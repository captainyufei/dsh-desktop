export interface ReadinessParser {
  push(chunk: string): string | undefined
  finalize(): string
}

const READINESS_PREFIX = 'dsh web: '

class IncrementalReadinessParser implements ReadinessParser {
  private pending = ''
  private origin: string | undefined

  push(chunk: string): string | undefined {
    if (this.origin !== undefined) {
      return this.origin
    }

    this.pending += chunk
    let newlineIndex = this.pending.indexOf('\n')
    while (newlineIndex !== -1) {
      const line = this.pending.slice(0, newlineIndex).replace(/\r$/u, '')
      this.pending = this.pending.slice(newlineIndex + 1)
      const origin = parseReadinessLine(line)
      if (origin !== undefined) {
        this.origin = origin
        return origin
      }
      newlineIndex = this.pending.indexOf('\n')
    }

    return undefined
  }

  finalize(): string {
    if (this.origin === undefined) {
      throw new Error('Harness Web Host ended before readiness')
    }
    return this.origin
  }
}

function parseReadinessLine(line: string): string | undefined {
  if (!line.startsWith(READINESS_PREFIX)) {
    return undefined
  }

  const value = line.slice(READINESS_PREFIX.length)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }

  const portMatch = /^http:\/\/(?:127\.0\.0\.1|localhost):(\d+)(?:\/|$)/u.exec(value)
  if (
    url.protocol !== 'http:' ||
    (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    portMatch === null
  ) {
    return undefined
  }

  const port = Number(portMatch[1])
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    return undefined
  }

  return `http://${url.hostname}:${port}`
}

export function createReadinessParser(): ReadinessParser {
  return new IncrementalReadinessParser()
}
