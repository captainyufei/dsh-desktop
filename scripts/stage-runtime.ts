import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyRuntime } from './verify-runtime.ts'

export function assertSafeRuntimeTarget(repositoryRoot: string, target: string): void {
  const resolvedRepositoryRoot = resolve(repositoryRoot)
  const resolvedTarget = resolve(target)
  const relativeTarget = relative(resolvedRepositoryRoot, resolvedTarget)

  if (relativeTarget === '') {
    throw new Error('Refusing to remove the repository root')
  }

  if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`)) {
    throw new Error(`Refusing to remove a target outside the repository root: ${resolvedTarget}`)
  }
}

export function stageRuntime(repositoryRoot: string): void {
  const resolvedRepositoryRoot = resolve(repositoryRoot)
  const runtimeHost = resolve(resolvedRepositoryRoot, 'runtime-host')
  assertSafeRuntimeTarget(resolvedRepositoryRoot, runtimeHost)
  rmSync(runtimeHost, { recursive: true, force: true })

  execFileSync(
    'pnpm',
    ['--filter', 'dsh-desktop', 'deploy', '--prod', runtimeHost],
    { cwd: resolvedRepositoryRoot, stdio: 'inherit' },
  )

  const entries = verifyRuntime(runtimeHost)
  console.log(`Harness CLI: ${entries.cliEntry}`)
  console.log(`Harness Web UI: ${entries.webEntry}`)
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entry = process.argv[1]
if (entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)) {
  stageRuntime(repositoryRoot)
}
