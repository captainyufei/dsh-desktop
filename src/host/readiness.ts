export interface ReadinessParser {
  push(chunk: string): string | undefined
  finalize(): string
}

const READINESS_PREFIX = 'dsh web: '
const MAX_PENDING_LINE_CHARS = 32_768

class IncrementalReadinessParser implements ReadinessParser {
  private pending = ''
  private discardingLongLine = false
  private origin: string | undefined

  push(chunk: string): string | undefined {
    if (this.origin !== undefined) {
      return this.origin
    }

    let remaining = chunk
    while (remaining !== '') {
      if (this.discardingLongLine) {
        const newlineIndex = remaining.indexOf('\n')
        if (newlineIndex === -1) {
          return undefined
        }
        remaining = remaining.slice(newlineIndex + 1)
        this.discardingLongLine = false
        continue
      }

      const newlineIndex = remaining.indexOf('\n')
      if (newlineIndex === -1) {
        this.appendPending(remaining)
        return undefined
      }

      if (this.pending.length + newlineIndex > MAX_PENDING_LINE_CHARS) {
        this.pending = ''
        remaining = remaining.slice(newlineIndex + 1)
        continue
      }

      const line = `${this.pending}${remaining.slice(0, newlineIndex)}`.replace(/\r$/u, '')
      this.pending = ''
      remaining = remaining.slice(newlineIndex + 1)
      if (line.length > MAX_PENDING_LINE_CHARS) {
        continue
      }
      const origin = parseReadinessLine(line)
      if (origin !== undefined) {
        this.origin = origin
        this.pending = ''
        this.discardingLongLine = false
        return origin
      }
    }

    return undefined
  }

  private appendPending(fragment: string): void {
    if (this.pending.length + fragment.length > MAX_PENDING_LINE_CHARS) {
      this.pending = ''
      this.discardingLongLine = true
      return
    }
    this.pending += fragment
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
