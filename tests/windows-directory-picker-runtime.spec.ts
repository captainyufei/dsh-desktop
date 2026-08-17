import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { patchWindowsDirectoryPicker } from '../scripts/patch-windows-directory-picker.ts'

const temporaryRoots: string[] = []

function createRuntime(
  version = '0.1.0-rc.6',
  workerSource = String.raw`function readUtf16(koffi, address) {
	const bytes = Buffer.from(koffi.view(address, 32768));
	let end = 0;
	while (end + 1 < bytes.length && bytes[end] !== 0) end += 2;
	return bytes.toString("utf16le", 0, end);
}

function runFolderDialog() {
	const coCreateInstance = ole32.func("__stdcall", "CoCreateInstance", "long", []);
	const getCurrentThreadId = kernel32.func("__stdcall", "GetCurrentThreadId", "uint32", []);
	process.send({ kind: "showing", threadId: getCurrentThreadId() });
	const nameOut = [null];
	const gotName = 0;
	if (gotName >= 0) {
						const path = readUtf16(koffi, nameOut[0]);
						coTaskMemFree(nameOut[0]);
		return { hr: gotName, path, coCreateInstance };
	}
}
`,
): { root: string; workerPath: string } {
  const root = mkdtempSync(join(tmpdir(), 'dsh-directory-picker-'))
  temporaryRoots.push(root)

  const packageRoot = join(
    root,
    'node_modules',
    '@deepseek-ai',
    'dsh-host-directory-picker-native',
  )
  const workerPath = join(packageRoot, 'lib', 'worker.cjs')
  mkdirSync(dirname(workerPath), { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ version }), 'utf8')
  writeFileSync(workerPath, workerSource, 'utf8')
  return { root, workerPath }
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('Windows directory picker runtime patch', () => {
  it('does not alter the runtime on other platforms', () => {
    const runtime = createRuntime()
    const before = readFileSync(runtime.workerPath, 'utf8')

    expect(patchWindowsDirectoryPicker(runtime.root, 'darwin')).toBeNull()
    expect(readFileSync(runtime.workerPath, 'utf8')).toBe(before)
  })

  it('copies native UTF-16 without creating Electron-forbidden external buffers', () => {
    const runtime = createRuntime()

    expect(patchWindowsDirectoryPicker(runtime.root, 'win32')).toBe(runtime.workerPath)

    const patched = readFileSync(runtime.workerPath, 'utf8')
    expect(patched).toContain('dsh-desktop safe win32 directory picker')
    expect(patched).toContain('"lstrlenW"')
    expect(patched).toContain('koffi.decode.string16(address, getLength(address))')
    expect(patched).toContain('readUtf16(koffi, nameOut[0], getUtf16Length)')
    expect(patched).toContain('process.send({ kind: "showing"')
    expect(patched).toContain('CoCreateInstance')
    expect(patched).not.toContain('koffi.view(')
    execFileSync(process.execPath, ['--check', runtime.workerPath])
  })

  it('is idempotent after the reviewed native patch has been applied', () => {
    const runtime = createRuntime()

    patchWindowsDirectoryPicker(runtime.root, 'win32')
    const once = readFileSync(runtime.workerPath, 'utf8')
    expect(patchWindowsDirectoryPicker(runtime.root, 'win32')).toBe(runtime.workerPath)
    expect(readFileSync(runtime.workerPath, 'utf8')).toBe(once)
  })

  it('fails closed when the native package version changes', () => {
    const runtime = createRuntime('0.1.0-rc.7')

    expect(() => patchWindowsDirectoryPicker(runtime.root, 'win32')).toThrow(
      'is not the reviewed 0.1.0-rc.6',
    )
  })

  it('fails closed when the upstream worker no longer matches the reviewed source', () => {
    const runtime = createRuntime('0.1.0-rc.6', "console.log('different implementation')\n")

    expect(() => patchWindowsDirectoryPicker(runtime.root, 'win32')).toThrow(
      'no longer matches the reviewed implementation',
    )
  })
})
