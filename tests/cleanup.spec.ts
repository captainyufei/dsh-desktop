import { describe, expect, it, vi } from 'vitest'
import { runCleanupStages } from '../src/cleanup.ts'

describe('guarded cleanup stages', () => {
  it('runs every stage in order after earlier failures', async () => {
    const calls: string[] = []
    const hostError = new Error('host shutdown failed')
    const onError = vi.fn((stage: string) => {
      calls.push(`error:${stage}`)
    })

    await runCleanupStages([
      {
        name: 'host',
        run: () => {
          calls.push('host')
          throw hostError
        },
      },
      { name: 'window', run: () => { calls.push('window') } },
      { name: 'tray', run: () => { calls.push('tray') } },
    ], onError)

    expect(calls).toEqual(['host', 'error:host', 'window', 'tray'])
    expect(onError).toHaveBeenCalledWith('host', hostError)
  })

  it('contains error-reporter failures and continues cleanup', async () => {
    const finalStage = vi.fn()

    await expect(runCleanupStages([
      { name: 'window', run: () => { throw new Error('destroy failed') } },
      { name: 'diagnostics', run: finalStage },
    ], () => {
      throw new Error('report failed')
    })).resolves.toBeUndefined()

    expect(finalStage).toHaveBeenCalledOnce()
  })
})
