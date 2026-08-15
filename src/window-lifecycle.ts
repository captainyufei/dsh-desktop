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

export interface DesktopLifecycleOptions {
  readonly getWindow: () => DesktopWindow | undefined
  readonly createWindow: () => DesktopWindow | Promise<DesktopWindow>
  readonly disposeHost: () => Promise<void> | void
  readonly quit: () => void
  readonly reportError: (error: unknown) => void
}

/**
 * Build the small state machine shared by Electron's window and app events.
 * Window creation and quit are both idempotent, which keeps event bursts from
 * creating duplicate BrowserWindows or disposing the host more than once.
 */
export function createDesktopLifecycle(options: DesktopLifecycleOptions): DesktopLifecycle {
  let quitting = false
  let creatingWindow: Promise<void> | undefined
  let pendingQuit: Promise<void> | undefined

  const restore = (window: DesktopWindow, forceShow = false): void => {
    if (window.isDestroyed() || quitting) {
      return
    }
    if (forceShow || !window.isVisible()) {
      window.show()
    }
    window.focus()
  }

  const showWindow = (): Promise<void> => {
    if (quitting) {
      return Promise.resolve()
    }

    const current = options.getWindow()
    if (current !== undefined && !current.isDestroyed()) {
      restore(current)
      return Promise.resolve()
    }

    if (creatingWindow !== undefined) {
      return creatingWindow
    }

    let created: DesktopWindow | Promise<DesktopWindow>
    try {
      created = options.createWindow()
    } catch (error) {
      options.reportError(error)
      return Promise.resolve()
    }

    const operation = Promise.resolve(created)
      .then((window) => {
        restore(window, true)
      })
      .catch((error: unknown) => {
        options.reportError(error)
      })
      .finally(() => {
        if (creatingWindow === operation) {
          creatingWindow = undefined
        }
      })
    creatingWindow = operation
    return operation
  }

  const onWindowClose = (event: { preventDefault(): void }): void => {
    if (quitting) {
      return
    }
    event.preventDefault()
    const window = options.getWindow()
    if (window !== undefined && !window.isDestroyed()) {
      window.hide()
    }
  }

  const requestQuit = (): Promise<void> => {
    if (pendingQuit !== undefined) {
      return pendingQuit
    }

    quitting = true
    let disposal: Promise<void>
    try {
      disposal = Promise.resolve(options.disposeHost())
    } catch (error) {
      options.reportError(error)
      disposal = Promise.resolve()
    }

    const operation = disposal
      .catch((error: unknown) => {
        options.reportError(error)
      })
      .then(() => {
        options.quit()
      })
    pendingQuit = operation
    return operation
  }

  return {
    get isQuitting(): boolean {
      return quitting
    },
    get pendingQuit(): Promise<void> | undefined {
      return pendingQuit
    },
    onWindowClose,
    showWindow,
    requestQuit,
  }
}
