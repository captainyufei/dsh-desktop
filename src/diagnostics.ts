import {
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import { join } from 'node:path'

const MAX_LOG_BYTES = 2 * 1024 * 1024
const MAX_LOG_GENERATIONS = 3

export interface Diagnostics {
  readonly path: string
  log(message: string): void
  error(message: string, error?: unknown): void
  close(): Promise<void>
}

function rotatedPath(logDir: string, generation: number): string {
  return join(logDir, `desktop.${generation}.log`)
}

function rotateAtStartup(logDir: string, currentPath: string): void {
  if (!existsSync(currentPath) || statSync(currentPath).size <= MAX_LOG_BYTES) {
    return
  }

  const oldestPath = rotatedPath(logDir, MAX_LOG_GENERATIONS)
  if (existsSync(oldestPath)) {
    unlinkSync(oldestPath)
  }

  for (let generation = MAX_LOG_GENERATIONS - 1; generation >= 1; generation -= 1) {
    const source = rotatedPath(logDir, generation)
    if (existsSync(source)) {
      renameSync(source, rotatedPath(logDir, generation + 1))
    }
  }

  renameSync(currentPath, rotatedPath(logDir, 1))
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`
  }
  return String(error)
}

export function createDiagnostics(userDataDir: string): Diagnostics {
  const logDir = join(userDataDir, 'logs')
  const logPath = join(logDir, 'desktop.log')
  mkdirSync(logDir, { recursive: true })
  rotateAtStartup(logDir, logPath)

  const stream = createWriteStream(logPath, { flags: 'a' })
  let streamError: Error | undefined
  let closePromise: Promise<void> | undefined
  stream.on('error', (error) => {
    streamError = error
  })

  const writeLine = (message: string): void => {
    if (closePromise !== undefined) {
      return
    }
    stream.write(`[${new Date().toISOString()}] ${message}\n`)
  }

  return {
    path: logPath,
    log(message) {
      writeLine(message)
    },
    error(message, error) {
      writeLine(error === undefined ? message : `${message}: ${formatError(error)}`)
    },
    close() {
      if (closePromise === undefined) {
        closePromise = new Promise<void>((resolve, reject) => {
          stream.end(() => {
            if (streamError === undefined) {
              resolve()
            } else {
              reject(streamError)
            }
          })
        })
      }
      return closePromise
    },
  }
}
