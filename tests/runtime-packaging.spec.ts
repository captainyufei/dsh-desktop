import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { assertReleaseTarget } from '../scripts/verify-release-target.ts'
import {
  assertSafeRuntimeTarget,
  resolveRuntimeDeployCommand,
} from '../scripts/stage-runtime.ts'
import { verifyRuntime } from '../scripts/verify-runtime.ts'

const temporaryRoots: string[] = []

function makeFakeRuntime({
  cli,
  web,
  sidebar,
}: {
  cli: boolean
  web: boolean
  sidebar: boolean
}): string {
  const root = mkdtempSync(join(tmpdir(), 'dsh-runtime-'))
  temporaryRoots.push(root)

  if (cli) {
    const cliDirectory = join(root, 'node_modules', '@deepseek-ai', 'dsh', 'lib')
    mkdirSync(cliDirectory, { recursive: true })
    writeFileSync(join(cliDirectory, 'bin.js'), '#!/usr/bin/env node\n')
  }

  if (web) {
    const webDirectory = join(
      root,
      'node_modules',
      '.pnpm',
      '@deepseek-ai+dsh@0.1.0-rc.6',
      'node_modules',
      '@deepseek-ai',
      'dsh-web-frontend',
      'dist',
    )
    mkdirSync(webDirectory, { recursive: true })
    writeFileSync(join(webDirectory, 'index.html'), '<!doctype html>\n')
  }

  if (sidebar) {
    const sidebarDirectory = join(root, 'node_modules', 'dsh-better-sidebar')
    mkdirSync(join(sidebarDirectory, 'lib'), { recursive: true })
    writeFileSync(join(sidebarDirectory, 'lib', 'index.js'), '')
    writeFileSync(join(sidebarDirectory, 'lib', 'client-registry.js'), '')
    writeFileSync(join(sidebarDirectory, 'lib', 'client-editor.js'), '')
    writeFileSync(join(sidebarDirectory, 'lib', 'client-terminal.js'), '')
    writeFileSync(join(sidebarDirectory, 'cordis.patch.yml'), '[]\n')
  }

  return root
}

function makeWebEntry(root: string): string {
  return join(
    root,
    'node_modules',
    '.pnpm',
    '@deepseek-ai+dsh@0.1.0-rc.6',
    'node_modules',
    '@deepseek-ai',
    'dsh-web-frontend',
    'dist',
    'index.html',
  )
}

function symlinkDirectory(target: string, path: string): void {
  symlinkSync(target, path, process.platform === 'win32' ? 'junction' : 'dir')
}

function symlinkExternalFile(target: string, path: string): void {
  if (process.platform !== 'win32') {
    symlinkSync(target, path, 'file')
    return
  }

  // Windows file symlinks require Developer Mode or elevation. A junction at
  // the file's parent exercises the same containment boundary without either.
  const linkedParent = dirname(path)
  rmSync(linkedParent, { recursive: true, force: true })
  symlinkDirectory(dirname(target), linkedParent)
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('runtime packaging verification', () => {
  it('rejects a staged runtime without the Harness CLI', () => {
    const root = makeFakeRuntime({ cli: false, web: true, sidebar: true })
    expect(() => verifyRuntime(root)).toThrow('Harness CLI is missing')
  })

  it('rejects a staged runtime without the Web frontend', () => {
    const root = makeFakeRuntime({ cli: true, web: false, sidebar: true })
    expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
  })

  it('accepts both required runtime entries', () => {
    const root = makeFakeRuntime({ cli: true, web: true, sidebar: true })
    expect(verifyRuntime(root)).toEqual({
      cliEntry: expect.stringMatching(/lib[/\\]bin\.js$/u),
      webEntry: expect.stringMatching(/dist[/\\]index\.html$/u),
      sidebarEntry: expect.stringMatching(/dsh-better-sidebar[/\\]lib[/\\]index\.js$/u),
      sidebarClientEntry: expect.stringMatching(/lib[/\\]client-registry\.js$/u),
      sidebarEditorEntry: expect.stringMatching(/lib[/\\]client-editor\.js$/u),
      sidebarTerminalEntry: expect.stringMatching(/lib[/\\]client-terminal\.js$/u),
      sidebarPatchEntry: expect.stringMatching(/dsh-better-sidebar[/\\]cordis\.patch\.yml$/u),
    })
  })

  it('rejects a staged runtime without Better Sidebar', () => {
    const root = makeFakeRuntime({ cli: true, web: true, sidebar: false })
    expect(() => verifyRuntime(root)).toThrow('Better Sidebar artifact is missing')
  })

  it('rejects a Better Sidebar host entry whose final file is an external symlink', () => {
    const root = makeFakeRuntime({ cli: true, web: true, sidebar: true })
    const external = makeFakeRuntime({ cli: false, web: false, sidebar: false })
    const externalEntry = join(external, 'index.js')
    const sidebarEntry = join(root, 'node_modules', 'dsh-better-sidebar', 'lib', 'index.js')
    rmSync(sidebarEntry)
    writeFileSync(externalEntry, '')
    symlinkExternalFile(externalEntry, sidebarEntry)

    expect(() => verifyRuntime(root)).toThrow('Better Sidebar artifact is missing')
  })

  it('ignores a Web frontend reached through an external directory symlink', () => {
    const root = makeFakeRuntime({ cli: true, web: false, sidebar: true })
    const external = makeFakeRuntime({ cli: false, web: true, sidebar: false })
    symlinkDirectory(
      join(external, 'node_modules'),
      join(root, 'node_modules', 'external-node-modules'),
    )

    expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
  })

  it('rejects a Web frontend whose final file is an external symlink', () => {
    const root = makeFakeRuntime({ cli: true, web: false, sidebar: true })
    const external = makeFakeRuntime({ cli: false, web: false, sidebar: false })
    const externalEntry = join(external, 'index.html')
    const webEntry = makeWebEntry(root)
    mkdirSync(join(webEntry, '..'), { recursive: true })
    writeFileSync(externalEntry, '<!doctype html>\n')
    symlinkExternalFile(externalEntry, webEntry)

    expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
  })

  it('rejects a Harness CLI whose final file is an external symlink', () => {
    const root = makeFakeRuntime({ cli: false, web: true, sidebar: true })
    const external = makeFakeRuntime({ cli: false, web: false, sidebar: false })
    const externalEntry = join(external, 'bin.js')
    const cliEntry = join(root, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
    mkdirSync(join(cliEntry, '..'), { recursive: true })
    writeFileSync(externalEntry, '#!/usr/bin/env node\n')
    symlinkExternalFile(externalEntry, cliEntry)

    expect(() => verifyRuntime(root)).toThrow('Harness CLI is missing')
  })

  it('terminates safely when an internal directory symlink forms a cycle', () => {
    const root = makeFakeRuntime({ cli: true, web: false, sidebar: true })
    const nodeModules = join(root, 'node_modules')
    symlinkDirectory(nodeModules, join(nodeModules, 'cycle'))

    expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
  })
})

describe('release target preflight', () => {
  it('accepts a matching target platform and architecture', () => {
    expect(() =>
      assertReleaseTarget('darwin', 'arm64', { platform: 'darwin', architecture: 'arm64' }),
    ).not.toThrow()
  })

  it('rejects a release target that does not match the host', () => {
    expect(() =>
      assertReleaseTarget('win32', 'x64', { platform: 'darwin', architecture: 'arm64' }),
    ).toThrow('Release target win32/x64 requires a matching host; current host is darwin/arm64')
  })
})

describe('runtime staging safety', () => {
  it('accepts only a generated directory beneath the repository root', () => {
    const repositoryRoot = makeFakeRuntime({ cli: false, web: false, sidebar: false })

    expect(() =>
      assertSafeRuntimeTarget(repositoryRoot, join(repositoryRoot, 'runtime-host')),
    ).not.toThrow()
    expect(() => assertSafeRuntimeTarget(repositoryRoot, repositoryRoot)).toThrow(
      'Refusing to remove the repository root',
    )
    expect(() => assertSafeRuntimeTarget(repositoryRoot, join(repositoryRoot, '..', 'runtime-host'))).toThrow(
      'outside the repository root',
    )
  })

  it('uses the Windows command processor to launch pnpm.cmd', () => {
    expect(resolveRuntimeDeployCommand(
      'win32',
      'C:\\Windows\\System32\\cmd.exe',
      'C:\\project with spaces\\runtime-host',
    )).toEqual({
      executable: 'C:\\Windows\\System32\\cmd.exe',
      args: [
        '/d',
        '/s',
        '/c',
        'pnpm.cmd --config.node-linker=hoisted --filter dsh-desktop deploy --prod "C:\\project with spaces\\runtime-host"',
      ],
    })
  })

  it.each(['darwin', 'linux'] as const)('keeps direct pnpm execution on %s', (platform) => {
    expect(resolveRuntimeDeployCommand(platform, '/unused/cmd.exe', '/repo/runtime-host')).toEqual({
      executable: 'pnpm',
      args: [
        '--config.node-linker=hoisted',
        '--filter',
        'dsh-desktop',
        'deploy',
        '--prod',
        '/repo/runtime-host',
      ],
    })
  })
})

describe('native package configuration', () => {
  it('pins the official Harness and Better Sidebar source revision', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>
    }
    const workspace = readFileSync('pnpm-workspace.yaml', 'utf8')

    expect(manifest.dependencies).toMatchObject({
      '@deepseek-ai/dsh': '0.1.0-rc.6',
      'dsh-better-sidebar':
        'github:omdsh-dev/DSH-better-sidebar#5d2d6e580143dc6ad95c015feb2909ec60afdf77',
    })
    expect(workspace).toMatch(/onlyBuiltDependencies:\s+- dsh-better-sidebar/u)
  })

  it('keeps Better Sidebar controls usable before the first session exists', () => {
    const patch = readFileSync('patches/dsh-better-sidebar@0.12.2.patch', 'utf8')
    const bundledClient = readFileSync('node_modules/dsh-better-sidebar/lib/client.js', 'utf8')

    expect(patch).toContain("const DRAFT_SESSION_ID = '__dsh_better_sidebar_draft__'")
    expect(bundledClient).toContain('const DRAFT_SESSION_ID = "__dsh_better_sidebar_draft__"')
    expect(bundledClient).toContain('store.setSession(current ?? DRAFT_SESSION_ID)')
    expect(bundledClient).toContain('if (narrow || current === void 0) return;')
  })

  it('copies the verified runtime and desktop resources outside ASAR', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      build?: Record<string, unknown>
      scripts?: Record<string, string>
    }

    expect(manifest.build).toMatchObject({
      appId: 'com.community.dsh-desktop',
      productName: 'DSH Desktop',
      icon: 'build/icon.png',
      compression: 'normal',
      beforeBuild: './scripts/electron-builder-hooks.cjs',
      asar: true,
      files: ['lib/**', 'package.json'],
      extraResources: [
        { from: 'runtime-host/node_modules', to: 'host/node_modules' },
        { from: 'runtime-host/package.json', to: 'host/package.json' },
        { from: 'build/generated/legal', to: 'legal' },
        {
          from: 'build/trayTemplate.png',
          to: 'desktop-resources/trayTemplate.png',
        },
        {
          from: 'build/trayTemplate@2x.png',
          to: 'desktop-resources/trayTemplate@2x.png',
        },
      ],
      mac: {
        icon: 'build/icon.icns',
        category: 'public.app-category.developer-tools',
        target: ['dmg'],
      },
      win: { icon: 'build/icon.ico', target: ['nsis'] },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
      },
    })
    expect(manifest.scripts).toMatchObject({
      'stage:legal': 'node --import tsx scripts/stage-legal-resources.ts',
      'verify:package-legal': 'node --import tsx scripts/verify-packaged-legal-resources.ts',
      package:
        'pnpm build && pnpm stage:runtime && pnpm verify:runtime && pnpm stage:legal && electron-builder --dir && pnpm verify:package-legal',
      'dist:mac:arm64':
        'node --import tsx scripts/verify-release-target.ts darwin arm64 && pnpm build && pnpm stage:runtime && pnpm verify:runtime && pnpm stage:legal && electron-builder --mac dmg --arm64 && pnpm verify:package-legal -- darwin arm64',
      'dist:mac:x64':
        'node --import tsx scripts/verify-release-target.ts darwin x64 && pnpm build && pnpm stage:runtime && pnpm verify:runtime && pnpm stage:legal && electron-builder --mac dmg --x64 && pnpm verify:package-legal -- darwin x64',
      'dist:win:x64':
        'node --import tsx scripts/verify-release-target.ts win32 x64 && pnpm build && pnpm stage:runtime && pnpm verify:runtime && pnpm stage:legal && electron-builder --win nsis --x64 && pnpm verify:package-legal -- win32 x64',
    })
  })

  it('provides production icons for macOS and Windows', () => {
    const upstreamLogo = readFileSync('build/deepseek-logo.svg', 'utf8')
    expect(upstreamLogo).toContain('viewBox="0 0 50 50"')
    expect(upstreamLogo).toContain('<path')

    const png = readFileSync('build/icon.png')
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(1024)
    expect(png.readUInt32BE(20)).toBe(1024)

    const icns = readFileSync('build/icon.icns')
    expect(icns.subarray(0, 4).toString('ascii')).toBe('icns')

    const ico = readFileSync('build/icon.ico')
    expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0])
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(7)

    const tray = readFileSync('build/trayTemplate.png')
    expect(tray.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect(tray.readUInt32BE(16)).toBe(18)
    expect(tray.readUInt32BE(20)).toBe(18)

    const retinaTray = readFileSync('build/trayTemplate@2x.png')
    expect(retinaTray.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect(retinaTray.readUInt32BE(16)).toBe(36)
    expect(retinaTray.readUInt32BE(20)).toBe(36)
  })

  it('can regenerate every packaged application icon from the shared multicolor source', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts?: Record<string, string>
    }
    expect(manifest.scripts?.icons).toBe('node scripts/generate-brand-icons.mjs')
    const iconGenerator = readFileSync('scripts/generate-brand-icons.mjs', 'utf8')
    expect(iconGenerator).toContain("favicon-spectrum-v3.svg")
    expect(iconGenerator).toContain("join(buildDirectory, 'icon.png')")
    expect(iconGenerator).toContain("join(buildDirectory, 'icon.icns')")
    expect(iconGenerator).toContain("join(buildDirectory, 'icon.ico')")
  })
})
