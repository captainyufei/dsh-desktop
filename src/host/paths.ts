import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

export interface RuntimeArtifacts {
  readonly cliEntry: string
  readonly webEntry: string
}

export interface HostPathOptions {
  readonly isPackaged: boolean
  readonly appPath: string
  readonly resourcesPath: string
  readonly execPath: string
  readonly homePath: string
  readonly env: NodeJS.ProcessEnv
}

export interface HostPaths extends RuntimeArtifacts {
  readonly nodeExecutable: string
  readonly cwd: string
  readonly electronRunAsNode: boolean
}

export function resolveRuntimeArtifacts(nodeModulesRoot: string): RuntimeArtifacts {
  const dshRoot = join(nodeModulesRoot, '@deepseek-ai/dsh')
  const dshRequire = createRequire(join(dshRoot, 'package.json'))
  const webAppPackage = dshRequire.resolve('@deepseek-ai/dsh-web-app/package.json')
  const webRequire = createRequire(webAppPackage)
  const webFrontendPackage = webRequire.resolve('@deepseek-ai/dsh-web-frontend/package.json')

  return {
    cliEntry: join(dshRoot, 'lib/bin.js'),
    webEntry: join(dirname(webFrontendPackage), 'dist/index.html'),
  }
}

export function resolveHostPaths(options: HostPathOptions): HostPaths {
  const nodeModulesRoot = options.isPackaged
    ? join(options.resourcesPath, 'host', 'node_modules')
    : join(options.appPath, 'node_modules')
  const artifacts = resolveRuntimeArtifacts(nodeModulesRoot)

  return {
    ...artifacts,
    nodeExecutable: options.isPackaged
      ? options.execPath
      : (options.env.DSH_DESKTOP_NODE_EXECUTABLE ?? 'node'),
    cwd: options.homePath,
    electronRunAsNode: options.isPackaged,
  }
}

export function assertRuntimeArtifacts(paths: HostPaths): void {
  if (!existsSync(paths.cliEntry)) {
    throw new Error(`Harness CLI is missing: ${paths.cliEntry}`)
  }
  if (!existsSync(paths.webEntry)) {
    throw new Error(`Harness Web UI is missing: ${paths.webEntry}`)
  }
}
