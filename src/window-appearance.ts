export const MACOS_TITLEBAR_HEIGHT = 38
export const MACOS_TITLEBAR_ELEMENT_ID = 'dsh-desktop-titlebar'
export const MACOS_SIDEBAR_TOGGLE_ELEMENT_ID = 'dsh-desktop-sidebar-toggle'
export const MACOS_COMPACT_BRAND_ELEMENT_ID = 'dsh-desktop-compact-brand'

export const MACOS_TITLEBAR_CSS = `
:root {
  --dsh-desktop-titlebar-height: ${MACOS_TITLEBAR_HEIGHT}px;
  --dsh-desktop-titlebar-main-background: var(--dsw-alias-bg-base, #fff);
  --dsh-desktop-titlebar-sidebar-width: 0px;
  --dsh-desktop-titlebar-sidebar-background: var(--dsh-desktop-titlebar-main-background);
  --dsh-desktop-titlebar-sidebar-divider: transparent;
  --dsh-desktop-toolbar-control-color: var(--dsw-alias-label-secondary, currentColor);
}

body {
  box-sizing: border-box;
  padding-top: var(--dsh-desktop-titlebar-height) !important;
  background: var(--dsw-alias-bg-base, #fff) !important;
  -webkit-font-smoothing: antialiased;
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

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID} {
  position: absolute;
  top: 5px;
  left: 84px;
  z-index: 1;
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: var(--dsh-desktop-toolbar-control-color);
  background: transparent;
  border: 0;
  border-radius: 7px;
  cursor: default;
  -webkit-app-region: no-drag;
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}:hover {
  color: var(--dsw-alias-label-primary, currentColor);
  background: color-mix(in srgb, currentColor 10%, transparent);
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}:active {
  transform: scale(0.96);
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}:focus-visible {
  outline: 2px solid var(--dsw-alias-accent-primary, Highlight);
  outline-offset: 1px;
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}[hidden],
#${MACOS_COMPACT_BRAND_ELEMENT_ID}[hidden] {
  display: none !important;
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID} svg {
  width: 16px;
  height: 16px;
}

#${MACOS_COMPACT_BRAND_ELEMENT_ID} {
  position: fixed;
  top: 50px;
  left: 10px;
  z-index: 2147483646;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  pointer-events: none;
  user-select: none;
}

#${MACOS_COMPACT_BRAND_ELEMENT_ID} img {
  display: block;
  width: 24px;
  height: 24px;
}

#root [data-dsh-desktop-original-sidebar-toggle] {
  visibility: hidden !important;
  pointer-events: none !important;
}

#root [data-dsh-desktop-main-header] {
  padding-left: 28px !important;
  background: var(--dsw-alias-bg-base, #fff) !important;
  border-bottom: 1px solid color-mix(in srgb, currentColor 9%, transparent) !important;
}

#root [data-dsh-desktop-main-tabs] {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: no-preference) {
  #${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID} {
    transition: color 120ms ease, background-color 120ms ease, transform 80ms ease;
  }
}
`

export const MACOS_TITLEBAR_SCRIPT = `
(() => {
  const id = ${JSON.stringify(MACOS_TITLEBAR_ELEMENT_ID)};
  if (document.getElementById(id) !== null) return;
  const titlebar = document.createElement('div');
  titlebar.id = id;
  titlebar.setAttribute('role', 'presentation');

  const sidebarToggle = document.createElement('button');
  sidebarToggle.id = ${JSON.stringify(MACOS_SIDEBAR_TOGGLE_ELEMENT_ID)};
  sidebarToggle.type = 'button';
  sidebarToggle.hidden = true;
  titlebar.appendChild(sidebarToggle);
  document.body.appendChild(titlebar);

  const compactBrand = document.createElement('div');
  compactBrand.id = ${JSON.stringify(MACOS_COMPACT_BRAND_ELEMENT_ID)};
  compactBrand.setAttribute('aria-hidden', 'true');
  compactBrand.hidden = true;
  const favicon = document.querySelector('link[rel~="icon"]');
  if (favicon instanceof HTMLLinkElement) {
    const compactBrandImage = document.createElement('img');
    compactBrandImage.src = favicon.href;
    compactBrandImage.alt = '';
    compactBrand.appendChild(compactBrandImage);
  }
  document.body.appendChild(compactBrand);

  const titlebarHeight = ${MACOS_TITLEBAR_HEIGHT};
  const isVisibleBackground = (value) =>
    value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)';
  let observedSidebar = null;
  let originalSidebarToggle = null;
  let mainHeader = null;
  let updateScheduled = false;

  const root = document.getElementById('root');

  const isSidebarToggle = (button) => {
    const label = button.getAttribute('aria-label') ?? '';
    return label.includes('侧边栏') || /sidebar/i.test(label);
  };

  const syncInterfaceControls = () => {
    const buttons = root === null ? [] : Array.from(root.querySelectorAll('button'));
    const nextSidebarToggle = buttons.find(isSidebarToggle) ?? null;
    if (nextSidebarToggle !== originalSidebarToggle) {
      if (originalSidebarToggle !== null) {
        originalSidebarToggle.removeAttribute('data-dsh-desktop-original-sidebar-toggle');
      }
      originalSidebarToggle = nextSidebarToggle;
    }

    if (originalSidebarToggle === null) {
      sidebarToggle.hidden = true;
    } else {
      originalSidebarToggle.setAttribute('data-dsh-desktop-original-sidebar-toggle', '');
      const label = originalSidebarToggle.getAttribute('aria-label') ?? '切换侧边栏';
      if (sidebarToggle.dataset.sourceLabel !== label) {
        sidebarToggle.dataset.sourceLabel = label;
        sidebarToggle.setAttribute('aria-label', label);
        sidebarToggle.title = label;
        sidebarToggle.innerHTML = originalSidebarToggle.innerHTML;
      }
      titlebar.style.setProperty(
        '--dsh-desktop-toolbar-control-color',
        getComputedStyle(originalSidebarToggle).color,
      );
      sidebarToggle.hidden = false;
    }

    const conversationTab = buttons.find((button) => {
      const text = (button.textContent ?? '').trim().toLocaleLowerCase();
      return text === '对话' || text === 'chat' || text === 'conversation';
    });
    const nextMainHeader = conversationTab?.closest('header') ?? null;
    if (nextMainHeader !== mainHeader) {
      if (mainHeader !== null) {
        mainHeader.removeAttribute('data-dsh-desktop-main-header');
        mainHeader.querySelector('[data-dsh-desktop-main-tabs]')
          ?.removeAttribute('data-dsh-desktop-main-tabs');
      }
      mainHeader = nextMainHeader;
    }
    if (mainHeader !== null) {
      mainHeader.setAttribute('data-dsh-desktop-main-header', '');
      conversationTab?.parentElement?.setAttribute('data-dsh-desktop-main-tabs', '');
    }
  };

  sidebarToggle.addEventListener('click', () => originalSidebarToggle?.click());

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());

  const update = () => {
    updateScheduled = false;
    syncInterfaceControls();
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
      compactBrand.hidden = true;
      if (observedSidebar !== null) {
        resizeObserver.unobserve(observedSidebar);
        observedSidebar = null;
      }
      return;
    }

    const sidebarWidth = Math.max(0, Math.min(window.innerWidth, sidebar.rect.right));
    compactBrand.hidden = sidebarWidth >= 100 || compactBrand.childElementCount === 0;
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
  if (root !== null) themeObserver.observe(root, themeObserverOptions);
  const containsShellControls = (node) => node instanceof Element && (
    node.matches('header, button[aria-label*="侧边栏"], button[aria-label*="sidebar" i]')
    || node.querySelector('header, button[aria-label*="侧边栏"], button[aria-label*="sidebar" i]') !== null
  );
  if (root !== null) {
    new MutationObserver((records) => {
      const shellChanged = originalSidebarToggle?.isConnected === false
        || mainHeader?.isConnected === false
        || records.some((record) =>
          [...record.addedNodes, ...record.removedNodes].some(containsShellControls));
      if (shellChanged) scheduleUpdate();
    }).observe(root, { childList: true, subtree: true });
  }
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
