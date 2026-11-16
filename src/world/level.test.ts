import { describe, expect, it } from 'vitest'
import { readSave, writeSave, memoryStore, defaultSave } from '../core/save'
import { LILY_PATH, SPAWN } from './content'
import { buildWorld, canWalk, worldToAscii } from './creationMap'
import { bfs } from './pathing'
import { apply, freshState, guideTarget, openGateIds, type CreationState, type GameEvent } from './logic'
import { validateWorld } from './validate'

describe('mapa de la creación', () => {
  const world = buildWorld()

  it('se puede recorrer en orden y los lirios separan las orillas', () => {
    const errors = validateWorld(world)
    expect(errors, worldToAscii(world)).toEqual([])
  })

  it('los lirios del camino son vecinos', () => {
    for (let i = 1; i < LILY_PATH.length; i++) {
      const a = LILY_PATH[i - 1]
      const b = LILY_PATH[i]
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
      expect(dist).toBe(1)
    }
  })

  it('el inicio está en suelo firme', () => {
    expect(canWalk(world, SPAWN.x, SPAWN.y, { open: new Set() })).toBe(true)
  })
})

describe('progreso del relato', () => {
  it('completa los siete días siguiendo la guía', () => {
    let state = freshState()
    let guard = 0
    const openFor = (s: CreationState) => new Set(openGateIds(s))
    let pos = { ...SPAWN }
    while (!state.rested && guard++ < 80) {
      const guide = guideTarget(state)
      expect(guide, `sin guía en el paso ${guard}`).not.toBeNull()
      const world = buildWorld()
      const path = bfs(
        pos,
        (x, y) => x === guide!.x && y === guide!.y,
        (x, y) => canWalk(world, x, y, { open: openFor(state) }),
      )
      expect(path, `no llega a ${guide!.x},${guide!.y}`).not.toBeNull()
      pos = { x: guide!.x, y: guide!.y }
      const step = apply(state, guide!.event)
      state = step.state
    }
    expect(state.rested).toBe(true)
    expect(openGateIds(state)).toContain('gate67')
  })

  it('no deja plantar sin semillas ni descansar antes de tiempo', () => {
    let state = freshState()
    state = apply(state, { type: 'interact', id: 'soil0' }).state
    expect(state.planted[0]).toBe(false)
    state = apply(state, { type: 'interact', id: 'rest' }).state
    expect(state.rested).toBe(false)
  })

  it('rechaza el pedestal equivocado y no pierde la luz', () => {
    let state = freshState()
    state.lights = [true, true, true]
    state.lilyDone = true
    state.planted = [true, true, true]
    state.seeds = [true, true, true]
    const picked = apply(state, { type: 'interact', id: 'orb-mayor' })
    expect(picked.state.holding).toBe('mayor')
    const wrong = apply(picked.state, { type: 'interact', id: 'ped-menor' })
    expect(wrong.state.holding).toBe('mayor')
    expect(wrong.state.placed.menor).toBe(false)
    expect(wrong.effects.some((e) => e.type === 'toast')).toBe(true)
  })

  it('reinicia el sendero de lirios si el paso no sigue a la luciérnaga', () => {
    let state = freshState()
    state.lights = [true, true, true]
    state = apply(state, { type: 'lily', order: 0, decoy: null }).state
    state = apply(state, { type: 'lily', order: 1, decoy: null }).state
    expect(state.lilyStep).toBe(2)
    const bad = apply(state, { type: 'lily', order: 4, decoy: null })
    expect(bad.state.lilyStep).toBe(0)
    expect(bad.state.lilyDone).toBe(false)
  })

  it('guarda y recupera la partida', () => {
    const store = memoryStore()
    const save = defaultSave()
    save.creation = freshState()
    save.creation.lights = [true, false, false]
    save.pos = { x: 120, y: 80 }
    save.settings.music = false
    writeSave(store, save)
    const loaded = readSave(store)
    expect(loaded.creation?.lights[0]).toBe(true)
    expect(loaded.pos).toEqual({ x: 120, y: 80 })
    expect(loaded.settings.music).toBe(false)
    expect(readSave(memoryStore('{'))).toEqual(defaultSave())
  })
})

describe('eventos ignorados si el día todavía no llega', () => {
  it('no marca peces antes de las luces del cielo', () => {
    const state = freshState()
    const next = apply(state, { type: 'fish-home', index: 0 } satisfies GameEvent)
    expect(next.state.fish[0]).toBe(false)
  })
})
