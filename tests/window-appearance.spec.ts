import { describe, expect, it, vi } from 'vitest'
import {
  applyWindowAppearance,
  DESKTOP_PANEL_TOGGLES_CSS,
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
  it('uses native platform titlebar controls with integrated content', () => {
    expect(windowAppearanceForPlatform('darwin')).toEqual({
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 15 },
    })
    expect(windowAppearanceForPlatform('win32')).toEqual({
      autoHideMenuBar: true,
    })
    expect(windowAppearanceForPlatform('linux')).toEqual({ autoHideMenuBar: true })
    expect(MACOS_TITLEBAR_HEIGHT).toBe(44)
  })

  it('installs a theme-matched draggable titlebar on macOS', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('darwin', webContents)

    expect(webContents.insertCSS).toHaveBeenCalledWith(DESKTOP_PANEL_TOGGLES_CSS, {
      cssOrigin: 'user',
    })
    expect(webContents.insertCSS).toHaveBeenCalledWith(MACOS_TITLEBAR_CSS, {
      cssOrigin: 'user',
    })
    expect(webContents.executeJavaScript).toHaveBeenCalledWith(MACOS_TITLEBAR_SCRIPT)
    expect(MACOS_TITLEBAR_CSS).toContain('var(--dsw-alias-bg-base, #fff)')
    expect(MACOS_TITLEBAR_CSS).toContain('-webkit-app-region: drag')
    expect(MACOS_TITLEBAR_CSS).toContain('padding-top: 0 !important')
    expect(MACOS_TITLEBAR_CSS).not.toContain('body::after')
    expect(MACOS_TITLEBAR_CSS).toContain('titlebar-sidebar-width')
    expect(MACOS_TITLEBAR_CSS).toContain(`#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}`)
    expect(MACOS_TITLEBAR_CSS).toContain('[data-dsh-desktop-fallback-drag]')
    expect(MACOS_TITLEBAR_CSS).toContain('var(--dsh-desktop-fallback-drag-width)')
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
    expect(MACOS_TITLEBAR_CSS).toContain('padding-right: 86px !important')
    expect(MACOS_TITLEBAR_CSS).toContain('width: 36px')
    expect(MACOS_TITLEBAR_CSS).toContain('height: 36px')
    expect(DESKTOP_PANEL_TOGGLES_CSS).toContain(
      "[data-dsh-better-sidebar] div[class*='_toggleCluster']",
    )
    expect(DESKTOP_PANEL_TOGGLES_CSS).toContain('[data-dsh-better-sidebar] button')
    expect(DESKTOP_PANEL_TOGGLES_CSS).toContain('-webkit-app-region: no-drag !important')
    expect(DESKTOP_PANEL_TOGGLES_CSS).not.toContain('[data-dsh-better-sidebar] >')
    expect(DESKTOP_PANEL_TOGGLES_CSS).toContain('top: 8px !important')
    expect(MACOS_TITLEBAR_SCRIPT).toContain(MACOS_TITLEBAR_ELEMENT_ID)
    expect(MACOS_TITLEBAR_SCRIPT).toContain('document.getElementById(id)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('document.elementsFromPoint(1, sampleY)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('new ResizeObserver')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('new MutationObserver')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("sidebarToggle.addEventListener('click'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const resolveOriginalSidebarToggle = (buttons)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const syncSidebarTogglePresentation = (source)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('queueMicrotask(() =>')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("conversationTab?.closest('header')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain(
      "titlebar.toggleAttribute('data-dsh-desktop-fallback-drag', nextMainHeader === null)",
    )
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const shellChanged = mainHeader === null')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const getLeftSidebarToggle = (buttons)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("'--dsh-desktop-fallback-drag-width'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain('root?.getBoundingClientRect().right')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const rightChromeControlLeft = Array.from(document.querySelectorAll')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('rect.right > window.innerWidth - 96')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const betterSidebarPanelLeft = Array.from')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("document.querySelectorAll('[data-dsh-better-sidebar] > div')")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("style.position === 'fixed'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain('betterSidebarPanelLeft,')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('left.getBoundingClientRect().left - right.getBoundingClientRect().left')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const getSidebarStructure = () =>')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const toggleStructure = getSidebarStructure()')
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
    expect(MACOS_TITLEBAR_SCRIPT).toContain('nextSidebarColumn.getBoundingClientRect().right')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('const nextObservedSidebar = nextSidebarColumn')
    expect(MACOS_TITLEBAR_SCRIPT).toContain('if (sidebarCollapsed)')
    expect(MACOS_TITLEBAR_SCRIPT).toContain("sidebarTransition === 'closing'")
    expect(MACOS_TITLEBAR_SCRIPT).toContain("removeAttribute('data-dsh-desktop-sidebar-transition')")
  })

  it('keeps the standard Windows frame without injecting desktop titlebar controls', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('win32', webContents)

    expect(webContents.insertCSS).toHaveBeenCalledOnce()
    expect(webContents.insertCSS).toHaveBeenCalledWith(DESKTOP_PANEL_TOGGLES_CSS, {
      cssOrigin: 'user',
    })
    expect(webContents.executeJavaScript).not.toHaveBeenCalled()
  })

  it('keeps the standard shell treatment on Linux', async () => {
    const webContents = makeWebContents()

    await applyWindowAppearance('linux', webContents)

    expect(webContents.insertCSS).toHaveBeenCalledOnce()
    expect(webContents.insertCSS).toHaveBeenCalledWith(DESKTOP_PANEL_TOGGLES_CSS, {
      cssOrigin: 'user',
    })
    expect(webContents.executeJavaScript).not.toHaveBeenCalled()
  })
})
