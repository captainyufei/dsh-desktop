import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import {
  assertRuntimeArtifacts,
  resolveHostPaths,
  resolveRuntimeArtifacts,
} from '../src/host/paths.ts'

describe('runtime artifacts', () => {
  it('resolves the CLI and official Web entry through package dependencies', () => {
    const result = resolveRuntimeArtifacts(join(process.cwd(), 'node_modules'))
    expect(result.cliEntry).toMatch(/@deepseek-ai[/\\]dsh[/\\]lib[/\\]bin\.js$/u)
    expect(result.webEntry).toMatch(
      /@deepseek-ai[/\\]dsh-web-frontend[/\\]dist[/\\]index\.html$/u,
    )
    expect(existsSync(result.cliEntry)).toBe(true)
    expect(existsSync(result.webEntry)).toBe(true)
  })

  it('uses Electron Node mode only for packaged applications', () => {
    const packaged = resolveHostPaths({
      isPackaged: true,
      appPath: '/Applications/DSH Desktop.app/Contents/Resources/app.asar',
      resourcesPath: '/Applications/DSH Desktop.app/Contents/Resources',
      execPath: '/Applications/DSH Desktop.app/Contents/MacOS/DSH Desktop',
      homePath: '/Users/tester',
      env: {},
    })
    expect(packaged.nodeExecutable).toContain('DSH Desktop')
    expect(packaged.electronRunAsNode).toBe(true)
    expect(packaged.cwd).toBe('/Users/tester')
  })

  it('uses the development node executable and app node_modules', () => {
    const appPath = process.cwd()
    const development = resolveHostPaths({
      isPackaged: false,
      appPath,
      resourcesPath: join(appPath, 'resources'),
      execPath: '/Applications/Electron.app/Contents/MacOS/Electron',
      homePath: '/Users/tester',
      env: { DSH_DESKTOP_NODE_EXECUTABLE: '/opt/node/bin/node' },
    })
    expect(development.nodeExecutable).toBe('/opt/node/bin/node')
    expect(development.electronRunAsNode).toBe(false)
    expect(development.cwd).toBe('/Users/tester')
    expect(development.cliEntry).toContain(join(appPath, 'node_modules'))
  })
})

describe('runtime artifact assertions', () => {
  it('reports a missing Harness CLI', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-host-paths-'))
    try {
      expect(() =>
        assertRuntimeArtifacts({
          nodeExecutable: 'node',
          cliEntry: join(root, 'missing-cli.js'),
          webEntry: join(root, 'web/index.html'),
          cwd: root,
          electronRunAsNode: false,
        }),
      ).toThrow(/Harness CLI is missing/u)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reports a missing Harness Web UI', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-host-paths-'))
    try {
      const cliEntry = join(root, 'cli.js')
      writeFileSync(cliEntry, '')
      expect(() =>
        assertRuntimeArtifacts({
          nodeExecutable: 'node',
          cliEntry,
          webEntry: join(root, 'missing-web/index.html'),
          cwd: root,
          electronRunAsNode: false,
        }),
      ).toThrow(/Harness Web UI is missing/u)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
