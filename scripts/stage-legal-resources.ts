import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stageLegalResources, verifyLegalResources } from './legal-resources.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inventory = execFileSync('pnpm', ['--silent', 'licenses:inventory'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
})
const legalDirectory = stageLegalResources(repositoryRoot, inventory)
const summary = verifyLegalResources(repositoryRoot, legalDirectory)
console.log(
  `Staged legal resources: ${legalDirectory} (${summary.packages} packages in ${summary.licenseGroups} license groups)`,
)
