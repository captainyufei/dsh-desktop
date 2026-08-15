import { describe, expect, it, vi } from 'vitest'
import { createDesktopLifecycle, type DesktopWindow } from '../src/window-lifecycle.ts'

class FakeWindow implements DesktopWindow {
  destroyed = false
  visible = true
  readonly show = vi.fn(() => {
    this.visible = true
  })
  readonly focus = vi.fn()
  readonly hide = vi.fn(() => {
    this.visible = false
  })

  isDestroyed(): boolean {
    return this.destroyed
  }

  isVisible(): boolean {
    return this.visible
  }
}

function createFixture() {
  let window: FakeWindow | undefined = new FakeWindow()
  const created: FakeWindow[] = []
  let resolveCreate: ((value: FakeWindow) => void) | undefined
  const createWindow = vi.fn(() => {
    const pending = new Promise<FakeWindow>((resolve) => {
      resolveCreate = resolve
    })
    return pending
  })
  const disposeHost = vi.fn<() => Promise<void>>(() => Promise.resolve())
  const quit = vi.fn()
  const reportError = vi.fn()
  const lifecycle = createDesktopLifecycle({
    getWindow: () => window,
    createWindow: async () => {
      const next = await createWindow()
      window = next
      created.push(next)
      return next
    },
    disposeHost,
    quit,
    reportError,
  })

  return {
    lifecycle,
    get window() {
      return window
    },
    set window(value: FakeWindow | undefined) {
      window = value
    },
    created,
    createWindow,
    resolveCreate: (value = new FakeWindow()) => resolveCreate?.(value),
    disposeHost,
    quit,
    reportError,
  }
}

describe('desktop lifecycle', () => {
  it('prevents ordinary close and hides a visible window', () => {
    const fixture = createFixture()
    const event = { preventDefault: vi.fn() }

    fixture.lifecycle.onWindowClose(event)

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(fixture.window?.hide).toHaveBeenCalledOnce()
  })

  it('shows and focuses an existing hidden window', async () => {
    const fixture = createFixture()
    fixture.window?.hide()

    await fixture.lifecycle.showWindow()

    expect(fixture.window?.show).toHaveBeenCalledOnce()
    expect(fixture.window?.focus).toHaveBeenCalledOnce()
  })

  it('recreates a destroyed window', async () => {
    const fixture = createFixture()
    fixture.window!.destroyed = true
    const pending = fixture.lifecycle.showWindow()
    expect(fixture.createWindow).toHaveBeenCalledOnce()
    fixture.resolveCreate()

    await pending

    expect(fixture.created).toHaveLength(1)
    expect(fixture.created[0]?.show).toHaveBeenCalledOnce()
    expect(fixture.created[0]?.focus).toHaveBeenCalledOnce()
  })

  it('coalesces concurrent window creation', async () => {
    const fixture = createFixture()
    fixture.window = undefined

    const first = fixture.lifecycle.showWindow()
    const second = fixture.lifecycle.showWindow()
    expect(first).toBe(second)
    expect(fixture.createWindow).toHaveBeenCalledOnce()
    fixture.resolveCreate()
    await Promise.all([first, second])
  })

  it('coalesces concurrent quit and disposes Host before Electron quit', async () => {
    const fixture = createFixture()
    let releaseDispose: (() => void) | undefined
    fixture.disposeHost.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseDispose = resolve
        }),
    )

    const first = fixture.lifecycle.requestQuit()
    const second = fixture.lifecycle.requestQuit()
    expect(first).toBe(second)
    expect(fixture.lifecycle.isQuitting).toBe(true)
    expect(fixture.lifecycle.pendingQuit).toBe(first)
    expect(fixture.disposeHost).toHaveBeenCalledOnce()
    expect(fixture.quit).not.toHaveBeenCalled()

    releaseDispose?.()
    await Promise.all([first, second])
    expect(fixture.quit).toHaveBeenCalledOnce()
  })

  it('suppresses close handling and restore while quitting', async () => {
    const fixture = createFixture()
    let releaseDispose: (() => void) | undefined
    fixture.disposeHost.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseDispose = resolve
        }),
    )
    const event = { preventDefault: vi.fn() }

    const quitting = fixture.lifecycle.requestQuit()
    fixture.lifecycle.onWindowClose(event)
    await fixture.lifecycle.showWindow()

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(fixture.window?.hide).not.toHaveBeenCalled()
    expect(fixture.window?.show).not.toHaveBeenCalled()
    expect(fixture.window?.focus).not.toHaveBeenCalled()

    releaseDispose?.()
    await quitting
  })

  it('reports disposal errors and still completes Electron quit', async () => {
    const fixture = createFixture()
    const error = new Error('dispose failed')
    fixture.disposeHost.mockRejectedValue(error)

    await fixture.lifecycle.requestQuit()

    expect(fixture.reportError).toHaveBeenCalledWith(error)
    expect(fixture.quit).toHaveBeenCalledOnce()
  })
})
