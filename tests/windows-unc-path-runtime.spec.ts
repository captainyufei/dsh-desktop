import { readFileSync } from 'node:fs'
import { win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveSidebarPath } from '../node_modules/dsh-better-sidebar/src/client/produced-files.ts'

describe('Better Sidebar Windows path handling', () => {
  it('uses Windows path semantics that accept and preserve UNC shares', () => {
    const sharedDirectory = String.raw`\\Mac\Home\Downloads\8月14日`
    const bundledHost = readFileSync('node_modules/dsh-better-sidebar/lib/index.js', 'utf8')

    expect(win32.isAbsolute(sharedDirectory)).toBe(true)
    expect(win32.resolve(sharedDirectory)).toBe(sharedDirectory)
    expect(bundledHost).toContain('const pathApi = platform === "win32" ? win32 : posix;')
    expect(bundledHost).toContain('if (!pathApi.isAbsolute(path))')
    expect(resolveSidebarPath(String.raw`\\Mac\Home\Downloads`, sharedDirectory)).toBe(
      sharedDirectory,
    )
  })

  it('keeps relative Windows paths distinguishable from absolute paths', () => {
    expect(win32.isAbsolute(String.raw`Downloads\8月14日`)).toBe(false)
    expect(resolveSidebarPath(String.raw`C:\Users\me`, String.raw`Downloads\8月14日`)).toBe(
      String.raw`C:\Users\me\Downloads\8月14日`,
    )
  })
})
