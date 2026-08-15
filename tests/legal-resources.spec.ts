import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  packagedLegalDirectory,
  resolveLicenseInventoryCommand,
  resolvePackageTarget,
  stageLegalResources,
  verifyLegalResources,
} from '../scripts/legal-resources.ts'

const temporaryRoots: string[] = []
const VALID_INVENTORY = JSON.stringify({
  MIT: [
    {
      name: '@deepseek-ai/dsh',
      versions: ['0.1.0-rc.6'],
      paths: ['/generated/node_modules/@deepseek-ai/dsh'],
      license: 'MIT',
    },
  ],
})

function makeRepositoryFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'dsh-legal-resources-'))
  temporaryRoots.push(root)
  writeFileSync(join(root, 'LICENSE'), 'desktop license\n')
  writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), '# Notices\n')
  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('packaged legal resources', () => {
  it('stages exact project notices and a generated production dependency inventory', () => {
    const root = makeRepositoryFixture()
    const legalDirectory = stageLegalResources(root, VALID_INVENTORY)

    expect(readFileSync(join(legalDirectory, 'LICENSE'), 'utf8')).toBe('desktop license\n')
    expect(readFileSync(join(legalDirectory, 'THIRD_PARTY_NOTICES.md'), 'utf8')).toBe(
      '# Notices\n',
    )
    expect(JSON.parse(readFileSync(join(legalDirectory, 'dependency-licenses.json'), 'utf8')))
      .toEqual(JSON.parse(VALID_INVENTORY))
    expect(verifyLegalResources(root, legalDirectory)).toEqual({
      licenseGroups: 1,
      packages: 1,
    })
  })

  it('rejects a package whose desktop notices do not match the reviewed sources', () => {
    const root = makeRepositoryFixture()
    const legalDirectory = stageLegalResources(root, VALID_INVENTORY)
    writeFileSync(join(legalDirectory, 'THIRD_PARTY_NOTICES.md'), '# Replaced notices\n')

    expect(() => verifyLegalResources(root, legalDirectory)).toThrow(
      'Packaged THIRD_PARTY_NOTICES.md does not match the project source',
    )
  })

  it.each([
    ['malformed JSON', '{'],
    ['an empty object', '{}'],
    ['an empty license group', '{"MIT":[]}'],
    ['a dependency without a version', '{"MIT":[{"name":"missing-version","versions":[]}]}'],
  ])('rejects %s as a dependency inventory', (_, inventory) => {
    const root = makeRepositoryFixture()

    expect(() => stageLegalResources(root, inventory)).toThrow(/dependency license inventory/u)
  })

  it('resolves the stable legal directory in supported unpacked applications', () => {
    expect(packagedLegalDirectory('/artifacts', 'darwin', 'arm64')).toBe(
      join('/artifacts', 'mac-arm64', 'DSH Desktop.app', 'Contents', 'Resources', 'legal'),
    )
    expect(packagedLegalDirectory('/artifacts', 'darwin', 'x64')).toBe(
      join('/artifacts', 'mac', 'DSH Desktop.app', 'Contents', 'Resources', 'legal'),
    )
    expect(packagedLegalDirectory('C:\\artifacts', 'win32', 'x64')).toBe(
      join('C:\\artifacts', 'win-unpacked', 'resources', 'legal'),
    )
  })

  it('accepts the argument separator forwarded by pnpm release scripts', () => {
    expect(resolvePackageTarget(['--', 'darwin', 'arm64'], 'win32', 'x64')).toEqual({
      platform: 'darwin',
      architecture: 'arm64',
    })
    expect(resolvePackageTarget([], 'darwin', 'arm64')).toEqual({
      platform: 'darwin',
      architecture: 'arm64',
    })
  })

  it('verifies files at the resolved post-package location', () => {
    const root = makeRepositoryFixture()
    const output = join(root, 'dist')
    const packagedDirectory = packagedLegalDirectory(output, 'darwin', 'arm64')
    const stagedDirectory = stageLegalResources(root, VALID_INVENTORY)
    mkdirSync(join(packagedDirectory, '..'), { recursive: true })
    mkdirSync(packagedDirectory, { recursive: true })
    for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'dependency-licenses.json']) {
      writeFileSync(
        join(packagedDirectory, name),
        readFileSync(join(stagedDirectory, name)),
      )
    }

    expect(verifyLegalResources(root, packagedDirectory)).toEqual({
      licenseGroups: 1,
      packages: 1,
    })
  })
})

describe('dependency license inventory command', () => {
  it('uses the Windows command processor to launch pnpm.cmd', () => {
    expect(resolveLicenseInventoryCommand('win32', 'C:\\Windows\\System32\\cmd.exe')).toEqual({
      executable: 'C:\\Windows\\System32\\cmd.exe',
      args: ['/d', '/s', '/c', 'pnpm.cmd --silent licenses:inventory'],
    })
  })

  it.each(['darwin', 'linux'] as const)('keeps direct pnpm execution on %s', (platform) => {
    expect(resolveLicenseInventoryCommand(platform, '/unused/cmd.exe')).toEqual({
      executable: 'pnpm',
      args: ['--silent', 'licenses:inventory'],
    })
  })
})
