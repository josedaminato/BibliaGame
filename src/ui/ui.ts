import { audio } from '../core/audio'
import { input } from '../core/input'
import { session } from '../core/session'
import { GENESIS } from '../data/chapters'
import { FICTION_NOTE } from '../data/copy'
import type { RefEntry } from '../data/copy'
import { discoveryCount, type CreationState } from '../world/logic'

export interface HudModel {
  dayLabel: string
  title: string
  hint: string
  action: string
  doneDays: number
  current: boolean
}

export interface FirmamentModel {
  mode: string
  constellation: boolean
}

type Closer = () => void

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

class DomUI {
  screen = 'boot'
  private overlay!: HTMLElement
  private header!: HTMLElement
  private footer!: HTMLElement
  private toasts!: HTMLElement
  private back: Closer | null = null
  private playing = false
  private onLayout: (() => void) | null = null
  private dayLabel!: HTMLElement
  private title!: HTMLElement
  private hint!: HTMLElement
  private action!: HTMLElement
  private pips!: HTMLElement
  private firmament!: HTMLElement
  private look!: HTMLButtonElement
  private dialogueOpen = false
  private line = ''
  private lineFull = ''
  private lines: string[] = []
  private lineIndex = 0
  private typer = 0
  private onDialogueDone: (() => void) | null = null

  init(): void {
    this.overlay = document.getElementById('overlay')!
    this.header = document.getElementById('chrome-top')!
    this.footer = document.getElementById('chrome-bottom')!
    this.toasts = document.createElement('div')
    this.toasts.id = 'toasts'
    document.getElementById('app')!.append(this.toasts)
    this.buildTouch()
    window.addEventListener('resize', () => this.syncTouch())
    window.addEventListener('touchstart', () => {
      session.touched = true
      this.syncTouch()
    }, { passive: true })
  }

  touchPreferred(): boolean {
    const mode = session.data.settings.touch
    if (mode === 'on') return true
    if (mode === 'off') return false
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820 || session.touched
  }

  setLayoutListener(fn: (() => void) | null): void {
    this.onLayout = fn
  }

  showMenu(actions: { onNew: () => void; onContinue: () => void; onChapters: () => void; onSettings: () => void }): void {
    this.playing = false
    this.header.hidden = true
    this.footer.hidden = true
    this.screen = 'menu'
    this.back = null
    this.clearOverlay()
    const root = el('div', 'menu')
    const copy = el('div', 'menu-copy')
    copy.append(
      el('p', 'eyebrow', 'Una aventura bíblica'),
      el('h1', undefined, 'Desde el Principio'),
      el('p', 'lede', 'Recorré los relatos desde Génesis. Mirá, jugá y, si querés, leé después.'),
    )
    const buttons = el('div', 'menu-actions')
    const hasSave = Boolean(session.data.creation)
    if (hasSave) buttons.append(this.btn('Continuar', actions.onContinue, 'primary'))
    buttons.append(this.btn(hasSave ? 'Nueva partida' : 'Nueva partida', actions.onNew, hasSave ? '' : 'primary'))
    buttons.append(this.btn('Capítulos', actions.onChapters), this.btn('Configuración', actions.onSettings))
    if (!session.persistent) {
      buttons.append(el('p', 'fine', 'Este navegador no deja guardar la partida. Podés jugar igual.'))
    }
    buttons.append(el('p', 'fine', 'Flechas o WASD para caminar. E o Espacio para mirar. Esc para pausar.'))
    root.append(copy, buttons)
    this.overlay.append(root)
    const primary = buttons.querySelector('button')
    window.setTimeout(() => primary?.focus(), 30)
  }

  showChapters(actions: { onPlay: () => void; onPreview: () => void; onBack: () => void }): void {
    this.screen = 'chapters'
    this.back = actions.onBack
    this.clearOverlay()
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel can-scroll')
    panel.append(el('h2', undefined, 'Capítulos'), el('p', 'note', 'Génesis es el comienzo. El resto del camino, de Éxodo a Apocalipsis, se irá abriendo más adelante.'))
    const list = el('div', 'stack')
    for (const card of GENESIS) {
      const done = card.id === 'creacion' && Boolean(session.data.creation?.rested)
      const unlocked = card.id === 'eden' && session.data.edenUnlocked
      const inProgress = card.id === 'creacion' && session.data.creation && !session.data.creation.rested
      let label = card.title
      let detail = card.blurb
      let enabled = false
      let click = actions.onPlay
      if (card.kind === 'level') {
        enabled = true
        label = done ? 'Volver a pasear' : inProgress ? 'Continuar la creación' : 'Jugar la creación'
      } else if (card.kind === 'preview') {
        enabled = unlocked
        label = unlocked ? 'Ver la puerta del Edén' : 'El jardín se asoma al terminar la creación'
        click = actions.onPreview
        detail = unlocked ? card.blurb : 'Terminá La creación para abrir esta presentación.'
      } else {
        detail = 'Más adelante.'
      }
      const button = this.btn('', () => { if (enabled) click() }, 'chapter')
      button.disabled = !enabled
      button.append(el('strong', undefined, card.title), el('small', undefined, `${card.book} · ${card.time}`), el('span', undefined, detail))
      if (done) button.append(el('span', 'badge', 'Completado'))
      if (card.kind === 'level') button.append(el('span', undefined, label))
      list.append(button)
    }
    panel.append(list, this.btn('Volver', actions.onBack))
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  showSettings(onClose: () => void): void {
    this.screen = 'settings'
    this.back = onClose
    this.clearOverlay()
    const settings = session.data.settings
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel can-scroll')
    panel.append(el('h2', undefined, 'Configuración'))
    const music = this.toggle('Música', settings.music, (on) => {
      settings.music = on
      this.persistSettings()
    })
    const sfx = this.toggle('Efectos', settings.sfx, (on) => {
      settings.sfx = on
      this.persistSettings()
    })
    panel.append(
      music,
      this.volume('Volumen de la música', settings.musicVolume, (value) => {
        settings.musicVolume = value
        this.persistSettings()
      }),
      sfx,
      this.volume('Volumen de los efectos', settings.sfxVolume, (value) => {
        settings.sfxVolume = value
        this.persistSettings()
      }),
      this.touchChoice(),
      el('p', 'note', 'El sonido empieza después de tu primer toque o tecla, cuando el navegador lo permite.'),
      this.btn('Listo', onClose, 'primary'),
    )
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  confirm(text: string, onYes: () => void, onNo: () => void): void {
    this.screen = 'confirm'
    this.back = onNo
    this.clearOverlay()
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel')
    panel.append(el('h2', undefined, 'Un momento'), el('p', 'note', text), el('div', 'row'))
    const row = panel.querySelector('.row')!
    row.append(this.btn('Sí, empezar de nuevo', onYes, 'primary'), this.btn('Volver', onNo))
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  enterPlay(handlers: { onPause: () => void; onRelato: () => void; pauseLabel?: string }): void {
    this.playing = true
    this.screen = 'play'
    this.dialogueOpen = false
    this.clearOverlay()
    this.header.hidden = false
    this.header.replaceChildren()
    this.firmament = el('div', 'firmament sky-void')
    this.firmament.append(el('i', 'glow'), el('i', 'sun'), el('i', 'moon'))
    for (const name of ['s1', 's2', 's3', 's4']) this.firmament.append(el('i', `star ${name}`))
    this.firmament.append(el('i', 'bird'), el('i', 'bird b2'))
    const bar = el('div', 'topbar')
    const obj = el('div', 'objective')
    const kicker = el('div', 'kicker')
    this.dayLabel = el('span', undefined, 'Día 1')
    this.pips = el('span', 'pips')
    for (let i = 0; i < 7; i++) this.pips.append(el('i'))
    kicker.append(this.dayLabel, this.pips)
    this.title = el('h2', undefined, '')
    this.hint = el('p', undefined, '')
    this.action = el('p', 'action', '')
    obj.append(kicker, this.title, this.hint, this.action)
    const actions = el('div', 'top-actions')
    actions.append(this.btn('Relato', handlers.onRelato), this.btn(handlers.pauseLabel ?? 'Pausa', handlers.onPause))
    bar.append(obj, actions)
    this.header.append(this.firmament, bar)
    this.syncTouch()
  }

  leavePlay(): void {
    this.playing = false
    this.dialogueOpen = false
    this.header.hidden = true
    this.footer.hidden = true
    this.header.replaceChildren()
    this.clearOverlay()
    this.setLayoutListener(null)
  }

  updateHud(model: HudModel): void {
    if (!this.title) return
    this.dayLabel.textContent = model.dayLabel
    this.title.textContent = model.title
    this.hint.textContent = model.hint
    this.action.textContent = model.action
    const dots = [...this.pips.children]
    dots.forEach((dot, index) => {
      dot.className = index < model.doneDays ? 'on' : !model.current && index === model.doneDays ? '' : index === model.doneDays && model.current ? 'now' : ''
    })
    if (this.look) this.look.classList.toggle('ready', model.action.length > 0 && !model.action.startsWith('Flechas') && !model.action.startsWith('E o'))
  }

  setFirmament(model: FirmamentModel): void {
    if (!this.firmament) return
    this.firmament.className = `firmament sky-${model.mode}`
    this.firmament.dataset.constellation = model.constellation ? '1' : '0'
  }

  toast(text: string): void {
    const node = el('div', 'toast', text)
    this.toasts.append(node)
    window.setTimeout(() => node.remove(), 4200)
  }

  openDialogue(lines: string[], onDone: () => void): void {
    this.dialogueOpen = true
    this.screen = 'dialogue'
    this.lines = lines
    this.lineIndex = 0
    this.onDialogueDone = onDone
    this.clearOverlay()
    const sheet = el('div', 'sheet')
    const who = el('p', 'who', 'Relato')
    const text = el('p')
    text.id = 'dialogue-line'
    const next = this.btn('Seguir', () => this.advanceDialogue(), 'primary')
    sheet.append(who, text, next)
    sheet.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).closest('button')) return
      this.advanceDialogue()
    })
    this.overlay.append(sheet)
    this.showLine()
  }

  advanceDialogue(): void {
    if (!this.dialogueOpen) return
    const node = document.getElementById('dialogue-line')
    if (node && this.line.length < this.lineFull.length) {
      window.clearInterval(this.typer)
      this.line = this.lineFull
      node.textContent = this.line
      return
    }
    this.lineIndex += 1
    if (this.lineIndex >= this.lines.length) {
      this.dialogueOpen = false
      this.clearOverlay()
      this.screen = 'play'
      const done = this.onDialogueDone
      this.onDialogueDone = null
      done?.()
      return
    }
    this.showLine()
  }

  isDialogue(): boolean {
    return this.dialogueOpen
  }

  showPause(model: {
    objective: string
    hint: string
    items: { name: string; detail: string }[]
    secrets: string
    onResume: () => void
    onRelato: () => void
    onSettings: () => void
    onEntrance: () => void
    onNudge: () => void
    onRestart: () => void
    onMenu: () => void
  }): void {
    this.screen = 'pause'
    this.back = model.onResume
    this.clearOverlay()
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel can-scroll')
    panel.append(el('h2', undefined, 'Pausa'), el('h3', undefined, model.objective), el('p', 'note', model.hint), el('h3', undefined, 'Inventario'))
    if (model.items.length === 0) panel.append(el('p', 'note', 'Nada por ahora.'))
    for (const item of model.items) {
      const row = el('p', 'item')
      row.append(el('strong', undefined, item.name), el('span', undefined, item.detail))
      panel.append(row)
    }
    panel.append(el('p', 'note', model.secrets), el('p', 'note', 'El progreso se guarda solo en este navegador.'))
    const stack = el('div', 'stack')
    stack.append(
      this.btn('Seguir jugando', model.onResume, 'primary'),
      this.btn('Leer el relato', model.onRelato),
      this.btn('Volver a la entrada de la zona', model.onEntrance),
      this.btn('Acomodar un paso', model.onNudge),
      this.btn('Configuración', model.onSettings),
      this.btn('Reiniciar este nivel', model.onRestart),
      this.btn('Salir al menú', model.onMenu),
    )
    panel.append(stack)
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  showRelato(refs: RefEntry[], onClose: () => void): void {
    this.screen = 'relato'
    this.back = onClose
    this.clearOverlay()
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel can-scroll')
    panel.append(el('h2', undefined, 'Relato'), el('p', 'note', 'Paráfrasis para acompañar el juego. El texto bíblico está en tu Biblia.'))
    for (const ref of refs) {
      const block = el('div', 'ref')
      block.append(el('strong', undefined, `${ref.title} · ${ref.ref}`), el('p', 'note', ref.text))
      panel.append(block)
    }
    panel.append(el('p', 'note', FICTION_NOTE), this.btn('Cerrar', onClose, 'primary'))
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  showComplete(model: {
    summary: string[]
    ref: string
    secrets: string
    onStroll: () => void
    onPreview: () => void
    onChapters: () => void
  }): void {
    this.screen = 'complete'
    this.back = model.onStroll
    this.clearOverlay()
    const scrim = el('div', 'scrim')
    const panel = el('div', 'panel can-scroll')
    panel.append(el('p', 'eyebrow', 'La creación'), el('h2', undefined, 'Y era bueno en gran manera'))
    for (const line of model.summary) panel.append(el('p', 'note', line))
    panel.append(el('p', 'note', model.ref), el('p', 'note', model.secrets))
    const stack = el('div', 'stack')
    stack.append(
      this.btn('Ver la puerta del Edén', model.onPreview, 'primary'),
      this.btn('Seguir paseando', model.onStroll),
      this.btn('Capítulos', model.onChapters),
    )
    panel.append(stack)
    scrim.append(panel)
    this.overlay.append(scrim)
  }

  backOut(): void {
    this.back?.()
  }

  closeOverlay(): void {
    this.dialogueOpen = false
    this.clearOverlay()
    if (this.playing) this.screen = 'play'
  }

  private showLine(): void {
    this.lineFull = this.lines[this.lineIndex] ?? ''
    this.line = ''
    const node = document.getElementById('dialogue-line')
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.clearInterval(this.typer)
    if (reduce) {
      this.line = this.lineFull
      node.textContent = this.line
      return
    }
    this.typer = window.setInterval(() => {
      this.line = this.lineFull.slice(0, this.line.length + 1)
      node.textContent = this.line
      if (this.line.length >= this.lineFull.length) window.clearInterval(this.typer)
    }, 16)
  }

  private persistSettings(): void {
    session.commit()
    audio.applySettings()
    this.syncTouch()
  }

  private toggle(label: string, initial: boolean, onChange: (on: boolean) => void): HTMLElement {
    const wrap = el('div', 'row')
    const text = el('strong', undefined, label)
    const button = this.btn(initial ? 'Sí' : 'No', () => {
      const next = button.getAttribute('aria-pressed') !== 'true'
      button.setAttribute('aria-pressed', next ? 'true' : 'false')
      button.textContent = next ? 'Sí' : 'No'
      onChange(next)
    }, 'choice')
    button.setAttribute('aria-pressed', initial ? 'true' : 'false')
    wrap.append(text, button)
    return wrap
  }

  private volume(label: string, initial: number, onChange: (value: number) => void): HTMLElement {
    const steps = [0.25, 0.55, 0.8, 1]
    const names = ['Bajo', 'Medio', 'Alto', 'Máximo']
    let index = steps.findIndex((step) => Math.abs(step - initial) < 0.08)
    if (index < 0) index = 2
    const wrap = el('div', 'row')
    const name = el('span', undefined, `${label}: ${names[index]}`)
    const apply = (next: number) => {
      index = Math.max(0, Math.min(steps.length - 1, next))
      name.textContent = `${label}: ${names[index]}`
      onChange(steps[index])
    }
    wrap.append(name, this.btn('−', () => apply(index - 1)), this.btn('+', () => apply(index + 1)))
    return wrap
  }

  private touchChoice(): HTMLElement {
    const wrap = el('div', 'stack')
    wrap.append(el('strong', undefined, 'Controles táctiles'))
    const row = el('div', 'row')
    const current = session.data.settings.touch
    for (const option of [
      ['auto', 'Automático'],
      ['on', 'Siempre'],
      ['off', 'Nunca'],
    ] as const) {
      const button = this.btn(option[1], () => {
        session.data.settings.touch = option[0]
        this.persistSettings()
        row.querySelectorAll('button').forEach((node) => node.setAttribute('aria-pressed', node === button ? 'true' : 'false'))
      }, 'choice')
      button.setAttribute('aria-pressed', current === option[0] ? 'true' : 'false')
      row.append(button)
    }
    wrap.append(row)
    return wrap
  }

  private buildTouch(): void {
    this.footer.replaceChildren()
    const row = el('div', 'touch-row')
    const pad = el('div', 'dpad')
    const dirs: { cls: string; label: string; x: number; y: number }[] = [
      { cls: 'up', label: 'Arriba', x: 0, y: -1 },
      { cls: 'down', label: 'Abajo', x: 0, y: 1 },
      { cls: 'left', label: 'Izquierda', x: -1, y: 0 },
      { cls: 'right', label: 'Derecha', x: 1, y: 0 },
    ]
    const held = new Set<string>()
    const sync = () => {
      let x = 0
      let y = 0
      if (held.has('left')) x -= 1
      if (held.has('right')) x += 1
      if (held.has('up')) y -= 1
      if (held.has('down')) y += 1
      input.setTouch(x, y)
    }
    for (const dir of dirs) {
      const button = el('button', dir.cls)
      button.type = 'button'
      button.setAttribute('aria-label', dir.label)
      button.textContent = dir.label === 'Arriba' ? '▲' : dir.label === 'Abajo' ? '▼' : dir.label === 'Izquierda' ? '◀' : '▶'
      const id = dir.cls
      const press = (event: PointerEvent) => {
        event.preventDefault()
        button.setPointerCapture(event.pointerId)
        held.add(id)
        sync()
      }
      const release = () => {
        held.delete(id)
        sync()
      }
      button.addEventListener('pointerdown', press)
      button.addEventListener('pointerup', release)
      button.addEventListener('pointercancel', release)
      button.addEventListener('lostpointercapture', release)
      pad.append(button)
    }
    this.look = el('button')
    this.look.id = 'btn-look'
    this.look.type = 'button'
    this.look.textContent = 'Mirar'
    this.look.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      input.queueInteract()
    })
    row.append(pad, this.look)
    this.footer.append(row)
  }

  private syncTouch(): void {
    const show = this.playing && this.touchPreferred()
    this.footer.hidden = !show
    requestAnimationFrame(() => {
      const height = show ? this.footer.offsetHeight : 0
      document.documentElement.style.setProperty('--foot', `${height}px`)
      this.onLayout?.()
    })
  }

  private btn(label: string, onClick: () => void, className = ''): HTMLButtonElement {
    const button = el('button', className, label)
    button.type = 'button'
    button.addEventListener('click', () => {
      audio.unlock()
      audio.sfx('ui')
      onClick()
    })
    return button
  }

  private clearOverlay(): void {
    window.clearInterval(this.typer)
    this.overlay.replaceChildren()
  }
}

export const ui = new DomUI()

export function secretsLine(state: CreationState): string {
  const count = discoveryCount(state)
  const names = [
    state.secrets.frog ? 'la rana' : '',
    state.secrets.shell ? 'la concha' : '',
    state.secrets.spring ? 'el manantial' : '',
    state.secrets.star ? 'la estrella' : '',
  ].filter(Boolean)
  const found = names.length ? ` Encontraste ${names.join(', ')}.` : ''
  return `Secretos del juego: ${count.found}/${count.total}.${found}`
}
