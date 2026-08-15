import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveHostPaths } from '../src/host/paths.ts'
import {
  createHostSupervisor,
  spawnDshWeb,
  type HostSupervisor,
} from '../src/host/supervisor.ts'

describe.runIf(process.env.DSH_RUN_HARNESS_SMOKE === '1')('real Harness Host', () => {
  let host: HostSupervisor | undefined
  let temporaryHome: string | undefined

  beforeEach(() => {
    temporaryHome = mkdtempSync(join(tmpdir(), 'dsh-desktop-harness-smoke-'))
  })

  afterEach(async () => {
    try {
      await host?.shutdown()
    } finally {
      host = undefined
      if (temporaryHome !== undefined) {
        rmSync(temporaryHome, { recursive: true, force: true })
        temporaryHome = undefined
      }
    }
  })

  it('serves the official Web document', async () => {
    if (temporaryHome === undefined) {
      throw new Error('Harness smoke temporary home was not created')
    }

    const env = { ...process.env, DSH_HOME: temporaryHome }
    const paths = resolveHostPaths({
      isPackaged: false,
      appPath: process.cwd(),
      resourcesPath: '',
      execPath: process.execPath,
      homePath: temporaryHome,
      env,
    })
    host = createHostSupervisor({
      ...paths,
      env,
      spawn: (options) => spawnDshWeb(options),
    })

    const origin = await host.start()
    const response = await fetch(origin)
    expect(response.ok).toBe(true)
    expect(await response.text()).toContain('<div id="root">')
  }, 120_000)
})
