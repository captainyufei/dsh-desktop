import { describe, expect, it } from 'vitest'
import {
  classifyNavigation,
  registerMainFrameNavigationHandlers,
  type MainFrameNavigationListener,
} from '../src/navigation-policy.ts'

describe('navigation policy', () => {
  it.each([
    ['http://127.0.0.1:3080/', 'allow'],
    ['http://127.0.0.1:3080/session/1', 'allow'],
    ['https://example.com/docs', 'external'],
    ['http://localhost:9999/', 'external'],
    ['file:///etc/passwd', 'deny'],
    ['javascript:alert(1)', 'deny'],
    ['not a url', 'deny'],
  ] as const)('classifies %s', (raw, expected) => {
    expect(classifyNavigation(raw, 'http://127.0.0.1:3080')).toBe(expected)
  })

  it('compares origins exactly, including protocol and port', () => {
    expect(classifyNavigation('https://127.0.0.1:3080/path', 'http://127.0.0.1:3080')).toBe(
      'external',
    )
    expect(classifyNavigation('http://127.0.0.1:3081/path', 'http://127.0.0.1:3080')).toBe(
      'external',
    )
  })

  it.each(['data:text/html,hello', 'about:blank', 'http://[invalid', ''])(
    'denies non-http(s) or malformed navigation %s',
    (raw) => {
      expect(classifyNavigation(raw, 'http://127.0.0.1:3080')).toBe('deny')
    },
  )

  it('prevents an external redirect from replacing the Harness page and opens it externally', () => {
    let navigate: MainFrameNavigationListener | undefined
    let redirect: MainFrameNavigationListener | undefined
    const externalUrls: string[] = []
    registerMainFrameNavigationHandlers({
      onWillNavigate(listener) {
        navigate = listener
      },
      onWillRedirect(listener) {
        redirect = listener
      },
    }, {
      getHostOrigin: () => 'http://127.0.0.1:3080',
      openExternal: (url) => externalUrls.push(url),
    })

    expect(redirect).toBe(navigate)
    const event = {
      isMainFrame: true,
      prevented: false,
      preventDefault() {
        this.prevented = true
      },
    }
    redirect?.(event, 'https://example.com/after-302')

    expect(event.prevented).toBe(true)
    expect(externalUrls).toEqual(['https://example.com/after-302'])
  })

  it('denies a non-HTTP redirect without handing it to the operating system', () => {
    let redirect: MainFrameNavigationListener | undefined
    const externalUrls: string[] = []
    registerMainFrameNavigationHandlers({
      onWillNavigate() {},
      onWillRedirect(listener) {
        redirect = listener
      },
    }, {
      getHostOrigin: () => 'http://127.0.0.1:3080',
      openExternal: (url) => externalUrls.push(url),
    })

    const event = {
      isMainFrame: true,
      prevented: false,
      preventDefault() {
        this.prevented = true
      },
    }
    redirect?.(event, 'file:///tmp/redirected')

    expect(event.prevented).toBe(true)
    expect(externalUrls).toEqual([])
  })

  it('ignores redirects in subframes', () => {
    let redirect: MainFrameNavigationListener | undefined
    const externalUrls: string[] = []
    registerMainFrameNavigationHandlers({
      onWillNavigate() {},
      onWillRedirect(listener) {
        redirect = listener
      },
    }, {
      getHostOrigin: () => 'http://127.0.0.1:3080',
      openExternal: (url) => externalUrls.push(url),
    })

    const event = {
      isMainFrame: false,
      prevented: false,
      preventDefault() {
        this.prevented = true
      },
    }
    redirect?.(event, 'https://example.com/subframe-redirect')

    expect(event.prevented).toBe(false)
    expect(externalUrls).toEqual([])
  })
})
