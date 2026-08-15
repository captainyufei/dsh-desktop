import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export const DESKTOP_PROFILE_NAME = 'dsh-desktop'

const REQUIRED_BUNDLES = [
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  'dsh-better-sidebar',
] as const
const PROFILE_PATCH = '[]\n'
const PROFILE_WORKSPACE = `packages:
  - .

nodeLinker: hoisted
autoInstallPeers: false
`

interface ProfileManifest {
  readonly [key: string]: unknown
}

export interface PrepareDesktopProfileOptions {
  readonly dshHomePath: string
  readonly sidebarPackageRoot: string
  readonly profileName?: string
}

export function resolveDshHomePath(
  homePath: string,
  env: NodeJS.ProcessEnv,
): string {
  const configured = env.DSH_HOME?.trim()
  if (configured === undefined || configured === '') {
    return join(homePath, '.dsh')
  }
  if (configured === '~') {
    return homePath
  }
  const expanded = configured.startsWith('~/') || configured.startsWith('~\\')
    ? join(homePath, configured.slice(2))
    : configured
  return resolve(homePath, expanded)
}

function readManifest(path: string): ProfileManifest {
  if (!existsSync(path)) {
    return {}
  }
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Desktop Harness profile manifest must contain an object: ${path}`)
  }
  return parsed as ProfileManifest
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function composeManifest(
  current: ProfileManifest,
  profileName: string,
): ProfileManifest {
  const currentDsh = current.dsh !== null && typeof current.dsh === 'object'
    ? current.dsh as Record<string, unknown>
    : {}
  const currentProfile = currentDsh.profile !== null && typeof currentDsh.profile === 'object'
    ? currentDsh.profile as Record<string, unknown>
    : {}
  const existingBundles = stringArray(currentProfile.bundles)
  const extraBundles = existingBundles.filter((bundle) => !REQUIRED_BUNDLES.includes(
    bundle as (typeof REQUIRED_BUNDLES)[number],
  ))
  const currentMarker = current.dshDesktop !== null && typeof current.dshDesktop === 'object'
    ? current.dshDesktop as Record<string, unknown>
    : {}

  return {
    ...current,
    name: typeof current.name === 'string' ? current.name : `dsh-profile-${profileName}`,
    private: true,
    dependencies: current.dependencies !== null && typeof current.dependencies === 'object'
      ? current.dependencies
      : {},
    dsh: {
      ...currentDsh,
      profile: {
        ...currentProfile,
        bundles: [...REQUIRED_BUNDLES, ...extraBundles],
      },
    },
    dshDesktop: {
      ...currentMarker,
      managedProfileVersion: 1,
    },
  }
}

function writeFileAtomically(path: string, content: string): void {
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(temporaryPath, content, { flag: 'wx' })
  try {
    renameSync(temporaryPath, path)
  } finally {
    if (existsSync(temporaryPath)) {
      unlinkSync(temporaryPath)
    }
  }
}

function ensureFile(path: string, content: string): void {
  if (!existsSync(path)) {
    writeFileAtomically(path, content)
  }
}

function ensureSidebarLink(linkPath: string, packageRoot: string): void {
  const target = realpathSync(packageRoot)
  if (existsSync(linkPath) || lstatExists(linkPath)) {
    const stat = lstatSync(linkPath)
    if (!stat.isSymbolicLink()) {
      throw new Error(
        `Desktop Harness profile cannot manage a non-symlink plugin path: ${linkPath}`,
      )
    }
    const currentTarget = resolve(dirname(linkPath), readlinkSync(linkPath))
    if (existsSync(currentTarget) && realpathSync(currentTarget) === target) {
      return
    }
    unlinkSync(linkPath)
  }
  symlinkSync(target, linkPath, 'junction')
}

function lstatExists(path: string): boolean {
  try {
    lstatSync(path)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ENOENT'
  }
}

export function prepareDesktopProfile(options: PrepareDesktopProfileOptions): string {
  const profileName = options.profileName ?? DESKTOP_PROFILE_NAME
  const profileDir = join(options.dshHomePath, 'profiles', profileName)
  const manifestPath = join(profileDir, 'package.json')
  const modulesDir = join(profileDir, 'node_modules')

  mkdirSync(modulesDir, { recursive: true })
  const manifest = composeManifest(readManifest(manifestPath), profileName)
  const serialized = `${JSON.stringify(manifest, undefined, 2)}\n`
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== serialized) {
    writeFileAtomically(manifestPath, serialized)
  }
  ensureFile(join(profileDir, 'cordis.patch.yml'), PROFILE_PATCH)
  ensureFile(join(profileDir, 'pnpm-workspace.yaml'), PROFILE_WORKSPACE)
  ensureSidebarLink(join(modulesDir, 'dsh-better-sidebar'), options.sidebarPackageRoot)

  return profileName
}
