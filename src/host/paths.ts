import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { DESKTOP_PROFILE_NAME, resolveDshHomePath } from './desktop-profile.ts'

export interface RuntimeArtifacts {
  readonly cliEntry: string
  readonly webEntry: string
  readonly sidebarPackageRoot: string
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
  readonly dshHomePath: string
  readonly profileName: string
}

export function resolveRuntimeArtifacts(nodeModulesRoot: string): RuntimeArtifacts {
  const nodeModulesRequire = createRequire(join(nodeModulesRoot, 'package.json'))
  const dshPackage = realpathSync(
    nodeModulesRequire.resolve('@deepseek-ai/dsh/package.json'),
  )
  const dshRoot = dirname(dshPackage)
  const dshRequire = createRequire(dshPackage)
  const webAppPackage = dshRequire.resolve('@deepseek-ai/dsh-web-app/package.json')
  const webRequire = createRequire(webAppPackage)
  const webFrontendPackage = webRequire.resolve('@deepseek-ai/dsh-web-frontend/package.json')
  const sidebarPackage = realpathSync(
    nodeModulesRequire.resolve('dsh-better-sidebar/package.json'),
  )

  return {
    cliEntry: join(dshRoot, 'lib/bin.js'),
    webEntry: join(dirname(webFrontendPackage), 'dist/index.html'),
    sidebarPackageRoot: dirname(sidebarPackage),
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
    dshHomePath: resolveDshHomePath(options.homePath, options.env),
    profileName: DESKTOP_PROFILE_NAME,
  }
}

export function assertRuntimeArtifacts(paths: HostPaths): void {
  if (!existsSync(paths.cliEntry)) {
    throw new Error(`Harness CLI is missing: ${paths.cliEntry}`)
  }
  if (!existsSync(paths.webEntry)) {
    throw new Error(`Harness Web UI is missing: ${paths.webEntry}`)
  }
  for (const relativePath of [
    'lib/index.js',
    'lib/client-registry.js',
    'lib/client-editor.js',
    'lib/client-terminal.js',
    'cordis.patch.yml',
  ]) {
    const artifact = join(paths.sidebarPackageRoot, relativePath)
    if (!existsSync(artifact)) {
      throw new Error(`Better Sidebar artifact is missing: ${artifact}`)
    }
  }
}
