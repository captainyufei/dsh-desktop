import { describe, expect, it, vi } from 'vitest'
import {
  applyWindowAppearance,
  MACOS_COMPACT_BRAND_ELEMENT_ID,
  MACOS_SIDEBAR_TOGGLE_ELEMENT_ID,
  MACOS_TITLEBAR_HEIGHT,
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
    expect(windowAppearanceForPlatform('darwin')).toEqual({
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 15 },
    })
    expect(windowAppearanceForPlatform('win32')).toEqual({})
    expect(windowAppearanceForPlatform('linux')).toEqual({})
    expect(MACOS_TITLEBAR_HEIGHT).toBe(44)
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
    expect(MACOS_TITLEBAR_CSS).toContain('padding-top: 0 !important')
    expect(MACOS_TITLEBAR_CSS).toContain('body::after')
    expect(MACOS_TITLEBAR_CSS).toContain('top: calc(var(--dsh-desktop-titlebar-height) - 1px)')
    expect(MACOS_TITLEBAR_CSS).toContain('titlebar-sidebar-width')
    expect(MACOS_TITLEBAR_CSS).toContain(`#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}`)
    expect(MACOS_TITLEBAR_CSS).toContain('background: transparent !important')
    expect(MACOS_TITLEBAR_CSS).toContain('appearance: none !important')
    expect(MACOS_TITLEBAR_CSS).toContain(`#${MACOS_COMPACT_BRAND_ELEMENT_ID}`)
    expect(MACOS_TITLEBAR_CSS).toContain('[data-dsh-desktop-main-header]')
    expect(MACOS_TITLEBAR_CSS).toContain('position: relative !important')
    expect(MACOS_TITLEBAR_CSS).toContain('flex: 0 0 var(--dsh-desktop-titlebar-height)')
    expect(MACOS_TITLEBAR_CSS).toContain('content: none !important')
    expect(MACOS_TITLEBAR_CSS).toContain('grid-template-rows: var(--dsh-desktop-titlebar-height)')
    expect(MACOS_TITLEBAR_CSS).toContain('[data-dsh-desktop-frame-collapsed]')
    expect(MACOS_TITLEBAR_CSS).toContain('grid-template-columns: 0 minmax(0, 1fr)')
    expect(MACOS_TITLEBAR_CSS).toContain('min-width: 42px !important')
    expect(MACOS_TITLEBAR_CSS).not.toContain('transition: left 220ms')
    expect(MACOS_TITLEBAR_CSS).toContain('box-shadow: none !important')
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
    expect(MACOS_TITLEBAR_SCRIPT).toContain("beginSidebarTransition(opening ? 'opening' : 'closing')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain('window.requestAnimationFrame(trackSidebarGeometry)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('}, 340)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('syncObservedSidebarWidth')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('nextSidebarColumn?.getBoundingClientRect().right')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const nextObservedSidebar = nextSidebarColumn ?? sidebar.element')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('if (sidebarCollapsed)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("sidebarTransition === 'closing'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("removeAttribute('data-dsh-desktop-sidebar-transition')")
  })

  it('does not alter Web contents on other platforms', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('win32', webContents)

    expect(webContents.insertCSS).not.toHaveBeenCalled()
    expect(webContents.executeJavaScript).not.toHaveBeenCalled()
  })
})
