import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  nativeImage,
  session,
  shell,
  Tray,
} from 'electron'
import { APP_ID, APP_NAME } from './app-metadata.ts'
import { runCleanupStages } from './cleanup.ts'
import { createDiagnostics } from './diagnostics.ts'
import { assertRuntimeArtifacts, resolveHostPaths, type HostPaths } from './host/paths.ts'
import {
  createHostSupervisor,
  formatStartupErrorForDialog,
  spawnDshWeb,
  type HostChild,
  type HostSupervisor,
} from './host/supervisor.ts'
import {
  classifyNavigation,
  registerMainFrameNavigationHandlers,
} from './navigation-policy.ts'
import {
  createRecoveryCoordinator,
  type RecoveryTicket,
} from './recovery-coordinator.ts'
import { createDesktopLifecycle } from './window-lifecycle.ts'

const MAX_HOST_LOG_CHARS = 32_768

app.setName(APP_NAME)
app.setAppUserModelId(APP_ID)

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  startApplication()
}

function startApplication(): void {
  const diagnostics = createDiagnostics(app.getPath('userData'))
  let mainWindow: BrowserWindow | undefined
  let mainWindowReady = false
  let tray: Tray | undefined
  let host: HostSupervisor | undefined
  let hostOrigin: string | undefined
  let hostExited = true
  let releaseQuit = false
  let runtimePaths: HostPaths | undefined

  const logHostChunk = (streamName: 'stdout' | 'stderr', chunk: string): void => {
    const bounded = chunk.length > MAX_HOST_LOG_CHARS
      ? `${chunk.slice(0, MAX_HOST_LOG_CHARS)}… [truncated]`
      : chunk
    diagnostics.log(`[Host ${streamName}] ${bounded.trimEnd()}`)
  }

  const instrumentChild = (child: HostChild): HostChild => ({
    stdout: {
      onData(listener) {
        return child.stdout.onData((chunk) => {
          logHostChunk('stdout', chunk)
          listener(chunk)
        })
      },
    },
    stderr: {
      onData(listener) {
        return child.stderr.onData((chunk) => {
          logHostChunk('stderr', chunk)
          listener(chunk)
        })
      },
    },
    onExit: (listener) => child.onExit(listener),
    onError: (listener) => child.onError(listener),
    kill: (signal) => child.kill(signal),
  })

  const createSupervisor = (): HostSupervisor => {
    if (runtimePaths === undefined) {
      throw new Error('Harness runtime paths have not been resolved')
    }

    let supervisor: HostSupervisor
    supervisor = createHostSupervisor({
      ...runtimePaths,
      env: process.env,
      spawn: (options) => instrumentChild(spawnDshWeb(options)),
      onUnexpectedExit: (code, signal) => {
        if (host !== supervisor) {
          return
        }
        hostExited = true
        hostOrigin = undefined
        diagnostics.error(
          'Harness Web Host exited unexpectedly',
          signal === null ? `code ${code ?? 'unknown'}` : `signal ${signal}`,
        )
        void recoveryCoordinator.schedule((ticket) => (
          handlePostStartHostFailure(supervisor, ticket)
        ))
      },
    })
    return supervisor
  }

  const replaceHost = async (): Promise<string> => {
    const previousHost = host
    host = undefined
    hostOrigin = undefined
    hostExited = true
    if (previousHost !== undefined) {
      await previousHost.shutdown()
    }

    const freshHost = createSupervisor()
    host = freshHost
    diagnostics.log('Starting Harness Web Host')
    try {
      const origin = await freshHost.start()
      if (host !== freshHost) {
        await freshHost.shutdown()
        throw new Error('Harness Web Host was superseded during startup')
      }
      hostOrigin = origin
      hostExited = false
      diagnostics.log(`Harness Web Host ready at ${origin}`)
      return origin
    } catch (error) {
      diagnostics.error('Harness Web Host failed to start', error)
      await freshHost.shutdown()
      if (host === freshHost) {
        host = undefined
      }
      throw error
    }
  }

  const openLogs = (): void => {
    shell.showItemInFolder(diagnostics.path)
  }

  const showStartupRecovery = async (
    error: unknown,
    ticket?: RecoveryTicket,
  ): Promise<boolean> => {
    diagnostics.error('Desktop startup failed', error)
    while (!lifecycle.isQuitting && (ticket === undefined || ticket.isCurrent())) {
      const { response } = await dialog.showMessageBox({
        type: 'error',
        title: APP_NAME,
        message: 'Harness could not start.',
        detail: formatStartupErrorForDialog(error),
        buttons: ['Retry', 'Open Logs', 'Quit'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      })
      if (ticket !== undefined && !ticket.isCurrent()) {
        return false
      }
      if (response === 0) {
        return true
      }
      if (response === 1) {
        openLogs()
        continue
      }
      await lifecycle.requestQuit()
      return false
    }
    return false
  }

  const startHostWithRecovery = async (
    ticket?: RecoveryTicket,
  ): Promise<string | undefined> => {
    while (!lifecycle.isQuitting && (ticket === undefined || ticket.isCurrent())) {
      try {
        const origin = await replaceHost()
        return ticket === undefined || ticket.isCurrent() ? origin : undefined
      } catch (error) {
        if (!await showStartupRecovery(error, ticket)) {
          return undefined
        }
      }
    }
    return undefined
  }

  const loadCurrentOrigin = (window: BrowserWindow): void => {
    if (hostOrigin === undefined) {
      return
    }
    void window.loadURL(hostOrigin).catch((error: unknown) => {
      diagnostics.error('Harness page load rejected', error)
    })
  }

  const recoverRenderer = (window: BrowserWindow, error: Error): void => {
    void recoveryCoordinator.schedule(async (ticket) => {
      if (!await showStartupRecovery(error, ticket) || !ticket.isCurrent()) {
        return
      }
      hostOrigin = undefined
      hostExited = true
      mainWindowReady = false
      if (!window.isDestroyed()) {
        window.destroy()
      }
      if (!ticket.isCurrent()) {
        return
      }
      const origin = await startHostWithRecovery(ticket)
      if (origin !== undefined && ticket.isCurrent() && !lifecycle.isQuitting) {
        await lifecycle.showWindow()
      }
    })
  }

  const attachLoadFailureHandler = (window: BrowserWindow): void => {
    let retried = false
    window.webContents.on(
      'did-fail-load',
      (_event, errorCode, errorDescription, _validatedUrl, isMainFrame) => {
        if (!isMainFrame || window.isDestroyed() || lifecycle.isQuitting) {
          return
        }
        const error = new Error(`Harness page failed to load (${errorCode}: ${errorDescription})`)
        diagnostics.error('Harness page load failed', error)
        if (hostExited || host === undefined || hostOrigin === undefined) {
          diagnostics.log('Harness page recovery deferred to Host recovery')
          return
        }
        if (!retried) {
          retried = true
          diagnostics.log('Retrying Harness page load once')
          loadCurrentOrigin(window)
          return
        }
        recoverRenderer(window, error)
      },
    )
  }

  const createWindow = (): Promise<BrowserWindow> => {
    if (hostOrigin === undefined || hostExited) {
      return Promise.reject(new Error('Harness Web Host is not ready'))
    }

    const window = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 960,
      minHeight: 640,
      show: false,
      frame: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    })
    mainWindow = window
    mainWindowReady = false

    window.on('close', (event) => lifecycle.onWindowClose(event))
    window.on('closed', () => {
      if (mainWindow === window) {
        mainWindow = undefined
        mainWindowReady = false
      }
    })

    registerMainFrameNavigationHandlers({
      onWillNavigate(listener) {
        window.webContents.on('will-navigate', listener)
      },
      onWillRedirect(listener) {
        window.webContents.on('will-redirect', listener)
      },
    }, {
      getHostOrigin: () => hostOrigin,
      openExternal(url) {
        void shell.openExternal(url).catch((error: unknown) => {
          diagnostics.error('Failed to open external link', error)
        })
      },
    })
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (hostOrigin !== undefined && classifyNavigation(url, hostOrigin) === 'external') {
        void shell.openExternal(url).catch((error: unknown) => {
          diagnostics.error('Failed to open external window link', error)
        })
      }
      return { action: 'deny' }
    })

    if (app.isPackaged) {
      window.webContents.on('before-input-event', (event, input) => {
        const devToolsKey = input.key === 'F12'
          || (input.key.toLowerCase() === 'i' && input.shift && (input.control || input.meta))
        if (devToolsKey) {
          event.preventDefault()
        }
      })
      window.webContents.on('devtools-opened', () => window.webContents.closeDevTools())
    }

    attachLoadFailureHandler(window)
    const loaded = new Promise<BrowserWindow>((resolve) => {
      window.webContents.once('did-finish-load', () => {
        diagnostics.log('Harness page finished loading')
        if (mainWindow === window && !window.isDestroyed()) {
          mainWindowReady = true
        }
        resolve(window)
      })
      // Let the lifecycle state machine observe a window destroyed while its
      // initial load was pending, so a later Host restart is not coalesced
      // into a promise that can never settle.
      window.once('closed', () => resolve(window))
    })
    loadCurrentOrigin(window)
    return loaded
  }

  const lifecycle = createDesktopLifecycle({
    getWindow: () => mainWindowReady ? mainWindow : undefined,
    createWindow,
    disposeHost: async () => {
      try {
        diagnostics.log('Shutting down desktop')
      } catch {
        // Continue cleanup even if diagnostics cannot accept another line.
      }
      const currentHost = host
      host = undefined
      hostOrigin = undefined
      hostExited = true
      mainWindowReady = false

      const reportCleanupError = (stage: string, error: unknown): void => {
        try {
          diagnostics.error(`Desktop cleanup failed during ${stage}`, error)
        } catch {
          // Diagnostics close below remains the final cleanup boundary.
        }
      }

      try {
        await runCleanupStages([
          {
            name: 'Host shutdown',
            run: async () => {
              if (currentHost !== undefined) {
                await currentHost.shutdown()
              }
            },
          },
          {
            name: 'window destruction',
            run: () => {
              const windowToDestroy = mainWindow
              mainWindow = undefined
              if (windowToDestroy !== undefined && !windowToDestroy.isDestroyed()) {
                windowToDestroy.destroy()
              }
            },
          },
          {
            name: 'tray destruction',
            run: () => {
              const trayToDestroy = tray
              tray = undefined
              trayToDestroy?.destroy()
            },
          },
        ], reportCleanupError)
      } finally {
        try {
          await diagnostics.close()
        } catch (error) {
          console.error(`${APP_NAME} diagnostics close failed`, error)
        }
      }
    },
    quit: () => {
      releaseQuit = true
      app.quit()
    },
    reportError: (error) => diagnostics.error('Desktop lifecycle error', error),
  })

  const recoveryCoordinator = createRecoveryCoordinator({
    onError: async (error) => {
      try {
        diagnostics.error('Desktop recovery failed terminally', error)
      } catch {
        // Quit remains mandatory even when the diagnostics sink has failed.
      }
      await lifecycle.requestQuit()
    },
  })

  async function handlePostStartHostFailure(
    failedHost: HostSupervisor,
    ticket: RecoveryTicket,
  ): Promise<void> {
    if (lifecycle.isQuitting || host !== failedHost || !ticket.isCurrent()) {
      return
    }
    mainWindowReady = false
    if (mainWindow !== undefined && !mainWindow.isDestroyed()) {
      mainWindow.destroy()
      mainWindow = undefined
    }
    while (!lifecycle.isQuitting && ticket.isCurrent()) {
      const { response } = await dialog.showMessageBox({
        type: 'error',
        title: APP_NAME,
        message: 'Harness stopped unexpectedly.',
        detail: 'The local Harness Web Host is no longer running.',
        buttons: ['Restart Host', 'Open Logs', 'Quit'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      })
      if (!ticket.isCurrent()) {
        return
      }
      if (response === 1) {
        openLogs()
        continue
      }
      if (response === 2) {
        await lifecycle.requestQuit()
        return
      }
      const origin = await startHostWithRecovery(ticket)
      if (origin !== undefined && ticket.isCurrent()) {
        await lifecycle.showWindow()
      }
      return
    }
  }

  const createTray = (): void => {
    const trayPath = app.isPackaged
      ? join(process.resourcesPath, 'desktop-resources', 'trayTemplate.png')
      : join(app.getAppPath(), 'build', 'trayTemplate.png')
    if (!existsSync(trayPath)) {
      throw new Error(`Tray asset is missing: ${trayPath}`)
    }
    const image = nativeImage.createFromPath(trayPath)
    if (image.isEmpty()) {
      throw new Error(`Tray asset could not be loaded: ${trayPath}`)
    }
    if (process.platform === 'darwin') {
      image.setTemplateImage(true)
    }
    tray = new Tray(image)
    tray.setToolTip(APP_NAME)
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: `Open ${APP_NAME}`, click: () => void lifecycle.showWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => void lifecycle.requestQuit() },
    ]))
    tray.on('click', () => void lifecycle.showWindow())
  }

  const showMissingArtifacts = async (error: unknown): Promise<void> => {
    diagnostics.error('Required runtime artifact is missing', error)
    const { response } = await dialog.showMessageBox({
      type: 'error',
      title: APP_NAME,
      message: 'Required Harness runtime artifacts are missing.',
      detail: formatStartupErrorForDialog(error),
      buttons: ['Open Logs', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
    if (response === 0) {
      openLogs()
    }
    await lifecycle.requestQuit()
  }

  app.on('second-instance', () => {
    void lifecycle.showWindow()
  })
  app.on('activate', () => {
    void lifecycle.showWindow()
  })
  app.on('window-all-closed', () => {})
  app.on('before-quit', (event) => {
    if (releaseQuit) {
      return
    }
    event.preventDefault()
    void lifecycle.requestQuit()
  })

  void app.whenReady().then(async () => {
    diagnostics.log('Electron application ready')
    session.defaultSession.setPermissionCheckHandler(() => false)
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false)
    })

    try {
      runtimePaths = resolveHostPaths({
        isPackaged: app.isPackaged,
        appPath: app.getAppPath(),
        resourcesPath: process.resourcesPath,
        execPath: process.execPath,
        homePath: app.getPath('home'),
        env: process.env,
      })
      assertRuntimeArtifacts(runtimePaths)
      createTray()
    } catch (error) {
      await showMissingArtifacts(error)
      return
    }

    const origin = await startHostWithRecovery()
    if (origin !== undefined) {
      await lifecycle.showWindow()
    }
  }).catch(async (error: unknown) => {
    try {
      diagnostics.error('Unhandled application startup failure', error)
    } catch {
      // The deterministic quit below does not depend on diagnostics.
    }
    try {
      if (app.isReady()) {
        await showStartupRecovery(error)
      }
    } catch (recoveryError) {
      try {
        diagnostics.error('Application startup recovery failed terminally', recoveryError)
      } catch {
        // The deterministic quit below does not depend on diagnostics.
      }
    } finally {
      await lifecycle.requestQuit()
    }
  })
}
