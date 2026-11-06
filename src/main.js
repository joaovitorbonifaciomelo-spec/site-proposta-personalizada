import '@fontsource-variable/instrument-sans/wght.css'
import '@fontsource-variable/inter-tight/wght.css'
import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

const root = document.documentElement
const $ = (s, c = document) => c.querySelector(s)
const $$ = (s, c = document) => [...c.querySelectorAll(s)]
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const isDesktop = () => matchMedia('(min-width: 1024px)').matches
const hasMouse = () => matchMedia('(hover: hover) and (pointer: fine)').matches

let motion = root.classList.contains('motion')
let lenis = null

/* ---------------------------------- Título que ocupa a largura exata ---------------------------------- */

function fitOne(el, target, axis = 'x', max = Infinity) {
  el.style.fontSize = '100px'
  const box = el.getBoundingClientRect()
  const size = axis === 'x' ? box.width : box.height
  if (!size || !target) return
  el.style.fontSize = `${Math.min(max, (100 * target) / size)}px`
}

function fitAll() {
  $$('[data-fit]').forEach((el) => fitOne(el, el.parentElement.clientWidth, 'x', innerHeight * 0.42))
  const word = $('[data-hero-word]')
  const hero = $('.hero')
  if (getComputedStyle(word).writingMode.startsWith('vertical')) {
    const cs = getComputedStyle(hero)
    fitOne(word, hero.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), 'y')
  } else {
    fitOne(word, $('.hero__title').clientWidth, 'x', innerHeight * (innerHeight < 500 ? 0.36 : 0.5))
  }
}

/* ---------------------------------- Peças geradas: curvas de nível, pontos, grade de horas ---------------------------------- */

/** Curvas de nível de verdade: isolinhas de um relevo gerado (marching squares), que nunca se cruzam. */
function contour(svg, seed) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const hills = Array.from({ length: 6 }, () => ({ x: rnd(), y: rnd(), r: 0.12 + rnd() * 0.22, h: 0.5 + rnd() }))
  const N = 72
  const size = 1000 / N
  const field = []
  for (let y = 0; y <= N; y++) {
    const row = []
    for (let x = 0; x <= N; x++) {
      const u = x / N
      const v = y / N
      row.push(hills.reduce((sum, c) => sum + c.h * Math.exp(-((u - c.x) ** 2 + (v - c.y) ** 2) / (2 * c.r * c.r)), 0))
    }
    field.push(row)
  }
  const cross = (a, b, l) => (l - a) / (b - a)
  let d = ''
  for (let level = 0.14; level < 2; level += 0.13) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const a = field[y][x]
        const b = field[y][x + 1]
        const c = field[y + 1][x + 1]
        const e = field[y + 1][x]
        const pts = []
        if (a < level !== b < level) pts.push([x + cross(a, b, level), y])
        if (b < level !== c < level) pts.push([x + 1, y + cross(b, c, level)])
        if (e < level !== c < level) pts.push([x + cross(e, c, level), y + 1])
        if (a < level !== e < level) pts.push([x, y + cross(a, e, level)])
        for (let k = 0; k + 1 < pts.length; k += 2) {
          d += `M${(pts[k][0] * size).toFixed(1)} ${(pts[k][1] * size).toFixed(1)}L${(pts[k + 1][0] * size).toFixed(1)} ${(pts[k + 1][1] * size).toFixed(1)}`
        }
      }
    }
  }
  svg.innerHTML = `<path d="${d}" />`
}

function buildPieces() {
  $$('[data-contour]').forEach((el) => contour(el, Number(el.dataset.contour) * 7919))

  // Marketing: os pontos saem de uma massa uniforme e se separam em públicos.
  const dots = $('[data-dots]')
  const groups = [
    { x: 530, y: 150, r: 112, name: 'Público A' },
    { x: 850, y: 310, r: 104, name: 'Público B' },
    { x: 560, y: 450, r: 92, name: 'Público C' },
  ]
  let html = ''
  let s = 91
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < 210; i++) {
    const g = groups[i % 3]
    const a = rnd() * 6.28
    const r = Math.sqrt(rnd()) * g.r
    const gx = 420 + (i % 15) * 38
    const gy = 50 + Math.floor(i / 15) * 38
    html += `<circle r="${(3.5 + rnd() * 4.5).toFixed(1)}" cx="${gx}" cy="${gy}" style="--dx:${(g.x + Math.cos(a) * r - gx).toFixed(0)}px;--dy:${(g.y + Math.sin(a) * r - gy).toFixed(0)}px;--d:${(i % 24) * 16}ms" />`
  }
  groups.forEach((g) => {
    html += `<text x="${g.x}" y="${g.y + g.r + 32}" text-anchor="middle">${g.name}</text>`
  })
  dots.innerHTML = html

  // Modelo: vinte células, cinco manhãs de quatro horas.
  const hours = $('[data-hours]')
  hours.innerHTML = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
    .map((d, c) => `<div class="hours__col"><b>${d}</b>${[0, 1, 2, 3].map((r) => `<i style="--n:${c * 4 + r}"></i>`).join('')}</div>`)
    .join('')

  // Abertura: os mesmos pontos de contato das Necessidades, soltos em profundidade.
  $$('[data-clone]').forEach((slot) => {
    const face = $(`.mo .${slot.dataset.clone}`).cloneNode(true)
    slot.append(face)
  })
}

/* ---------------------------------- Cortes em fatias e barra ---------------------------------- */

const STRIPS = 9
$$('.opener__strips').forEach((box) => {
  for (let i = 0; i < STRIPS; i++) {
    const s = document.createElement('i')
    s.style.setProperty('--o', ((i * 5) % STRIPS) / (STRIPS - 1))
    if (i % 2) s.className = 'from-right'
    box.append(s)
  }
})

const openers = $$('.opener').map((el) => {
  const stage = $('.opener__stage', el)
  return { el, stage, from: stage.dataset.theme, to: $('.opener__plane', el).dataset.theme, top: 0, travel: 1, lead: 0, last: -1, p: 1 }
})
const moments = $$('.moment')
const momentEl = $('[data-moment]')
const hud = $('.hud')
const hudParts = $$('[data-hud]').map((el) => ({ el, theme: '' }))
const uni = $('[data-uni]')
const asks = { el: $('[data-asks]'), top: 0, span: 1, idx: -1, items: $$('.ask'), buttons: $$('[data-ask]'), rail: $('[data-rail]'), tl: null }
let vh = innerHeight
let queued = false
let uniTop = 0
let uniBottom = 0

function measure() {
  vh = innerHeight
  const y = scrollY
  openers.forEach((o) => {
    const r = o.el.getBoundingClientRect()
    o.top = r.top + y
    o.travel = Math.max(1, r.height - o.stage.offsetHeight)
    // O corte começa antes de o quadro encostar no topo: nada de tela vazia entre os momentos.
    o.lead = vh * (isDesktop() ? 0.62 : 0.5)
    o.last = -1
  })
  moments.forEach((m) => {
    m._top = m.getBoundingClientRect().top + y
    m._opener = openers.find((o) => m.contains(o.el)) || null
  })
  const a = asks.el.getBoundingClientRect()
  asks.top = a.top + y
  asks.span = Math.max(1, a.height - vh)
  const u = uni.getBoundingClientRect()
  uniTop = u.top + y
  uniBottom = u.bottom + y
}

function setAsk(i) {
  if (i === asks.idx) return
  asks.idx = i
  asks.items.forEach((el, n) => el.classList.toggle('is-active', n === i))
  asks.buttons.forEach((b, n) => (n === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')))
}

function update() {
  queued = false
  const y = scrollY

  openers.forEach((o) => {
    o.p = motion ? clamp((y - o.top + o.lead) / (o.travel + o.lead)) : 1
    if (o.p === o.last) return
    o.last = o.p
    o.stage.style.setProperty('--p', o.p)
  })

  let current = 0
  moments.forEach((m, i) => {
    if (y + 60 >= m._top) current = i
  })
  const m = moments[current]
  const o = m._opener
  const inOpener = Boolean(o && y >= o.top && o.p < 1)
  let bar = m.dataset.theme
  if (y >= uniTop - 60 && y < uniBottom - 60) bar = uni.dataset.theme
  // Cada corte tem seu próprio tema até a metade: a barra acompanha a troca.
  const partTheme = inOpener ? (o.p > 0.5 ? o.to : o.from) : bar
  // Na abertura, a barra é transparente: o disco e os objetos passam por trás.
  hud.classList.toggle('is-sweeping', inOpener || current === 0)
  if (hud.dataset.theme !== bar) hud.dataset.theme = bar
  hudParts.forEach((part) => {
    if (part.theme !== partTheme) {
      part.theme = partTheme
      part.el.dataset.theme = partTheme
    }
  })
  if (momentEl) momentEl.textContent = String(current + 1).padStart(2, '0')

  if (motion && asks.tl) {
    const p = clamp((y - asks.top) / asks.span)
    asks.rail.style.setProperty('--p', p)
    asks.tl.progress(p)
    setAsk(Math.round(p * 4))
  }
}

const requestUpdate = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(update)
}

function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 })
  else window.scrollTo({ top: y, behavior: motion ? 'smooth' : 'auto' })
}

function goTo(id) {
  const section = document.getElementById(id)
  if (!section) return
  const o = openers.find((op) => section.contains(op.el))
  const top = section.getBoundingClientRect().top + scrollY
  // Em Investimento, o destino é o valor já composto, sem a recapitulação que o antecede.
  scrollToY(o ? o.top + (motion ? o.travel : 0) : id === 'abertura' ? 0 : top)
}

/* ---------------------------------- Necessidades: a superfície que se transforma ---------------------------------- */

// Unidades relativas a --u. `s` é a escala extra em telas estreitas, para o caminhão e o site caberem.
const STATES = [
  { w: 46, h: 94, r: 5.5, rx: 7, ry: -22, rz: 3, x: 0, y: 0, s: 0.92 },
  { w: 100, h: 64, r: 1.6, rx: 6, ry: -18, rz: -1, x: -4, y: -3, s: 0.86 },
  { w: 112, h: 46, r: 0.5, rx: 4, ry: -24, rz: 0, x: -17, y: -4, d: 0.88, s: 0.78, sx: -13 },
  { w: 50, h: 70, r: 3, rx: 9, ry: -16, rz: -7, x: 0, y: 0, s: 1 },
  { w: 78, h: 78, r: 1, rx: 54, ry: 0, rz: -24, x: 0, y: 4, s: 0.95 },
]

function buildMorph() {
  const rig = $('[data-rig]')
  const plate = $('[data-plate]')
  const faces = $$('.f', plate)
  const sats = $$('.sat', rig)
  asks.tl?.kill()

  const small = !isDesktop()
  const put = (st) => ({
    '--x': small && st.sx !== undefined ? st.sx : st.x,
    '--y': st.y,
    '--rx': st.rx,
    '--ry': st.ry,
    '--rz': st.rz,
    '--s': small ? st.s : st.d || 1,
  })
  gsap.set(rig, put(STATES[0]))
  gsap.set(plate, { '--w': STATES[0].w, '--h': STATES[0].h, '--r': STATES[0].r })
  faces.forEach((f, i) => gsap.set(f, { autoAlpha: i === 0 ? 1 : 0 }))
  sats.forEach((el) => {
    const on = el.dataset.state === '0'
    gsap.set(el, { autoAlpha: on ? 1 : 0, '--g': on ? 1 : 0 })
  })

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
  for (let i = 1; i < STATES.length; i++) {
    const st = STATES[i]
    // Cada estado fica parado por boa parte do trecho: dá tempo de ler antes de transformar.
    const start = i - 0.62
    tl.to(rig, { ...put(st), duration: 0.56 }, start)
    tl.to(plate, { '--w': st.w, '--h': st.h, '--r': st.r, duration: 0.56 }, start)
    tl.to(faces[i - 1], { autoAlpha: 0, duration: 0.18, ease: 'none' }, start + 0.14)
    tl.to(faces[i], { autoAlpha: 1, duration: 0.18, ease: 'none' }, start + 0.24)
    sats.filter((el) => el.dataset.state === String(i - 1)).forEach((el, n) => {
      tl.to(el, { autoAlpha: 0, '--g': 0, duration: 0.24 }, start + n * 0.015)
    })
    sats.filter((el) => el.dataset.state === String(i)).forEach((el, n) => {
      tl.to(el, { autoAlpha: 1, '--g': 1, duration: 0.3 }, start + 0.26 + n * 0.015)
    })
  }
  tl.to({}, { duration: 0.01 }, 4 - 0.01)
  asks.tl = tl
  tl.progress(motion ? clamp((scrollY - asks.top) / asks.span) : Math.max(asks.idx, 0) / 4)
}

function initMoInteraction() {
  const stage = $('.asks__stage')
  const mo = $('[data-mo]')
  if (motion && hasMouse()) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect()
      gsap.to(mo, { '--mx': (e.clientX - r.left) / r.width - 0.5, '--my': (e.clientY - r.top) / r.height - 0.5, duration: 0.7, overwrite: 'auto' })
    })
  }
  asks.buttons.forEach((b, i) => {
    b.addEventListener('click', () => {
      if (motion) return scrollToY(asks.top + (i / 4) * asks.span)
      setAsk(i)
      asks.tl?.progress(i / 4)
    })
  })
}

/* ---------------------------------- Abertura ---------------------------------- */

function runIntro() {
  const word = $('[data-hero-word]')
  // Letras soltas seriam soletradas por leitor de tela: elas ficam ocultas e o nome inteiro é lido à parte.
  const split = new SplitText(word, { type: 'chars', charsClass: 'ch', aria: 'none' })
  split.chars.forEach((ch) => ch.setAttribute('aria-hidden', 'true'))
  const spoken = document.createElement('span')
  spoken.className = 'vh'
  spoken.textContent = 'PERBONI.'
  word.append(spoken)
  fitAll()
  measure()

  root.classList.add('ready')
  const floats = $$('.float, .hero__disc')
  const rest = ['.hero__lead', '.hero__sign', '.hud__part']

  // As letras chegam fora de ordem e se reorganizam até formar o nome. Cerca de 1,2 s, e qualquer gesto encerra.
  const from = [
    { x: 28, y: 46, r: -9 }, { x: -22, y: -38, r: 7 }, { x: 16, y: 58, r: 5 }, { x: -12, y: -52, r: -6 },
    { x: 24, y: 40, r: 8 }, { x: -30, y: -44, r: -5 }, { x: 12, y: 60, r: 6 },
  ]
  split.chars.forEach((ch, i) => {
    const f = from[i % from.length]
    gsap.set(ch, { xPercent: f.x, yPercent: f.y, rotation: f.r, opacity: 0 })
  })
  gsap.set(floats, { opacity: 0, scale: 0.86 })
  gsap.set(rest, { autoAlpha: 0 })

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      removeSkip()
      gsap.set(rest, { clearProps: 'all' })
      initHeroScroll(split.chars)
    },
  })
  tl.to(split.chars, { opacity: 1, duration: 0.3, ease: 'none', stagger: 0.03 }, 0)
    .to(split.chars, { xPercent: 0, yPercent: 0, rotation: 0, duration: 0.86, stagger: 0.03 }, 0.05)
    .to(floats, { opacity: 1, scale: 1, duration: 0.8, stagger: 0.05 }, 0.25)
    .to(rest, { autoAlpha: 1, duration: 0.45, ease: 'power2.out', stagger: 0.03 }, 0.65)

  const finish = () => tl.progress(1)
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown']
  events.forEach((e) => addEventListener(e, finish, { passive: true }))
  const removeSkip = () => events.forEach((e) => removeEventListener(e, finish))
  if (scrollY > 40 || location.hash.length > 1) finish()

  if (hasMouse()) {
    const movers = $$('[data-depth]').map((el) => ({
      d: Number(el.dataset.depth),
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    }))
    $('.hero').addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      movers.forEach((m) => {
        m.x(nx * -34 * m.d)
        m.y(ny * -24 * m.d)
      })
    })
  }
}

/** Ao rolar, as letras começam a se soltar e os objetos passam em velocidades diferentes. */
function initHeroScroll(chars) {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
  gsap.to(chars, { yPercent: (i) => (i % 2 ? -16 : 16), ease: 'none', scrollTrigger: st })
  $$('[data-depth]').forEach((el) => {
    gsap.to(el, { yPercent: -60 * Number(el.dataset.depth), rotation: 5 * Number(el.dataset.depth), ease: 'none', scrollTrigger: st })
  })
}

/* ---------------------------------- Revelações ---------------------------------- */

function initReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        io.unobserve(e.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  )
  $$('.rv').forEach((el) => io.observe(el))

  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'ln',
      aria: 'none',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, { yPercent: 112, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 86%', once: true } }),
    })
    gsap.set(el, { autoAlpha: 1 })
  })

  // Modelo: os números sobem, mas nunca escondem o horário de quem chega rápido.
  gsap.from('.num__big', { yPercent: 14, opacity: 0.35, duration: 0.8, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.nums', start: 'top 92%', once: true } })
  const cells = $$('.hours i')
  ScrollTrigger.create({
    trigger: '[data-hours]',
    start: 'top 98%',
    end: 'top 72%',
    scrub: 0.3,
    onUpdate: (self) => {
      const n = Math.round(self.progress * cells.length)
      cells.forEach((c, i) => c.classList.toggle('on', i < n))
    },
  })
}

/* ---------------------------------- Compromisso: três módulos que se reorganizam ---------------------------------- */

function initFronts() {
  const mods = $$('.mod')
  const set = (i) => mods.forEach((m, k) => m.classList.toggle('is-active', k === i))
  let hovering = false
  mods.forEach((m, i) => {
    m.addEventListener('pointerenter', () => {
      if (!hasMouse()) return
      hovering = true
      set(i)
    })
    m.addEventListener('pointerleave', () => (hovering = false))
    m.addEventListener('click', () => set(i))
  })
  if (!motion) return

  ScrollTrigger.matchMedia({
    // Desktop: empilhados no centro, abrem em sequência. Mostra que é uma coisa só, antes de mostrar as partes.
    '(min-width: 1024px) and (min-height: 600px)': () => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '[data-fronts]',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (self) => {
            if (!hovering) set(Math.min(2, Math.floor(clamp((self.progress - 0.25) / 0.75) * 3)))
          },
        },
      })
      tl.from(mods[0], { xPercent: 104, rotation: -6, y: 18, duration: 1 }, 0)
        .from(mods[2], { xPercent: -104, rotation: 6, y: 18, duration: 1 }, 0)
        .from(mods[1], { scale: 1.04, duration: 1 }, 0)
        .from('.fronts__title', { y: 28, opacity: 0.5, duration: 0.6 }, 0)
        .to({}, { duration: 0.5 })
    },
    // Toque: coluna vertical, sem tela presa. O módulo do meio da tela é o ativo.
    '(max-width: 1023px)': () => {
      mods.forEach((m, i) => ScrollTrigger.create({ trigger: m, start: 'top 58%', end: 'bottom 40%', onToggle: (s) => s.isActive && set(i) }))
    },
  })
}

/* ---------------------------------- Competências: quatro universos ---------------------------------- */

function initUniverses() {
  const items = $$('.uni__item')
  const buttons = items.map((it) => $('.uni__btn', it))
  const setOpen = (target, open) => {
    items.forEach((item, i) => {
      const on = item === target && open
      item.classList.toggle('is-active', on)
      buttons[i].setAttribute('aria-expanded', String(on))
      if (on && isDesktop()) {
        uni.dataset.theme = $('.uni__panel', item).dataset.theme
        requestUpdate()
      }
    })
  }
  items.forEach((item, i) => {
    const btn = buttons[i]
    btn.addEventListener('click', () => {
      if (isDesktop()) return setOpen(item, true)
      const opening = !item.classList.contains('is-active')
      setOpen(item, opening)
      if (!opening) return
      // O painel anterior fecha acima e desloca a página: só depois disso dá para medir o título.
      const align = (behavior) => {
        const bar = hud.getBoundingClientRect().bottom
        const top = btn.getBoundingClientRect().top
        if (top < bar + 4 || top > innerHeight * 0.5) window.scrollBy({ top: top - bar - 8, behavior })
      }
      setTimeout(() => align(motion ? 'smooth' : 'auto'), 480)
      setTimeout(() => align('auto'), 1050)
    })
    btn.addEventListener('focus', () => {
      if (isDesktop()) setOpen(item, true)
    })
    btn.addEventListener('pointerenter', () => {
      if (isDesktop() && hasMouse()) setOpen(item, true)
    })
    btn.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
      if (!d) return
      e.preventDefault()
      buttons[(i + d + buttons.length) % buttons.length].focus()
    })
  })
}

/* ---------------------------------- Resumo e navegação ---------------------------------- */

function initChrome() {
  const dialog = $('dialog.index')
  $('[data-open-index]').addEventListener('click', () => {
    dialog.showModal()
    lenis?.stop()
  })
  $('[data-close-index]').addEventListener('click', () => dialog.close())
  dialog.addEventListener('close', () => {
    if (lenis?.isStopped) lenis.start()
  })
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close()
  })

  $$('[data-goto]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      if (dialog.open) {
        dialog.close()
        lenis?.start()
      }
      goTo(a.dataset.goto)
    })
  })

  $('.skip').addEventListener('click', (e) => {
    e.preventDefault()
    goTo('conexao')
    const t = $('#t-conexao')
    t.setAttribute('tabindex', '-1')
    t.focus({ preventScroll: true })
  })
}

/* ---------------------------------- Início ---------------------------------- */

async function start() {
  buildPieces()
  initUniverses()
  initChrome()

  // Não espera a fonte para sempre: a abertura não pode ficar refém da rede.
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])

  if (motion && hasMouse() && isDesktop()) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }
  ScrollTrigger.config({ ignoreMobileResize: true })

  fitAll()
  measure()
  setAsk(0)
  buildMorph()
  initMoInteraction()
  initFronts()
  if (motion) {
    runIntro()
    initReveals()
  } else {
    root.classList.add('ready')
  }
  measure()
  update()

  addEventListener('scroll', requestUpdate, { passive: true })

  let resizeTimer
  let wasDesktop = isDesktop()
  addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      fitAll()
      if (wasDesktop !== isDesktop()) {
        wasDesktop = isDesktop()
        if (!wasDesktop) uni.dataset.theme = 'light'
      }
      measure()
      buildMorph()
      ScrollTrigger.refresh()
      update()
    }, 120)
  })

  // Painéis que abrem mudam a altura da página: remede sem refazer os títulos.
  let lastHeight = document.documentElement.scrollHeight
  new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight
    if (h === lastHeight) return
    lastHeight = h
    measure()
    update()
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200)
  }).observe(document.body)

  const hash = location.hash.slice(1)
  if (hash && document.getElementById(hash)) requestAnimationFrame(() => goTo(hash))
}

start().catch((err) => {
  // Qualquer falha de animação cai na versão estática: o conteúdo nunca fica escondido.
  console.error(err)
  motion = false
  root.classList.remove('motion')
  root.classList.add('ready')
  measure()
  update()
})
