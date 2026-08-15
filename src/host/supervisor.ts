import { spawn } from 'node:child_process'
import { createReadinessParser } from './readiness.ts'

const STARTUP_TIMEOUT_MS = 90_000
const SHUTDOWN_TIMEOUT_MS = 5_000
const MAX_STARTUP_OUTPUT_CHARS = 32_768

export interface HostChild {
  readonly stdout: { onData(listener: (chunk: string) => void): () => void }
  readonly stderr: { onData(listener: (chunk: string) => void): () => void }
  onExit(listener: (code: number | null, signal: NodeJS.Signals | null) => void): () => void
  onError(listener: (error: Error) => void): () => void
  kill(signal: 'SIGTERM' | 'SIGKILL'): void
}

export interface SpawnDshWebOptions {
  readonly nodeExecutable: string
  readonly cliEntry: string
  readonly cwd: string
  readonly electronRunAsNode: boolean
  readonly env: NodeJS.ProcessEnv
}

export interface HostSupervisorOptions extends SpawnDshWebOptions {
  readonly spawn?: (options: SpawnDshWebOptions) => HostChild
  readonly startupTimeoutMs?: number
  readonly shutdownTimeoutMs?: number
  readonly onUnexpectedExit?: (code: number | null, signal: NodeJS.Signals | null) => void
}

export interface HostSupervisor {
  start(): Promise<string>
  shutdown(): Promise<void>
}

type HostState = 'idle' | 'starting' | 'ready' | 'stopping' | 'stopped'

class SupervisedHost implements HostSupervisor {
  private state: HostState = 'idle'
  private child: HostChild | undefined
  private startPromise: Promise<string> | undefined
  private resolveStart: ((origin: string) => void) | undefined
  private rejectStart: ((error: Error) => void) | undefined
  private shutdownPromise: Promise<void> | undefined
  private resolveShutdown: (() => void) | undefined
  private startupTimer: ReturnType<typeof setTimeout> | undefined
  private shutdownTimer: ReturnType<typeof setTimeout> | undefined
  private startupOutput = ''
  private readonly readinessParser = createReadinessParser()
  private sentSigterm = false
  private sentSigkill = false
  private childExited = false

  constructor(private readonly options: HostSupervisorOptions) {}

  start(): Promise<string> {
    if (this.startPromise !== undefined) {
      return this.startPromise
    }

    this.state = 'starting'
    this.startPromise = new Promise<string>((resolve, reject) => {
      this.resolveStart = resolve
      this.rejectStart = reject
    })

    try {
      const spawnHost = this.options.spawn ?? spawnDshWeb
      this.child = spawnHost(this.options)
      this.child.stdout.onData((chunk) => this.handleStdout(chunk))
      this.child.stderr.onData((chunk) => this.recordOutput(chunk))
      this.child.onExit((code, signal) => this.handleExit(code, signal))
      this.child.onError((error) => this.handleError(error))
      this.startupTimer = setTimeout(() => this.handleStartupTimeout(), this.startupTimeoutMs)
    } catch (error) {
      this.failStartup(asError(error), false)
    }

    return this.startPromise
  }

  shutdown(): Promise<void> {
    if (this.shutdownPromise !== undefined) {
      return this.shutdownPromise
    }

    if (this.child === undefined || this.childExited) {
      this.state = 'stopped'
      return Promise.resolve()
    }

    this.shutdownPromise = new Promise<void>((resolve) => {
      this.resolveShutdown = resolve
    })

    if (this.state === 'starting') {
      this.failStartup(new Error('Harness Web Host shut down before readiness'), false)
    }
    this.requestTermination()
    return this.shutdownPromise
  }

  private get startupTimeoutMs(): number {
    return this.options.startupTimeoutMs ?? STARTUP_TIMEOUT_MS
  }

  private get shutdownTimeoutMs(): number {
    return this.options.shutdownTimeoutMs ?? SHUTDOWN_TIMEOUT_MS
  }

  private handleStdout(chunk: string): void {
    this.recordOutput(chunk)
    if (this.state !== 'starting') {
      return
    }

    const origin = this.readinessParser.push(chunk)
    if (origin !== undefined) {
      this.state = 'ready'
      this.clearStartupTimer()
      this.resolveStart?.(origin)
      this.resolveStart = undefined
      this.rejectStart = undefined
    }
  }

  private handleStartupTimeout(): void {
    if (this.state !== 'starting') {
      return
    }
    this.failStartup(
      new Error(`Harness Web Host startup timed out after ${this.startupTimeoutMs} ms`),
      true,
    )
  }

  private handleExit(code: number | null, signal: NodeJS.Signals | null): void {
    this.childExited = true
    this.clearStartupTimer()
    this.clearShutdownTimer()

    const wasReady = this.state === 'ready'
    const wasStarting = this.state === 'starting'
    this.state = 'stopped'
    if (wasStarting) {
      this.failStartup(
        new Error(`Harness Web Host exited before readiness (${formatExit(code, signal)})`),
        false,
      )
    } else if (wasReady) {
      this.options.onUnexpectedExit?.(code, signal)
    }
    this.resolveShutdown?.()
    this.resolveShutdown = undefined
  }

  private handleError(error: Error): void {
    if (this.state === 'starting') {
      this.failStartup(error, true)
    }
  }

  private failStartup(error: Error, terminate: boolean): void {
    if (this.rejectStart === undefined) {
      return
    }
    this.clearStartupTimer()
    this.rejectStart(this.withOutput(error))
    this.resolveStart = undefined
    this.rejectStart = undefined
    if (terminate) {
      this.requestTermination()
    }
  }

  private requestTermination(): void {
    if (this.child === undefined || this.childExited) {
      return
    }
    this.state = 'stopping'
    this.clearStartupTimer()
    if (!this.sentSigterm) {
      this.sentSigterm = true
      this.child.kill('SIGTERM')
    }
    if (this.shutdownTimer === undefined) {
      this.shutdownTimer = setTimeout(() => {
        if (this.child !== undefined && !this.childExited && !this.sentSigkill) {
          this.sentSigkill = true
          this.child.kill('SIGKILL')
        }
      }, this.shutdownTimeoutMs)
    }
  }

  private recordOutput(chunk: string): void {
    this.startupOutput = `${this.startupOutput}${chunk}`.slice(-MAX_STARTUP_OUTPUT_CHARS)
  }

  private outputSuffix(): string {
    return this.startupOutput === '' ? '' : `\nStartup output:\n${this.startupOutput}`
  }

  private withOutput(error: Error): Error {
    return this.startupOutput === ''
      ? error
      : new Error(`${error.message}${this.outputSuffix()}`, { cause: error })
  }

  private clearStartupTimer(): void {
    if (this.startupTimer !== undefined) {
      clearTimeout(this.startupTimer)
      this.startupTimer = undefined
    }
  }

  private clearShutdownTimer(): void {
    if (this.shutdownTimer !== undefined) {
      clearTimeout(this.shutdownTimer)
      this.shutdownTimer = undefined
    }
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function formatExit(code: number | null, signal: NodeJS.Signals | null): string {
  return signal === null ? `code ${code ?? 'unknown'}` : `signal ${signal}`
}

function readableAdapter(stream: NodeJS.ReadableStream): HostChild['stdout'] {
  return {
    onData(listener) {
      const onData = (chunk: unknown) => listener(String(chunk))
      stream.on('data', onData)
      return () => stream.removeListener('data', onData)
    },
  }
}

export function spawnDshWeb(options: SpawnDshWebOptions): HostChild {
  const env = options.electronRunAsNode
    ? { ...options.env, ELECTRON_RUN_AS_NODE: '1' }
    : options.env
  const child = spawn(options.nodeExecutable, [
    '--expose-internals',
    options.cliEntry,
    'web',
    '--host', '127.0.0.1',
    '--port', '0',
  ], {
    cwd: options.cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  if (child.stdout === null || child.stderr === null) {
    child.kill('SIGKILL')
    throw new Error('Harness Web Host did not provide stdout and stderr pipes')
  }

  return {
    stdout: readableAdapter(child.stdout),
    stderr: readableAdapter(child.stderr),
    onExit(listener) {
      child.on('exit', listener)
      return () => child.removeListener('exit', listener)
    },
    onError(listener) {
      child.on('error', listener)
      return () => child.removeListener('error', listener)
    },
    kill(signal) {
      child.kill(signal)
    },
  }
}

export function createHostSupervisor(options: HostSupervisorOptions): HostSupervisor {
  return new SupervisedHost(options)
}
