import { freshState, type CreationState } from '../world/logic'
import type { LuminaryId } from '../world/content'

export const SAVE_KEY = 'desde-el-principio-v1'

export type TouchMode = 'auto' | 'on' | 'off'

export interface Settings {
  music: boolean
  sfx: boolean
  musicVolume: number
  sfxVolume: number
  touch: TouchMode
}

export interface SaveV1 {
  v: 1
  settings: Settings
  creation: CreationState | null
  pos: { x: number; y: number } | null
  edenUnlocked: boolean
}

export interface KeyValue {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function defaultSettings(): Settings {
  return { music: true, sfx: true, musicVolume: 0.7, sfxVolume: 0.8, touch: 'auto' }
}

export function defaultSave(): SaveV1 {
  return { v: 1, settings: defaultSettings(), creation: null, pos: null, edenUnlocked: false }
}

function flag3(value: boolean[] | undefined, fallback: [boolean, boolean, boolean]): [boolean, boolean, boolean] {
  if (!value || value.length < 3) return fallback
  return [Boolean(value[0]), Boolean(value[1]), Boolean(value[2])]
}

function flag2(value: boolean[] | undefined, fallback: [boolean, boolean]): [boolean, boolean] {
  if (!value || value.length < 2) return fallback
  return [Boolean(value[0]), Boolean(value[1])]
}

function mergeCreation(raw: Partial<CreationState>): CreationState {
  const base = freshState()
  const lights = flag3(raw.lights, base.lights)
  return {
    ...base,
    ...raw,
    lights,
    seeds: flag3(raw.seeds, base.seeds),
    planted: flag3(raw.planted, base.planted),
    fish: flag2(raw.fish, base.fish),
    birds: flag2(raw.birds, base.birds),
    animals: flag3(raw.animals, base.animals),
    orbs: { ...base.orbs, ...(raw.orbs ?? {}) },
    placed: { ...base.placed, ...(raw.placed ?? {}) },
    secrets: { ...base.secrets, ...(raw.secrets ?? {}) },
    holding: isLuminary(raw.holding) ? raw.holding : null,
  }
}

function isLuminary(value: unknown): value is LuminaryId {
  return value === 'mayor' || value === 'menor' || value === 'stars'
}

export function readSave(store: KeyValue): SaveV1 {
  try {
    const raw = store.getItem(SAVE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as Partial<SaveV1>
    if (parsed.v !== 1 || !parsed.settings) return defaultSave()
    return {
      v: 1,
      settings: { ...defaultSettings(), ...parsed.settings },
      creation: parsed.creation ? mergeCreation(parsed.creation) : null,
      pos: parsed.pos ?? null,
      edenUnlocked: Boolean(parsed.edenUnlocked),
    }
  } catch {
    return defaultSave()
  }
}

export function writeSave(store: KeyValue, data: SaveV1): void {
  store.setItem(SAVE_KEY, JSON.stringify(data))
}

export function memoryStore(initial?: string): KeyValue {
  const bag = new Map<string, string>()
  if (initial) bag.set(SAVE_KEY, initial)
  return {
    getItem: (k) => bag.get(k) ?? null,
    setItem: (k, v) => {
      bag.set(k, v)
    },
    removeItem: (k) => {
      bag.delete(k)
    },
  }
}
