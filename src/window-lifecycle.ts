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

  const restore = (window: DesktopWindow, forceShow = false): boolean => {
    if (window.isDestroyed() || quitting) {
      return false
    }
    try {
      if (forceShow || !window.isVisible()) {
        window.show()
      }
      if (window.isDestroyed() || quitting) {
        return false
      }
      window.focus()
      return !window.isDestroyed()
    } catch (error) {
      if (window.isDestroyed()) {
        return false
      }
      throw error
    }
  }

  const showWindow = (): Promise<void> => {
    if (quitting) {
      return Promise.resolve()
    }

    const current = options.getWindow()
    if (current !== undefined && !current.isDestroyed()) {
      try {
        if (restore(current)) {
          return Promise.resolve()
        }
      } catch (error) {
        options.reportError(error)
        return Promise.resolve()
      }
    }

    if (creatingWindow !== undefined) {
      return creatingWindow
    }

    let resolveOperation!: () => void
    const operation = new Promise<void>((resolve) => {
      resolveOperation = resolve
    })
    creatingWindow = operation

    const createAndRestore = (): void => {
      let created: DesktopWindow | Promise<DesktopWindow>
      try {
        created = options.createWindow()
      } catch (error) {
        options.reportError(error)
        resolveOperation()
        return
      }

      Promise.resolve(created).then(
        (window) => {
          try {
            if (restore(window, true)) {
              resolveOperation()
            } else if (!quitting) {
              createAndRestore()
            } else {
              resolveOperation()
            }
          } catch (error) {
            options.reportError(error)
            resolveOperation()
          }
        },
        (error: unknown) => {
          options.reportError(error)
          resolveOperation()
        },
      )
    }

    operation.then(() => {
      if (creatingWindow === operation) {
        creatingWindow = undefined
      }
    })
    createAndRestore()
    return operation
  }

  const onWindowClose = (event: { preventDefault(): void }): void => {
    if (quitting) {
      return
    }
    event.preventDefault()
    const window = options.getWindow()
    if (window === undefined || window.isDestroyed()) {
      return
    }
    try {
      if (!window.isDestroyed()) {
        window.hide()
      }
    } catch (error) {
      if (!window.isDestroyed()) {
        options.reportError(error)
      }
    }
  }

  const requestQuit = (): Promise<void> => {
    if (pendingQuit !== undefined) {
      return pendingQuit
    }

    quitting = true
    let resolveOperation!: () => void
    const operation = new Promise<void>((resolve) => {
      resolveOperation = resolve
    })
    pendingQuit = operation

    const finishQuit = (): void => {
      try {
        options.quit()
      } catch (error) {
        options.reportError(error)
      }
      resolveOperation()
    }

    let disposal: Promise<void>
    try {
      disposal = Promise.resolve(options.disposeHost())
    } catch (error) {
      options.reportError(error)
      finishQuit()
      return operation
    }

    disposal.then(
      () => {
        finishQuit()
      },
      (error: unknown) => {
        options.reportError(error)
        finishQuit()
      },
    )
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
