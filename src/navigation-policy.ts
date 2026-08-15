export type NavigationDecision = 'allow' | 'external' | 'deny'

export interface CancellableNavigationEvent {
  readonly isMainFrame?: boolean
  preventDefault(): void
}

export type MainFrameNavigationListener = (
  event: CancellableNavigationEvent,
  url: string,
) => void

export interface MainFrameNavigationRegistrations {
  onWillNavigate(listener: MainFrameNavigationListener): void
  onWillRedirect(listener: MainFrameNavigationListener): void
}

export interface MainFrameNavigationOptions {
  getHostOrigin(): string | undefined
  openExternal(url: string): void
}

/**
 * Classify a navigation without importing Electron-specific URL handling.
 *
 * A navigation is internal only when its URL origin is exactly the host
 * origin. Other HTTP(S) URLs are external; every other scheme or malformed
 * URL is denied.
 */
export function classifyNavigation(raw: string, hostOrigin: string): NavigationDecision {
  let target: URL
  let host: URL

  try {
    target = new URL(raw)
    host = new URL(hostOrigin)
  } catch {
    return 'deny'
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return 'deny'
  }

  return target.origin === host.origin ? 'allow' : 'external'
}

/** Apply one exact-origin policy to direct navigations and server redirects. */
export function registerMainFrameNavigationHandlers(
  registrations: MainFrameNavigationRegistrations,
  options: MainFrameNavigationOptions,
): void {
  const handleNavigation: MainFrameNavigationListener = (event, url) => {
    if (event.isMainFrame === false) {
      return
    }
    const hostOrigin = options.getHostOrigin()
    if (hostOrigin === undefined) {
      event.preventDefault()
      return
    }

    const decision = classifyNavigation(url, hostOrigin)
    if (decision === 'allow') {
      return
    }

    event.preventDefault()
    if (decision === 'external') {
      options.openExternal(url)
    }
  }

  registrations.onWillNavigate(handleNavigation)
  registrations.onWillRedirect(handleNavigation)
}
