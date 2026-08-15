export const MACOS_TITLEBAR_HEIGHT = 38
export const MACOS_TITLEBAR_ELEMENT_ID = 'dsh-desktop-titlebar'

export const MACOS_TITLEBAR_CSS = `
:root {
  --dsh-desktop-titlebar-height: ${MACOS_TITLEBAR_HEIGHT}px;
}

body {
  box-sizing: border-box;
  padding-top: var(--dsh-desktop-titlebar-height) !important;
  background: var(--dsw-alias-bg-base, #fff) !important;
}

#root {
  height: 100% !important;
}

#${MACOS_TITLEBAR_ELEMENT_ID} {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 2147483647;
  height: var(--dsh-desktop-titlebar-height);
  background: var(--dsw-alias-bg-base, #fff);
  -webkit-app-region: drag;
  user-select: none;
}
`

export const MACOS_TITLEBAR_SCRIPT = `
(() => {
  const id = ${JSON.stringify(MACOS_TITLEBAR_ELEMENT_ID)};
  if (document.getElementById(id) !== null) return;
  const titlebar = document.createElement('div');
  titlebar.id = id;
  titlebar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(titlebar);
})();
`

export interface WindowAppearanceWebContents {
  insertCSS(
    css: string,
    options?: { cssOrigin?: 'author' | 'user' },
  ): Promise<string>
  executeJavaScript(code: string): Promise<unknown>
}

export function windowAppearanceForPlatform(
  platform: NodeJS.Platform,
): { titleBarStyle?: 'hiddenInset' } {
  return platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : {}
}

export async function applyWindowAppearance(
  platform: NodeJS.Platform,
  webContents: WindowAppearanceWebContents,
): Promise<void> {
  if (platform !== 'darwin') {
    return
  }

  await Promise.all([
    webContents.insertCSS(MACOS_TITLEBAR_CSS, { cssOrigin: 'user' }),
    webContents.executeJavaScript(MACOS_TITLEBAR_SCRIPT),
  ])
}
