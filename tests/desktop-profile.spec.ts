import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DESKTOP_PROFILE_NAME,
  prepareDesktopProfile,
  resolveDshHomePath,
} from '../src/host/desktop-profile.ts'

const temporaryRoots: string[] = []

function makeRoot(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix))
  temporaryRoots.push(root)
  return root
}

function makeSidebarPackage(root: string, name = 'sidebar-package'): string {
  const packageRoot = join(root, name)
  mkdirSync(join(packageRoot, 'lib'), { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: 'dsh-better-sidebar' }))
  writeFileSync(join(packageRoot, 'lib/index.js'), '')
  writeFileSync(join(packageRoot, 'lib/client-registry.js'), '')
  writeFileSync(join(packageRoot, 'cordis.patch.yml'), '[]\n')
  return packageRoot
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('desktop Harness profile', () => {
  it('resolves default, home-relative, and cwd-relative DSH homes', () => {
    const homePath = resolve(tmpdir(), 'dsh-desktop-test-home')

    expect(resolveDshHomePath(homePath, {})).toBe(join(homePath, '.dsh'))
    expect(resolveDshHomePath(homePath, { DSH_HOME: '~/custom-dsh' })).toBe(
      join(homePath, 'custom-dsh'),
    )
    expect(resolveDshHomePath(homePath, { DSH_HOME: 'runtime/dsh' })).toBe(
      join(homePath, 'runtime/dsh'),
    )
  })

  it('creates an isolated profile with official bundles and the bundled sidebar', () => {
    const root = makeRoot('dsh-desktop-profile-')
    const dshHomePath = join(root, 'dsh-home')
    const sidebarPackageRoot = makeSidebarPackage(root)

    expect(prepareDesktopProfile({ dshHomePath, sidebarPackageRoot })).toBe(
      DESKTOP_PROFILE_NAME,
    )

    const profileDir = join(dshHomePath, 'profiles', DESKTOP_PROFILE_NAME)
    const manifest = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as {
      dsh: { profile: { bundles: string[] } }
      dshDesktop: { managedProfileVersion: number }
    }
    expect(manifest.dsh.profile.bundles).toEqual([
      '@deepseek-ai/dsh-base',
      '@deepseek-ai/dsh-web-app',
      'dsh-better-sidebar',
    ])
    expect(manifest.dshDesktop.managedProfileVersion).toBe(1)
    expect(readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')).toBe('[]\n')
    expect(readFileSync(join(profileDir, 'pnpm-workspace.yaml'), 'utf8')).toContain(
      'nodeLinker: hoisted',
    )
    const sidebarLink = join(profileDir, 'node_modules', 'dsh-better-sidebar')
    expect(lstatSync(sidebarLink).isSymbolicLink()).toBe(true)
    expect(realpathSync(sidebarLink)).toBe(realpathSync(sidebarPackageRoot))
  })

  it('preserves profile customizations and refreshes only the managed plugin link', () => {
    const root = makeRoot('dsh-desktop-profile-preserve-')
    const dshHomePath = join(root, 'dsh-home')
    const profileDir = join(dshHomePath, 'profiles', DESKTOP_PROFILE_NAME)
    mkdirSync(profileDir, { recursive: true })
    writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
      dependencies: { 'custom-package': '1.0.0' },
      dsh: { profile: { bundles: ['custom-bundle', '@deepseek-ai/dsh-base'] } },
    }))
    writeFileSync(join(profileDir, 'cordis.patch.yml'), '- custom: true\n')
    const firstPackageRoot = makeSidebarPackage(root, 'sidebar-first')
    const secondPackageRoot = makeSidebarPackage(root, 'sidebar-second')

    prepareDesktopProfile({ dshHomePath, sidebarPackageRoot: firstPackageRoot })
    prepareDesktopProfile({ dshHomePath, sidebarPackageRoot: secondPackageRoot })

    const manifest = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      dsh: { profile: { bundles: string[] } }
    }
    expect(manifest.dependencies).toEqual({ 'custom-package': '1.0.0' })
    expect(manifest.dsh.profile.bundles).toEqual([
      '@deepseek-ai/dsh-base',
      '@deepseek-ai/dsh-web-app',
      'dsh-better-sidebar',
      'custom-bundle',
    ])
    expect(readFileSync(join(profileDir, 'cordis.patch.yml'), 'utf8')).toBe(
      '- custom: true\n',
    )
    expect(realpathSync(join(profileDir, 'node_modules', 'dsh-better-sidebar'))).toBe(
      realpathSync(secondPackageRoot),
    )
  })

  it('does not overwrite a user-owned plugin directory', () => {
    const root = makeRoot('dsh-desktop-profile-collision-')
    const dshHomePath = join(root, 'dsh-home')
    const pluginPath = join(
      dshHomePath,
      'profiles',
      DESKTOP_PROFILE_NAME,
      'node_modules',
      'dsh-better-sidebar',
    )
    mkdirSync(pluginPath, { recursive: true })
    const sidebarPackageRoot = makeSidebarPackage(root)

    expect(() => prepareDesktopProfile({ dshHomePath, sidebarPackageRoot })).toThrow(
      'cannot manage a non-symlink plugin path',
    )
    expect(existsSync(pluginPath)).toBe(true)
  })
})
