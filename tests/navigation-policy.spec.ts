import { describe, expect, it } from 'vitest'
import { classifyNavigation } from '../src/navigation-policy.ts'

describe('navigation policy', () => {
  it.each([
    ['http://127.0.0.1:3080/', 'allow'],
    ['http://127.0.0.1:3080/session/1', 'allow'],
    ['https://example.com/docs', 'external'],
    ['http://localhost:9999/', 'external'],
    ['file:///etc/passwd', 'deny'],
    ['javascript:alert(1)', 'deny'],
    ['not a url', 'deny'],
  ] as const)('classifies %s', (raw, expected) => {
    expect(classifyNavigation(raw, 'http://127.0.0.1:3080')).toBe(expected)
  })

  it('compares origins exactly, including protocol and port', () => {
    expect(classifyNavigation('https://127.0.0.1:3080/path', 'http://127.0.0.1:3080')).toBe(
      'external',
    )
    expect(classifyNavigation('http://127.0.0.1:3081/path', 'http://127.0.0.1:3080')).toBe(
      'external',
    )
  })

  it.each(['data:text/html,hello', 'about:blank', 'http://[invalid', ''])(
    'denies non-http(s) or malformed navigation %s',
    (raw) => {
      expect(classifyNavigation(raw, 'http://127.0.0.1:3080')).toBe('deny')
    },
  )
})
