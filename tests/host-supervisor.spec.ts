import { describe, expect, it, vi } from 'vitest'
import {
  createHostSupervisor,
  type HostChild,
  type HostSupervisorOptions,
} from '../src/host/supervisor.ts'

type ExitListener = (code: number | null, signal: NodeJS.Signals | null) => void

class FakeChild implements HostChild {
  readonly killed: Array<'SIGTERM' | 'SIGKILL'> = []
  private readonly stdoutListeners = new Set<(chunk: string) => void>()
  private readonly stderrListeners = new Set<(chunk: string) => void>()
  private readonly exitListeners = new Set<ExitListener>()
  private readonly errorListeners = new Set<(error: Error) => void>()

  readonly stdout = { onData: (listener: (chunk: string) => void) => this.listen(this.stdoutListeners, listener) }
  readonly stderr = { onData: (listener: (chunk: string) => void) => this.listen(this.stderrListeners, listener) }

  onExit(listener: ExitListener): () => void {
    return this.listen(this.exitListeners, listener)
  }

  onError(listener: (error: Error) => void): () => void {
    return this.listen(this.errorListeners, listener)
  }

  kill(signal: 'SIGTERM' | 'SIGKILL'): void {
    this.killed.push(signal)
  }

  writeStdout(chunk: string): void {
    this.stdoutListeners.forEach((listener) => listener(chunk))
  }

  writeStderr(chunk: string): void {
    this.stderrListeners.forEach((listener) => listener(chunk))
  }

  exit(code: number | null = 0, signal: NodeJS.Signals | null = null): void {
    this.exitListeners.forEach((listener) => listener(code, signal))
  }

  fail(error: Error): void {
    this.errorListeners.forEach((listener) => listener(error))
  }

  private listen<T>(listeners: Set<T>, listener: T): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}

class SynchronousExitChild extends FakeChild {
  override onExit(listener: ExitListener): () => void {
    listener(1, null)
    return () => undefined
  }
}

class SynchronousErrorChild extends FakeChild {
  override onError(listener: (error: Error) => void): () => void {
    listener(new Error('synchronous spawn failure'))
    return () => undefined
  }
}

function createFixture(
  overrides: Partial<HostSupervisorOptions> = {},
  child = new FakeChild(),
): {
  readonly child: FakeChild
  readonly spawn: ReturnType<typeof vi.fn>
  readonly unexpectedExit: ReturnType<typeof vi.fn>
  readonly options: HostSupervisorOptions
} {
  const spawn = vi.fn(() => child)
  const unexpectedExit = vi.fn()
  return {
    child,
    spawn,
    unexpectedExit,
    options: {
      nodeExecutable: 'node',
      cliEntry: '/runtime/dsh/bin.js',
      cwd: '/tmp',
      electronRunAsNode: false,
      env: {},
      spawn,
      onUnexpectedExit: unexpectedExit,
      startupTimeoutMs: 90_000,
      shutdownTimeoutMs: 5_000,
      ...overrides,
    },
  }
}

describe('Harness Web host supervisor', () => {
  it('spawns once for concurrent starts and resolves readiness once', async () => {
    const fixture = createFixture()
    const supervisor = createHostSupervisor(fixture.options)
    const first = supervisor.start()
    const second = supervisor.start()

    expect(fixture.spawn).toHaveBeenCalledTimes(1)
    fixture.child.writeStdout('dsh web: http://127.0.0.1:3080\n')
    await expect(first).resolves.toBe('http://127.0.0.1:3080')
    await expect(second).resolves.toBe('http://127.0.0.1:3080')
    fixture.child.writeStdout('dsh web: http://localhost:4000\n')
    await expect(supervisor.start()).resolves.toBe('http://127.0.0.1:3080')
    expect(fixture.spawn).toHaveBeenCalledTimes(1)
  })

  it('caps startup output at 32,768 characters when readiness fails', async () => {
    const fixture = createFixture()
    const pending = createHostSupervisor(fixture.options).start()
    fixture.child.writeStdout('a'.repeat(40_000))
    fixture.child.writeStderr('b'.repeat(40_000))
    fixture.child.exit(1)

    await expect(pending).rejects.toMatchObject({ message: expect.stringMatching(/b{32768}/u) })
  })

  it('terminates and rejects on the 90-second startup timeout', async () => {
    vi.useFakeTimers()
    try {
      const fixture = createFixture()
      const pending = createHostSupervisor(fixture.options).start()
      const rejection = expect(pending).rejects.toThrow(/timed out/u)
      await vi.advanceTimersByTimeAsync(90_000)
      expect(fixture.child.killed).toEqual(['SIGTERM'])
      await rejection
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects when the child exits before readiness', async () => {
    const fixture = createFixture()
    const pending = createHostSupervisor(fixture.options).start()
    fixture.child.exit(1)
    await expect(pending).rejects.toThrow(/exited before readiness/u)
  })

  it('reports an unexpected exit after readiness', async () => {
    const fixture = createFixture()
    const supervisor = createHostSupervisor(fixture.options)
    const pending = supervisor.start()
    fixture.child.writeStdout('dsh web: http://127.0.0.1:3080\n')
    await pending
    fixture.child.exit(12, 'SIGTERM')
    expect(fixture.unexpectedExit).toHaveBeenCalledWith(12, 'SIGTERM')
  })

  it('sends one SIGTERM for concurrent shutdowns and escalates after five seconds', async () => {
    vi.useFakeTimers()
    try {
      const fixture = createFixture()
      const supervisor = createHostSupervisor(fixture.options)
      const started = supervisor.start()
      fixture.child.writeStdout('dsh web: http://127.0.0.1:3080\n')
      await started

      const first = supervisor.shutdown()
      const second = supervisor.shutdown()
      expect(fixture.child.killed).toEqual(['SIGTERM'])
      await vi.advanceTimersByTimeAsync(5_000)
      expect(fixture.child.killed).toEqual(['SIGTERM', 'SIGKILL'])
      fixture.child.exit(null, 'SIGKILL')
      await Promise.all([first, second])
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects startup failures reported by the child', async () => {
    const fixture = createFixture()
    const supervisor = createHostSupervisor(fixture.options)
    const pending = supervisor.start()
    fixture.child.fail(new Error('spawn failed'))
    await expect(pending).rejects.toThrow(/spawn failed/u)
    await expect(supervisor.shutdown()).resolves.toBeUndefined()
  })

  it.each([
    ['exit', new SynchronousExitChild(), /exited before readiness/u],
    ['error', new SynchronousErrorChild(), /synchronous spawn failure/u],
  ])('clears timers when a synchronous %s callback fires during registration', async (_, child, error) => {
    vi.useFakeTimers()
    try {
      const fixture = createFixture({}, child)
      const pending = createHostSupervisor(fixture.options).start()
      const rejection = expect(pending).rejects.toThrow(error)
      await rejection
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
