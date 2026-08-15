import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { assertSafeRuntimeTarget } from '../scripts/stage-runtime.ts'
import { verifyRuntime } from '../scripts/verify-runtime.ts'

const temporaryRoots: string[] = []

function makeFakeRuntime({ cli, web }: { cli: boolean; web: boolean }): string {
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

  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('runtime packaging verification', () => {
  it('rejects a staged runtime without the Harness CLI', () => {
    const root = makeFakeRuntime({ cli: false, web: true })
    expect(() => verifyRuntime(root)).toThrow('Harness CLI is missing')
  })

  it('rejects a staged runtime without the Web frontend', () => {
    const root = makeFakeRuntime({ cli: true, web: false })
    expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
  })

  it('accepts both required runtime entries', () => {
    const root = makeFakeRuntime({ cli: true, web: true })
    expect(verifyRuntime(root)).toEqual({
      cliEntry: expect.stringMatching(/lib[/\\]bin\.js$/u),
      webEntry: expect.stringMatching(/dist[/\\]index\.html$/u),
    })
  })
})

describe('runtime staging safety', () => {
  it('accepts only a generated directory beneath the repository root', () => {
    const repositoryRoot = makeFakeRuntime({ cli: false, web: false })

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
})

describe('native package configuration', () => {
  it('copies the verified runtime and desktop resources outside ASAR', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      build?: Record<string, unknown>
    }

    expect(manifest.build).toMatchObject({
      appId: 'com.community.dsh-desktop',
      productName: 'DSH Desktop',
      icon: 'build/icon.svg',
      beforeBuild: './scripts/electron-builder-hooks.cjs',
      asar: true,
      files: ['lib/**', 'package.json'],
      extraResources: [
        { from: 'runtime-host/node_modules', to: 'host/node_modules' },
        { from: 'runtime-host/package.json', to: 'host/package.json' },
        {
          from: 'build/trayTemplate.png',
          to: 'desktop-resources/trayTemplate.png',
        },
      ],
      mac: {
        category: 'public.app-category.developer-tools',
        target: ['dmg'],
      },
      win: { target: ['nsis'] },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
      },
    })
  })

  it('provides an original scalable application icon', () => {
    const icon = readFileSync('build/icon.svg', 'utf8')
    expect(icon).toContain('viewBox="0 0 1024 1024"')
    expect(icon).toContain('<svg')
  })
})
