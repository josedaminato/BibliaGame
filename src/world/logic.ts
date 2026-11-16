import { DAY_TOAST, LUMINARY_NAME, REFS, SIGN_LINES, type RefEntry } from '../data/copy'
import {
  ANIMALS,
  BIRDS,
  CHECKPOINTS,
  FISH,
  HUMAN_PATH,
  LIGHTS,
  LILY_PATH,
  ORBS,
  PEDESTALS,
  REST,
  SEEDS,
  SOILS,
  type LuminaryId,
  type Point,
} from '../world/content'

export interface CreationState {
  welcomed: boolean
  introSeen: boolean
  lights: [boolean, boolean, boolean]
  lilyStep: number
  lilyDone: boolean
  lilyHintShown: boolean
  seeds: [boolean, boolean, boolean]
  planted: [boolean, boolean, boolean]
  orbs: Record<LuminaryId, boolean>
  holding: LuminaryId | null
  placed: Record<LuminaryId, boolean>
  fish: [boolean, boolean]
  birds: [boolean, boolean]
  animals: [boolean, boolean, boolean]
  humansArrived: boolean
  humansSeen: boolean
  rested: boolean
  summaryDismissed: boolean
  secrets: { frog: boolean; shell: boolean; spring: boolean; star: boolean }
}

export function freshState(): CreationState {
  return {
    welcomed: false,
    introSeen: false,
    lights: [false, false, false],
    lilyStep: 0,
    lilyDone: false,
    lilyHintShown: false,
    seeds: [false, false, false],
    planted: [false, false, false],
    orbs: { mayor: false, menor: false, stars: false },
    holding: null,
    placed: { mayor: false, menor: false, stars: false },
    fish: [false, false],
    birds: [false, false],
    animals: [false, false, false],
    humansArrived: false,
    humansSeen: false,
    rested: false,
    summaryDismissed: false,
    secrets: { frog: false, shell: false, spring: false, star: false },
  }
}

export type Mood = 'explore' | 'mystery' | 'humor' | 'danger' | 'drama' | 'victory' | 'solemn' | 'silence'

export type SfxName = 'ui' | 'no' | 'sparkle' | 'grow' | 'splash' | 'chime' | 'step' | 'discover' | 'fanfare' | 'place'

export type Effect =
  | { type: 'toast'; text: string }
  | { type: 'dialogue'; lines: string[] }
  | { type: 'sfx'; name: SfxName }
  | { type: 'ambient'; mood: Mood }
  | { type: 'sting'; mood: Mood; ms: number }
  | { type: 'humans' }
  | { type: 'complete' }

export type GameEvent =
  | { type: 'welcome' }
  | { type: 'interact'; id: string }
  | { type: 'lily'; order: number | null; decoy: 'frog' | 'shell' | null }
  | { type: 'fish-home'; index: number }
  | { type: 'animal-home'; index: number }
  | { type: 'arrive-humans' }
  | { type: 'see-humans' }

const LIGHT_IDS = ['light0', 'light1', 'light2']
const LUMINARIES: LuminaryId[] = ['mayor', 'menor', 'stars']

export function completedDay(s: CreationState): number {
  if (!s.lights.every(Boolean)) return 0
  if (!s.lilyDone) return 1
  if (!s.planted.every(Boolean)) return 2
  if (!s.placed.mayor || !s.placed.menor || !s.placed.stars) return 3
  if (!s.fish.every(Boolean) || !s.birds.every(Boolean)) return 4
  if (!s.animals.every(Boolean) || !s.humansSeen) return 5
  if (!s.rested) return 6
  return 7
}

export function openGateIds(s: CreationState): string[] {
  const ids: string[] = []
  if (s.lights.every(Boolean)) ids.push('gate12')
  if (s.lilyDone) ids.push('gate23')
  if (s.planted.every(Boolean)) ids.push('gate34')
  if (s.placed.mayor && s.placed.menor && s.placed.stars) ids.push('gate45')
  if (s.fish.every(Boolean) && s.birds.every(Boolean)) ids.push('gate56')
  if (s.humansSeen) ids.push('gate67')
  return ids
}

export function seedsInHand(s: CreationState): number {
  return s.seeds.filter(Boolean).length - s.planted.filter(Boolean).length
}

export function hasFruit(s: CreationState): boolean {
  return s.planted.every(Boolean)
}

export function checkpointFor(s: CreationState): Point {
  return CHECKPOINTS[Math.min(completedDay(s), CHECKPOINTS.length - 1)]
}

export interface Objective {
  dayLabel: string
  title: string
  hint: string
  ref: string
}

export function objective(s: CreationState): Objective {
  const day = completedDay(s)
  if (s.rested) {
    return {
      dayLabel: 'Completo',
      title: 'La creación está en calma',
      hint: 'Podés seguir paseando. El resumen está en Pausa.',
      ref: 'Génesis 1:1–2:3',
    }
  }
  if (day <= 0) {
    const n = s.lights.filter(Boolean).length
    return {
      dayLabel: 'Día 1',
      title: 'Encontrá la luz',
      hint: `Acercate a los resplandores de la zona oscura. ${n}/3`,
      ref: REFS[0].ref,
    }
  }
  if (day === 1) {
    return {
      dayLabel: 'Día 2',
      title: 'Cruzá entre las aguas',
      hint: s.lilyDone ? 'El cielo ya se abrió.' : `Seguí a la luciérnaga. Lirio ${Math.min(s.lilyStep + 1, LILY_PATH.length)}/${LILY_PATH.length}`,
      ref: REFS[1].ref,
    }
  }
  if (day === 2) {
    const bag = seedsInHand(s)
    const planted = s.planted.filter(Boolean).length
    return {
      dayLabel: 'Día 3',
      title: 'Mirá el verde brotar',
      hint:
        bag > 0 || s.seeds.every(Boolean)
          ? `Dejá semillas en la tierra removida. ${planted}/3`
          : `Juntá semillas. ${s.seeds.filter(Boolean).length}/3`,
      ref: REFS[2].ref,
    }
  }
  if (day === 3) {
    const placed = LUMINARIES.filter((k) => s.placed[k]).length
    return {
      dayLabel: 'Día 4',
      title: 'Acomodá las luces del cielo',
      hint: s.holding
        ? `Llevá la ${LUMINARY_NAME[s.holding].toLowerCase()} a su pedestal. ${placed}/3`
        : `Juntá cada luz y dejala en el dibujo que coincida. ${placed}/3`,
      ref: REFS[3].ref,
    }
  }
  if (day === 4) {
    const fish = s.fish.filter(Boolean).length
    const birds = s.birds.filter(Boolean).length
    return {
      dayLabel: 'Día 5',
      title: 'Agua para los peces, cielo para las aves',
      hint: `Peces ${fish}/2 · Aves ${birds}/2`,
      ref: REFS[4].ref,
    }
  }
  if (day === 5) {
    const animals = s.animals.filter(Boolean).length
    if (!s.animals.every(Boolean)) {
      return {
        dayLabel: 'Día 6',
        title: 'Acompañá a los animales',
        hint: `Llevalos al prado verde. ${animals}/3`,
        ref: REFS[5].ref,
      }
    }
    if (!s.humansArrived) {
      return {
        dayLabel: 'Día 6',
        title: 'El claro se ilumina',
        hint: 'Quedate cerca. Alguien se está acercando.',
        ref: REFS[5].ref,
      }
    }
    return {
      dayLabel: 'Día 6',
      title: 'Acercate a mirar',
      hint: 'Las personas ya están en el claro.',
      ref: REFS[5].ref,
    }
  }
  return {
    dayLabel: 'Día 7',
    title: 'Descansá',
    hint: 'Buscá el círculo tranquilo y sentate un momento.',
    ref: REFS[6].ref,
  }
}

export function refsFor(s: CreationState): RefEntry[] {
  const last = s.rested ? 7 : Math.min(7, completedDay(s) + 1)
  return REFS.filter((r) => r.day <= Math.max(1, last))
}

export interface Guide {
  x: number
  y: number
  event: GameEvent
}

export function guideTarget(s: CreationState): Guide | null {
  if (s.rested) return null
  if (!s.lights.every(Boolean)) {
    const i = s.lights.findIndex((v) => !v)
    return { ...LIGHTS[i], event: { type: 'interact', id: LIGHT_IDS[i] } }
  }
  if (!s.lilyDone) {
    const step = Math.min(s.lilyStep, LILY_PATH.length - 1)
    return { ...LILY_PATH[step], event: { type: 'lily', order: step, decoy: null } }
  }
  if (!s.planted.every(Boolean) || !s.seeds.every(Boolean)) {
    if (seedsInHand(s) > 0 && !s.planted.every(Boolean)) {
      const i = s.planted.findIndex((v) => !v)
      return { ...SOILS[i], event: { type: 'interact', id: `soil${i}` } }
    }
    if (!s.seeds.every(Boolean)) {
      const i = s.seeds.findIndex((v) => !v)
      return { ...SEEDS[i], event: { type: 'interact', id: `seed${i}` } }
    }
    const i = s.planted.findIndex((v) => !v)
    return { ...SOILS[i], event: { type: 'interact', id: `soil${i}` } }
  }
  if (!s.placed.mayor || !s.placed.menor || !s.placed.stars) {
    if (s.holding) return { ...PEDESTALS[s.holding], event: { type: 'interact', id: `ped-${s.holding}` } }
    const next = LUMINARIES.find((k) => !s.orbs[k])!
    return { ...ORBS[next], event: { type: 'interact', id: `orb-${next}` } }
  }
  if (!s.fish.every(Boolean)) {
    const i = s.fish.findIndex((v) => !v)
    return { ...FISH[i], event: { type: 'fish-home', index: i } }
  }
  if (!s.birds.every(Boolean)) {
    const i = s.birds.findIndex((v) => !v)
    return { ...BIRDS[i], event: { type: 'interact', id: `bird${i}` } }
  }
  if (!s.animals.every(Boolean)) {
    const i = s.animals.findIndex((v) => !v)
    return { ...ANIMALS[i], event: { type: 'animal-home', index: i } }
  }
  if (!s.humansArrived) {
    const dest = HUMAN_PATH[HUMAN_PATH.length - 1]
    return { ...dest, event: { type: 'arrive-humans' } }
  }
  if (!s.humansSeen) {
    const dest = HUMAN_PATH[HUMAN_PATH.length - 1]
    return { ...dest, event: { type: 'see-humans' } }
  }
  return { ...REST, event: { type: 'interact', id: 'rest' } }
}

export function discoveryCount(s: CreationState): { found: number; total: number } {
  const vals = Object.values(s.secrets)
  return { found: vals.filter(Boolean).length, total: vals.length }
}

export function inventoryLines(s: CreationState): { name: string; detail: string }[] {
  const items: { name: string; detail: string }[] = []
  const seeds = seedsInHand(s)
  if (seeds > 0) items.push({ name: 'Semillas', detail: `${seeds} en la mano` })
  if (hasFruit(s)) items.push({ name: 'Fruto', detail: 'Recuerdo del tercer día. Atrae a los animales.' })
  if (s.holding) items.push({ name: LUMINARY_NAME[s.holding], detail: 'Llevala al pedestal con el mismo dibujo.' })
  if (s.secrets.shell) items.push({ name: 'Concha brillante', detail: 'Secreto del juego, no del relato.' })
  if (items.length === 0) items.push({ name: 'Nada por ahora', detail: 'Lo que juntes aparece acá.' })
  return items
}

export interface StepResult {
  state: CreationState
  effects: Effect[]
}

export function apply(prev: CreationState, event: GameEvent): StepResult {
  const state = clone(prev)
  const effects: Effect[] = []
  const before = completedDay(prev)

  switch (event.type) {
    case 'welcome':
      if (!state.welcomed) {
        state.welcomed = true
        effects.push({
          type: 'toast',
          text: 'Todo está quieto y oscuro. Caminá y usá E o Espacio para mirar de cerca.',
        })
      }
      break
    case 'interact':
      interact(state, event.id, effects)
      break
    case 'lily':
      onLily(state, event, effects)
      break
    case 'fish-home':
      if (luminariesReady(state) && !state.fish[event.index]) {
        state.fish[event.index] = true
        effects.push({ type: 'sfx', name: 'splash' })
        effects.push({ type: 'toast', text: `Un pez vuelve al agua. ${state.fish.filter(Boolean).length}/2` })
      }
      break
    case 'animal-home':
      if (coastReady(state) && !state.animals[event.index]) {
        state.animals[event.index] = true
        effects.push({ type: 'sfx', name: 'chime' })
        if (state.animals.every(Boolean)) {
          effects.push({ type: 'toast', text: 'El prado está habitado. Mirá el claro.' })
          effects.push({ type: 'humans' })
        }
      }
      break
    case 'arrive-humans':
      if (state.animals.every(Boolean) && !state.humansArrived) {
        state.humansArrived = true
        effects.push({ type: 'ambient', mood: 'drama' })
        effects.push({ type: 'toast', text: 'Dos personas llegan al claro. Acercate.' })
      }
      break
    case 'see-humans':
      if (state.humansArrived && state.animals.every(Boolean) && !state.humansSeen) {
        state.humansSeen = true
        effects.push({ type: 'sfx', name: 'chime' })
        effects.push({
          type: 'toast',
          text: 'Dios creó a la humanidad. La apariencia de estas figuras es ilustrativa: el texto no describe su rostro.',
        })
      }
      break
    default:
      break
  }

  const after = completedDay(state)
  for (let d = before + 1; d <= after; d++) effects.push(...milestone(d))
  return { state, effects }
}

function interact(state: CreationState, id: string, effects: Effect[]): void {
  if (SIGN_LINES[id]) {
    if (id === 'intro') state.introSeen = true
    effects.push({ type: 'dialogue', lines: SIGN_LINES[id] })
    effects.push({ type: 'sfx', name: 'ui' })
    return
  }
  if (id.startsWith('light')) {
    const i = Number(id.slice(5))
    if (!state.lights[i]) {
      state.lights[i] = true
      const n = state.lights.filter(Boolean).length
      effects.push({ type: 'sfx', name: 'sparkle' })
      if (n < 3) effects.push({ type: 'toast', text: `Resplandor ${n} de 3. La oscuridad se corre.` })
    }
    return
  }
  if (id.startsWith('seed')) {
    if (!state.lilyDone) return
    const i = Number(id.slice(4))
    if (!state.seeds[i]) {
      state.seeds[i] = true
      effects.push({ type: 'sfx', name: 'place' })
      effects.push({ type: 'toast', text: `Semilla ${state.seeds.filter(Boolean).length}/3.` })
    }
    return
  }
  if (id.startsWith('soil')) {
    if (!state.lilyDone) return
    const i = Number(id.slice(4))
    if (state.planted[i]) return
    if (seedsInHand(state) <= 0) {
      effects.push({ type: 'sfx', name: 'no' })
      effects.push({ type: 'toast', text: 'Primero juntá una semilla.' })
      return
    }
    state.planted[i] = true
    effects.push({ type: 'sfx', name: 'grow' })
    effects.push({ type: 'toast', text: `Brota un verde nuevo. ${state.planted.filter(Boolean).length}/3` })
    return
  }
  if (id.startsWith('orb-')) {
    if (!state.planted.every(Boolean)) return
    const which = id.slice(4) as LuminaryId
    if (state.placed[which] || state.orbs[which]) {
      effects.push({ type: 'toast', text: 'Esa luz ya la tomaste.' })
      return
    }
    if (state.holding) {
      effects.push({ type: 'sfx', name: 'no' })
      effects.push({ type: 'toast', text: 'Dejá primero la luz que llevás, en su pedestal.' })
      return
    }
    state.orbs[which] = true
    state.holding = which
    effects.push({ type: 'sfx', name: 'chime' })
    effects.push({ type: 'toast', text: `${LUMINARY_NAME[which]} en tus manos.` })
    return
  }
  if (id.startsWith('ped-')) {
    if (!state.planted.every(Boolean)) return
    const which = id.slice(4) as LuminaryId
    if (state.placed[which]) return
    if (state.holding !== which) {
      effects.push({ type: 'sfx', name: 'no' })
      effects.push({
        type: 'toast',
        text: state.holding
          ? 'Ese pedestal muestra otro dibujo.'
          : 'Primero levantá la luz que coincide con el dibujo.',
      })
      return
    }
    state.placed[which] = true
    state.holding = null
    effects.push({ type: 'sfx', name: 'place' })
    const n = LUMINARIES.filter((k) => state.placed[k]).length
    effects.push({ type: 'toast', text: `${LUMINARY_NAME[which]} queda en su lugar. ${n}/3` })
    return
  }
  if (id.startsWith('bird')) {
    if (!luminariesReady(state)) return
    const i = Number(id.slice(4))
    if (!state.birds[i]) {
      state.birds[i] = true
      effects.push({ type: 'sfx', name: 'discover' })
      effects.push({ type: 'toast', text: `Un ave toma el cielo. ${state.birds.filter(Boolean).length}/2` })
    }
    return
  }
  if (id === 'shell') {
    if (!state.lights.every(Boolean)) return
    if (!state.secrets.shell) {
      state.secrets.shell = true
      effects.push({ type: 'sfx', name: 'discover' })
      effects.push({ type: 'sting', mood: 'humor', ms: 4200 })
      effects.push({ type: 'toast', text: 'Una concha brillante. Es un secreto del juego, no del relato.' })
    }
    return
  }
  if (id === 'spring') {
    if (!state.lilyDone) return
    if (!state.secrets.spring) {
      state.secrets.spring = true
      effects.push({ type: 'sfx', name: 'discover' })
      effects.push({ type: 'toast', text: 'Un manantial escondido. También es un secreto del juego.' })
    }
    return
  }
  if (id === 'star') {
    if (!state.planted.every(Boolean)) return
    if (!state.secrets.star) {
      state.secrets.star = true
      effects.push({ type: 'sfx', name: 'discover' })
      effects.push({ type: 'toast', text: 'Una estrella traviesa guiña en el cielo. Secreto del juego.' })
    }
    return
  }
  if (id === 'rest') {
    if (state.humansSeen && !state.rested) {
      state.rested = true
      effects.push({ type: 'sfx', name: 'fanfare' })
    }
  }
}

function onLily(
  state: CreationState,
  event: Extract<GameEvent, { type: 'lily' }>,
  effects: Effect[],
): void {
  if (!state.lights.every(Boolean) || state.lilyDone) return
  if (event.decoy) {
    if (event.decoy === 'frog' && !state.secrets.frog) {
      state.secrets.frog = true
      effects.push({ type: 'sting', mood: 'humor', ms: 3800 })
      effects.push({ type: 'toast', text: '¡Croá! Esta rana no está en el relato. Solo vive en el juego.' })
    }
    if (state.lilyStep > 0) {
      state.lilyStep = 0
      if (!state.lilyHintShown) {
        state.lilyHintShown = true
        effects.push({ type: 'toast', text: 'Ese lirio no sigue a la luciérnaga. Volvé al primero, sin apuro.' })
      } else {
        effects.push({ type: 'sfx', name: 'no' })
      }
    }
    return
  }
  if (event.order === null) return
  if (event.order === state.lilyStep) {
    state.lilyStep += 1
    effects.push({ type: 'sfx', name: 'sparkle' })
    if (state.lilyStep >= LILY_PATH.length) state.lilyDone = true
    return
  }
  if (event.order === 0) {
    state.lilyStep = 1
    effects.push({ type: 'sfx', name: 'sparkle' })
    return
  }
  state.lilyStep = 0
  if (!state.lilyHintShown) {
    state.lilyHintShown = true
    effects.push({ type: 'toast', text: 'Ese lirio no sigue a la luciérnaga. Volvé al primero, sin apuro.' })
  } else {
    effects.push({ type: 'sfx', name: 'no' })
  }
}

function luminariesReady(s: CreationState): boolean {
  return s.placed.mayor && s.placed.menor && s.placed.stars
}

function coastReady(s: CreationState): boolean {
  return s.fish.every(Boolean) && s.birds.every(Boolean)
}

function milestone(day: number): Effect[] {
  const effects: Effect[] = [
    { type: 'toast', text: DAY_TOAST[day] },
    { type: 'sfx', name: day === 7 ? 'fanfare' : 'chime' },
  ]
  if (day === 1) effects.push({ type: 'ambient', mood: 'explore' })
  if (day === 2) effects.push({ type: 'ambient', mood: 'explore' })
  if (day === 6) effects.push({ type: 'ambient', mood: 'drama' })
  if (day === 7) {
    effects.push({ type: 'ambient', mood: 'solemn' })
    effects.push({ type: 'complete' })
  }
  return effects
}

function clone(s: CreationState): CreationState {
  return JSON.parse(JSON.stringify(s)) as CreationState
}

export function skyView(s: CreationState): {
  mode: 'void' | 'dawn' | 'waters' | 'green' | 'lights' | 'life' | 'rest'
  mayor: boolean
  menor: boolean
  stars: boolean
  constellation: boolean
} {
  const day = completedDay(s)
  let mode: 'void' | 'dawn' | 'waters' | 'green' | 'lights' | 'life' | 'rest' = 'void'
  if (s.rested || day >= 6) mode = s.rested ? 'rest' : 'life'
  else if (day >= 5) mode = 'life'
  else if (day >= 4 || s.placed.mayor || s.placed.menor || s.placed.stars) mode = 'lights'
  else if (day >= 3) mode = 'green'
  else if (day >= 2) mode = 'waters'
  else if (day >= 1 || s.lights.some(Boolean)) mode = 'dawn'
  if (s.rested) mode = 'rest'
  return {
    mode,
    mayor: s.placed.mayor || day >= 4,
    menor: s.placed.menor || day >= 4,
    stars: s.placed.stars || day >= 4,
    constellation: s.secrets.star,
  }
}

export function zoneMood(zone: string, s: CreationState): Mood {
  if (s.rested || zone === 'day7') return 'solemn'
  if ((zone === 'start' || zone === 'day1') && completedDay(s) < 1) return 'mystery'
  if (zone === 'day2' && !s.lilyDone) return 'mystery'
  if (zone === 'day6' && s.humansArrived && !s.humansSeen) return 'drama'
  return 'explore'
}
