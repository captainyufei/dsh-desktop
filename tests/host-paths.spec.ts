import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import {
  assertRuntimeArtifacts,
  resolveHostPaths,
  resolveRuntimeArtifacts,
} from '../src/host/paths.ts'

function createPackagedRuntimeFixture(): {
  readonly root: string
  readonly resourcesPath: string
} {
  const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-packaged-'))
  const resourcesPath = join(root, 'resources')
  const nodeModulesRoot = join(resourcesPath, 'host', 'node_modules')
  const pnpmRoot = join(nodeModulesRoot, '.pnpm')
  const dshRoot = join(
    pnpmRoot,
    '@deepseek-ai+dsh@fixture/node_modules/@deepseek-ai/dsh',
  )
  const webAppRoot = join(
    pnpmRoot,
    '@deepseek-ai+dsh-web-app@fixture/node_modules/@deepseek-ai/dsh-web-app',
  )
  const webFrontendRoot = join(
    pnpmRoot,
    '@deepseek-ai+dsh-web-frontend@fixture/node_modules/@deepseek-ai/dsh-web-frontend',
  )
  const dshLink = join(nodeModulesRoot, '@deepseek-ai', 'dsh')
  const webAppLink = join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh-web-app')
  const webFrontendLink = join(
    webAppRoot,
    'node_modules',
    '@deepseek-ai',
    'dsh-web-frontend',
  )

  mkdirSync(join(dshRoot, 'lib'), { recursive: true })
  mkdirSync(join(dshRoot, 'node_modules', '@deepseek-ai'), { recursive: true })
  mkdirSync(join(webAppRoot, 'node_modules', '@deepseek-ai'), { recursive: true })
  mkdirSync(join(webFrontendRoot, 'dist'), { recursive: true })
  mkdirSync(join(nodeModulesRoot, '@deepseek-ai'), { recursive: true })
  writeFileSync(join(dshRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh' }))
  writeFileSync(join(dshRoot, 'lib/bin.js'), '')
  writeFileSync(join(webAppRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-web-app' }))
  writeFileSync(
    join(webFrontendRoot, 'package.json'),
    JSON.stringify({ name: '@deepseek-ai/dsh-web-frontend' }),
  )
  writeFileSync(join(webFrontendRoot, 'dist/index.html'), '')
  symlinkSync(dshRoot, dshLink, 'dir')
  symlinkSync(webAppRoot, webAppLink, 'dir')
  symlinkSync(webFrontendRoot, webFrontendLink, 'dir')

  return { root, resourcesPath }
}

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

  it('resolves runtime artifacts from a pnpm-like packaged tree', () => {
    const fixture = createPackagedRuntimeFixture()
    try {
      const packaged = resolveHostPaths({
        isPackaged: true,
        appPath: join(fixture.resourcesPath, 'app.asar'),
        resourcesPath: fixture.resourcesPath,
        execPath: '/Applications/DSH Desktop.app/Contents/MacOS/DSH Desktop',
        homePath: '/Users/tester',
        env: {},
      })
      const packagedNodeModules = join(fixture.resourcesPath, 'host', 'node_modules')
      expect(packaged.nodeExecutable).toContain('DSH Desktop')
      expect(packaged.electronRunAsNode).toBe(true)
      expect(packaged.cwd).toBe('/Users/tester')
      expect(packaged.cliEntry).toContain(packagedNodeModules)
      expect(packaged.webEntry).toContain(packagedNodeModules)
      assertRuntimeArtifacts(packaged)
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  it('resolves successfully in a native Node child process', () => {
    const script = [
      "import { existsSync } from 'node:fs'",
      "import { resolveRuntimeArtifacts } from './src/host/paths.ts'",
      `const result = resolveRuntimeArtifacts(${JSON.stringify(join(process.cwd(), 'node_modules'))})`,
      'if (!existsSync(result.cliEntry) || !existsSync(result.webEntry)) process.exit(2)',
    ].join(';')
    const child = spawnSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', script],
      { cwd: process.cwd(), encoding: 'utf8' },
    )
    expect(child.status).toBe(0)
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
