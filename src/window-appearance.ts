export const MACOS_TITLEBAR_HEIGHT = 38
export const MACOS_TITLEBAR_ELEMENT_ID = 'dsh-desktop-titlebar'

export const MACOS_TITLEBAR_CSS = `
:root {
  --dsh-desktop-titlebar-height: ${MACOS_TITLEBAR_HEIGHT}px;
  --dsh-desktop-titlebar-main-background: var(--dsw-alias-bg-base, #fff);
  --dsh-desktop-titlebar-sidebar-width: 0px;
  --dsh-desktop-titlebar-sidebar-background: var(--dsh-desktop-titlebar-main-background);
  --dsh-desktop-titlebar-sidebar-divider: transparent;
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
  background: var(--dsh-desktop-titlebar-main-background);
  -webkit-app-region: drag;
  user-select: none;
}

#${MACOS_TITLEBAR_ELEMENT_ID}::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  box-sizing: border-box;
  width: var(--dsh-desktop-titlebar-sidebar-width);
  background: var(--dsh-desktop-titlebar-sidebar-background);
  border-right: 1px solid var(--dsh-desktop-titlebar-sidebar-divider);
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

  const titlebarHeight = ${MACOS_TITLEBAR_HEIGHT};
  const isVisibleBackground = (value) =>
    value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)';
  let observedSidebar = null;
  let updateScheduled = false;

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());

  const update = () => {
    updateScheduled = false;
    const sampleY = Math.min(titlebarHeight + 1, window.innerHeight - 1);
    const candidates = document.elementsFromPoint(1, sampleY)
      .filter((element) => element !== titlebar)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, rect, style: getComputedStyle(element) };
      })
      .filter(({ rect, style }) =>
        rect.left <= 0.5
        && rect.width >= 40
        && rect.width < window.innerWidth - 80
        && rect.height >= Math.max(200, (window.innerHeight - titlebarHeight) / 2)
        && isVisibleBackground(style.backgroundColor));

    const borderedCandidate = candidates.find(({ style }) =>
      Number.parseFloat(style.borderRightWidth) > 0);
    const sidebar = borderedCandidate ?? candidates[0] ?? null;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    titlebar.style.setProperty(
      '--dsh-desktop-titlebar-main-background',
      isVisibleBackground(bodyBackground)
        ? bodyBackground
        : 'var(--dsw-alias-bg-base, #fff)',
    );

    if (sidebar === null) {
      titlebar.style.setProperty('--dsh-desktop-titlebar-sidebar-width', '0px');
      if (observedSidebar !== null) {
        resizeObserver.unobserve(observedSidebar);
        observedSidebar = null;
      }
      return;
    }

    const sidebarWidth = Math.max(0, Math.min(window.innerWidth, sidebar.rect.right));
    titlebar.style.setProperty('--dsh-desktop-titlebar-sidebar-width', sidebarWidth + 'px');
    titlebar.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-background',
      sidebar.style.backgroundColor,
    );
    titlebar.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-divider',
      Number.parseFloat(sidebar.style.borderRightWidth) > 0
        ? sidebar.style.borderRightColor
        : 'rgba(127, 127, 127, 0.18)',
    );

    if (observedSidebar !== sidebar.element) {
      if (observedSidebar !== null) resizeObserver.unobserve(observedSidebar);
      observedSidebar = sidebar.element;
      resizeObserver.observe(observedSidebar);
    }
  };

  function scheduleUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(update);
  }

  resizeObserver.observe(document.body);
  window.addEventListener('resize', scheduleUpdate);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', scheduleUpdate);
  const themeObserver = new MutationObserver(scheduleUpdate);
  const themeObserverOptions = {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme'],
  };
  themeObserver.observe(document.documentElement, themeObserverOptions);
  themeObserver.observe(document.body, themeObserverOptions);
  const root = document.getElementById('root');
  if (root !== null) themeObserver.observe(root, themeObserverOptions);
  scheduleUpdate();
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
