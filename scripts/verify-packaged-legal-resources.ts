import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  packagedLegalDirectory,
  resolvePackageTarget,
  verifyLegalResources,
} from './legal-resources.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { platform, architecture } = resolvePackageTarget(
  process.argv.slice(2),
  process.platform,
  process.arch,
)
const legalDirectory = packagedLegalDirectory(
  resolve(repositoryRoot, 'dist'),
  platform,
  architecture,
)
const summary = verifyLegalResources(repositoryRoot, legalDirectory)
console.log(
  `Verified packaged legal resources: ${legalDirectory} (${summary.packages} packages in ${summary.licenseGroups} license groups)`,
)
