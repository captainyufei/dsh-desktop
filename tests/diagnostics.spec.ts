import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDiagnostics } from '../src/diagnostics.ts'

describe('local diagnostics', () => {
  let userDataDir: string

  beforeEach(() => {
    userDataDir = mkdtempSync(join(tmpdir(), 'dsh-desktop-diagnostics-'))
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true })
  })

  it('writes timestamped messages without implicitly adding environment secrets', async () => {
    const secret = 'diagnostics-must-not-copy-this-secret'
    const previousSecret = process.env.DSH_DIAGNOSTICS_TEST_SECRET
    process.env.DSH_DIAGNOSTICS_TEST_SECRET = secret

    try {
      const diagnostics = createDiagnostics(userDataDir)
      diagnostics.log('desktop started')
      diagnostics.error('host failed', new Error('connection reset'))
      await diagnostics.close()

      expect(diagnostics.path).toBe(join(userDataDir, 'logs', 'desktop.log'))
      const contents = readFileSync(diagnostics.path, 'utf8')
      expect(contents).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] desktop started$/m,
      )
      expect(contents).toContain('host failed: Error: connection reset')
      expect(contents).not.toContain(secret)
    } finally {
      if (previousSecret === undefined) {
        delete process.env.DSH_DIAGNOSTICS_TEST_SECRET
      } else {
        process.env.DSH_DIAGNOSTICS_TEST_SECRET = previousSecret
      }
    }
  })

  it('rotates an oversized log through three generations at startup', async () => {
    const logDir = join(userDataDir, 'logs')
    const firstDiagnostics = createDiagnostics(userDataDir)
    await firstDiagnostics.close()

    writeFileSync(join(logDir, 'desktop.log'), `current-${'x'.repeat(2 * 1024 * 1024)}`)
    writeFileSync(join(logDir, 'desktop.1.log'), 'generation-one')
    writeFileSync(join(logDir, 'desktop.2.log'), 'generation-two')
    writeFileSync(join(logDir, 'desktop.3.log'), 'generation-three')

    const diagnostics = createDiagnostics(userDataDir)
    diagnostics.log('fresh generation')
    await diagnostics.close()

    expect(readFileSync(join(logDir, 'desktop.1.log'), 'utf8')).toMatch(/^current-/)
    expect(readFileSync(join(logDir, 'desktop.2.log'), 'utf8')).toBe('generation-one')
    expect(readFileSync(join(logDir, 'desktop.3.log'), 'utf8')).toBe('generation-two')
    expect(readFileSync(join(logDir, 'desktop.log'), 'utf8')).toContain('fresh generation')
  })

  it('flushes pending writes before close resolves', async () => {
    const diagnostics = createDiagnostics(userDataDir)
    diagnostics.log('last buffered line')

    await diagnostics.close()

    expect(readFileSync(diagnostics.path, 'utf8')).toContain('last buffered line')
  })
})
