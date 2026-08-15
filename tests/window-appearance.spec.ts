import { describe, expect, it, vi } from 'vitest'
import {
  applyWindowAppearance,
  MACOS_COMPACT_BRAND_ELEMENT_ID,
  MACOS_SIDEBAR_TOGGLE_ELEMENT_ID,
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
    expect(MACOS_TITLEBAR_CSS).toContain('titlebar-sidebar-width')
    expect(MACOS_TITLEBAR_CSS).toContain('border-right: 1px solid')
    expect(MACOS_TITLEBAR_CSS).toContain(`#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}`)
    expect(MACOS_TITLEBAR_CSS).toContain('background: transparent !important')
    expect(MACOS_TITLEBAR_CSS).toContain('appearance: none !important')
    expect(MACOS_TITLEBAR_CSS).toContain(`#${MACOS_COMPACT_BRAND_ELEMENT_ID}`)
    expect(MACOS_TITLEBAR_CSS).toContain('[data-dsh-desktop-main-header]')
    expect(MACOS_TITLEBAR_CSS).toContain('position: fixed !important')
    expect(MACOS_TITLEBAR_CSS).toContain('grid-template-rows: var(--dsh-desktop-titlebar-height)')
    expect(MACOS_TITLEBAR_CSS).toContain('[data-dsh-desktop-frame-collapsed]')
    expect(MACOS_TITLEBAR_CSS).toContain('grid-template-columns: 0 minmax(0, 1fr)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain(MACOS_TITLEBAR_ELEMENT_ID)
    expect(MACOS_TITLEBAR_SCRIPT).toContain('document.getElementById(id)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('document.elementsFromPoint(1, sampleY)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('new ResizeObserver')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('new MutationObserver')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("sidebarToggle.addEventListener('click'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("conversationTab?.closest('header')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("label.includes('展开侧边栏')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("label.includes('打开侧边栏')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("setAttribute('data-dsh-desktop-frame-collapsed'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("setAttribute('data-dsh-desktop-main-title-row'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("'data-details-collapsed'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain('getDetailsWidth(nextFrame, nextDetailsColumn)')
  })

  it('does not alter Web contents on other platforms', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('win32', webContents)

    expect(webContents.insertCSS).not.toHaveBeenCalled()
    expect(webContents.executeJavaScript).not.toHaveBeenCalled()
  })
})
