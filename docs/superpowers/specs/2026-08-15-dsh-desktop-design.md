# DSH Desktop v1 Design

## Summary

DSH Desktop packages the official DeepSeek Harness Web experience as an installable macOS and Windows application. Version 1 deliberately does not change the Harness UI or agent behavior. Its value is installation, local service supervision, desktop lifecycle integration, and repeatable cross-platform packaging.

The application is an independent Electron project. It consumes an exact published version of `@deepseek-ai/dsh` instead of forking the upstream monorepo. This keeps the desktop code small and makes upstream upgrades explicit and testable.

## Goals

- Let a non-technical user install and open Harness without installing Node.js or running a command.
- Render the official Harness Web UI without desktop-specific feature or layout changes.
- Produce macOS ARM64, macOS x64, and Windows x64 installers.
- Start, monitor, and stop the local Harness process reliably.
- Preserve the official Harness data locations and behavior.
- Pin the Harness version so a desktop release cannot change underneath the user.

## Non-goals

- A redesigned or native desktop UI.
- Accounts, cloud sync, mobile remote control, team collaboration, or IM channels.
- A desktop plugin marketplace.
- Automatic application updates.
- Changes to Harness profiles, agent behavior, models, tools, approvals, or storage.
- Linux packages.
- Signed public releases before Apple and Windows signing credentials are supplied. Development releases will be unsigned and suitable for testing.

## Product behavior

1. The user installs and launches `DSH Desktop`.
2. The application starts the bundled Harness Web Host on `127.0.0.1` with an operating-system-assigned port.
3. The native window remains hidden until the Host reports readiness.
4. Electron loads the reported local origin and displays the official Web UI unchanged.
5. Closing the window hides it while the tray-owned Host remains running. The tray can restore the window or explicitly quit the application.
6. Explicit quit gracefully stops Harness and escalates termination after a bounded timeout so no child process is orphaned.

`DSH Desktop` is a working product name. Branding can change without altering the architecture.

## Architecture

```text
Electron main process
  |-- HostSupervisor
  |     `-- Electron executable in Node mode
  |           `-- bundled @deepseek-ai/dsh: dsh web
  |                 `-- http://127.0.0.1:<random-port>
  |-- BrowserWindow
  |     `-- loads the Host origin without modifying its UI
  |-- DesktopLifecycle
  |     `-- single instance, window, tray, quit coordination
  `-- Diagnostics
        `-- bounded local log files and native error dialogs
```

### Electron main process

The application has no custom renderer and does not expose a preload bridge. The main process creates the window, owns the tray, starts Harness, applies navigation and permission policy, and coordinates shutdown.

Development uses the developer machine's Node executable and the installed dependency. A packaged application uses Electron's executable with `ELECTRON_RUN_AS_NODE=1`, so it does not ship a second Node runtime.

### Bundled Harness runtime

`@deepseek-ai/dsh` is an exact, non-range production dependency. Packaging stages its closed production dependency tree outside `app.asar` under the application's resources directory. The Host is launched from that staged tree with:

```text
<electron-executable> --expose-internals <dsh-cli-entry> web --host 127.0.0.1 --port 0
```

The Host working directory is the user's home directory, never the read-only application resources directory. Harness continues to choose its own official home and persistence paths.

The packaging build fails if the staged CLI entry or Web UI entry is missing. Updating Harness is a deliberate dependency change followed by the complete desktop test and packaging suite.

### Host supervisor

The supervisor owns exactly one child process. It:

- incrementally parses the canonical `dsh web: <URL>` readiness line;
- accepts only HTTP URLs on `127.0.0.1` or `localhost` with an explicit port;
- uses a 90-second startup timeout;
- captures bounded startup output for diagnostics;
- detects unexpected exits after readiness;
- sends graceful termination on quit and forcefully terminates after five seconds;
- coalesces duplicate start and shutdown requests.

### Window and tray lifecycle

Only one application instance may run. A second launch focuses the existing window.

The initial window is 1440 by 920 pixels with a 960 by 640 minimum. It uses platform-appropriate native window controls. The window is shown only after the Web Host is ready, avoiding a blank or connection-error page during startup.

Closing the window hides it. The tray menu contains `Open DSH Desktop` and `Quit`. Explicit quit is the only ordinary path that stops the Host. macOS activation and a second application launch restore the existing window.

## Data flow

### Startup

1. Electron acquires the single-instance lock.
2. Diagnostics opens the current log file.
3. The main process resolves and verifies the CLI and Web UI artifacts.
4. `HostSupervisor` spawns Harness on a random loopback port.
5. The supervisor validates the readiness origin.
6. The main process creates a hardened `BrowserWindow`, loads the origin, and shows it after the first successful load.

### Runtime

The BrowserWindow communicates directly with the official local Web Host using its existing protocol. DSH Desktop does not proxy, transform, or persist conversation data. Harness remains the sole owner of sessions, settings, credentials, tools, and files.

### Shutdown

1. A tray or application quit request enters a shared quit operation.
2. New window restoration is disabled.
3. The supervisor asks the Host to terminate.
4. After five seconds, a still-running child is forcefully terminated.
5. The tray and window are destroyed and Electron exits.

## Security

- Harness binds only to loopback on an operating-system-assigned port.
- The readiness URL is treated as untrusted input and strictly validated.
- The renderer uses context isolation, sandboxing, disabled Node integration, and normal web security.
- Renderer permission requests are denied by default.
- Main-frame navigation is restricted to the validated Harness origin.
- HTTP and HTTPS links to other origins open in the operating system browser; other schemes are denied.
- New windows are denied.
- Production DevTools are disabled.
- No renderer-to-main IPC API is exposed in v1.

The local Harness protocol does not gain authentication in this wrapper. Other processes running as the same local user may be able to reach its random loopback port. Adding authentication would require an upstream-compatible protocol change and is outside v1.

## Error handling and diagnostics

Failures are presented with native dialogs so the official Web UI remains untouched.

- Missing packaged artifacts: show a packaging error and quit.
- Startup timeout or early Host exit: show a concise error with `Retry`, `Open Logs`, and `Quit` actions.
- Unexpected Host exit after startup: close or hide the unusable window and offer `Restart Host`, `Open Logs`, or `Quit`.
- Renderer load failure: retry once after confirming the Host is still alive, then use the startup failure dialog.
- Shutdown timeout: record the escalation and forcefully terminate the child.

Logs live under Electron's per-user application data directory. They include desktop lifecycle events and bounded Harness stdout/stderr, rotate locally, and are never uploaded. The application does not intentionally log environment variables or credentials.

## Packaging and release

Electron Builder produces:

- macOS ARM64 DMG;
- macOS x64 DMG;
- Windows x64 NSIS installer.

GitHub Actions builds each target on its native runner and uploads checksummed artifacts. Local development packaging builds only for the current platform. The first test release is unsigned; signed and notarized public distribution begins only after the corresponding secrets are configured in CI.

The application includes its own license plus required notices for DeepSeek Harness and all redistributed production dependencies. It clearly states that it is a community application and not an official DeepSeek product.

## Testing

### Unit tests

- readiness parsing across partial and multiple output chunks;
- rejection of non-loopback, malformed, conflicting, and missing readiness URLs;
- startup timeout and early exit diagnostics;
- graceful shutdown, escalation, and duplicate shutdown calls;
- window hide, restore, second-instance, and explicit quit behavior;
- navigation allowlist and external-link classification;
- development and packaged resource-path resolution.

### Integration and packaging tests

- start the pinned real Harness dependency and confirm its Web Host becomes ready;
- load the real Web UI in Electron and confirm the initial document succeeds;
- verify every packaged artifact contains the CLI entry and Web UI entry;
- launch the packaged application without a system Node.js dependency;
- quit the packaged application and confirm the Host process is gone;
- install and launch smoke tests on macOS ARM64, macOS x64, and Windows x64 CI runners where available.

## Acceptance criteria

Version 1 is complete when:

- a fresh supported Mac or Windows machine can install and launch the app without Node.js;
- the visible product UI and Harness behavior match the pinned official Web release;
- Harness data survives application restarts in its official location;
- ordinary window close and tray restoration work consistently;
- explicit quit leaves no Harness child process;
- external navigation cannot replace the Harness page inside the desktop window;
- startup failures give the user a readable recovery path and a local log;
- CI produces the three specified installer artifacts from a tagged commit.

