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
  const sidebarRoot = join(
    pnpmRoot,
    'dsh-better-sidebar@fixture/node_modules/dsh-better-sidebar',
  )
  const dshLink = join(nodeModulesRoot, '@deepseek-ai', 'dsh')
  const webAppLink = join(dshRoot, 'node_modules', '@deepseek-ai', 'dsh-web-app')
  const webFrontendLink = join(
    webAppRoot,
    'node_modules',
    '@deepseek-ai',
    'dsh-web-frontend',
  )
  const sidebarLink = join(nodeModulesRoot, 'dsh-better-sidebar')

  mkdirSync(join(dshRoot, 'lib'), { recursive: true })
  mkdirSync(join(dshRoot, 'node_modules', '@deepseek-ai'), { recursive: true })
  mkdirSync(join(webAppRoot, 'node_modules', '@deepseek-ai'), { recursive: true })
  mkdirSync(join(webFrontendRoot, 'dist'), { recursive: true })
  mkdirSync(join(sidebarRoot, 'lib'), { recursive: true })
  mkdirSync(join(nodeModulesRoot, '@deepseek-ai'), { recursive: true })
  writeFileSync(join(dshRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh' }))
  writeFileSync(join(dshRoot, 'lib/bin.js'), '')
  writeFileSync(join(webAppRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-web-app' }))
  writeFileSync(
    join(webFrontendRoot, 'package.json'),
    JSON.stringify({ name: '@deepseek-ai/dsh-web-frontend' }),
  )
  writeFileSync(join(webFrontendRoot, 'dist/index.html'), '')
  writeFileSync(join(sidebarRoot, 'package.json'), JSON.stringify({ name: 'dsh-better-sidebar' }))
  writeFileSync(join(sidebarRoot, 'lib/index.js'), '')
  writeFileSync(join(sidebarRoot, 'lib/client-registry.js'), '')
  writeFileSync(join(sidebarRoot, 'lib/client-editor.js'), '')
  writeFileSync(join(sidebarRoot, 'lib/client-terminal.js'), '')
  writeFileSync(join(sidebarRoot, 'cordis.patch.yml'), '[]\n')
  symlinkDirectory(dshRoot, dshLink)
  symlinkDirectory(webAppRoot, webAppLink)
  symlinkDirectory(webFrontendRoot, webFrontendLink)
  symlinkDirectory(sidebarRoot, sidebarLink)

  return { root, resourcesPath }
}

function symlinkDirectory(target: string, path: string): void {
  symlinkSync(target, path, process.platform === 'win32' ? 'junction' : 'dir')
}

describe('runtime artifacts', () => {
  it('resolves the CLI and official Web entry through package dependencies', () => {
    const result = resolveRuntimeArtifacts(join(process.cwd(), 'node_modules'))
    expect(result.cliEntry).toMatch(/@deepseek-ai[/\\]dsh[/\\]lib[/\\]bin\.js$/u)
    expect(result.webEntry).toMatch(
      /@deepseek-ai[/\\]dsh-web-frontend[/\\]dist[/\\]index\.html$/u,
    )
    expect(result.sidebarPackageRoot).toMatch(/dsh-better-sidebar$/u)
    expect(existsSync(result.cliEntry)).toBe(true)
    expect(existsSync(result.webEntry)).toBe(true)
    expect(existsSync(join(result.sidebarPackageRoot, 'lib/index.js'))).toBe(true)
    expect(existsSync(join(result.sidebarPackageRoot, 'lib/client-editor.js'))).toBe(true)
    expect(existsSync(join(result.sidebarPackageRoot, 'lib/client-terminal.js'))).toBe(true)
  })

  it('resolves runtime artifacts from a pnpm-like packaged tree', () => {
    const fixture = createPackagedRuntimeFixture()
    const homePath = join('/Users', 'tester')
    try {
      const packaged = resolveHostPaths({
        isPackaged: true,
        appPath: join(fixture.resourcesPath, 'app.asar'),
        resourcesPath: fixture.resourcesPath,
        execPath: '/Applications/DSH Desktop.app/Contents/MacOS/DSH Desktop',
        homePath,
        env: {},
      })
      const packagedNodeModules = join(fixture.resourcesPath, 'host', 'node_modules')
      expect(packaged.nodeExecutable).toContain('DSH Desktop')
      expect(packaged.electronRunAsNode).toBe(true)
      expect(packaged.cwd).toBe(homePath)
      expect(packaged.cliEntry).toContain(packagedNodeModules)
      expect(packaged.webEntry).toContain(packagedNodeModules)
      expect(packaged.sidebarPackageRoot).toContain(packagedNodeModules)
      expect(packaged.dshHomePath).toBe(join(homePath, '.dsh'))
      expect(packaged.profileName).toBe('dsh-desktop')
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
      'if (!existsSync(result.cliEntry) || !existsSync(result.webEntry) || !existsSync(result.sidebarPackageRoot)) process.exit(2)',
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
    const homePath = join('/Users', 'tester')
    const development = resolveHostPaths({
      isPackaged: false,
      appPath,
      resourcesPath: join(appPath, 'resources'),
      execPath: '/Applications/Electron.app/Contents/MacOS/Electron',
      homePath,
      env: { DSH_DESKTOP_NODE_EXECUTABLE: '/opt/node/bin/node' },
    })
    expect(development.nodeExecutable).toBe('/opt/node/bin/node')
    expect(development.electronRunAsNode).toBe(false)
    expect(development.cwd).toBe(homePath)
    expect(development.cliEntry).toContain(join(appPath, 'node_modules'))
    expect(development.sidebarPackageRoot).toContain(join(appPath, 'node_modules'))
    expect(development.dshHomePath).toBe(join(homePath, '.dsh'))
    expect(development.profileName).toBe('dsh-desktop')
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
          sidebarPackageRoot: join(root, 'sidebar'),
          cwd: root,
          electronRunAsNode: false,
          dshHomePath: join(root, '.dsh'),
          profileName: 'dsh-desktop',
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
          sidebarPackageRoot: join(root, 'sidebar'),
          cwd: root,
          electronRunAsNode: false,
          dshHomePath: join(root, '.dsh'),
          profileName: 'dsh-desktop',
        }),
      ).toThrow(/Harness Web UI is missing/u)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('reports a missing Better Sidebar artifact', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-host-paths-'))
    try {
      const cliEntry = join(root, 'cli.js')
      const webEntry = join(root, 'web/index.html')
      mkdirSync(join(webEntry, '..'), { recursive: true })
      writeFileSync(cliEntry, '')
      writeFileSync(webEntry, '')
      expect(() =>
        assertRuntimeArtifacts({
          nodeExecutable: 'node',
          cliEntry,
          webEntry,
          sidebarPackageRoot: join(root, 'missing-sidebar'),
          cwd: root,
          electronRunAsNode: false,
          dshHomePath: join(root, '.dsh'),
          profileName: 'dsh-desktop',
        }),
      ).toThrow(/Better Sidebar artifact is missing/u)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
