import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface RuntimeEntries {
  cliEntry: string
  webEntry: string
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function findWebEntry(nodeModules: string): string | undefined {
  const visitedDirectories = new Set<string>()
  const directories = [nodeModules]

  while (directories.length > 0) {
    const directory = directories.pop()
    if (directory === undefined) {
      break
    }

    let realDirectory: string
    try {
      realDirectory = realpathSync(directory)
    } catch {
      continue
    }

    if (visitedDirectories.has(realDirectory)) {
      continue
    }
    visitedDirectories.add(realDirectory)

    if (basename(directory) === 'node_modules') {
      const candidate = join(
        directory,
        '@deepseek-ai',
        'dsh-web-frontend',
        'dist',
        'index.html',
      )
      if (isFile(candidate)) {
        return candidate
      }
    }

    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries.sort((left, right) => right.name.localeCompare(left.name))) {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        directories.push(entryPath)
        continue
      }

      if (!entry.isSymbolicLink()) {
        continue
      }

      try {
        if (lstatSync(entryPath).isSymbolicLink() && statSync(entryPath).isDirectory()) {
          directories.push(entryPath)
        }
      } catch {
        // Ignore dangling links and links that cannot be inspected.
      }
    }
  }

  return undefined
}

export function verifyRuntime(root: string): RuntimeEntries {
  const runtimeRoot = resolve(root)
  const nodeModules = join(runtimeRoot, 'node_modules')
  const cliEntry = join(nodeModules, '@deepseek-ai', 'dsh', 'lib', 'bin.js')

  if (!isFile(cliEntry)) {
    throw new Error(`Harness CLI is missing: ${cliEntry}`)
  }

  const webEntry = findWebEntry(nodeModules)
  if (webEntry === undefined) {
    throw new Error(`Harness Web UI is missing beneath: ${nodeModules}`)
  }

  return { cliEntry, webEntry }
}

function isProcessEntry(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)
}

if (isProcessEntry()) {
  const runtimeRoot = process.argv[2] ?? 'runtime-host'
  const entries = verifyRuntime(runtimeRoot)
  console.log(`Harness CLI: ${entries.cliEntry}`)
  console.log(`Harness Web UI: ${entries.webEntry}`)
}
