import { describe, expect, it, vi } from 'vitest'
import {
  applyWindowAppearance,
  MACOS_TITLEBAR_CSS,
  MACOS_TITLEBAR_ELEMENT_ID,
  MACOS_TITLEBAR_SCRIPT,
  windowAppearanceForPlatform,
  type WindowAppearanceWebContents,
} from '../src/window-appearance.ts'

function makeWebContents(): WindowAppearanceWebContents & {
  insertCSS: ReturnType<typeof vi.fn>
  executeJavaScript: ReturnType<typeof vi.fn>
} {
  return {
    insertCSS: vi.fn().mockResolvedValue('css-key'),
    executeJavaScript: vi.fn().mockResolvedValue(undefined),
  }
}

describe('desktop window appearance', () => {
  it('uses the native inset titlebar only on macOS', () => {
    expect(windowAppearanceForPlatform('darwin')).toEqual({ titleBarStyle: 'hiddenInset' })
    expect(windowAppearanceForPlatform('win32')).toEqual({})
    expect(windowAppearanceForPlatform('linux')).toEqual({})
  })

  it('installs a theme-matched draggable titlebar on macOS', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('darwin', webContents)

    expect(webContents.insertCSS).toHaveBeenCalledWith(MACOS_TITLEBAR_CSS, {
      cssOrigin: 'user',
    })
    expect(webContents.executeJavaScript).toHaveBeenCalledWith(MACOS_TITLEBAR_SCRIPT)
    expect(MACOS_TITLEBAR_CSS).toContain('var(--dsw-alias-bg-base, #fff)')
    expect(MACOS_TITLEBAR_CSS).toContain('-webkit-app-region: drag')
    expect(MACOS_TITLEBAR_CSS).toContain('padding-top: var(--dsh-desktop-titlebar-height)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain(MACOS_TITLEBAR_ELEMENT_ID)
    expect(MACOS_TITLEBAR_SCRIPT).toContain('document.getElementById(id)')
  })

  it('does not alter Web contents on other platforms', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('win32', webContents)

    expect(webContents.insertCSS).not.toHaveBeenCalled()
    expect(webContents.executeJavaScript).not.toHaveBeenCalled()
  })
})
