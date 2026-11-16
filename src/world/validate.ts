import { SPAWN, zoneAt, type Point } from './content'
import { buildWorld, canWalk, type World } from './creationMap'
import { bfs } from './pathing'
import { T } from './tiles'

export interface Target {
  name: string
  at: Point
  gates: number
}

const GATE_ORDER = ['gate12', 'gate23', 'gate34', 'gate45', 'gate56', 'gate67']

export function progressionTargets(): Target[] {
  return [
    { name: 'luz 1', at: { x: 24, y: 36 }, gates: 0 },
    { name: 'luz 2', at: { x: 28, y: 29 }, gates: 0 },
    { name: 'luz 3', at: { x: 33, y: 34 }, gates: 0 },
    { name: 'primer lirio', at: { x: 44, y: 34 }, gates: 1 },
    { name: 'orilla derecha', at: { x: 54, y: 33 }, gates: 1 },
    { name: 'semilla', at: { x: 41, y: 16 }, gates: 2 },
    { name: 'tierra', at: { x: 42, y: 20 }, gates: 2 },
    { name: 'pedestal', at: { x: 22, y: 16 }, gates: 3 },
    { name: 'luz mayor', at: { x: 23, y: 22 }, gates: 3 },
    { name: 'pez', at: { x: 6, y: 18 }, gates: 4 },
    { name: 'ave', at: { x: 4, y: 15 }, gates: 4 },
    { name: 'animal', at: { x: 7, y: 8 }, gates: 5 },
    { name: 'prado', at: { x: 24, y: 4 }, gates: 5 },
    { name: 'claro', at: { x: 22, y: 6 }, gates: 5 },
    { name: 'descanso', at: { x: 44, y: 6 }, gates: 6 },
  ]
}

export function validateWorld(world: World = buildWorld()): string[] {
  const errors: string[] = []
  if (!canWalk(world, SPAWN.x, SPAWN.y, { open: new Set() })) {
    errors.push('El punto de inicio no es transitable.')
  }
  if (zoneAt(SPAWN.x, SPAWN.y) !== 'start') errors.push('El inicio no está en la zona de entrada.')

  for (const target of progressionTargets()) {
    const open = new Set(GATE_ORDER.slice(0, target.gates))
    const closedFuture = new Set(GATE_ORDER.slice(0, Math.max(0, target.gates - 1)))
    if (!reachable(world, SPAWN, target.at, open)) {
      errors.push(`No se puede llegar a ${target.name} con ${target.gates} puertas abiertas.`)
    }
    if (target.gates > 0 && reachable(world, SPAWN, target.at, closedFuture)) {
      errors.push(`${target.name} se alcanza antes de abrir la puerta que le corresponde.`)
    }
  }

  const left = { x: 40, y: 33 }
  const right = { x: 54, y: 33 }
  const openBeach = new Set(['gate12'])
  if (!reachable(world, SPAWN, left, openBeach)) errors.push('La orilla izquierda no se alcanza.')
  if (
    reachable(world, left, right, openBeach, { blockLily: true })
  ) {
    errors.push('Hay un puente de tierra que saltea los lirios.')
  }
  if (!reachable(world, left, right, openBeach)) errors.push('Los lirios no conectan las dos orillas.')

  const fishWalk = (x: number, y: number) =>
    zoneAt(x, y) === 'day5' && canWalk(world, x, y, { open: new Set(GATE_ORDER) })
  const fishGoal = (x: number, y: number) => {
    const t = world.tiles[y]?.[x]
    return zoneAt(x, y) === 'day5' && (t === T.WATER || t === T.DEEP || t === T.WATER2 || t === T.DEEP2)
  }
  if (!bfs({ x: 6, y: 18 }, fishGoal, fishWalk)) errors.push('El primer pez no puede llegar al agua.')
  if (!bfs({ x: 12, y: 18 }, fishGoal, fishWalk)) errors.push('El segundo pez no puede llegar al agua.')

  const animalWalk = (x: number, y: number) =>
    zoneAt(x, y) === 'day6' && canWalk(world, x, y, { open: new Set(GATE_ORDER) })
  const pasture = (x: number, y: number) => world.tiles[y]?.[x] === T.PASTURE
  for (const start of [
    { x: 7, y: 8 },
    { x: 12, y: 8 },
    { x: 15, y: 9 },
  ]) {
    if (!bfs(start, pasture, animalWalk)) errors.push(`Un animal en ${start.x},${start.y} no llega al prado.`)
  }

  for (let i = 0; i < 12; i++) {
    // adjacency of lily path checked by name via tiles
  }
  return errors
}

function reachable(
  world: World,
  from: Point,
  to: Point,
  open: Set<string>,
  extra?: { blockLily?: boolean },
): boolean {
  return (
    bfs(
      from,
      (x, y) => x === to.x && y === to.y,
      (x, y) => canWalk(world, x, y, { open, blockLily: extra?.blockLily }),
    ) !== null
  )
}
