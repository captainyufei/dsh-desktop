import { describe, expect, it } from 'vitest'
import { createReadinessParser } from '../src/host/readiness.ts'

describe('Harness Web readiness parser', () => {
  it('accepts a split canonical readiness line', () => {
    const parser = createReadinessParser()
    expect(parser.push('booting\ndsh we')).toBeUndefined()
    expect(parser.push('b: http://127.0.0.1:3080\n')).toBe('http://127.0.0.1:3080')
    expect(parser.finalize()).toBe('http://127.0.0.1:3080')
  })

  it('ignores unrelated lines and accepts CRLF output', () => {
    const parser = createReadinessParser()
    expect(parser.push('info: preparing\r\ndsh web: http://localhost:3000\r\n')).toBe(
      'http://localhost:3000',
    )
  })

  it('accepts an explicitly supplied default HTTP port', () => {
    expect(createReadinessParser().push('dsh web: http://127.0.0.1:80\n')).toBe(
      'http://127.0.0.1:80',
    )
  })

  it('keeps the first accepted origin when identical or conflicting URLs follow', () => {
    const parser = createReadinessParser()
    expect(parser.push('dsh web: http://127.0.0.1:3080\n')).toBe('http://127.0.0.1:3080')
    expect(parser.push('dsh web: http://127.0.0.1:3080\ndsh web: http://localhost:4000\n')).toBe(
      'http://127.0.0.1:3080',
    )
    expect(parser.finalize()).toBe('http://127.0.0.1:3080')
  })

  it.each([
    'dsh web: not-a-url',
    'dsh web: https://127.0.0.1:3080',
    'dsh web: http://0.0.0.0:3080',
    'dsh web: http://example.test:3080',
    'dsh web: http://127.0.0.1',
    'dsh web: http://127.0.0.1:0',
    'dsh web: http://127.0.0.1:65536',
    'dsh web: http://127.0.0.1:3080/path',
    'dsh web: http://127.0.0.1:3080/?query=1',
    'dsh web: http://127.0.0.1:3080/#fragment',
  ])('rejects an invalid readiness URL: %s', (line) => {
    const parser = createReadinessParser()
    expect(parser.push(`${line}\n`)).toBeUndefined()
    expect(() => parser.finalize()).toThrow(/before readiness/u)
  })

  it('requires the exact readiness prefix and a complete line before accepting it', () => {
    const parser = createReadinessParser()
    expect(parser.push(' dsh web: http://127.0.0.1:3080\n')).toBeUndefined()
    expect(parser.push('dsh web: http://localhost:3210')).toBeUndefined()
    expect(parser.push('\n')).toBe('http://localhost:3210')
  })

  it('reports EOF before readiness', () => {
    expect(() => createReadinessParser().finalize()).toThrow(/before readiness/u)
  })
})
