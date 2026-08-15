import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { APP_NAME } from '../src/app-metadata.ts'

const GENERATED_LEGAL_DIRECTORY = join('build', 'generated', 'legal')
const INVENTORY_NAME = 'dependency-licenses.json'

export interface DependencyInventorySummary {
  readonly licenseGroups: number
  readonly packages: number
}

export interface LicenseInventoryCommand {
  readonly executable: string
  readonly args: readonly string[]
}

export function resolveLicenseInventoryCommand(
  platform: NodeJS.Platform,
  commandProcessor?: string,
): LicenseInventoryCommand {
  if (platform === 'win32') {
    return {
      executable: commandProcessor === undefined || commandProcessor === ''
        ? 'cmd.exe'
        : commandProcessor,
      args: ['/d', '/s', '/c', 'pnpm.cmd --silent licenses:inventory'],
    }
  }
  return {
    executable: 'pnpm',
    args: ['--silent', 'licenses:inventory'],
  }
}

export interface PackageTarget {
  readonly platform: NodeJS.Platform
  readonly architecture: string
}

export function resolvePackageTarget(
  args: readonly string[],
  currentPlatform: NodeJS.Platform,
  currentArchitecture: string,
): PackageTarget {
  const targetArguments = args[0] === '--' ? args.slice(1) : args
  if (targetArguments.length === 0) {
    return { platform: currentPlatform, architecture: currentArchitecture }
  }
  if (targetArguments.length !== 2) {
    throw new Error('Usage: verify-packaged-legal-resources [--] [platform architecture]')
  }
  return {
    platform: targetArguments[0] as NodeJS.Platform,
    architecture: targetArguments[1] as string,
  }
}

function summarizeDependencyInventory(contents: string): DependencyInventorySummary {
  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    throw new Error('Generated dependency license inventory is not valid JSON')
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Generated dependency license inventory must be an object')
  }

  const groups = Object.entries(parsed)
  if (groups.length === 0) {
    throw new Error('Generated dependency license inventory has no license groups')
  }

  let packages = 0
  for (const [license, dependencies] of groups) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      throw new Error(`Generated dependency license inventory group ${license} is empty`)
    }
    for (const dependency of dependencies) {
      if (dependency === null || typeof dependency !== 'object' || Array.isArray(dependency)) {
        throw new Error('Generated dependency license inventory contains an invalid package')
      }
      const { name, versions } = dependency as { name?: unknown; versions?: unknown }
      if (typeof name !== 'string' || name === '') {
        throw new Error('Generated dependency license inventory contains a package without a name')
      }
      if (!Array.isArray(versions)
        || versions.length === 0
        || versions.some((version) => typeof version !== 'string' || version === '')) {
        throw new Error(
          `Generated dependency license inventory contains ${name} without a version`,
        )
      }
      packages += 1
    }
  }

  return { licenseGroups: groups.length, packages }
}

export function stageLegalResources(repositoryRoot: string, inventory: string): string {
  summarizeDependencyInventory(inventory)
  const root = resolve(repositoryRoot)
  const target = resolve(root, GENERATED_LEGAL_DIRECTORY)

  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  copyFileSync(join(root, 'LICENSE'), join(target, 'LICENSE'))
  copyFileSync(
    join(root, 'THIRD_PARTY_NOTICES.md'),
    join(target, 'THIRD_PARTY_NOTICES.md'),
  )
  writeFileSync(
    join(target, INVENTORY_NAME),
    inventory.endsWith('\n') ? inventory : `${inventory}\n`,
  )
  return target
}

export function verifyLegalResources(
  repositoryRoot: string,
  legalDirectory: string,
): DependencyInventorySummary {
  const root = resolve(repositoryRoot)
  const legal = resolve(legalDirectory)
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md'] as const) {
    const source = readFileSync(join(root, name))
    const packaged = readFileSync(join(legal, name))
    if (!source.equals(packaged)) {
      throw new Error(`Packaged ${name} does not match the project source`)
    }
  }
  return summarizeDependencyInventory(readFileSync(join(legal, INVENTORY_NAME), 'utf8'))
}

export function packagedLegalDirectory(
  outputRoot: string,
  platform: NodeJS.Platform,
  architecture: string,
): string {
  if (platform === 'darwin' && (architecture === 'arm64' || architecture === 'x64')) {
    const outputName = architecture === 'arm64' ? 'mac-arm64' : 'mac'
    return join(
      outputRoot,
      outputName,
      `${APP_NAME}.app`,
      'Contents',
      'Resources',
      'legal',
    )
  }
  if (platform === 'win32' && architecture === 'x64') {
    return join(outputRoot, 'win-unpacked', 'resources', 'legal')
  }
  throw new Error(`Unsupported package target for legal verification: ${platform}/${architecture}`)
}
