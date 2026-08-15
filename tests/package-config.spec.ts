import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_ID, APP_NAME, APP_VERSION } from '../src/app-metadata.ts'

describe('desktop package metadata', () => {
  it('pins the public identity and Harness runtime', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      version: string
      dependencies: Record<string, string>
    }
    expect({ APP_ID, APP_NAME, APP_VERSION }).toEqual({
      APP_ID: 'com.community.dsh-desktop',
      APP_NAME: 'DSH Desktop',
      APP_VERSION: '0.1.0',
    })
    expect(manifest.version).toBe(APP_VERSION)
    expect(manifest.dependencies['@deepseek-ai/dsh']).toBe('0.1.0-rc.6')
  })
})
