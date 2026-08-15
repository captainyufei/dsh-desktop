import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync('website/index.html', 'utf8')
const css = readFileSync('website/site.css', 'utf8')
const demoCss = readFileSync('website/site-demo.css', 'utf8')
const config = readFileSync('website/site.config.js', 'utf8')
const script = readFileSync('website/site.js', 'utf8')
const i18n = readFileSync('website/site-i18n.js', 'utf8')
const deepseekLogo = readFileSync('build/deepseek-logo.svg', 'utf8')
const favicon = readFileSync('website/build/favicon-spectrum-v3.svg', 'utf8')
const rootRedirect = readFileSync('index.html', 'utf8')
const vercelConfig = JSON.parse(readFileSync('website/vercel.json', 'utf8'))

describe('landing page', () => {
  it('ships as a standalone static Vercel project while retaining the repository-root preview entry', () => {
    expect(vercelConfig).toMatchObject({
      framework: null,
      outputDirectory: '.',
      cleanUrls: true,
      trailingSlash: false,
    })
    expect(rootRedirect).toContain('window.location.replace(\'./website/\'')
    expect(rootRedirect).toContain('window.location.search + window.location.hash')
  })

  it('keeps the Chinese landing page focused on the product, downloads, and disclaimer', () => {
    expect(html).toContain('<html lang="zh-CN">')
    expect(html).toContain('DeepSeek Harness')
    expect(html).toContain('基于官方 DeepSeek Harness 构建的桌面端，开箱即用')
    expect(html).toContain('这是由社区维护的开源项目，并非 DeepSeek 官方产品。')
    expect(html).toContain('data-download="macArm64"')
    expect(html).toContain('data-download="windowsX64"')
    expect(html.match(/data-download=/g)).toHaveLength(2)
    expect(html).not.toContain('INTERACTIVE PRODUCT DEMO')
    expect(html).not.toContain('class="proof-strip"')
    expect(html).not.toContain('class="why-section"')
    expect(html).not.toContain('class="inside-section"')
    expect(html).not.toContain('class="download-section"')
    expect(html).not.toContain('class="faq-section"')
    expect(html).not.toContain('class="site-footer"')
  })

  it('keeps the hero focused on the two platform downloads and removes personal terminal details', () => {
    expect(html).toContain('class="hero-downloads reveal"')
    expect(html).toContain('data-i18n="downloadMac">下载 Mac 版</span>')
    expect(html).toContain('data-i18n="downloadWindows">下载 Windows 版</span>')
    expect(html).toContain('<span>dsh-desktop %</span>')
    expect(html).not.toContain('guoyufei')
    expect(html).not.toContain('MacBook-Pro')
  })

  it('identifies the community project in the upper-left brand instead of presenting the upstream name', () => {
    expect(html).toContain('data-site-brand')
    expect(html).toContain('class="brand-name">dsh-desktop</strong>')
    expect(html).toContain('github.com/captainyufei/dsh-desktop')
    expect(html).toContain('<span class="brand-mark" aria-hidden="true">\n          <img src="./build/favicon-spectrum-v3.svg" alt="" />')
    expect(html).toContain('captainyufei/dsh-desktop')
    expect(html).not.toContain('class="brand-name">deepseek</span>')
  })

  it('provides a shareable multilingual menu without mixing it into the default Chinese view', () => {
    for (const locale of ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'es', 'fr', 'de']) {
      expect(html).toContain(`data-locale="${locale}"`)
      expect(i18n).toContain(`code: '${locale}'`)
    }
    expect(html).toContain('data-i18n="heroTitle"')
    expect(html).toContain('data-language-trigger')
    expect(html).toContain('data-language-popover')
    expect(script).toContain('normalizeLocale')
    expect(script).toContain("url.searchParams.set('lang', activeLocale)")
    expect(i18n).toContain("heroTitle: 'Desktop'")
    expect(i18n).toContain("downloadMac: 'Download for Mac'")
    expect(i18n).toContain("demoSessionLog: 'セッションログ'")
    expect(i18n).toContain("demoExplorer: '탐색기'")
    expect(i18n).toContain("downloadWindows: 'Télécharger pour Windows'")
    expect(script).toContain("document.documentElement.lang = activeLocale")
    expect(script).toContain("window.history.pushState({ locale: activeLocale }")
  })

  it('aligns the GitHub project identity left and keeps language and repository actions on the right', () => {
    expect(css).toContain('left: max(var(--page-pad), calc((100vw - 1500px) / 2))')
    expect(css).toContain('right: max(var(--page-pad), calc((100vw - 1500px) / 2))')
    expect(css).toContain('justify-self: start')
    expect(css).toContain('.language-popover')
    expect(css).toContain('.header-tools')
  })

  it('uses this repository and keeps installers pending until the first release', () => {
    expect(config).toContain("version: '0.1.0'")
    expect(config).toContain("repositoryUrl: 'https://github.com/captainyufei/dsh-desktop'")
    expect(config).toContain('githubStars: 0')
    expect(config.match(/:\s*''/g)).toHaveLength(3)
  })

  it('supports responsive layouts and reduced motion', () => {
    expect(css).toContain('@media (max-width: 760px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('uses an original interactive fluid hero and a compact scroll header', () => {
    expect(html).toContain('data-hero-fluid')
    expect(html).toContain('data-hero-grid-field')
    expect(html).toContain('data-hero-symbol-field')
    expect(html).toContain('data-site-header')
    expect(script).toContain('initHeroFluidWebGL')
    expect(script).toContain("getContext('webgl2'")
    expect(script).toContain('createFramebuffer')
    expect(script).toContain('initHeroFluidFallback')
    expect(script).toContain('initHeroSymbolField')
    expect(script).toContain('initHeroGridField')
    expect(script).toContain('u_distortBoost')
    expect(script).toContain('u_swirlBoost')
    expect(script).toContain('const spacing = 90')
    expect(script).toContain('const pointerRadius = 140')
    expect(script).toContain('gl.uniform1f(flowUniforms.radius, 0.09)')
    expect(script).toContain('gl.uniform1f(fluidUniforms.distortBoost, 2.2)')
    expect(script).toContain('drawSymbolField')
    expect(script).toContain('distortPoint')
    expect(script).toContain("classList.toggle('is-scrolled'")
    expect(css).toContain('.hero-fluid')
    expect(css).toContain('.hero-symbol-field')
    expect(css).toContain('.site-header.is-scrolled')
  })

  it('uses the DSH multicolor identity for the whale mark and its particle field', () => {
    expect(deepseekLogo).toContain('id="dsh-spectrum"')
    for (const color of ['#FF3D81', '#FF7A45', '#FFD84D', '#22D3A7', '#3291FF', '#9B5CFF']) {
      expect(deepseekLogo).toContain(color)
    }
    expect(script).toContain('DSH_LOGO_PALETTE')
    expect(script).toContain('getDshLogoRgb')
  })

  it('uses a high-contrast multicolor favicon that remains distinct at tab size', () => {
    expect(html).toContain('href="./build/favicon-spectrum-v3.svg"')
    expect(html.match(/src="\.\/build\/favicon-spectrum-v3\.svg"/g)).toHaveLength(4)
    expect(html).not.toContain('src="./build/deepseek-logo.svg"')
    expect(favicon).toContain('id="favicon-spectrum"')
    for (const color of ['#FF3D81', '#FF7A45', '#FFD84D', '#22D3A7', '#3291FF', '#9B5CFF']) {
      expect(favicon).toContain(color)
    }
    expect(favicon).toContain('fill="#FFFFFF"')
  })

  it('renders the client as an interactive DOM component instead of a screenshot', () => {
    expect(html).toContain('<link rel="stylesheet" href="site-demo.css" />')
    expect(html).toContain('data-dsh-demo')
    expect(html).toContain('data-demo-view-trigger="trace"')
    expect(html).toContain('class="dsh-demo-explorer"')
    expect(html).toContain('class="dsh-demo-terminal"')
    expect(html).toContain('data-demo-message-form')
    expect(html).not.toContain('hero-client-screenshot')
    expect(html).not.toContain('site-assets/dsh-desktop-client-hero.jpg')
  })

  it('keeps one hello session while chat and trace remain independent views', () => {
    expect(html.match(/data-demo-session="hello"/g)).toHaveLength(1)
    expect(html).not.toContain('data-i18n="demoBuildHomepage"')
    expect(html).toContain('data-demo-view-trigger="chat"')
    expect(html).toContain('data-demo-view-trigger="trace"')
    expect(script).toContain("view === 'chat' || view === 'trace'")
  })

  it('keeps the demo geometry and icons aligned with the desktop client sources', () => {
    expect(html).toContain('class="dsh-tab-list"')
    expect(html).toContain('class="dsh-panel-rail"')
    expect(html).toContain('class="dsh-composer-send"')
    expect(html).toContain('class="dsh-context-label"')
    expect(demoCss).toContain('width: min(40.625cqw')
    expect(demoCss).toContain('height: 1.9792cqw')
    expect(demoCss).toContain('height: 1.7708cqw')
    expect(demoCss).toContain('.dsh-panel-toggles .dsh-panel-rail')
    expect(css).toContain('.dsh-context-line > .dsh-context-label')
  })

  it('models the real trajectory toolbar, timeline, and event ledger', () => {
    expect(html).toContain('data-demo-trace-duration')
    expect(html).toContain('data-demo-trace-turns')
    expect(html).toContain('data-demo-trace-calls')
    expect(html).toContain('data-demo-trace-timeline')
    expect(html).toContain('data-demo-trace-search')
    expect(html).toContain('aria-label="轨迹事件明细"')
    expect(demoCss).toContain('height: 1.6667cqw')
    expect(demoCss).toContain('height: 2.6042cqw')
    expect(script).toContain("demoTraceView.dataset[stateKey]")
  })

  it('keeps source-sized panel toggles fixed while the canvas owns pointer motion', () => {
    expect(demoCss).toContain('--dsh-sidebar-width: 2.9167%')
    expect(demoCss).toContain('.dsh-demo-shell > .dsh-panel-toggles')
    expect(demoCss).toContain('container: dsh-product-stage / inline-size')
    expect(demoCss).toContain('border-radius: 0.8333cqw')
    expect(demoCss).toContain('width: 1.6667cqw')
    expect(demoCss).toContain('width: 0.9375cqw')
    expect(demoCss).toContain('transform: none !important')
    expect(script).not.toContain("setProperty('--stage-x'")
    expect(script).toContain('pointer.energy')
    expect(script).toContain('wakes.push')
  })

  it('keeps the desktop workbench controls interactive', () => {
    expect(html).toContain('data-demo-toggle-sidebar')
    expect(html).toContain('data-demo-toggle-explorer')
    expect(html).toContain('data-demo-toggle-terminal')
    expect(html).toContain('data-demo-session-log')
    expect(html).toContain('data-demo-open-file="README.md"')
    expect(script).toContain('dataset.sidebarCollapsed')
    expect(script).toContain('dataset.explorerCollapsed')
    expect(script).toContain('dataset.terminalCollapsed')
    expect(script).toContain("link.download = 'dsh-session-demo.json'")
  })
})
