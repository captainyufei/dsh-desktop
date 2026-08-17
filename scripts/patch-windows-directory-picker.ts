import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const PACKAGE_NAME = '@deepseek-ai/dsh-host-directory-picker-native'
const EXPECTED_PACKAGE_VERSION = '0.1.0-rc.6'
const PATCH_MARKER = 'dsh-desktop safe win32 directory picker'

const UNSAFE_UTF16_READER = String.raw`function readUtf16(koffi, address) {
	const bytes = Buffer.from(koffi.view(address, 32768));
	let end = 0;
	while (end + 1 < bytes.length && bytes[end] !== 0) end += 2;
	return bytes.toString("utf16le", 0, end);
}`

const SAFE_UTF16_READER = String.raw`// dsh-desktop safe win32 directory picker
function readUtf16(koffi, address, getLength) {
	if (address === null) return "";
	return koffi.decode.string16(address, getLength(address));
}`

const THREAD_ID_BINDING = String.raw`	const getCurrentThreadId = kernel32.func("__stdcall", "GetCurrentThreadId", "uint32", []);`

const UTF16_LENGTH_BINDING = String.raw`	const getUtf16Length = kernel32.func("__stdcall", "lstrlenW", "int32", ["void *"]);`

const UNSAFE_RESULT_PATH = String.raw`						const path = readUtf16(koffi, nameOut[0]);
						coTaskMemFree(nameOut[0]);`

const SAFE_RESULT_PATH = String.raw`						let path;
						try {
							path = readUtf16(koffi, nameOut[0], getUtf16Length);
						} finally {
							coTaskMemFree(nameOut[0]);
						}`

function replaceExactlyOnce(
  source: string,
  target: string,
  replacement: string,
  label: string,
): string {
  const firstIndex = source.indexOf(target)
  if (firstIndex < 0 || source.indexOf(target, firstIndex + target.length) >= 0) {
    throw new Error(`The staged ${PACKAGE_NAME} worker has an unexpected ${label}`)
  }

  return `${source.slice(0, firstIndex)}${replacement}${source.slice(firstIndex + target.length)}`
}

function directWorkerPath(runtimeHost: string): string {
  return join(runtimeHost, 'node_modules', ...PACKAGE_NAME.split('/'), 'lib', 'worker.cjs')
}

function pnpmWorkerPaths(runtimeHost: string): string[] {
  const pnpmRoot = join(runtimeHost, 'node_modules', '.pnpm')
  if (!existsSync(pnpmRoot)) return []

  return readdirSync(pnpmRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      join(pnpmRoot, entry.name, 'node_modules', ...PACKAGE_NAME.split('/'), 'lib', 'worker.cjs'),
    )
    .filter(existsSync)
}

export function resolveWindowsDirectoryPickerWorker(runtimeHost: string): string {
  const resolvedRuntimeHost = resolve(runtimeHost)
  const direct = directWorkerPath(resolvedRuntimeHost)
  if (existsSync(direct)) return direct

  const candidates = pnpmWorkerPaths(resolvedRuntimeHost)
  const [candidate] = candidates
  if (candidates.length === 1 && candidate !== undefined) return candidate
  if (candidates.length > 1) {
    throw new Error(`Found multiple staged ${PACKAGE_NAME} workers; refusing an ambiguous patch`)
  }

  throw new Error(`Staged ${PACKAGE_NAME} worker was not found beneath ${resolvedRuntimeHost}`)
}

export function patchWindowsDirectoryPicker(
  runtimeHost: string,
  platform: NodeJS.Platform = process.platform,
): string | null {
  if (platform !== 'win32') return null

  const workerPath = resolveWindowsDirectoryPickerWorker(runtimeHost)
  const packageRoot = dirname(dirname(workerPath))
  const packageJsonPath = join(packageRoot, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string }
  if (packageJson.version !== EXPECTED_PACKAGE_VERSION) {
    throw new Error(
      `${PACKAGE_NAME} version ${String(packageJson.version)} is not the reviewed ${EXPECTED_PACKAGE_VERSION}; refusing to patch`,
    )
  }

  const currentSource = readFileSync(workerPath, 'utf8')
  if (currentSource.includes(PATCH_MARKER)) {
    if (
      !currentSource.includes('"lstrlenW"') ||
      !currentSource.includes('koffi.decode.string16(address, getLength(address))') ||
      !currentSource.includes('readUtf16(koffi, nameOut[0], getUtf16Length)') ||
      currentSource.includes('koffi.view(')
    ) {
      throw new Error(`The staged ${PACKAGE_NAME} worker contains an incomplete safety patch`)
    }
    return workerPath
  }

  if (
    !currentSource.includes('runFolderDialog') ||
    !currentSource.includes('CoCreateInstance') ||
    !currentSource.includes(UNSAFE_UTF16_READER) ||
    !currentSource.includes(THREAD_ID_BINDING) ||
    !currentSource.includes(UNSAFE_RESULT_PATH)
  ) {
    throw new Error(`The staged ${PACKAGE_NAME} worker no longer matches the reviewed implementation`)
  }

  let patchedSource = replaceExactlyOnce(
    currentSource,
    UNSAFE_UTF16_READER,
    SAFE_UTF16_READER,
    'UTF-16 reader',
  )
  patchedSource = replaceExactlyOnce(
    patchedSource,
    THREAD_ID_BINDING,
    `${THREAD_ID_BINDING}\n${UTF16_LENGTH_BINDING}`,
    'Win32 binding block',
  )
  patchedSource = replaceExactlyOnce(
    patchedSource,
    UNSAFE_RESULT_PATH,
    SAFE_RESULT_PATH,
    'result-path block',
  )

  writeFileSync(workerPath, patchedSource, 'utf8')
  return workerPath
}
