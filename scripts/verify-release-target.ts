import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ReleaseHost {
  platform: string
  architecture: string
}

export function assertReleaseTarget(
  expectedPlatform: string,
  expectedArchitecture: string,
  host: ReleaseHost = { platform: process.platform, architecture: process.arch },
): void {
  if (host.platform !== expectedPlatform || host.architecture !== expectedArchitecture) {
    throw new Error(
      `Release target ${expectedPlatform}/${expectedArchitecture} requires a matching host; ` +
        `current host is ${host.platform}/${host.architecture}`,
    )
  }
}

const entry = process.argv[1]
if (entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)) {
  const expectedPlatform = process.argv[2]
  const expectedArchitecture = process.argv[3]
  if (expectedPlatform === undefined || expectedArchitecture === undefined) {
    throw new Error('Usage: verify-release-target <platform> <architecture>')
  }
  assertReleaseTarget(expectedPlatform, expectedArchitecture)
  console.log(`Release target verified: ${expectedPlatform}/${expectedArchitecture}`)
}
