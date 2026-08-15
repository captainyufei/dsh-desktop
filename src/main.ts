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
import { createDiagnostics } from './diagnostics.ts'
import { assertRuntimeArtifacts, resolveHostPaths, type HostPaths } from './host/paths.ts'
import {
  createHostSupervisor,
  spawnDshWeb,
  type HostChild,
  type HostSupervisor,
} from './host/supervisor.ts'
import { classifyNavigation } from './navigation-policy.ts'
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
  let tray: Tray | undefined
  let host: HostSupervisor | undefined
  let hostOrigin: string | undefined
  let hostExited = true
  let releaseQuit = false
  let runtimePaths: HostPaths | undefined
  let rendererRecovery: Promise<void> | undefined
  let postStartRecovery: Promise<void> | undefined

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
        diagnostics.error(
          'Harness Web Host exited unexpectedly',
          signal === null ? `code ${code ?? 'unknown'}` : `signal ${signal}`,
        )
        void handlePostStartHostFailure(supervisor)
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

  const showStartupRecovery = async (error: unknown): Promise<boolean> => {
    diagnostics.error('Desktop startup failed', error)
    while (!lifecycle.isQuitting) {
      const { response } = await dialog.showMessageBox({
        type: 'error',
        title: APP_NAME,
        message: 'Harness could not start.',
        detail: error instanceof Error ? error.message : String(error),
        buttons: ['Retry', 'Open Logs', 'Quit'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      })
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

  const startHostWithRecovery = async (): Promise<string | undefined> => {
    while (!lifecycle.isQuitting) {
      try {
        return await replaceHost()
      } catch (error) {
        if (!await showStartupRecovery(error)) {
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
    if (rendererRecovery !== undefined) {
      return
    }
    rendererRecovery = (async () => {
      if (!await showStartupRecovery(error)) {
        return
      }
      const origin = await startHostWithRecovery()
      if (origin === undefined || window.isDestroyed() || lifecycle.isQuitting) {
        return
      }
      window.webContents.removeAllListeners('did-fail-load')
      attachLoadFailureHandler(window)
      loadCurrentOrigin(window)
    })().finally(() => {
      rendererRecovery = undefined
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
        if (!hostExited && host !== undefined && hostOrigin !== undefined && !retried) {
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

    window.on('close', (event) => lifecycle.onWindowClose(event))
    window.on('closed', () => {
      if (mainWindow === window) {
        mainWindow = undefined
      }
    })

    window.webContents.on('will-navigate', (event, url) => {
      if (hostOrigin === undefined) {
        event.preventDefault()
        return
      }
      const decision = classifyNavigation(url, hostOrigin)
      if (decision === 'allow') {
        return
      }
      event.preventDefault()
      if (decision === 'external') {
        void shell.openExternal(url).catch((error: unknown) => {
          diagnostics.error('Failed to open external link', error)
        })
      }
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
    getWindow: () => mainWindow,
    createWindow,
    disposeHost: async () => {
      diagnostics.log('Shutting down desktop')
      const currentHost = host
      host = undefined
      hostOrigin = undefined
      hostExited = true
      if (currentHost !== undefined) {
        await currentHost.shutdown()
      }
      if (mainWindow !== undefined && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
      }
      mainWindow = undefined
      tray?.destroy()
      tray = undefined
      await diagnostics.close()
    },
    quit: () => {
      releaseQuit = true
      app.quit()
    },
    reportError: (error) => diagnostics.error('Desktop lifecycle error', error),
  })

  async function handlePostStartHostFailure(failedHost: HostSupervisor): Promise<void> {
    if (postStartRecovery !== undefined || lifecycle.isQuitting || host !== failedHost) {
      return
    }
    postStartRecovery = (async () => {
      if (mainWindow !== undefined && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
        mainWindow = undefined
      }
      while (!lifecycle.isQuitting) {
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
        if (response === 1) {
          openLogs()
          continue
        }
        if (response === 2) {
          await lifecycle.requestQuit()
          return
        }
        const origin = await startHostWithRecovery()
        if (origin !== undefined) {
          await lifecycle.showWindow()
        }
        return
      }
    })().finally(() => {
      postStartRecovery = undefined
    })
    await postStartRecovery
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
      detail: error instanceof Error ? error.message : String(error),
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
    diagnostics.error('Unhandled application startup failure', error)
    if (app.isReady()) {
      await showStartupRecovery(error)
    }
    await lifecycle.requestQuit()
  })
}
