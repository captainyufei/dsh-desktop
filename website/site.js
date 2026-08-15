const config = window.DSH_SITE_CONFIG ?? {
  version: '0.1.0',
  repositoryUrl: 'https://github.com/captainyufei/dsh-desktop',
  githubStars: 0,
  upstreamUrl: 'https://github.com/deepseek-ai/deepseek-harness',
  downloadUrls: {},
}

const legacySiteMessages = Object.freeze({
  'zh-CN': Object.freeze({
    metaTitle: 'DSH Desktop — DeepSeek Harness 桌面端',
    metaDescription: '基于官方 DeepSeek Harness 构建的桌面端，开箱即用。',
    skipLink: '跳到主要内容',
    repositoryLabel: '在 GitHub 查看 dsh-desktop',
    languageSwitch: '语言切换',
    brandDesktop: '桌面端',
    heroTitle: '桌面端',
    heroLead: '基于官方 DeepSeek Harness 构建的桌面端，开箱即用',
    downloadGroup: '下载 DSH Desktop',
    downloadMac: '下载 Mac 版',
    downloadWindows: '下载 Windows 版',
    disclaimer: '这是由社区维护的开源项目，并非 DeepSeek 官方产品。',
    demoLabel: '可交互的 DSH Desktop 客户端演示组件',
    demoNewChat: '新会话',
    demoWorkspace: '工作区',
    demoHello: '你好',
    demoJustNow: '刚刚',
    demoSettings: '设置',
    demoTraceTitle: '本轮轨迹',
    demoStandardMode: '标准模式',
    demoChat: '对话',
    demoTrace: '轨迹',
    demoSessionLog: '会话日志',
    demoContextInjection: '上下文注入',
    demoThink: '思考 · 用户刚刚说“你好”，这是一句简单的问候……',
    demoGreeting: '你好！👋 我是你的 AI 助手，很高兴见到你。',
    demoHelpIntro: '我可以帮你处理很多事情，比如：',
    demoContentCreation: '内容创作：公众号文章、小红书笔记、短视频脚本、文案改写等',
    demoResearch: '数据调研：各平台热点分析、账号诊断、市场调研、竞品分析',
    demoDevelopment: '开发工作：阅读代码、修改文件、运行工具与验证结果',
    demoComposer: '给智能体发消息',
    demoWorkspaceWrite: '工作区写入',
    demoStats: '1 轮 · 1 步｜模型 7.9 秒｜首字响应 4.6 秒 · 56 字/秒｜缓存命中 0%',
    demoExplorer: '资源管理器',
    demoReadmeDescription: '基于官方 DeepSeek Harness 构建的桌面端，开箱即用。',
    demoTerminal: '终端 1',
    demoHostReady: 'Harness 已在 127.0.0.1 就绪',
    demoRun: '运行',
    demoExplore: '探索未至之境',
    demoDescribeTask: '描述你想完成的任务',
    demoAppearance: '外观',
    demoDarkMode: '深色模式',
    demoLightMode: '浅色模式',
    demoLanguage: '语言',
    demoSimplifiedChinese: '简体中文',
    demoWorkspacePermission: '工作区权限',
    demoSessionDownloaded: '演示会话日志已下载',
    demoTerminalVersion: '桌面演示版',
    demoTerminalDone: '演示命令已完成（未在本机执行）',
    demoAnalyzing: '正在分析你的演示消息…',
    demoMessageLocal: '消息只在这个演示组件中处理，不会发送到服务器。',
    downloadPending: '该版本安装包正在准备中，发布后这里会直接下载。',
    downloadPendingAria: '，安装包准备中',
    repositoryPending: '项目仓库地址尚未公开。',
  }),
  en: Object.freeze({
    metaTitle: 'DSH Desktop — DeepSeek Harness for Desktop',
    metaDescription: 'A ready-to-use desktop app built on the official DeepSeek Harness.',
    skipLink: 'Skip to main content',
    repositoryLabel: 'View dsh-desktop on GitHub',
    languageSwitch: 'Language',
    brandDesktop: 'Desktop',
    heroTitle: 'Desktop',
    heroLead: 'A ready-to-use desktop app built on the official DeepSeek Harness.',
    downloadGroup: 'Download DSH Desktop',
    downloadMac: 'Download for Mac',
    downloadWindows: 'Download for Windows',
    disclaimer: 'An open-source community project. Not an official DeepSeek product.',
    demoLabel: 'Interactive DSH Desktop client demo',
    demoNewChat: 'New chat',
    demoWorkspace: 'Workspace',
    demoHello: 'Hello',
    demoJustNow: 'Just now',
    demoSettings: 'Settings',
    demoTraceTitle: 'Current trace',
    demoStandardMode: 'Standard mode',
    demoChat: 'Chat',
    demoTrace: 'Trace',
    demoSessionLog: 'Session log',
    demoContextInjection: 'Context injection',
    demoThink: 'Think · The user just said “Hello”. This is a simple greeting…',
    demoGreeting: 'Hello! 👋 I’m your AI assistant. Great to meet you.',
    demoHelpIntro: 'I can help with many kinds of work, including:',
    demoContentCreation: 'Content: articles, social posts, video scripts, and rewrites',
    demoResearch: 'Research: trend analysis, account reviews, markets, and competitors',
    demoDevelopment: 'Development: read code, edit files, run tools, and verify results',
    demoComposer: 'Message the agent',
    demoWorkspaceWrite: 'Workspace Write',
    demoStats: '1 turn · 1 step | LLM 7.9s | first token 4.6s · 56 tok/s | cache hit 0%',
    demoExplorer: 'Explorer',
    demoReadmeDescription: 'A ready-to-use desktop app built on the official DeepSeek Harness.',
    demoTerminal: 'Terminal 1',
    demoHostReady: 'Harness host ready at 127.0.0.1',
    demoRun: 'Run',
    demoExplore: 'Explore the unknown',
    demoDescribeTask: 'Describe what you want to build',
    demoAppearance: 'Appearance',
    demoDarkMode: 'Dark mode',
    demoLightMode: 'Light mode',
    demoLanguage: 'Language',
    demoSimplifiedChinese: 'English',
    demoWorkspacePermission: 'Workspace permission',
    demoSessionDownloaded: 'Demo session log downloaded',
    demoTerminalVersion: 'desktop demo',
    demoTerminalDone: 'Demo command completed without running on your machine',
    demoAnalyzing: 'Analyzing your demo message…',
    demoMessageLocal: 'This message stays inside the demo and is not sent to a server.',
    downloadPending: 'This installer is being prepared and will download here once released.',
    downloadPendingAria: ', installer coming soon',
    repositoryPending: 'The project repository is not public yet.',
  }),
})

const localeDefinitions = window.DSH_SITE_LOCALES ?? Object.freeze([
  Object.freeze({ code: 'zh-CN', label: '简体中文' }),
  Object.freeze({ code: 'en', label: 'English' }),
])
const siteMessages = window.DSH_SITE_MESSAGES ?? legacySiteMessages
const supportedLocales = new Set(localeDefinitions.map(({ code }) => code))

function normalizeLocale(locale) {
  if (supportedLocales.has(locale)) return locale
  if (locale === 'zh' || locale?.toLowerCase() === 'zh-hans') return 'zh-CN'
  if (locale?.toLowerCase() === 'zh-hant') return 'zh-TW'
  return 'zh-CN'
}

function localeFromLocation() {
  return normalizeLocale(new URLSearchParams(window.location.search).get('lang'))
}

let activeLocale = localeFromLocation()
const demoViewTitleKeys = Object.freeze({ chat: 'demoHello', trace: 'demoTraceTitle', new: 'demoNewChat', settings: 'demoSettings' })

function translate(key) {
  return siteMessages[activeLocale]?.[key] ?? siteMessages['zh-CN'][key] ?? key
}

function applyLocale(locale, updateUrl = false) {
  activeLocale = normalizeLocale(locale)
  document.documentElement.lang = activeLocale
  document.title = translate('metaTitle')

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = translate(node.dataset.i18n)
  })

  document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', translate(node.dataset.i18nAriaLabel))
  })

  document.querySelectorAll('[data-i18n-content]').forEach((node) => {
    node.setAttribute('content', translate(node.dataset.i18nContent))
  })

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.setAttribute('placeholder', translate(node.dataset.i18nPlaceholder))
  })

  document.querySelectorAll('[data-locale]').forEach((button) => {
    const selected = button.dataset.locale === activeLocale
    if (button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', String(selected))
    if (button.getAttribute('role') === 'menuitemradio') button.setAttribute('aria-checked', String(selected))
  })

  const activeLocaleLabel = localeDefinitions.find(({ code }) => code === activeLocale)?.label ?? activeLocale
  document.querySelectorAll('[data-active-locale-label]').forEach((node) => {
    node.textContent = activeLocaleLabel
  })

  const stars = Number(config.githubStars)
  document.querySelectorAll('[data-github-stars]').forEach((node) => {
    node.title = `${stars.toLocaleString(activeLocale)} ${translate('githubStarsLabel')}`
  })

  const demo = document.querySelector('[data-dsh-demo]')
  const demoTitle = document.querySelector('[data-demo-title]')
  if (demo && demoTitle && demoViewTitleKeys[demo.dataset.demoView]) {
    demoTitle.textContent = translate(demoViewTitleKeys[demo.dataset.demoView])
  }

  if (updateUrl) {
    const url = new URL(window.location.href)
    if (activeLocale === 'zh-CN') url.searchParams.delete('lang')
    else url.searchParams.set('lang', activeLocale)
    window.history.pushState({ locale: activeLocale }, '', url)
  }
}

const languageMenu = document.querySelector('[data-language-menu]')
const languageTrigger = document.querySelector('[data-language-trigger]')
const languagePopover = document.querySelector('[data-language-popover]')

function setLanguageMenuOpen(open) {
  if (!languageTrigger || !languagePopover) return
  languageTrigger.setAttribute('aria-expanded', String(open))
  languagePopover.hidden = !open
  languageMenu?.classList.toggle('is-open', open)
}

languageTrigger?.addEventListener('click', () => {
  setLanguageMenuOpen(languageTrigger.getAttribute('aria-expanded') !== 'true')
})

document.querySelectorAll('[data-locale]').forEach((button) => {
  button.addEventListener('click', () => {
    applyLocale(button.dataset.locale, true)
    setLanguageMenuOpen(false)
    languageTrigger?.focus()
  })
})

document.addEventListener('click', (event) => {
  if (!languageMenu?.contains(event.target)) setLanguageMenuOpen(false)
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || languageTrigger?.getAttribute('aria-expanded') !== 'true') return
  setLanguageMenuOpen(false)
  languageTrigger.focus()
})

window.addEventListener('popstate', () => applyLocale(localeFromLocation()))
applyLocale(activeLocale)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const toast = document.querySelector('.toast')
let toastTimer

const siteHeader = document.querySelector('[data-site-header]')

function updateHeaderState() {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 36)
}

updateHeaderState()
window.addEventListener('scroll', updateHeaderState, { passive: true })

function initHeroFluidWebGL(motionEnabled = true) {
  const canvas = document.querySelector('[data-hero-fluid]')
  const hero = canvas?.closest('.hero')
  if (!canvas || !hero) return false

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return false

  const vertexSource = `#version 300 es
    layout(location = 0) in vec4 a_position;
    out vec2 vUv;
    void main() {
      vUv = a_position.xy * 0.5 + 0.5;
      gl_Position = a_position;
    }
  `

  const flowSource = `#version 300 es
    precision mediump float;
    in vec2 vUv;
    uniform sampler2D u_prev;
    uniform vec2 u_mouse;
    uniform vec2 u_velocity;
    uniform float u_brushRadius;
    uniform float u_brushStrength;
    uniform float u_decay;
    out vec4 fragColor;

    void main() {
      vec4 prev = texture(u_prev, vUv);
      prev.r *= u_decay;
      prev.gb = mix(vec2(0.5), prev.gb, u_decay);

      float dist = distance(vUv, u_mouse);
      float influence = exp(-dist * dist / (u_brushRadius * u_brushRadius * 0.5));
      influence = max(0.0, influence - 0.01);
      float speed = length(u_velocity);
      float presenceStrength = u_brushStrength * 0.3;
      float velBonus = min(speed * 3.0, 0.7) * u_brushStrength;
      float totalStrength = presenceStrength + velBonus;

      prev.r = max(prev.r, influence * totalStrength);
      float blendAmt = influence * min(totalStrength, 0.4) * 0.3;
      prev.g = mix(prev.g, clamp(u_velocity.x * 2.0 + 0.5, 0.0, 1.0), blendAmt);
      prev.b = mix(prev.b, clamp(u_velocity.y * 2.0 + 0.5, 0.0, 1.0), blendAmt);
      fragColor = prev;
    }
  `

  const fluidSource = `#version 300 es
    precision mediump float;
    in vec2 vUv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_c1, u_c2, u_c3, u_c4, u_c5;
    uniform float u_scale;
    uniform vec2 u_offset;
    uniform float u_grain;
    uniform sampler2D u_flowmap;
    uniform float u_distortBoost;
    uniform float u_swirlBoost;
    uniform float u_glowIntensity;
    uniform vec3 u_glowColor1;
    uniform vec3 u_glowColor2;
    uniform vec3 u_glowColor3;
    uniform vec2 u_lightPos;
    uniform float u_lightCore;
    uniform float u_lightHalo;
    uniform float u_vignette;
    uniform float u_bloomThreshold;
    uniform float u_bloomRange;
    uniform float u_bloomStrength;
    out vec4 fragColor;

    vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
    vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

    float snoise(vec3 v){
      const vec2 C=vec2(1./6.,1./3.);
      const vec4 D=vec4(0.,.5,1.,2.);
      vec3 i=floor(v+dot(v,C.yyy));
      vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);
      vec3 l=1.-g;
      vec3 i1=min(g.xyz,l.zxy);
      vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;
      vec3 x2=x0-i2+C.yyy;
      vec3 x3=x0-D.yyy;
      i=mod289v3(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
      float n_=.142857142857;
      vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z);
      vec4 y_=floor(j-7.*x_);
      vec4 x=x_*ns.x+ns.yyyy;
      vec4 y=y_*ns.x+ns.yyyy;
      vec4 h=1.-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);
      vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.+1.;
      vec4 s1=floor(b1)*2.+1.;
      vec4 sh=-step(h,vec4(0.));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
      vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
      vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
      m=m*m;
      return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    float hash(vec2 p){
      vec3 p3=fract(vec3(p.xyx)*.1031);
      p3+=dot(p3,p3.yzx+33.33);
      return fract((p3.x+p3.y)*p3.z);
    }

    float fbm(vec3 p){
      float v=0.,amp=.6;vec3 shift=vec3(100.);
      for(int i=0;i<1;i++){v+=amp*snoise(p);p=p*2.+shift;amp*=.4;}
      return v;
    }

    float fluidNoise(vec2 uv,float t){
      float n1=fbm(vec3(uv*.6,t*.06));
      float n2=fbm(vec3(uv*.6+5.2,t*.06+1.3));
      vec2 w1=vec2(n1,n2)*.6;
      float n3=fbm(vec3((uv+w1)*.7+1.7,t*.05+3.1));
      float n4=fbm(vec3((uv+w1)*.7+9.2,t*.05+5.7));
      vec2 w2=vec2(n3,n4)*.5;
      return fbm(vec3((uv+w1+w2)*.5,t*.04));
    }

    vec2 curlish(vec2 uv,float t){
      float eps=.02;
      float n=snoise(vec3(uv*.8,t));
      float nx=snoise(vec3((uv+vec2(eps,0.))*.8,t));
      float ny=snoise(vec3((uv+vec2(0.,eps))*.8,t));
      return vec2(-(ny-n)/eps,(nx-n)/eps)*.003;
    }

    void main(){
      float aspect=u_resolution.x/u_resolution.y;
      vec2 uv=gl_FragCoord.xy/u_resolution;
      vec2 suv=vec2(uv.x*aspect, uv.y) * u_scale + u_offset;
      float t=u_time;

      vec4 flow = texture(u_flowmap, uv);
      float influence = flow.r;
      vec2 flowDir = (flow.gb - 0.5) * 2.0;

      suv += flowDir * influence * u_distortBoost * 0.8;
      float swirlAngle = influence * u_swirlBoost * 2.5;
      float cs = cos(swirlAngle), sn = sin(swirlAngle);
      vec2 delta = suv - vec2(uv.x * aspect, uv.y) * u_scale;
      suv += (mat2(cs, sn, -sn, cs) * delta - delta) * influence;

      vec2 curl=curlish(suv,t*.04);
      vec2 uvD=suv+curl*12.;
      float f=fluidNoise(uvD,t);
      float swirl=snoise(vec3(uvD*.8+f*1.5,t*.035))*.5+.5;
      float n=f*.5+.5;
      vec3 col=mix(u_c1,u_c2,smoothstep(.2,.5,n));
      col=mix(col,u_c3,smoothstep(.35,.65,n+swirl*.25));
      col=mix(col,u_c4,smoothstep(.6,.85,swirl)*.55);
      col=mix(col,u_c5,smoothstep(.5,.8,n*swirl)*.35);

      float glow = smoothstep(0.0, 0.8, influence);
      float glowNoise = snoise(vec3(uvD * 1.5, t * 0.08)) * 0.5 + 0.5;
      float glowDist = smoothstep(0.0, 1.0, influence);
      vec3 glowMix = mix(u_glowColor3, u_glowColor2, glowDist);
      glowMix = mix(glowMix, u_glowColor1, glowDist * glowNoise);
      col = mix(col, glowMix, glow * u_glowIntensity);

      if(u_grain>0.0){
        vec2 flowOffset = (uvD - suv) * u_resolution.y;
        vec2 gp = floor((gl_FragCoord.xy + flowOffset) / 5.0);
        float gr=hash(gp)*2.-1.;
        col+=gr*u_grain;
      }

      float luma=dot(col,vec3(.299,.587,.114));
      float bloom=smoothstep(u_bloomThreshold-u_bloomRange,u_bloomThreshold+u_bloomRange,luma);
      col+=(col*.85+vec3(.15,.145,.13))*bloom*u_bloomStrength;

      float ld=length((uv-u_lightPos)*vec2(aspect,1.));
      float core=exp(-ld*ld*4.5);
      float halo=exp(-ld*1.8);
      col+=vec3(1.,.97,.9)*core*u_lightCore+vec3(.72,.8,1.)*halo*u_lightHalo;

      float vig=1.-smoothstep(.35,.75,length(uv-.5));
      col=mix(col*(1.-u_vignette),col,vig);
      fragColor=vec4(col,1.);
    }
  `

  function hexToRgb(hex) {
    const value = hex.replace('#', '')
    return [
      Number.parseInt(value.slice(0, 2), 16) / 255,
      Number.parseInt(value.slice(2, 4), 16) / 255,
      Number.parseInt(value.slice(4, 6), 16) / 255,
    ]
  }

  function compile(type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
    console.warn('Hero shader compilation failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  function createProgram(fragmentSource) {
    const vertex = compile(gl.VERTEX_SHADER, vertexSource)
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertex || !fragment) return null
    const program = gl.createProgram()
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
    console.warn('Hero shader link failed:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  const flowProgram = createProgram(flowSource)
  const fluidProgram = createProgram(fluidSource)
  if (!flowProgram || !fluidProgram) {
    const replacement = canvas.cloneNode(false)
    canvas.replaceWith(replacement)
    return false
  }

  const flowUniforms = {
    previous: gl.getUniformLocation(flowProgram, 'u_prev'),
    pointer: gl.getUniformLocation(flowProgram, 'u_mouse'),
    velocity: gl.getUniformLocation(flowProgram, 'u_velocity'),
    radius: gl.getUniformLocation(flowProgram, 'u_brushRadius'),
    strength: gl.getUniformLocation(flowProgram, 'u_brushStrength'),
    decay: gl.getUniformLocation(flowProgram, 'u_decay'),
  }
  const fluidUniforms = {
    flow: gl.getUniformLocation(fluidProgram, 'u_flowmap'),
    resolution: gl.getUniformLocation(fluidProgram, 'u_resolution'),
    time: gl.getUniformLocation(fluidProgram, 'u_time'),
    scale: gl.getUniformLocation(fluidProgram, 'u_scale'),
    offset: gl.getUniformLocation(fluidProgram, 'u_offset'),
    grain: gl.getUniformLocation(fluidProgram, 'u_grain'),
    distortBoost: gl.getUniformLocation(fluidProgram, 'u_distortBoost'),
    swirlBoost: gl.getUniformLocation(fluidProgram, 'u_swirlBoost'),
    glowIntensity: gl.getUniformLocation(fluidProgram, 'u_glowIntensity'),
    glowColors: [1, 2, 3].map((index) => gl.getUniformLocation(fluidProgram, `u_glowColor${index}`)),
    colors: [1, 2, 3, 4, 5].map((index) => gl.getUniformLocation(fluidProgram, `u_c${index}`)),
    light: gl.getUniformLocation(fluidProgram, 'u_lightPos'),
    lightCore: gl.getUniformLocation(fluidProgram, 'u_lightCore'),
    lightHalo: gl.getUniformLocation(fluidProgram, 'u_lightHalo'),
    vignette: gl.getUniformLocation(fluidProgram, 'u_vignette'),
    bloomThreshold: gl.getUniformLocation(fluidProgram, 'u_bloomThreshold'),
    bloomRange: gl.getUniformLocation(fluidProgram, 'u_bloomRange'),
    bloomStrength: gl.getUniformLocation(fluidProgram, 'u_bloomStrength'),
  }

  const vertices = gl.createBuffer()
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  let width = 0
  let height = 0
  let flowWidth = 0
  let flowHeight = 0
  let readTarget = null
  let writeTarget = null
  let frame = 0
  let visible = true
  let lastFrameTime = 0
  const startedAt = performance.now()
  const frameInterval = 1000 / 30
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches
  const pointer = { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5, vx: 0, vy: 0, active: false }

  function createTarget(initialPixels) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, flowWidth, flowHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, initialPixels)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { texture, framebuffer }
  }

  function resetFlowTargets() {
    for (const target of [readTarget, writeTarget]) {
      if (!target) continue
      gl.deleteFramebuffer(target.framebuffer)
      gl.deleteTexture(target.texture)
    }
    flowWidth = Math.max(2, Math.round(width / 4))
    flowHeight = Math.max(2, Math.round(height / 4))
    const neutral = new Uint8Array(flowWidth * flowHeight * 4)
    for (let index = 0; index < flowWidth * flowHeight; index += 1) {
      neutral[index * 4] = 0
      neutral[index * 4 + 1] = 128
      neutral[index * 4 + 2] = 128
      neutral[index * 4 + 3] = 255
    }
    readTarget = createTarget(neutral)
    writeTarget = createTarget(neutral)
  }

  function resize() {
    const bounds = hero.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    const nextWidth = Math.max(2, Math.round(bounds.width * ratio))
    const nextHeight = Math.max(2, Math.round(bounds.height * ratio))
    if (nextWidth === width && nextHeight === height) return
    width = nextWidth
    height = nextHeight
    canvas.width = width
    canvas.height = height
    resetFlowTargets()
  }

  function render(now) {
    if (!visible) {
      frame = 0
      return
    }
    if (motionEnabled && now - lastFrameTime < frameInterval) {
      frame = window.requestAnimationFrame(render)
      return
    }
    lastFrameTime = now - ((now - lastFrameTime) % frameInterval)

    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.1
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.1
    pointer.vx += ((pointer.x - pointer.smoothX) * 0.5 - pointer.vx) * 0.2
    pointer.vy += ((pointer.y - pointer.smoothY) * 0.5 - pointer.vy) * 0.2

    gl.bindVertexArray(vao)
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeTarget.framebuffer)
    gl.viewport(0, 0, flowWidth, flowHeight)
    gl.useProgram(flowProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, readTarget.texture)
    gl.uniform1i(flowUniforms.previous, 0)
    gl.uniform2f(flowUniforms.pointer, pointer.smoothX, pointer.smoothY)
    gl.uniform2f(flowUniforms.velocity, pointer.vx, pointer.vy)
    gl.uniform1f(flowUniforms.radius, 0.09)
    gl.uniform1f(flowUniforms.strength, pointer.active && motionEnabled && !coarsePointer ? 1.8 : 0)
    gl.uniform1f(flowUniforms.decay, 0.925)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, width, height)
    gl.useProgram(fluidProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, writeTarget.texture)
    gl.uniform1i(fluidUniforms.flow, 0)
    gl.uniform2f(fluidUniforms.resolution, width, height)
    gl.uniform1f(fluidUniforms.scale, 1.77)
    gl.uniform2f(fluidUniforms.offset, -1.24, -0.48)
    gl.uniform1f(fluidUniforms.grain, 0.005)
    gl.uniform1f(fluidUniforms.distortBoost, 2.2)
    gl.uniform1f(fluidUniforms.swirlBoost, 0.8)
    gl.uniform1f(fluidUniforms.glowIntensity, 0.13)
    gl.uniform2f(
      fluidUniforms.light,
      0.89 + (pointer.smoothX - 0.89) * 0.63,
      0.46,
    )
    gl.uniform1f(fluidUniforms.lightCore, 0.14)
    gl.uniform1f(fluidUniforms.lightHalo, 0.2)
    gl.uniform1f(fluidUniforms.vignette, 0.38)
    gl.uniform1f(fluidUniforms.bloomThreshold, 0.61)
    gl.uniform1f(fluidUniforms.bloomRange, 0.18)
    gl.uniform1f(fluidUniforms.bloomStrength, 0.4)
    gl.uniform1f(fluidUniforms.time, motionEnabled ? ((now - startedAt) * 0.001 * 28) / 100 : 0)
    const palette = ['#000000', '#1A3870', '#204a7e', '#eed8aa', '#000000']
    fluidUniforms.colors.forEach((uniform, index) => {
      const [red, green, blue] = hexToRgb(palette[index])
      gl.uniform3f(uniform, red, green, blue)
    })
    const glowPalette = ['#fff7d1', '#538dca', '#2d448b']
    fluidUniforms.glowColors.forEach((uniform, index) => {
      const [red, green, blue] = hexToRgb(glowPalette[index])
      gl.uniform3f(uniform, red, green, blue)
    })
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    const previous = readTarget
    readTarget = writeTarget
    writeTarget = previous
    frame = motionEnabled ? window.requestAnimationFrame(render) : 0
  }

  function onPointerMove(event) {
    const bounds = hero.getBoundingClientRect()
    pointer.x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
    pointer.y = 1 - Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
    pointer.active = true
  }

  if (motionEnabled) {
    hero.addEventListener('pointermove', onPointerMove, { passive: true })
    hero.addEventListener('pointerleave', () => { pointer.active = false })
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden
    if (visible && !frame) frame = window.requestAnimationFrame(render)
  })
  observer.observe(hero)
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden && hero.getBoundingClientRect().bottom > 0
    if (visible && !frame) frame = window.requestAnimationFrame(render)
  })
  new ResizeObserver(() => {
    resize()
    if (!motionEnabled) window.requestAnimationFrame(render)
  }).observe(hero)

  hero.classList.add('is-webgl-fluid')
  resize()
  frame = window.requestAnimationFrame(render)
  return true
}

function initHeroGridField(motionEnabled = true) {
  const canvas = document.querySelector('[data-hero-grid-field]')
  const hero = canvas?.closest('.hero')
  const context = canvas?.getContext('2d')
  if (!canvas || !hero || !context) return

  const spacing = 90
  const pointerRadius = 140
  const frameInterval = 1000 / 30
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches
  const pointer = { x: Number.NaN, y: Number.NaN }
  let points = []
  let columns = 0
  let rows = 0
  let width = 0
  let height = 0
  let ratio = 1
  let frame = 0
  let lastFrameTime = 0
  let visible = true
  let resting = false

  function buildGrid() {
    columns = Math.ceil(width / spacing) + 1
    rows = Math.ceil(height / spacing) + 1
    const offsetX = (width - (columns - 1) * spacing) / 2
    const offsetY = (height - (rows - 1) * spacing) / 2
    points = []
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = offsetX + column * spacing
        const y = offsetY + row * spacing
        points.push({ restX: x, restY: y, x, y, vx: 0, vy: 0 })
      }
    }
  }

  function resize() {
    const bounds = hero.getBoundingClientRect()
    const nextWidth = Math.max(1, Math.round(bounds.width))
    const nextHeight = Math.max(1, Math.round(bounds.height))
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2)
    if (nextWidth === width && nextHeight === height && nextRatio === ratio) return
    width = nextWidth
    height = nextHeight
    ratio = nextRatio
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    buildGrid()
    wake()
  }

  function wake() {
    if (!visible || frame) return
    resting = false
    frame = window.requestAnimationFrame(draw)
  }

  function lineBetween(first, second) {
    const dx = second.x - first.x
    const dy = second.y - first.y
    const distance = Math.hypot(dx, dy)
    if (distance < 20) return
    context.beginPath()
    context.moveTo(first.x + (10 * dx) / distance, first.y + (10 * dy) / distance)
    context.lineTo(second.x - (10 * dx) / distance, second.y - (10 * dy) / distance)
    context.stroke()
  }

  function draw(now) {
    frame = 0
    if (!visible) return
    if (motionEnabled && now - lastFrameTime < frameInterval) {
      frame = window.requestAnimationFrame(draw)
      return
    }
    lastFrameTime = now - ((now - lastFrameTime) % frameInterval)
    resize()
    context.clearRect(0, 0, width, height)

    let maxVelocity = 0
    for (const point of points) {
      if (motionEnabled && !coarsePointer && !Number.isNaN(pointer.x)) {
        const dx = point.x - pointer.x
        const dy = point.y - pointer.y
        const distance = Math.hypot(dx, dy)
        if (distance < pointerRadius && distance > 0.1) {
          const force = (1 - distance / pointerRadius) * 30
          point.vx += (dx / distance) * force * 0.1
          point.vy += (dy / distance) * force * 0.1
        }
      }
      point.vx += (point.restX - point.x) * 0.05
      point.vy += (point.restY - point.y) * 0.05
      point.vx *= 0.85
      point.vy *= 0.85
      point.x += point.vx
      point.y += point.vy
      maxVelocity = Math.max(maxVelocity, Math.abs(point.vx) + Math.abs(point.vy))
    }

    context.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    context.lineWidth = 0.5
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns - 1; column += 1) {
        lineBetween(points[row * columns + column], points[row * columns + column + 1])
      }
    }
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows - 1; row += 1) {
        lineBetween(points[row * columns + column], points[(row + 1) * columns + column])
      }
    }

    for (const point of points) {
      let size = 1.8
      let opacity = 0.16
      if (!Number.isNaN(pointer.x)) {
        const influence = Math.max(0, 1 - Math.hypot(point.x - pointer.x, point.y - pointer.y) / pointerRadius)
        size += 2 * influence
        opacity += 0.4 * influence
      }
      context.globalAlpha = opacity
      context.fillStyle = '#fff'
      context.fillRect(point.x - size, point.y - size, size * 2, size * 2)
    }
    context.globalAlpha = 1

    if (!motionEnabled || maxVelocity < 0.01) {
      resting = true
      return
    }
    frame = window.requestAnimationFrame(draw)
  }

  if (motionEnabled && !coarsePointer) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
      wake()
    }, { passive: true })
    hero.addEventListener('pointerleave', () => {
      pointer.x = Number.NaN
      pointer.y = Number.NaN
      wake()
    })
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && !document.hidden
    if (visible && (resting || !frame)) wake()
  })
  observer.observe(hero)
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden && hero.getBoundingClientRect().bottom > 0
    if (visible) wake()
  })
  new ResizeObserver(() => resize()).observe(hero)
  resize()
  wake()
}

const DSH_LOGO_PALETTE = [
  [255, 61, 129],
  [255, 122, 69],
  [255, 216, 77],
  [34, 211, 167],
  [50, 145, 255],
  [155, 92, 255],
]

function getDshLogoRgb(position) {
  const clamped = Math.max(0, Math.min(0.999, position))
  const scaled = clamped * (DSH_LOGO_PALETTE.length - 1)
  const index = Math.floor(scaled)
  const amount = scaled - index
  const start = DSH_LOGO_PALETTE[index]
  const end = DSH_LOGO_PALETTE[Math.min(index + 1, DSH_LOGO_PALETTE.length - 1)]
  return start.map((value, channel) => Math.round(value + (end[channel] - value) * amount))
}

function initHeroSymbolField(motionEnabled = true) {
  const canvas = document.querySelector('[data-hero-symbol-field]')
  const hero = canvas?.closest('.hero')
  const context = canvas?.getContext('2d')
  if (!canvas || !hero || !context) return

  const image = new Image()
  let points = []
  let width = 0
  let height = 0
  let frame = 0
  const pointer = { x: 0.5, y: 0.5, smoothX: 0.5, smoothY: 0.5, active: false }

  function sampleLogo() {
    const size = 300
    const mask = document.createElement('canvas')
    const maskContext = mask.getContext('2d', { willReadFrequently: true })
    if (!maskContext) return
    mask.width = size
    mask.height = size
    maskContext.drawImage(image, 18, 18, size - 36, size - 36)
    const pixels = maskContext.getImageData(0, 0, size, size).data
    points = []
    for (let y = 15; y < size - 15; y += 6) {
      for (let x = 15; x < size - 15; x += 6) {
        if (pixels[(y * size + x) * 4 + 3] > 80) points.push({ x: x / size - 0.5, y: y / size - 0.5 })
      }
    }
  }

  function resize() {
    const bounds = hero.getBoundingClientRect()
    width = Math.max(1, Math.round(bounds.width))
    height = Math.max(1, Math.round(bounds.height))
    canvas.width = width
    canvas.height = height
  }

  function draw(now = 0) {
    context.clearRect(0, 0, width, height)
    if (!points.length) {
      frame = motionEnabled ? window.requestAnimationFrame(draw) : 0
      return
    }

    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.09
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.09
    const singleColumn = width <= 1180
    const logoSize = singleColumn
      ? Math.min(width * 0.72, height * 0.42, 520)
      : Math.min(620, height * 0.72)
    const centerX = singleColumn ? width * 0.5 : Math.min(360, width * 0.28)
    const centerY = singleColumn ? Math.min(250, height * 0.25) : 190
    const focusX = pointer.smoothX * width
    const focusY = pointer.smoothY * height
    const radius = Math.max(120, logoSize * 0.5)
    const dotSize = Math.max(1, Math.min(2.4, width * 0.0012))

    context.save()
    context.globalCompositeOperation = 'screen'
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index]
      let x = centerX + point.x * logoSize
      let y = centerY + point.y * logoSize
      const dx = x - focusX
      const dy = y - focusY
      const distance = Math.max(1, Math.hypot(dx, dy))
      const influence = pointer.active ? Math.exp(-(distance * distance) / (radius * radius)) : 0
      const wave = Math.sin(distance * 0.035 - now * 0.004) * influence * 8
      x += (dx / distance) * wave
      y += (dy / distance) * wave
      const shimmer = 0.5 + Math.sin(index * 0.87 + now * 0.00055) * 0.5
      const [red, green, blue] = getDshLogoRgb(point.x + 0.5 + shimmer * 0.035)
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.24 + shimmer * 0.3})`
      context.fillRect(x, y, dotSize, dotSize)
    }
    context.restore()
    frame = motionEnabled ? window.requestAnimationFrame(draw) : 0
  }

  if (motionEnabled) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect()
      pointer.x = (event.clientX - bounds.left) / bounds.width
      pointer.y = (event.clientY - bounds.top) / bounds.height
      pointer.active = true
    }, { passive: true })
    hero.addEventListener('pointerleave', () => { pointer.active = false })
  }
  new ResizeObserver(() => {
    resize()
    if (!motionEnabled) draw()
  }).observe(hero)
  image.addEventListener('load', () => {
    sampleLogo()
    if (!motionEnabled) draw()
  }, { once: true })
  image.src = 'build/deepseek-logo.svg'
  resize()
  frame = window.requestAnimationFrame(draw)
}

function initHeroFluidFallback(motionEnabled = true) {
  const canvas = document.querySelector('[data-hero-fluid]')
  const symbolCanvas = document.querySelector('[data-hero-symbol-field]')
  const hero = canvas?.closest('.hero')
  const context = canvas?.getContext('2d')
  const symbolContext = symbolCanvas?.getContext('2d')
  if (!canvas || !symbolCanvas || !hero || !context || !symbolContext) return

  hero.classList.add('is-fluid-fallback')

  let width = 0
  let height = 0
  let frame = 0
  let active = true
  let previousFrameTime = 0
  let symbolReady = false
  let symbolPoints = []
  let lastWakeAt = 0
  const pointer = {
    x: 0.56,
    y: 0.42,
    targetX: 0.56,
    targetY: 0.42,
    velocityX: 0,
    velocityY: 0,
    energy: 0,
    inside: false,
  }
  const wakes = []
  const symbolImage = new Image()
  symbolImage.decoding = 'async'

  function buildSymbolPoints() {
    const sampleSize = 320
    const mask = document.createElement('canvas')
    const maskContext = mask.getContext('2d', { willReadFrequently: true })
    if (!maskContext) return
    mask.width = sampleSize
    mask.height = sampleSize
    maskContext.clearRect(0, 0, sampleSize, sampleSize)

    try {
      if (!symbolReady) throw new Error('symbol-not-ready')
      maskContext.drawImage(symbolImage, 20, 20, sampleSize - 40, sampleSize - 40)
      const pixels = maskContext.getImageData(0, 0, sampleSize, sampleSize).data
      const nextPoints = []
      for (let y = 18; y < sampleSize - 18; y += 6) {
        for (let x = 18; x < sampleSize - 18; x += 6) {
          const alpha = pixels[(y * sampleSize + x) * 4 + 3]
          if (alpha > 72) nextPoints.push({ x: x / sampleSize - 0.5, y: y / sampleSize - 0.5 })
        }
      }
      symbolPoints = nextPoints
    } catch {
      maskContext.fillStyle = '#fff'
      maskContext.font = '900 150px ui-sans-serif, system-ui, sans-serif'
      maskContext.textAlign = 'center'
      maskContext.textBaseline = 'middle'
      maskContext.fillText('dsh', sampleSize / 2, sampleSize / 2)
      const pixels = maskContext.getImageData(0, 0, sampleSize, sampleSize).data
      const nextPoints = []
      for (let y = 18; y < sampleSize - 18; y += 6) {
        for (let x = 18; x < sampleSize - 18; x += 6) {
          if (pixels[(y * sampleSize + x) * 4 + 3] > 72) {
            nextPoints.push({ x: x / sampleSize - 0.5, y: y / sampleSize - 0.5 })
          }
        }
      }
      symbolPoints = nextPoints
    }
  }

  function resize() {
    const bounds = hero.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 1)
    width = Math.max(1, Math.round(bounds.width))
    height = Math.max(1, Math.round(bounds.height))
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    symbolCanvas.width = Math.round(width * ratio)
    symbolCanvas.height = Math.round(height * ratio)
    symbolCanvas.style.width = `${width}px`
    symbolCanvas.style.height = `${height}px`
    symbolContext.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  function radial(x, y, radius, inner, outer = 'rgba(0,0,0,0)') {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, inner)
    gradient.addColorStop(1, outer)
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  function distortPoint(pointX, pointY, time, strength = 1) {
    let nextX = pointX
    let nextY = pointY
    const focusX = pointer.x * width
    const focusY = pointer.y * height
    const dx = pointX - focusX
    const dy = pointY - focusY
    const radius = Math.max(width, height) * 0.28
    const distance = Math.max(1, Math.hypot(dx, dy))
    const influence = Math.exp(-(distance * distance) / (radius * radius))
    const vortex = influence * (0.018 + pointer.energy * 0.09) * strength

    nextX += (-dy / distance) * vortex * width + pointer.velocityX * influence * width * 0.75
    nextY += (dx / distance) * vortex * height + pointer.velocityY * influence * height * 0.75

    for (const wake of wakes) {
      const wakeX = wake.x * width
      const wakeY = wake.y * height
      const wakeDx = pointX - wakeX
      const wakeDy = pointY - wakeY
      const wakeDistance = Math.max(1, Math.hypot(wakeDx, wakeDy))
      const ring = Math.sin(wakeDistance * 0.035 - wake.age * 0.12)
      const falloff = Math.exp(-wakeDistance / Math.max(90, width * 0.16)) * wake.life
      nextX += (wakeDx / wakeDistance) * ring * falloff * 15 * strength
      nextY += (wakeDy / wakeDistance) * ring * falloff * 15 * strength
    }

    nextY += Math.sin(pointX * 0.0036 + time * 0.48) * height * 0.008 * strength
    return { x: nextX, y: nextY }
  }

  function ribbonCenter(ribbonIndex, t, time) {
    if (ribbonIndex === 0) {
      return {
        x: width * (-0.16 + t * 1.34),
        y: height * (0.67 - Math.sin(t * Math.PI * 1.02) * 0.48 + Math.sin(t * 7 + time * 0.2) * 0.025),
      }
    }
    if (ribbonIndex === 1) {
      return {
        x: width * (0.13 + t * 0.72 + Math.sin(t * Math.PI * 1.4 + time * 0.12) * 0.1),
        y: height * (-0.22 + t * 1.42),
      }
    }
    return {
      x: width * (0.43 + t * 0.78),
      y: height * (1.12 - t * 1.18 + Math.sin(t * Math.PI * 2.2 + time * 0.16) * 0.12),
    }
  }

  function drawRibbon(ribbonIndex, time, thickness, stops, alpha = 1) {
    const points = []
    const samples = 52
    for (let index = 0; index <= samples; index += 1) {
      const t = index / samples
      const center = ribbonCenter(ribbonIndex, t, time)
      points.push(distortPoint(center.x, center.y, time, 0.9 + ribbonIndex * 0.08))
    }

    const upper = []
    const lower = []
    for (let index = 0; index < points.length; index += 1) {
      const before = points[Math.max(0, index - 1)]
      const after = points[Math.min(points.length - 1, index + 1)]
      const dx = after.x - before.x
      const dy = after.y - before.y
      const length = Math.max(1, Math.hypot(dx, dy))
      const taper = Math.sin((index / samples) * Math.PI) * 0.28 + 0.72
      const half = thickness * taper * 0.5
      const normalX = (-dy / length) * half
      const normalY = (dx / length) * half
      upper.push({ x: points[index].x + normalX, y: points[index].y + normalY })
      lower.push({ x: points[index].x - normalX, y: points[index].y - normalY })
    }

    context.beginPath()
    context.moveTo(upper[0].x, upper[0].y)
    for (const point of upper) context.lineTo(point.x, point.y)
    for (let index = lower.length - 1; index >= 0; index -= 1) context.lineTo(lower[index].x, lower[index].y)
    context.closePath()

    const gradient = context.createLinearGradient(0, 0, width, height)
    stops.forEach(([position, color]) => gradient.addColorStop(position, color))
    context.globalAlpha = alpha
    context.fillStyle = gradient
    context.fill()
    context.globalAlpha = 1
  }

  function drawSymbolField(time) {
    symbolContext.clearRect(0, 0, width, height)
    if (!symbolPoints.length) return

    const singleColumn = width < 1180
    const symbolSize = singleColumn
      ? Math.min(width * 0.34, height * 0.34)
      : Math.min(width * 0.29, height * 0.58)
    const centerX = width * (singleColumn ? 0.75 : 0.33)
    const centerY = height * (singleColumn ? 0.31 : 0.34)
    const dotSize = Math.max(1, Math.min(2.5, width * 0.00125))

    symbolContext.save()
    symbolContext.globalCompositeOperation = 'screen'
    for (let index = 0; index < symbolPoints.length; index += 1) {
      const point = symbolPoints[index]
      const baseX = centerX + point.x * symbolSize
      const baseY = centerY + point.y * symbolSize
      const displaced = distortPoint(baseX, baseY, time, 0.42)
      const shimmer = 0.5 + Math.sin(index * 0.91 + time * 0.62) * 0.5
      const [red, green, blue] = getDshLogoRgb(point.x + 0.5 + shimmer * 0.035)
      symbolContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.24 + shimmer * 0.3})`
      symbolContext.fillRect(displaced.x, displaced.y, dotSize, dotSize)
    }
    symbolContext.restore()
  }

  function draw(time = 0) {
    if (!active) {
      frame = 0
      return
    }

    const seconds = time * 0.001
    const delta = previousFrameTime ? Math.min(34, Math.max(8, time - previousFrameTime)) : 16.67
    const frameScale = delta / 16.67
    const follow = 1 - Math.exp(-delta / 105)
    previousFrameTime = time
    pointer.x += (pointer.targetX - pointer.x) * follow
    pointer.y += (pointer.targetY - pointer.y) * follow

    context.clearRect(0, 0, width, height)
    context.save()
    context.globalCompositeOperation = 'screen'
    drawRibbon(0, seconds, Math.max(150, height * 0.26), [
      [0, 'rgba(223, 226, 219, 0.55)'],
      [0.46, 'rgba(137, 168, 203, 0.38)'],
      [1, 'rgba(32, 84, 158, 0.16)'],
    ], 0.88)
    drawRibbon(1, seconds + 0.8, Math.max(130, height * 0.23), [
      [0, 'rgba(43, 105, 186, 0.16)'],
      [0.52, 'rgba(218, 221, 213, 0.5)'],
      [1, 'rgba(75, 126, 196, 0.28)'],
    ], 0.82)
    drawRibbon(2, seconds + 1.7, Math.max(110, height * 0.18), [
      [0, 'rgba(118, 156, 205, 0.2)'],
      [0.6, 'rgba(226, 228, 218, 0.38)'],
      [1, 'rgba(27, 78, 146, 0.12)'],
    ], 0.72)
    context.restore()

    context.save()
    context.globalCompositeOperation = 'screen'
    drawRibbon(0, seconds, Math.max(24, height * 0.035), [
      [0, 'rgba(255, 255, 246, 0.52)'],
      [1, 'rgba(154, 188, 232, 0.08)'],
    ], 0.42)
    context.restore()

    context.save()
    context.globalCompositeOperation = 'screen'
    for (let index = wakes.length - 1; index >= 0; index -= 1) {
      const wake = wakes[index]
      wake.life *= Math.pow(0.965, frameScale)
      wake.radius += width * 0.0007 * frameScale
      wake.age += frameScale
      radial(
        wake.x * width,
        wake.y * height,
        wake.radius,
        `rgba(203, 220, 248, ${0.12 * wake.life})`,
      )
      if (wake.life < 0.08) wakes.splice(index, 1)
    }
    context.restore()

    context.save()
    context.globalCompositeOperation = 'screen'
    const pointerRadius = Math.max(width, height) * (0.24 + pointer.energy * 0.08)
    radial(pointer.x * width, pointer.y * height, pointerRadius, `rgba(91, 151, 255, ${pointer.inside ? 0.34 : 0.22})`)
    radial(width * 0.12, height * 0.18, Math.max(width, height) * 0.32, 'rgba(221, 223, 216, 0.12)')
    context.restore()

    if (pointer.inside) {
      context.save()
      context.globalCompositeOperation = 'screen'
      const focusX = pointer.x * width
      const focusY = pointer.y * height
      const dotRadius = Math.max(90, width * 0.085)
      const dotGap = Math.max(12, width * 0.009)
      for (let x = focusX - dotRadius; x <= focusX + dotRadius; x += dotGap) {
        for (let y = focusY - dotRadius; y <= focusY + dotRadius; y += dotGap) {
          const distance = Math.hypot(x - focusX, y - focusY)
          if (distance > dotRadius) continue
          const strength = (1 - distance / dotRadius) * (0.16 + pointer.energy * 0.16)
          context.fillStyle = `rgba(210, 226, 250, ${strength})`
          context.beginPath()
          context.arc(x, y, Math.max(0.55, width * 0.00055), 0, Math.PI * 2)
          context.fill()
        }
      }
      context.restore()
    }

    pointer.energy *= Math.pow(0.94, frameScale)
    pointer.velocityX *= Math.pow(0.9, frameScale)
    pointer.velocityY *= Math.pow(0.9, frameScale)

    drawSymbolField(seconds)

    frame = motionEnabled ? window.requestAnimationFrame(draw) : 0
  }

  if (motionEnabled) hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect()
    const nextX = (event.clientX - bounds.left) / bounds.width
    const nextY = (event.clientY - bounds.top) / bounds.height
    const velocity = Math.hypot(nextX - pointer.targetX, nextY - pointer.targetY)
    pointer.velocityX = nextX - pointer.targetX
    pointer.velocityY = nextY - pointer.targetY
    pointer.targetX = nextX
    pointer.targetY = nextY
    pointer.energy = Math.min(1, pointer.energy + velocity * 10)
    pointer.inside = true
    if (velocity > 0.006 && event.timeStamp - lastWakeAt > 34) {
      wakes.push({ x: nextX, y: nextY, radius: Math.max(44, width * 0.045), life: 1, age: 0 })
      lastWakeAt = event.timeStamp
      if (wakes.length > 7) wakes.shift()
    }
  }, { passive: true })

  if (motionEnabled) hero.addEventListener('pointerleave', () => {
    pointer.targetX = 0.56
    pointer.targetY = 0.42
    pointer.inside = false
    pointer.velocityX = 0
    pointer.velocityY = 0
  })

  if (motionEnabled) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && !document.hidden
      if (active && !frame) frame = window.requestAnimationFrame(draw)
    })
    visibilityObserver.observe(hero)

    document.addEventListener('visibilitychange', () => {
      active = !document.hidden && hero.getBoundingClientRect().bottom > 0
      if (active && !frame) frame = window.requestAnimationFrame(draw)
    })
  }

  new ResizeObserver(() => {
    resize()
    if (!motionEnabled) draw()
  }).observe(hero)
  symbolImage.addEventListener('load', () => {
    symbolReady = true
    buildSymbolPoints()
    if (!motionEnabled) draw()
  }, { once: true })
  symbolImage.addEventListener('error', () => {
    buildSymbolPoints()
    if (!motionEnabled) draw()
  }, { once: true })
  symbolImage.src = 'build/deepseek-logo.svg'
  resize()
  draw()
}

initHeroGridField(!reducedMotion.matches)
const heroFluidUsesWebGL = initHeroFluidWebGL(!reducedMotion.matches)
if (heroFluidUsesWebGL) initHeroSymbolField(!reducedMotion.matches)
else initHeroFluidFallback(!reducedMotion.matches)

function showToast(message) {
  if (!toast) return
  toast.textContent = message
  toast.classList.add('visible')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3600)
}

function getPlatform() {
  const rawPlatform = navigator.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent
  const platform = rawPlatform.toLowerCase()

  if (platform.includes('win')) return 'windowsX64'
  if (platform.includes('mac')) return platform.includes('arm') ? 'macArm64' : 'macArm64'
  return 'unknown'
}

function platformLabel(platform) {
  if (platform === 'windowsX64') return translate('downloadWindows')
  if (platform === 'macArm64') return translate('downloadMac')
  return translate('downloadGroup')
}

function configureDownloadLink(link, platform) {
  const url = config.downloadUrls?.[platform]

  if (url) {
    link.href = url
    delete link.dataset.pending
    return true
  }

  link.href = '#release-pending'
  link.dataset.pending = 'true'
  link.setAttribute('aria-label', `${link.textContent.trim()}${translate('downloadPendingAria')}`)
  link.addEventListener('click', () => {
    showToast(translate('downloadPending'))
  })
  return false
}

document.querySelectorAll('[data-version]').forEach((node) => {
  node.textContent = config.version
})

document.querySelectorAll('[data-download]').forEach((link) => {
  configureDownloadLink(link, link.dataset.download)
})

const detectedPlatform = getPlatform()
const primaryDownload = document.querySelector('[data-primary-download]')
const primaryLabel = document.querySelector('[data-primary-label]')
const detectedCard = document.querySelector(`[data-platform-card="${detectedPlatform}"]`)

if (primaryLabel) primaryLabel.textContent = platformLabel(detectedPlatform)

if (primaryDownload && detectedPlatform !== 'unknown') {
  const configured = config.downloadUrls?.[detectedPlatform]
  primaryDownload.href = configured || '#download'
}

if (detectedCard) detectedCard.classList.add('detected')

const repositoryLinks = document.querySelectorAll('[data-repository-link]')
repositoryLinks.forEach((repositoryLink) => {
  if (config.repositoryUrl) {
    repositoryLink.href = config.repositoryUrl
    repositoryLink.target = '_blank'
    repositoryLink.rel = 'noreferrer'
  } else {
    repositoryLink.addEventListener('click', () => showToast(translate('repositoryPending')))
  }
})

const githubStarNodes = document.querySelectorAll('[data-github-stars]')

function formatGitHubStars(stars) {
  if (!Number.isFinite(stars)) return '—'
  if (stars < 1000) return String(stars)
  const compact = stars / 1000
  return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1).replace('.0', '')}K`
}

function renderGitHubStars(stars) {
  githubStarNodes.forEach((node) => {
    node.textContent = formatGitHubStars(stars)
    node.title = `${stars.toLocaleString(activeLocale)} ${translate('githubStarsLabel')}`
  })
}

renderGitHubStars(Number(config.githubStars))

async function refreshGitHubStars() {
  if (!config.repositoryUrl) return
  const repository = new URL(config.repositoryUrl).pathname.replace(/^\/+|\/+$/g, '')
  if (!repository || repository.split('/').length !== 2) return

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) return
    const payload = await response.json()
    if (Number.isFinite(payload.stargazers_count)) renderGitHubStars(payload.stargazers_count)
  } catch {
    // The verified value in site.config.js remains visible when GitHub is unavailable.
  }
}

refreshGitHubStars()

const upstreamLink = document.querySelector('[data-upstream-link]')
if (upstreamLink && config.upstreamUrl) upstreamLink.href = config.upstreamUrl

const year = document.querySelector('[data-year]')
if (year) year.textContent = String(new Date().getFullYear())

const heroRevealItems = document.querySelectorAll('.hero .reveal')

if (reducedMotion.matches) {
  heroRevealItems.forEach((item) => item.classList.add('revealed'))
} else {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      heroRevealItems.forEach((item) => item.classList.add('revealed'))
    })
  })

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('revealed')
      observer.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

  document.querySelectorAll('.reveal').forEach((item) => {
    if (!item.closest('.hero')) revealObserver.observe(item)
  })
}

const dshDemo = document.querySelector('[data-dsh-demo]')
const demoViewTriggers = document.querySelectorAll('[data-demo-view-trigger]')
const demoTitle = document.querySelector('[data-demo-title]')
const demoToast = document.querySelector('[data-demo-toast]')
let demoToastTimer

function showDemoToast(message) {
  if (!demoToast) return
  demoToast.textContent = message
  demoToast.classList.add('visible')
  window.clearTimeout(demoToastTimer)
  demoToastTimer = window.setTimeout(() => demoToast.classList.remove('visible'), 2400)
}

function setDemoView(view) {
  if (!dshDemo || !demoViewTitleKeys[view]) return
  dshDemo.dataset.demoView = view
  if (demoTitle) demoTitle.textContent = translate(demoViewTitleKeys[view])

  demoViewTriggers.forEach((button) => {
    const selected = button.dataset.demoViewTrigger === view
    if (button.getAttribute('role') === 'tab') button.setAttribute('aria-selected', String(selected))
    if (button.matches('[data-demo-session]')) button.classList.toggle('active', view === 'chat' || view === 'trace')
  })
}

demoViewTriggers.forEach((button) => {
  button.addEventListener('click', () => setDemoView(button.dataset.demoViewTrigger))
})

const demoTraceView = document.querySelector('.dsh-trace-view')
const demoTraceDuration = document.querySelector('[data-demo-trace-duration]')
const demoTraceTurns = document.querySelector('[data-demo-trace-turns]')
const demoTraceCalls = document.querySelector('[data-demo-trace-calls]')
const demoTraceTimeline = document.querySelector('[data-demo-trace-timeline]')
const demoTraceSearch = document.querySelector('[data-demo-trace-search]')

function toggleTraceControl(button, stateKey, expandedTitle, collapsedTitle) {
  if (!button || !demoTraceView) return
  const active = button.getAttribute('aria-pressed') !== 'true'
  button.setAttribute('aria-pressed', String(active))
  demoTraceView.dataset[stateKey] = String(active)
  button.title = active ? expandedTitle : collapsedTitle
  const icon = button.querySelector('span:first-child')
  if (icon && button !== demoTraceDuration) icon.textContent = active ? '⊞' : '⊟'
}

demoTraceDuration?.addEventListener('click', () => {
  const active = demoTraceDuration.getAttribute('aria-pressed') !== 'true'
  demoTraceDuration.setAttribute('aria-pressed', String(active))
  demoTraceDuration.title = active ? '使用等宽时间轴' : '使用实际时长'
  if (demoTraceTimeline) demoTraceTimeline.dataset.actualDuration = String(active)
})

demoTraceTurns?.addEventListener('click', () => {
  toggleTraceControl(demoTraceTurns, 'turnsCollapsed', '展开轮次', '折叠轮次')
})

demoTraceCalls?.addEventListener('click', () => {
  toggleTraceControl(demoTraceCalls, 'callsCollapsed', '展开调用', '折叠调用')
})

demoTraceSearch?.addEventListener('input', () => {
  const query = demoTraceSearch.value.trim().toLowerCase()
  const rows = [...document.querySelectorAll('[data-trace-searchable]')]
  let visible = 0
  rows.forEach((row) => {
    const matches = query === '' || row.dataset.traceSearchable.toLowerCase().includes(query)
    row.hidden = !matches
    if (matches) visible += 1
  })
  const empty = document.querySelector('[data-demo-trace-empty]')
  if (empty) empty.hidden = visible !== 0
})

document.querySelectorAll('[data-demo-trace-span]').forEach((span) => {
  span.addEventListener('click', () => {
    document.querySelectorAll('[data-demo-trace-span]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === span)))
    document.querySelectorAll('[data-trace-row]').forEach((row) => {
      row.dataset.selected = String(row.dataset.traceRow === span.dataset.demoTraceSpan)
    })
    document.querySelector(`[data-trace-row="${span.dataset.demoTraceSpan}"]`)?.scrollIntoView({ block: 'nearest' })
  })
})

document.querySelectorAll('[data-demo-notice]').forEach((button) => {
  button.addEventListener('click', () => showDemoToast(button.dataset.demoNotice))
})

document.querySelectorAll('[data-demo-folder]').forEach((folder) => {
  folder.addEventListener('click', () => {
    folder.setAttribute('aria-expanded', String(folder.getAttribute('aria-expanded') !== 'true'))
  })
})

document.querySelector('[data-demo-toggle-sidebar]')?.addEventListener('click', (event) => {
  const collapsed = dshDemo.dataset.sidebarCollapsed === 'true'
  dshDemo.dataset.sidebarCollapsed = String(!collapsed)
  const label = collapsed ? '收起侧边栏' : '展开侧边栏'
  event.currentTarget.setAttribute('aria-label', label)
  event.currentTarget.setAttribute('title', label)
})

document.querySelectorAll('[data-demo-toggle-explorer]').forEach((button) => {
  button.addEventListener('click', () => {
    const collapsed = dshDemo.dataset.explorerCollapsed === 'true'
    dshDemo.dataset.explorerCollapsed = String(!collapsed)
    document.querySelectorAll('[data-demo-toggle-explorer]').forEach((control) => {
      control.setAttribute('aria-label', collapsed ? '收起右侧面板' : '展开右侧面板')
    })
  })
})

document.querySelectorAll('[data-demo-toggle-terminal]').forEach((button) => {
  button.addEventListener('click', () => {
    const collapsed = dshDemo.dataset.terminalCollapsed === 'true'
    dshDemo.dataset.terminalCollapsed = String(!collapsed)
    document.querySelectorAll('[data-demo-toggle-terminal]').forEach((control) => {
      control.setAttribute('aria-label', collapsed ? '收起底部面板' : '展开底部面板')
    })
  })
})

const demoSearchBox = document.querySelector('[data-demo-search-box]')
const demoSessionSearch = document.querySelector('[data-demo-session-search]')

document.querySelector('[data-demo-search]')?.addEventListener('click', () => {
  demoSearchBox?.classList.toggle('visible')
  if (demoSearchBox?.classList.contains('visible')) demoSessionSearch?.focus()
})

demoSessionSearch?.addEventListener('input', () => {
  const query = demoSessionSearch.value.trim().toLowerCase()
  document.querySelectorAll('.dsh-session-list button').forEach((session) => {
    session.hidden = Boolean(query) && !session.textContent.toLowerCase().includes(query)
  })
})

document.querySelector('[data-demo-filter]')?.addEventListener('click', (event) => {
  const active = event.currentTarget.getAttribute('aria-pressed') === 'true'
  event.currentTarget.setAttribute('aria-pressed', String(!active))
  document.querySelectorAll('.dsh-session-list button:not(.active)').forEach((session) => {
    session.hidden = !active
  })
  showDemoToast(active ? '已显示全部会话' : '只显示当前会话')
})

document.querySelector('[data-demo-add-workspace]')?.addEventListener('click', () => {
  showDemoToast('真实客户端会在这里打开本机目录选择器')
})

document.querySelector('[data-demo-refresh-files]')?.addEventListener('click', (event) => {
  event.currentTarget.classList.remove('spinning')
  window.requestAnimationFrame(() => event.currentTarget.classList.add('spinning'))
  showDemoToast('文件列表已刷新')
})

const demoFilePreview = document.querySelector('[data-demo-file-preview]')
const demoFileName = document.querySelector('[data-demo-file-name]')

document.querySelectorAll('[data-demo-open-file]').forEach((file) => {
  file.addEventListener('click', () => {
    if (demoFileName) demoFileName.textContent = file.dataset.demoOpenFile
    if (demoFilePreview) demoFilePreview.hidden = false
  })
})

document.querySelector('[data-demo-close-file]')?.addEventListener('click', () => {
  if (demoFilePreview) demoFilePreview.hidden = true
})

document.querySelector('[data-demo-session-log]')?.addEventListener('click', () => {
  const payload = JSON.stringify({ project: 'DeepSeek', session: '你好', turns: 1, demo: true }, null, 2)
  const href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = href
  link.download = 'dsh-session-demo.json'
  link.click()
  URL.revokeObjectURL(href)
  showDemoToast(translate('demoSessionDownloaded'))
})

document.querySelector('[data-demo-theme-toggle]')?.addEventListener('click', (event) => {
  const light = dshDemo.dataset.demoTheme === 'light'
  dshDemo.dataset.demoTheme = light ? 'dark' : 'light'
  event.currentTarget.textContent = light ? translate('demoDarkMode') : translate('demoLightMode')
})

const terminalForm = document.querySelector('[data-demo-terminal-form]')
const terminalInput = document.querySelector('[data-demo-terminal-input]')
const terminalOutput = document.querySelector('[data-terminal-output]')

terminalForm?.addEventListener('submit', (event) => {
  event.preventDefault()
  const command = terminalInput.value.trim()
  if (!command) return

  const commandLine = document.createElement('span')
  commandLine.textContent = `% ${command}`
  const resultLine = document.createElement('span')
  resultLine.className = 'terminal-success'
  resultLine.textContent = command === 'dsh --version' ? `dsh ${config.version} · ${translate('demoTerminalVersion')}` : translate('demoTerminalDone')
  terminalOutput.replaceChildren(commandLine, resultLine)
})

const messageForm = document.querySelector('[data-demo-message-form]')
const messageInput = document.querySelector('[data-demo-message-input]')
const demoUserMessage = document.querySelector('[data-demo-user-message]')
const demoAssistantMessage = document.querySelector('[data-demo-assistant-message]')

messageForm?.addEventListener('submit', (event) => {
  event.preventDefault()
  const message = messageInput.value.trim()
  if (!message || !demoUserMessage || !demoAssistantMessage) return

  setDemoView('chat')
  demoUserMessage.textContent = message
  demoAssistantMessage.textContent = translate('demoAnalyzing')
  messageInput.value = ''
  showDemoToast(translate('demoMessageLocal'))

  window.setTimeout(() => {
    demoAssistantMessage.textContent = translate('demoReceived').replace('{message}', message)
  }, reducedMotion.matches ? 0 : 650)
})

document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return
    document.querySelectorAll('details[open]').forEach((other) => {
      if (other !== detail) other.open = false
    })
  })
})
