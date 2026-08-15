export type NavigationDecision = 'allow' | 'external' | 'deny'

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
