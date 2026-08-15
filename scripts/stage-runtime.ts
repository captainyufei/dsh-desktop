import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyRuntime } from './verify-runtime.ts'

export interface RuntimeDeployCommand {
  readonly executable: string
  readonly args: readonly string[]
}

export function resolveRuntimeDeployCommand(
  platform: NodeJS.Platform,
  commandProcessor: string | undefined,
  runtimeHost: string,
): RuntimeDeployCommand {
  // A regular pnpm deploy uses directory links into node_modules/.pnpm. On
  // Windows those links are absolute NTFS junctions, and electron-builder
  // preserves their original targets in extraResources. The resulting app
  // then works only on the build machine. A hoisted deploy contains real
  // directories and remains portable after the application is installed.
  const deployArguments = [
    '--config.node-linker=hoisted',
    '--filter',
    'dsh-desktop',
    'deploy',
    '--prod',
    runtimeHost,
  ]
  if (platform === 'win32') {
    const quotedRuntimeHost = `"${runtimeHost.replaceAll('"', '""')}"`
    return {
      executable: commandProcessor === undefined || commandProcessor === ''
        ? 'cmd.exe'
        : commandProcessor,
      args: [
        '/d',
        '/s',
        '/c',
        `pnpm.cmd --config.node-linker=hoisted --filter dsh-desktop deploy --prod ${quotedRuntimeHost}`,
      ],
    }
  }

  return { executable: 'pnpm', args: deployArguments }
}

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

  const deployCommand = resolveRuntimeDeployCommand(
    process.platform,
    process.env.ComSpec,
    runtimeHost,
  )
  const deployResult = spawnSync(deployCommand.executable, [...deployCommand.args], {
    cwd: resolvedRepositoryRoot,
    stdio: 'inherit',
    // Node's default Windows argv quoting preserves the quotes inside the
    // `cmd.exe /c` command string, so pnpm receives them as part of the path.
    windowsVerbatimArguments: process.platform === 'win32',
  })
  if (deployResult.error !== undefined) {
    throw deployResult.error
  }
  if (deployResult.status !== 0) {
    throw new Error(`Harness runtime deployment failed with exit code ${deployResult.status ?? 'unknown'}`)
  }

  const entries = verifyRuntime(runtimeHost)
  console.log(`Harness CLI: ${entries.cliEntry}`)
  console.log(`Harness Web UI: ${entries.webEntry}`)
  console.log(`Better Sidebar host: ${entries.sidebarEntry}`)
  console.log(`Better Sidebar client: ${entries.sidebarClientEntry}`)
  console.log(`Better Sidebar editor: ${entries.sidebarEditorEntry}`)
  console.log(`Better Sidebar terminal: ${entries.sidebarTerminalEntry}`)
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entry = process.argv[1]
if (entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)) {
  stageRuntime(repositoryRoot)
}
