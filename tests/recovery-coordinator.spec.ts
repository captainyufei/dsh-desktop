import { describe, expect, it, vi } from 'vitest'
import { createRecoveryCoordinator } from '../src/recovery-coordinator.ts'

describe('recovery coordinator', () => {
  it('serializes recovery and lets only the newest request act after an await', async () => {
    let releaseFirst: (() => void) | undefined
    const firstPaused = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const actions: string[] = []
    const coordinator = createRecoveryCoordinator({ onError: vi.fn() })

    const first = coordinator.schedule(async (ticket) => {
      actions.push('first-started')
      await firstPaused
      if (ticket.isCurrent()) {
        actions.push('first-mutated')
      }
    })
    await Promise.resolve()
    const second = coordinator.schedule(async (ticket) => {
      actions.push('second-started')
      if (ticket.isCurrent()) {
        actions.push('second-mutated')
      }
    })

    releaseFirst?.()
    await Promise.all([first, second])

    expect(actions).toEqual(['first-started', 'second-started', 'second-mutated'])
  })

  it('never overlaps recovery operations', async () => {
    let active = 0
    let maximumActive = 0
    let releaseFirst: (() => void) | undefined
    const firstPaused = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const coordinator = createRecoveryCoordinator({ onError: vi.fn() })

    const first = coordinator.schedule(async () => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      await firstPaused
      active -= 1
    })
    await Promise.resolve()
    const second = coordinator.schedule(async () => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      active -= 1
    })

    releaseFirst?.()
    await Promise.all([first, second])

    expect(maximumActive).toBe(1)
  })

  it('handles terminal operation and error-handler failures without rejecting', async () => {
    const recoveryError = new Error('dialog failed')
    const onError = vi.fn(() => {
      throw new Error('quit failed')
    })
    const coordinator = createRecoveryCoordinator({ onError })

    await expect(coordinator.schedule(() => Promise.reject(recoveryError))).resolves.toBeUndefined()

    expect(onError).toHaveBeenCalledWith(recoveryError)
  })
})
