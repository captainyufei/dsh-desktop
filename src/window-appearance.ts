export const MACOS_TITLEBAR_HEIGHT = 44
export const MACOS_TITLEBAR_ELEMENT_ID = 'dsh-desktop-titlebar'
export const MACOS_SIDEBAR_TOGGLE_ELEMENT_ID = 'dsh-desktop-sidebar-toggle'
export const MACOS_COMPACT_BRAND_ELEMENT_ID = 'dsh-desktop-compact-brand'

export const MACOS_TITLEBAR_CSS = `
:root {
  --dsh-desktop-titlebar-height: ${MACOS_TITLEBAR_HEIGHT}px;
  --dsh-desktop-titlebar-main-background: var(--dsw-alias-bg-base, #fff);
  --dsh-desktop-titlebar-sidebar-width: 0px;
  --dsh-desktop-details-width: 0px;
  --dsh-desktop-toolbar-safe-left: 120px;
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
  z-index: 2147483645;
  height: var(--dsh-desktop-titlebar-height);
  background: var(--dsh-desktop-titlebar-main-background);
  box-shadow: inset 0 -1px color-mix(in srgb, currentColor 10%, transparent);
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
  top: calc((var(--dsh-desktop-titlebar-height) - 28px) / 2);
  left: 84px;
  z-index: 1;
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: var(--dsh-desktop-toolbar-control-color) !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 7px;
  box-shadow: none !important;
  cursor: pointer;
  opacity: 0.72;
  -webkit-app-region: no-drag;
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}:hover {
  color: var(--dsw-alias-label-primary, currentColor);
  background: transparent !important;
  opacity: 1;
}

#${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID}:active {
  background: color-mix(in srgb, currentColor 10%, transparent) !important;
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

#root [data-dsh-desktop-original-sidebar-toggle] {
  visibility: hidden !important;
  pointer-events: none !important;
}

#root [data-dsh-desktop-main-header] {
  position: fixed !important;
  inset: 0 var(--dsh-desktop-details-width) auto max(
    var(--dsh-desktop-titlebar-sidebar-width),
    var(--dsh-desktop-toolbar-safe-left)
  ) !important;
  z-index: 2147483646 !important;
  display: grid !important;
  grid-template-columns: minmax(0, max-content) max-content minmax(20px, 1fr) max-content !important;
  grid-template-rows: var(--dsh-desktop-titlebar-height) !important;
  column-gap: 18px !important;
  box-sizing: border-box !important;
  width: auto !important;
  height: var(--dsh-desktop-titlebar-height) !important;
  min-height: var(--dsh-desktop-titlebar-height) !important;
  padding: 0 16px 0 20px !important;
  overflow: hidden !important;
  background: var(--dsw-alias-bg-base, #fff) !important;
  border: 0 !important;
  box-shadow: none !important;
  -webkit-app-region: drag;
}

#root [data-dsh-desktop-main-title-row] {
  display: contents !important;
}

#root [data-dsh-desktop-main-title-cluster] {
  grid-column: 1 !important;
  grid-row: 1 !important;
  min-width: 0 !important;
  height: var(--dsh-desktop-titlebar-height) !important;
  gap: 10px !important;
  overflow: hidden !important;
}

#root [data-dsh-desktop-main-tabs] {
  grid-column: 2 !important;
  grid-row: 1 !important;
  align-self: stretch !important;
  display: flex !important;
  align-items: stretch !important;
  gap: 18px !important;
  height: var(--dsh-desktop-titlebar-height) !important;
  margin: 0 !important;
  padding: 0 !important;
  -webkit-app-region: no-drag;
}

#root [data-dsh-desktop-main-tabs] > button {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 42px !important;
  height: var(--dsh-desktop-titlebar-height) !important;
  padding: 1px 6px 0 !important;
  border-radius: 7px 7px 0 0 !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  -webkit-app-region: no-drag !important;
}

#root [data-dsh-desktop-main-tabs] > button:hover {
  background: color-mix(in srgb, currentColor 6%, transparent) !important;
}

#root [data-dsh-desktop-main-utilities] {
  grid-column: 4 !important;
  grid-row: 1 !important;
  align-self: center !important;
  height: 30px !important;
  margin: 0 !important;
  -webkit-app-region: no-drag;
}

#root [data-dsh-desktop-main-header] button,
#root [data-dsh-desktop-main-header] a,
#root [data-dsh-desktop-main-header] input,
#root [data-dsh-desktop-main-header] [role='button'] {
  pointer-events: auto !important;
  -webkit-app-region: no-drag !important;
}

#root [data-dsh-desktop-frame-collapsed] {
  grid-template-columns: 0 minmax(0, 1fr) var(--dsh-desktop-details-width) !important;
}

#root [data-dsh-desktop-frame-collapsed] > [data-dsh-desktop-sidebar-column] {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
  border-right: 0 !important;
  pointer-events: none !important;
}

@media (prefers-reduced-motion: no-preference) {
  #${MACOS_SIDEBAR_TOGGLE_ELEMENT_ID} {
    transition: color 120ms ease, opacity 120ms ease, transform 80ms ease;
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
  let shellFrame = null;
  let sidebarColumn = null;
  let detailsColumn = null;
  let sidebarTransition = null;
  let sidebarTransitionTimer = null;
  let updateScheduled = false;

  const root = document.getElementById('root');

  const isSidebarToggle = (button) => {
    const label = button.getAttribute('aria-label') ?? '';
    return label.includes('侧边栏') || /sidebar/i.test(label);
  };

  const indicatesCollapsedSidebar = (label) =>
    label.includes('展开侧边栏')
    || label.includes('打开侧边栏')
    || label.includes('显示侧边栏')
    || /(?:show|open|expand) sidebar/i.test(label);

  const getDetailsWidth = (frame, column) => {
    const authoredColumns = frame?.style.gridTemplateColumns ?? '';
    const authoredWidth = authoredColumns.match(/([0-9]+(?:[.][0-9]+)?)px[ ]*$/)?.[1];
    if (authoredWidth !== undefined) {
      return Number.parseFloat(authoredWidth);
    }
    return column?.getBoundingClientRect().width ?? 0;
  };

  const beginSidebarTransition = (direction) => {
    sidebarTransition = direction;
    document.documentElement.setAttribute('data-dsh-desktop-sidebar-transition', direction);
    if (sidebarTransitionTimer !== null) {
      window.clearTimeout(sidebarTransitionTimer);
    }
    sidebarTransitionTimer = window.setTimeout(() => {
      sidebarTransition = null;
      sidebarTransitionTimer = null;
      document.documentElement.removeAttribute('data-dsh-desktop-sidebar-transition');
      scheduleUpdate();
    }, 260);
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
        mainHeader.querySelectorAll('[data-dsh-desktop-main-tabs], [data-dsh-desktop-main-title-row], [data-dsh-desktop-main-title-cluster], [data-dsh-desktop-main-utilities]')
          .forEach((element) => {
            for (const attribute of Array.from(element.attributes)) {
              if (attribute.name.startsWith('data-dsh-desktop-main-')) {
                element.removeAttribute(attribute.name);
              }
            }
          });
      }
      mainHeader = nextMainHeader;
    }
    if (mainHeader !== null) {
      mainHeader.setAttribute('data-dsh-desktop-main-header', '');
      const tabs = conversationTab?.parentElement ?? null;
      const titleRow = Array.from(mainHeader.children)
        .find((element) => element !== tabs && element.contains(tabs) === false) ?? null;
      const titleCluster = titleRow?.firstElementChild ?? null;
      const utilities = titleRow?.lastElementChild ?? null;
      tabs?.setAttribute('data-dsh-desktop-main-tabs', '');
      titleRow?.setAttribute('data-dsh-desktop-main-title-row', '');
      titleCluster?.setAttribute('data-dsh-desktop-main-title-cluster', '');
      if (utilities !== titleCluster) {
        utilities?.setAttribute('data-dsh-desktop-main-utilities', '');
      }
    }
  };

  sidebarToggle.addEventListener('click', () => {
    if (originalSidebarToggle === null) return;
    const opening = indicatesCollapsedSidebar(
      originalSidebarToggle.getAttribute('aria-label') ?? '',
    );
    beginSidebarTransition(opening ? 'opening' : 'closing');
    if (opening) {
      shellFrame?.removeAttribute('data-dsh-desktop-frame-collapsed');
    }
    originalSidebarToggle.click();
    scheduleUpdate();
  });

  const syncObservedSidebarWidth = () => {
    if (observedSidebar === null) return;
    const toggleLabel = originalSidebarToggle?.getAttribute('aria-label') ?? '';
    const sidebarWidth = Math.max(
      0,
      Math.min(window.innerWidth, observedSidebar.getBoundingClientRect().right),
    );
    if (
      sidebarTransition === null
      && (sidebarWidth < 100 || indicatesCollapsedSidebar(toggleLabel))
    ) return;
    document.documentElement.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-width',
      sidebarWidth + 'px',
    );
  };

  const resizeObserver = new ResizeObserver(() => {
    syncObservedSidebarWidth();
    scheduleUpdate();
  });

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
      if (
        sidebarTransition === 'opening'
        && shellFrame?.isConnected === true
        && sidebarColumn?.isConnected === true
      ) {
        shellFrame.removeAttribute('data-dsh-desktop-frame-collapsed');
        document.documentElement.style.setProperty(
          '--dsh-desktop-titlebar-sidebar-width',
          Math.max(0, sidebarColumn.getBoundingClientRect().right) + 'px',
        );
        compactBrand.hidden = true;
        return;
      }
      if (
        sidebarTransition === 'closing'
        && shellFrame?.isConnected === true
        && sidebarColumn?.isConnected === true
      ) {
        shellFrame.removeAttribute('data-dsh-desktop-frame-collapsed');
        document.documentElement.style.setProperty(
          '--dsh-desktop-titlebar-sidebar-width',
          Math.max(0, sidebarColumn.getBoundingClientRect().right) + 'px',
        );
        compactBrand.hidden = true;
        return;
      }
      const toggleLabel = originalSidebarToggle?.getAttribute('aria-label') ?? '';
      const sidebarCollapsed = indicatesCollapsedSidebar(toggleLabel);
      if (
        sidebarCollapsed
        && shellFrame?.isConnected === true
        && sidebarColumn?.isConnected === true
      ) {
        shellFrame.setAttribute('data-dsh-desktop-frame-collapsed', '');
        sidebarColumn.setAttribute('data-dsh-desktop-sidebar-column', '');
        const detailsWidth = getDetailsWidth(shellFrame, detailsColumn);
        document.documentElement.style.setProperty('--dsh-desktop-titlebar-sidebar-width', '0px');
        document.documentElement.style.setProperty(
          '--dsh-desktop-details-width',
          Math.max(0, detailsWidth) + 'px',
        );
        compactBrand.hidden = true;
        return;
      }
      document.documentElement.style.setProperty('--dsh-desktop-titlebar-sidebar-width', '0px');
      document.documentElement.style.setProperty('--dsh-desktop-details-width', '0px');
      compactBrand.hidden = true;
      shellFrame?.removeAttribute('data-dsh-desktop-frame-collapsed');
      sidebarColumn?.removeAttribute('data-dsh-desktop-sidebar-column');
      shellFrame = null;
      sidebarColumn = null;
      detailsColumn = null;
      if (observedSidebar !== null) {
        resizeObserver.unobserve(observedSidebar);
        observedSidebar = null;
      }
      return;
    }

    const toggleLabel = originalSidebarToggle?.getAttribute('aria-label') ?? '';
    const nextFrame = (() => {
      let element = sidebar.element.parentElement;
      while (element !== null && element !== root) {
        if (getComputedStyle(element).display === 'grid' && element.children.length >= 2) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    })();
    const nextSidebarColumn = nextFrame === null
      ? null
      : Array.from(nextFrame.children).find((element) => element.contains(sidebar.element)) ?? null;
    const measuredSidebarWidth = Math.max(
      0,
      Math.min(
        window.innerWidth,
        nextSidebarColumn?.getBoundingClientRect().right ?? sidebar.rect.right,
      ),
    );
    const sidebarCollapsed = sidebarTransition === null && (
      measuredSidebarWidth < 100 || indicatesCollapsedSidebar(toggleLabel)
    );
    const flowColumns = nextFrame === null
      ? []
      : Array.from(nextFrame.children).filter((element) => {
        const position = getComputedStyle(element).position;
        return position !== 'absolute' && position !== 'fixed';
      });
    const nextDetailsColumn = flowColumns.length >= 3
      ? flowColumns.at(-1) ?? null
      : null;
    const detailsWidth = getDetailsWidth(nextFrame, nextDetailsColumn);

    if (shellFrame !== nextFrame) {
      shellFrame?.removeAttribute('data-dsh-desktop-frame-collapsed');
      shellFrame = nextFrame;
    }
    if (sidebarColumn !== nextSidebarColumn) {
      sidebarColumn?.removeAttribute('data-dsh-desktop-sidebar-column');
      sidebarColumn = nextSidebarColumn;
    }
    detailsColumn = nextDetailsColumn;
    sidebarColumn?.setAttribute('data-dsh-desktop-sidebar-column', '');
    if (sidebarCollapsed) {
      shellFrame?.setAttribute('data-dsh-desktop-frame-collapsed', '');
    } else {
      shellFrame?.removeAttribute('data-dsh-desktop-frame-collapsed');
    }

    const sidebarWidth = sidebarCollapsed ? 0 : measuredSidebarWidth;
    compactBrand.hidden = true;
    document.documentElement.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-width',
      sidebarWidth + 'px',
    );
    document.documentElement.style.setProperty(
      '--dsh-desktop-details-width',
      Math.max(0, detailsWidth) + 'px',
    );
    document.documentElement.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-background',
      sidebar.style.backgroundColor,
    );
    document.documentElement.style.setProperty(
      '--dsh-desktop-titlebar-sidebar-divider',
      Number.parseFloat(sidebar.style.borderRightWidth) > 0
        ? sidebar.style.borderRightColor
        : 'rgba(127, 127, 127, 0.18)',
    );

    const nextObservedSidebar = nextSidebarColumn ?? sidebar.element;
    if (observedSidebar !== nextObservedSidebar) {
      if (observedSidebar !== null) resizeObserver.unobserve(observedSidebar);
      observedSidebar = nextObservedSidebar;
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
    || node.closest('header') !== null
    || node.querySelector('header, button[aria-label*="侧边栏"], button[aria-label*="sidebar" i]') !== null
  );
  if (root !== null) {
    new MutationObserver((records) => {
      const shellChanged = originalSidebarToggle?.isConnected === false
        || mainHeader?.isConnected === false
        || records.some((record) =>
          record.target === shellFrame
          || record.target === sidebarColumn
          || record.target === detailsColumn
          || containsShellControls(record.target)
          || [...record.addedNodes, ...record.removedNodes].some(containsShellControls));
      if (shellChanged) scheduleUpdate();
    }).observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'class',
        'style',
        'aria-label',
        'aria-hidden',
        'data-details-collapsed',
        'data-sidebar-collapsed',
      ],
    });
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
): {
  titleBarStyle?: 'hiddenInset'
  trafficLightPosition?: { x: number; y: number }
} {
  return platform === 'darwin'
    ? {
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 15 },
      }
    : {}
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
