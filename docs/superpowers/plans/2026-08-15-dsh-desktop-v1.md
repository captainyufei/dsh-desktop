# DSH Desktop v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build installable macOS ARM64, macOS x64, and Windows x64 Electron clients that bundle and display the unchanged DeepSeek Harness Web UI without requiring a system Node.js installation.

**Architecture:** A small TypeScript Electron main process stages an exact `@deepseek-ai/dsh` production dependency tree, runs its CLI through Electron's Node mode, validates the loopback readiness URL, and loads that origin in a hardened `BrowserWindow`. Focused modules own runtime discovery, Host supervision, navigation policy, desktop lifecycle, and local diagnostics; the official Harness Host remains the sole owner of UI, settings, credentials, and sessions.

**Tech Stack:** Node.js 24+, pnpm 10.29.2, TypeScript 7.0.2, Electron 43.4.0, Electron Builder 26.15.3, tsdown 0.22.14, Vitest 4.1.10, `@deepseek-ai/dsh` 0.1.0-rc.6.

## Global Constraints

- Product name is `DSH Desktop`; package version starts at `0.1.0`.
- `@deepseek-ai/dsh` must be pinned exactly to `0.1.0-rc.6`; do not use a range.
- The official Harness Web UI must not be forked, patched, proxied, or replaced.
- Harness must bind to `127.0.0.1` on an operating-system-assigned port.
- The application must work without a separately installed Node.js runtime.
- The renderer must use context isolation, sandboxing, disabled Node integration, and normal web security; no preload bridge is allowed in v1.
- Only the validated Harness origin may navigate inside the desktop window; external HTTP(S) destinations open in the system browser and all other schemes are denied.
- Closing the window hides it; tray Quit owns Host shutdown.
- Host startup timeout is 90 seconds; graceful shutdown timeout is five seconds.
- Logs remain local under Electron's per-user application data directory and are never uploaded.
- Release targets are macOS ARM64 DMG, macOS x64 DMG, and Windows x64 NSIS.
- Version 1 artifacts are unsigned until signing credentials are supplied.
- The app must state that it is a community application and not an official DeepSeek product.

---

## Planned file structure

```text
.
├── .github/workflows/ci.yml             # quality checks and native-platform installers
├── .gitignore                           # generated output, staged runtime, logs
├── LICENSE                              # MIT license for desktop-owned code
├── README.md                            # install, development, architecture, limitations
├── THIRD_PARTY_NOTICES.md               # DeepSeek Harness attribution and notices
├── build/icon.svg                       # neutral DSH Desktop application icon
├── package.json                         # pinned dependencies, scripts, builder configuration
├── pnpm-lock.yaml                       # reproducible complete dependency graph
├── pnpm-workspace.yaml                  # root project deploy support
├── scripts/stage-runtime.ts             # closed production-tree staging
├── scripts/verify-runtime.ts            # packaged CLI/Web artifact verification
├── src/app-metadata.ts                  # immutable name/version-independent constants
├── src/diagnostics.ts                   # bounded local log rotation and writer
├── src/host/paths.ts                    # development/packaged runtime resolution
├── src/host/readiness.ts                # readiness URL parser
├── src/host/supervisor.ts               # child process ownership and shutdown
├── src/main.ts                          # Electron adapter and application composition root
├── src/navigation-policy.ts             # pure origin and external URL classification
├── src/window-lifecycle.ts              # pure window/tray/quit state transitions
├── tests/diagnostics.spec.ts
├── tests/harness-smoke.spec.ts
├── tests/host-paths.spec.ts
├── tests/host-readiness.spec.ts
├── tests/host-supervisor.spec.ts
├── tests/navigation-policy.spec.ts
├── tests/package-config.spec.ts
├── tests/runtime-packaging.spec.ts
├── tests/window-lifecycle.spec.ts
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

Each `src/` file owns one behavior boundary. `main.ts` contains Electron-specific wiring only; reusable logic remains testable without importing Electron.

---

### Task 1: Reproducible TypeScript/Electron project skeleton

**Files:**
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `tsdown.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app-metadata.ts`
- Create: `src/main.ts`
- Create: `tests/package-config.spec.ts`
- Generate: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `APP_NAME: "DSH Desktop"`, `APP_ID: "com.community.dsh-desktop"`, `APP_VERSION: "0.1.0"`.
- Produces scripts consumed later: `build`, `typecheck`, `test`, `dev`, `stage:runtime`, `verify:runtime`, `package`, `dist:mac:arm64`, `dist:mac:x64`, `dist:win:x64`.

- [ ] **Step 1: Create the package-manager and compiler foundation**

Create a private ESM package with these exact dependency versions:

```json
{
  "name": "dsh-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "lib/main.js",
  "packageManager": "pnpm@10.29.2",
  "engines": { "node": ">=24.0.0" },
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit && tsdown",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:smoke": "cross-env DSH_RUN_HARNESS_SMOKE=1 vitest run tests/harness-smoke.spec.ts",
    "dev": "pnpm build && electron .",
    "stage:runtime": "node --import tsx scripts/stage-runtime.ts",
    "verify:runtime": "node --import tsx scripts/verify-runtime.ts runtime-host",
    "package": "pnpm build && pnpm stage:runtime && pnpm verify:runtime && electron-builder --dir",
    "dist:mac:arm64": "pnpm build && pnpm stage:runtime && pnpm verify:runtime && electron-builder --mac dmg --arm64",
    "dist:mac:x64": "pnpm build && pnpm stage:runtime && pnpm verify:runtime && electron-builder --mac dmg --x64",
    "dist:win:x64": "pnpm build && pnpm stage:runtime && pnpm verify:runtime && electron-builder --win nsis --x64"
  },
  "dependencies": {
    "@deepseek-ai/dsh": "0.1.0-rc.6"
  },
  "devDependencies": {
    "@types/node": "26.2.0",
    "cross-env": "10.1.0",
    "electron": "43.4.0",
    "electron-builder": "26.15.3",
    "tsdown": "0.22.14",
    "tsx": "4.23.12",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

Configure TypeScript with `target: ES2024`, `module: NodeNext`, `moduleResolution: NodeNext`, `strict: true`, `noUncheckedIndexedAccess: true`, and Node/Electron types. Configure tsdown to build only `src/main.ts` as ESM for Node with `electron` external. Configure Vitest for the Node environment.

Create `src/main.ts` with exactly `export {}` so every foundation command is runnable before Task 5 replaces the composition root. Write the standard MIT license with `Copyright (c) 2026 DSH Desktop contributors`. Ignore `node_modules/`, `lib/`, `dist/`, `runtime-host/`, and coverage output.

- [ ] **Step 2: Install the pinned dependency graph**

Run: `pnpm install`

Expected: `pnpm-lock.yaml` is created and resolves `@deepseek-ai/dsh` to exactly `0.1.0-rc.6`.

- [ ] **Step 3: Write the failing metadata and manifest test**

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_ID, APP_NAME, APP_VERSION } from '../src/app-metadata.ts'

describe('desktop package metadata', () => {
  it('pins the public identity and Harness runtime', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
      version: string
      dependencies: Record<string, string>
    }
    expect({ APP_ID, APP_NAME, APP_VERSION }).toEqual({
      APP_ID: 'com.community.dsh-desktop',
      APP_NAME: 'DSH Desktop',
      APP_VERSION: '0.1.0',
    })
    expect(manifest.version).toBe(APP_VERSION)
    expect(manifest.dependencies['@deepseek-ai/dsh']).toBe('0.1.0-rc.6')
  })
})
```

- [ ] **Step 4: Run the test and verify the missing module failure**

Run: `pnpm vitest run tests/package-config.spec.ts`

Expected: FAIL because `src/app-metadata.ts` does not exist.

- [ ] **Step 5: Add the minimal metadata module**

```ts
export const APP_NAME = 'DSH Desktop'
export const APP_ID = 'com.community.dsh-desktop'
export const APP_VERSION = '0.1.0'
```

- [ ] **Step 6: Verify the foundation**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all commands succeed and `lib/main.js` is the compiled form of the temporary `export {}` composition-root stub. Configure tsdown with `clean: true`; Task 5 replaces the stub.

- [ ] **Step 7: Commit**

```bash
git add .gitignore LICENSE package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsdown.config.ts vitest.config.ts src/app-metadata.ts tests/package-config.spec.ts src/main.ts
git commit -m "build: scaffold DSH Desktop"
```

---

### Task 2: Runtime artifact and path resolution

**Files:**
- Create: `src/host/paths.ts`
- Create: `tests/host-paths.spec.ts`

**Interfaces:**
- Produces: `RuntimeArtifacts { cliEntry: string; webEntry: string }`.
- Produces: `HostPaths { nodeExecutable: string; cliEntry: string; webEntry: string; cwd: string; electronRunAsNode: boolean }`.
- Produces: `resolveRuntimeArtifacts(nodeModulesRoot: string): RuntimeArtifacts`.
- Produces: `resolveHostPaths(options: HostPathOptions): HostPaths`.
- Consumed by Task 3 `spawnDshWeb()` and Task 5 startup validation.

- [ ] **Step 1: Write failing tests against the installed real package graph**

```ts
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveHostPaths, resolveRuntimeArtifacts } from '../src/host/paths.ts'

describe('runtime artifacts', () => {
  it('resolves the CLI and official Web entry through package dependencies', () => {
    const result = resolveRuntimeArtifacts(join(process.cwd(), 'node_modules'))
    expect(result.cliEntry).toMatch(/@deepseek-ai[/\\]dsh[/\\]lib[/\\]bin\.js$/u)
    expect(result.webEntry).toMatch(/@deepseek-ai[/\\]dsh-web-frontend[/\\]dist[/\\]index\.html$/u)
    expect(existsSync(result.cliEntry)).toBe(true)
    expect(existsSync(result.webEntry)).toBe(true)
  })

  it('uses Electron Node mode only for packaged applications', () => {
    const packaged = resolveHostPaths({
      isPackaged: true,
      appPath: '/Applications/DSH Desktop.app/Contents/Resources/app.asar',
      resourcesPath: '/Applications/DSH Desktop.app/Contents/Resources',
      execPath: '/Applications/DSH Desktop.app/Contents/MacOS/DSH Desktop',
      homePath: '/Users/tester',
      env: {},
    })
    expect(packaged.nodeExecutable).toContain('DSH Desktop')
    expect(packaged.electronRunAsNode).toBe(true)
    expect(packaged.cwd).toBe('/Users/tester')
  })
})
```

- [ ] **Step 2: Run tests and verify the module failure**

Run: `pnpm vitest run tests/host-paths.spec.ts`

Expected: FAIL because `src/host/paths.ts` does not exist.

- [ ] **Step 3: Implement dependency-aware artifact resolution**

Use `createRequire()` twice rather than assuming pnpm hoists transitive packages:

```ts
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
```

For development, resolve from `<appPath>/node_modules`, use `DSH_DESKTOP_NODE_EXECUTABLE ?? 'node'`, and set `electronRunAsNode: false`. For packaged apps, resolve from `<resourcesPath>/host/node_modules`, use `execPath`, and set `electronRunAsNode: true`. Both modes use `homePath` as `cwd`.

- [ ] **Step 4: Add missing-artifact assertions and tests**

Export `assertRuntimeArtifacts(paths: HostPaths): void` and throw messages containing `Harness CLI is missing` or `Harness Web UI is missing`. Test each error using temporary nonexistent paths.

- [ ] **Step 5: Verify**

Run: `pnpm vitest run tests/host-paths.spec.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/host/paths.ts tests/host-paths.spec.ts
git commit -m "feat: resolve bundled Harness runtime"
```

---

### Task 3: Harness readiness parser and supervised process lifecycle

**Files:**
- Create: `src/host/readiness.ts`
- Create: `src/host/supervisor.ts`
- Create: `tests/host-readiness.spec.ts`
- Create: `tests/host-supervisor.spec.ts`

**Interfaces:**
- Produces: `ReadinessParser { push(chunk: string): string | undefined; finalize(): string }`.
- Produces: `createReadinessParser(): ReadinessParser`.
- Produces: `HostSupervisor { start(): Promise<string>; shutdown(): Promise<void> }`.
- Produces: `createHostSupervisor(options: HostSupervisorOptions): HostSupervisor`.
- Produces: `spawnDshWeb(options: SpawnDshWebOptions): HostChild`.
- Consumes Task 2 fields `nodeExecutable`, `cliEntry`, `cwd`, and `electronRunAsNode`.

- [ ] **Step 1: Write exhaustive failing readiness tests**

Cover partial chunks, unrelated log lines, CRLF, repeated identical URLs, conflicting URLs, malformed URLs, non-loopback hosts, HTTPS, missing explicit ports, paths/query/fragments, port zero, and EOF before readiness. The central happy path is:

```ts
it('accepts a split canonical readiness line', () => {
  const parser = createReadinessParser()
  expect(parser.push('booting\ndsh we')).toBeUndefined()
  expect(parser.push('b: http://127.0.0.1:3080\n')).toBe('http://127.0.0.1:3080')
  expect(parser.finalize()).toBe('http://127.0.0.1:3080')
})
```

- [ ] **Step 2: Run the readiness tests and verify failure**

Run: `pnpm vitest run tests/host-readiness.spec.ts`

Expected: FAIL because the parser module does not exist.

- [ ] **Step 3: Implement the incremental readiness parser**

Use the exact prefix `dsh web: `. Validate with `new URL()`, require `http:`, hostname `127.0.0.1` or `localhost`, pathname `/`, empty search/hash, and integer port 1–65535. Retain incomplete text between chunks and make the accepted origin stable after readiness.

- [ ] **Step 4: Run readiness tests**

Run: `pnpm vitest run tests/host-readiness.spec.ts`

Expected: PASS.

- [ ] **Step 5: Write failing supervisor tests with a fake child**

Define this boundary in the tests and implementation:

```ts
export interface HostChild {
  readonly stdout: { onData(listener: (chunk: string) => void): () => void }
  readonly stderr: { onData(listener: (chunk: string) => void): () => void }
  onExit(listener: (code: number | null, signal: NodeJS.Signals | null) => void): () => void
  onError(listener: (error: Error) => void): () => void
  kill(signal: 'SIGTERM' | 'SIGKILL'): void
}
```

Tests must prove: concurrent starts spawn once; readiness resolves once; output is capped at 32,768 characters in startup errors; a 90-second timeout sends `SIGTERM`; early exit rejects; unexpected ready-state exit calls `onUnexpectedExit`; concurrent shutdown sends one `SIGTERM`; a still-running child receives `SIGKILL` after five seconds.

- [ ] **Step 6: Run supervisor tests and verify failure**

Run: `pnpm vitest run tests/host-supervisor.spec.ts`

Expected: FAIL because `src/host/supervisor.ts` does not exist.

- [ ] **Step 7: Implement supervision and the real child adapter**

`spawnDshWeb()` must execute:

```ts
const env = options.electronRunAsNode
  ? { ...options.env, ELECTRON_RUN_AS_NODE: '1' }
  : options.env

spawn(options.nodeExecutable, [
  '--expose-internals',
  options.cliEntry,
  'web',
  '--host', '127.0.0.1',
  '--port', '0',
], {
  cwd: options.cwd,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
})
```

Use injectable timeouts in tests while preserving 90,000 ms and 5,000 ms production defaults.

- [ ] **Step 8: Verify**

Run: `pnpm vitest run tests/host-readiness.spec.ts tests/host-supervisor.spec.ts && pnpm typecheck`

Expected: PASS with no leaked fake timers or open handles.

- [ ] **Step 9: Commit**

```bash
git add src/host/readiness.ts src/host/supervisor.ts tests/host-readiness.spec.ts tests/host-supervisor.spec.ts
git commit -m "feat: supervise the Harness Web Host"
```

---

### Task 4: Navigation security and desktop lifecycle state

**Files:**
- Create: `src/navigation-policy.ts`
- Create: `src/window-lifecycle.ts`
- Create: `tests/navigation-policy.spec.ts`
- Create: `tests/window-lifecycle.spec.ts`

**Interfaces:**
- Produces: `classifyNavigation(raw: string, hostOrigin: string): 'allow' | 'external' | 'deny'`.
- Produces: `DesktopLifecycle` with `isQuitting`, `pendingQuit`, `onWindowClose()`, `showWindow()`, and `requestQuit()`.
- Consumed by Task 5 Electron adapters.

- [ ] **Step 1: Write failing navigation-policy tests**

```ts
it.each([
  ['http://127.0.0.1:3080/', 'allow'],
  ['http://127.0.0.1:3080/session/1', 'allow'],
  ['https://example.com/docs', 'external'],
  ['http://localhost:9999/', 'external'],
  ['file:///etc/passwd', 'deny'],
  ['javascript:alert(1)', 'deny'],
  ['not a url', 'deny'],
] as const)('classifies %s', (raw, expected) => {
  expect(classifyNavigation(raw, 'http://127.0.0.1:3080')).toBe(expected)
})
```

- [ ] **Step 2: Run navigation tests and verify failure**

Run: `pnpm vitest run tests/navigation-policy.spec.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement exact-origin navigation classification**

Parse both URLs. Return `allow` only when origins match exactly, `external` only for HTTP or HTTPS, and `deny` otherwise.

- [ ] **Step 4: Write failing lifecycle tests**

Use minimal adapter types with no Electron import:

```ts
export interface DesktopWindow {
  isDestroyed(): boolean
  isVisible(): boolean
  show(): void
  focus(): void
  hide(): void
}

export interface DesktopLifecycle {
  readonly isQuitting: boolean
  readonly pendingQuit: Promise<void> | undefined
  onWindowClose(event: { preventDefault(): void }): void
  showWindow(): Promise<void>
  requestQuit(): Promise<void>
}
```

Test ordinary close prevention and hide, existing-window show/focus, destroyed-window recreation, coalesced concurrent window creation, coalesced quit, Host disposal before final Electron quit, and suppression of restore during quit.

- [ ] **Step 5: Run lifecycle tests and verify failure**

Run: `pnpm vitest run tests/window-lifecycle.spec.ts`

Expected: FAIL because `src/window-lifecycle.ts` does not exist.

- [ ] **Step 6: Implement the lifecycle controller**

Expose `createDesktopLifecycle(options)` using injected `getWindow`, `createWindow`, `disposeHost`, `quit`, and `reportError`. Keep a single `creatingWindow` promise and a single `pendingQuit` promise.

- [ ] **Step 7: Verify**

Run: `pnpm vitest run tests/navigation-policy.spec.ts tests/window-lifecycle.spec.ts && pnpm typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/navigation-policy.ts src/window-lifecycle.ts tests/navigation-policy.spec.ts tests/window-lifecycle.spec.ts
git commit -m "feat: add secure desktop window lifecycle"
```

---

### Task 5: Local diagnostics and Electron composition root

**Files:**
- Create: `src/diagnostics.ts`
- Replace: `src/main.ts`
- Create: `tests/diagnostics.spec.ts`

**Interfaces:**
- Produces: `Diagnostics { readonly path: string; log(message: string): void; error(message: string, error?: unknown): void; close(): Promise<void> }`.
- Produces: `createDiagnostics(userDataDir: string): Diagnostics`.
- Consumes Tasks 1–4 interfaces and Electron APIs.

- [ ] **Step 1: Write failing diagnostics tests**

Test that logs are written to `<userDataDir>/logs/desktop.log`, secrets are not implicitly added, a file larger than 2 MiB rotates on startup to `desktop.1.log`, older generations shift through `desktop.3.log`, and `close()` flushes the stream. Use a temporary directory created by the test framework and delete only that exact directory after each test.

- [ ] **Step 2: Run diagnostics tests and verify failure**

Run: `pnpm vitest run tests/diagnostics.spec.ts`

Expected: FAIL because `src/diagnostics.ts` does not exist.

- [ ] **Step 3: Implement bounded local diagnostics**

Use `mkdirSync(logDir, { recursive: true })`, rotate only at application startup, then write ISO-timestamped lines through one `createWriteStream(..., { flags: 'a' })`. Format unknown errors without reading the process environment.

- [ ] **Step 4: Run diagnostics tests**

Run: `pnpm vitest run tests/diagnostics.spec.ts`

Expected: PASS.

- [ ] **Step 5: Compose the real Electron application**

Implement `src/main.ts` with these exact behaviors:

- acquire `app.requestSingleInstanceLock()` before boot;
- resolve and assert runtime artifacts after `app.whenReady()`;
- create one supervisor and forward bounded Host stdout/stderr to diagnostics;
- wait for readiness before creating the window;
- create `BrowserWindow` at 1440×920, minimum 960×640, initially hidden;
- use a normal native frame so the official UI receives no desktop layout patch;
- set `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, and no preload;
- deny permission checks and requests before the first navigation;
- use `classifyNavigation()` for `will-navigate` and `setWindowOpenHandler()`;
- call `shell.openExternal()` only for the `external` result;
- show the window after `did-finish-load` and only when not quitting;
- on `did-fail-load`, confirm the Host has not exited, retry the same origin once, then show the startup recovery dialog;
- create a tray with `Open DSH Desktop` and `Quit` actions;
- restore on tray click, second instance, and macOS activate;
- leave `window-all-closed` empty because the tray owns lifetime;
- intercept `before-quit`, await the shared shutdown, destroy tray, close diagnostics, then release `app.quit()`;
- disable DevTools in packaged builds through the `before-input-event` shortcut path and `webContents.on('devtools-opened', closeDevTools)`.

Missing runtime artifacts use an `Open Logs`/`Quit` dialog and cannot retry. Other startup or post-start Host failures must use `dialog.showMessageBox()` with `Retry`, `Open Logs`, and `Quit` or `Restart Host`, `Open Logs`, and `Quit`. Retry constructs a fresh supervisor; it never reuses a shut-down supervisor. `Open Logs` calls `shell.showItemInFolder(diagnostics.path)`.

- [ ] **Step 6: Add a deterministic tray asset**

Add a monochrome 32×32 PNG under `build/trayTemplate.png`, include it in packaged resources, call `setTemplateImage(true)` on macOS, and fail startup with a readable error if the asset is missing. The image must be original, use no DeepSeek logo, and depict only the neutral `DSH` working mark.

- [ ] **Step 7: Verify the integrated development build**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: PASS and `lib/main.js` exists.

Run: `pnpm dev`

Expected manual smoke result: the official Harness page appears; closing hides it; tray restores it; Quit removes the Host child. Do not change Harness settings during this smoke test.

- [ ] **Step 8: Commit**

```bash
git add src/diagnostics.ts src/main.ts tests/diagnostics.spec.ts build/trayTemplate.png
git commit -m "feat: launch Harness in the Electron shell"
```

---

### Task 6: Reproducible runtime staging and native installers

**Files:**
- Create: `scripts/stage-runtime.ts`
- Create: `scripts/verify-runtime.ts`
- Create: `tests/runtime-packaging.spec.ts`
- Create: `build/icon.svg`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `runtime-host/node_modules` as the exact production deployment tree.
- Produces: `verifyRuntime(root: string): { cliEntry: string; webEntry: string }` for tests and packaging preflight.
- Produces installers under `dist/`.

- [ ] **Step 1: Write failing staging and verification tests**

```ts
it('rejects a staged runtime without the Web frontend', () => {
  const root = makeFakeRuntime({ cli: true, web: false })
  expect(() => verifyRuntime(root)).toThrow('Harness Web UI is missing')
})

it('accepts both required runtime entries', () => {
  const root = makeFakeRuntime({ cli: true, web: true })
  expect(verifyRuntime(root)).toEqual({
    cliEntry: expect.stringMatching(/lib[/\\]bin\.js$/u),
    webEntry: expect.stringMatching(/dist[/\\]index\.html$/u),
  })
})
```

The fake tree must reproduce pnpm's nested `.pnpm/.../node_modules/@deepseek-ai/...` layout so verification cannot depend on hoisting.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm vitest run tests/runtime-packaging.spec.ts`

Expected: FAIL because the packaging scripts do not exist.

- [ ] **Step 3: Implement production-tree staging**

`scripts/stage-runtime.ts` must resolve `runtime-host` from the repository root, remove only that exact generated directory, then run:

```ts
execFileSync('pnpm', [
  '--filter', 'dsh-desktop',
  'deploy',
  '--prod',
  runtimeHost,
], { cwd: repositoryRoot, stdio: 'inherit' })
```

After deployment, call `verifyRuntime(runtimeHost)`. Reject any staging target that resolves outside the repository root before deleting it.

- [ ] **Step 4: Implement artifact verification without hoisting assumptions**

Check the direct CLI at `node_modules/@deepseek-ai/dsh/lib/bin.js`. Locate `@deepseek-ai/dsh-web-frontend/dist/index.html` by walking only the staged `node_modules` tree, ignoring symlink cycles and stopping on the first exact package-path match. Export the pure verifier and execute it from the script when `import.meta.url` is the process entry.

- [ ] **Step 5: Add Electron Builder configuration and release scripts**

Configure `package.json` with:

```json
{
  "build": {
    "appId": "com.community.dsh-desktop",
    "productName": "DSH Desktop",
    "asar": true,
    "files": ["lib/**", "package.json"],
    "extraResources": [
      { "from": "runtime-host/node_modules", "to": "host/node_modules" },
      { "from": "runtime-host/package.json", "to": "host/package.json" },
      { "from": "build/trayTemplate.png", "to": "desktop-resources/trayTemplate.png" }
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg"]
    },
    "win": {
      "target": ["nsis"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

`package` runs build, staging, verification, and `electron-builder --dir`. Architecture scripts append `--mac dmg --arm64`, `--mac dmg --x64`, or `--win nsis --x64`. Add `runtime-host/`, `lib/`, `dist/`, and coverage output to `.gitignore`.

- [ ] **Step 6: Add an original neutral application icon**

Create `build/icon.svg` as a 1024×1024 vector with a dark rounded-square background and an original geometric `D`/terminal-chevron mark. It must not reproduce the DeepSeek whale or wordmark. Electron Builder will convert this single SVG for macOS and Windows.

- [ ] **Step 7: Verify runtime staging and unpacked packaging**

Run: `pnpm stage:runtime && pnpm verify:runtime`

Expected: both the CLI and `dsh-web-frontend/dist/index.html` are reported.

Run: `pnpm package`

Expected: an unpacked application is created under `dist/` and the build fails if either verified artifact is removed from a copied test tree.

- [ ] **Step 8: Commit**

```bash
git add scripts/stage-runtime.ts scripts/verify-runtime.ts tests/runtime-packaging.spec.ts build/icon.svg package.json pnpm-lock.yaml .gitignore
git commit -m "build: package the pinned Harness runtime"
```

---

### Task 7: Real Harness smoke test, CI artifacts, and handoff documentation

**Files:**
- Create: `tests/harness-smoke.spec.ts`
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Create: `THIRD_PARTY_NOTICES.md`
- Modify: `package.json`

**Interfaces:**
- Produces: opt-in `test:smoke` command that launches the real pinned Harness.
- Produces: tagged-build artifacts for all three target/architecture combinations.

- [ ] **Step 1: Write the real Host smoke test**

```ts
describe.runIf(process.env.DSH_RUN_HARNESS_SMOKE === '1')('real Harness Host', () => {
  it('serves the official Web document', async () => {
    const paths = resolveHostPaths({
      isPackaged: false,
      appPath: process.cwd(),
      resourcesPath: '',
      execPath: process.execPath,
      homePath: temporaryHome,
      env: process.env,
    })
    const host = createHostSupervisor({
      spawnHost: () => spawnDshWeb({ ...paths, env: process.env }),
    })
    const origin = await host.start()
    const response = await fetch(origin)
    expect(response.ok).toBe(true)
    expect(await response.text()).toContain('<div id="root">')
    await host.shutdown()
  }, 120_000)
})
```

Always shut down the Host in `afterEach`, even when the fetch assertion fails. Set `DSH_HOME` to the exact temporary directory for this test; `@deepseek-ai/dsh-home-paths` defines that variable as the supported override. Remove only the temporary directory created by the test.

- [ ] **Step 2: Run the real smoke test**

Run: `DSH_RUN_HARNESS_SMOKE=1 pnpm vitest run tests/harness-smoke.spec.ts`

Expected: PASS, the returned HTML is the official Web entry, and no Host process remains.

- [ ] **Step 3: Add native CI jobs**

Create four jobs:

1. `quality` on `ubuntu-24.04`: install Node 24 and pnpm 10.29.2, then run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm build`, and the opt-in Harness smoke test.
2. `mac-arm64` on `macos-15`: repeat quality checks, run `pnpm dist:mac:arm64` with `CSC_IDENTITY_AUTO_DISCOVERY=false`, and upload the ARM64 DMG plus SHA-256 checksum.
3. `mac-x64` on `macos-15-intel`: repeat quality checks, run `pnpm dist:mac:x64` with signing discovery disabled, and upload the x64 DMG plus checksum.
4. `windows-x64` on `windows-2025`: repeat quality checks, run `pnpm dist:win:x64`, and upload the NSIS executable plus checksum.

Run on pushes and pull requests for quality; build installers on manual dispatch and tags matching `v*`. Pin action major versions and grant only `contents: read`.

- [ ] **Step 4: Write user and developer documentation**

README must contain:

- the non-official community disclaimer at the top;
- supported platforms and unsigned-build warnings;
- installation and first launch instructions;
- `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm package`, and architecture build commands;
- the startup/process diagram from the design;
- local data and log locations, with Harness owning its normal data directory;
- troubleshooting for startup timeout, missing runtime, Windows SmartScreen, and macOS Gatekeeper;
- explicit v1 limitations: no automatic updates, cloud sync, mobile remote, plugin marketplace, Linux, or custom UI.

THIRD_PARTY_NOTICES must identify DeepSeek Harness, link its upstream repository, reproduce its MIT copyright/license notice as required, and state that the official Web UI is redistributed unchanged through the pinned npm packages. Generate the full dependency license inventory during release rather than hand-writing transitive notices.

- [ ] **Step 5: Run the complete local acceptance suite**

Run:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
DSH_RUN_HARNESS_SMOKE=1 pnpm vitest run tests/harness-smoke.spec.ts
pnpm stage:runtime
pnpm verify:runtime
pnpm package
git diff --check
```

Expected: every command succeeds, the unpacked current-platform application launches without using a system Node executable, the official UI loads, tray restore works, external navigation opens outside the app, and explicit Quit leaves no Host child.

- [ ] **Step 6: Commit**

```bash
git add tests/harness-smoke.spec.ts .github/workflows/ci.yml README.md THIRD_PARTY_NOTICES.md package.json pnpm-lock.yaml
git commit -m "ci: build cross-platform desktop releases"
```

- [ ] **Step 7: Record installer checks after CI**

Download the three workflow artifacts, verify their published SHA-256 checksums, install each on its matching architecture, and record the tag and pass/fail result in the GitHub Release notes. A v1 tag is not published until all three launch, show the official UI, persist a harmless settings change across restart, and quit without an orphan Host process.

---

## Final verification matrix

| Requirement | Implemented by | Verification |
|---|---|---|
| No system Node.js required | Tasks 2, 3, 6 | Packaged launch smoke test |
| Official Web UI unchanged | Tasks 2, 5, 7 | Real Host response and visual smoke |
| Strict loopback startup | Task 3 | Readiness parser and real Host tests |
| Secure navigation | Tasks 4, 5 | Policy unit tests and manual external-link smoke |
| Tray-owned lifecycle | Tasks 4, 5 | Lifecycle unit tests and packaged smoke |
| Local bounded logs and recovery dialogs | Task 5 | Diagnostics tests and forced-failure smoke |
| Runtime completeness | Tasks 2, 6 | Staging verifier and packaging preflight |
| Mac ARM64, Mac x64, Windows x64 | Tasks 6, 7 | Native CI installers and release checklist |
| Community attribution | Task 7 | README and third-party notice review |
