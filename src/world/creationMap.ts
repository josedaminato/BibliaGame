import {
  BLOOMS,
  COAST_WATER,
  DEEP_RECT,
  DOORS,
  LILY_DECOYS,
  LILY_PATH,
  MAP_H,
  MAP_W,
  NORTH_DAM,
  PASTURE,
  ROOMS,
  SOUTH_DAM,
  SOILS,
  WATER_RECT,
  keyOf,
  zoneAt,
  type Point,
  type ZoneId,
} from './content'
import { T, isSolidIndex } from './tiles'

export interface World {
  w: number
  h: number
  tiles: number[][]
  gateAt: Map<string, string>
  mist: Set<string>
  lilyOrder: Map<string, number>
  lilyDecoy: Map<string, 'frog' | 'shell'>
  waterTiles: Point[]
}

export function buildWorld(): World {
  const tiles: number[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.VOID))
  const floorOf: Record<ZoneId, number> = {
    start: T.PATH,
    day1: T.DARK,
    day2: T.SAND,
    day3: T.DIRT,
    day4: T.HILL,
    day5: T.SAND,
    day6: T.GRASS,
    day7: T.REST,
  }

  for (const id of Object.keys(ROOMS) as ZoneId[]) {
    const r = ROOMS[id]
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        const edge = x === r.x0 || y === r.y0 || x === r.x1 || y === r.y1
        if (edge) {
          tiles[y][x] = (x + y) % 5 === 0 ? T.STONE2 : T.STONE
        } else {
          const base = floorOf[id]
          const alt =
            base === T.DARK ? T.DARK2 : base === T.GRASS ? T.GRASS2 : base === T.PATH ? T.PATH2 : base
          tiles[y][x] = (x * 3 + y * 5) % 4 === 0 ? alt : base
        }
      }
    }
  }

  fillRect(tiles, WATER_RECT, T.WATER)
  fillRect(tiles, DEEP_RECT, T.DEEP)
  fillRect(tiles, NORTH_DAM, T.STONE)
  fillRect(tiles, SOUTH_DAM, T.STONE)
  fillRect(tiles, COAST_WATER, T.WATER)
  for (let y = COAST_WATER.y0; y <= COAST_WATER.y1; y++) {
    for (let x = COAST_WATER.x0 + 2; x <= COAST_WATER.x1 - 2; x++) {
      if ((x + y) % 3 === 0) tiles[y][x] = T.DEEP
    }
  }

  const lilyOrder = new Map<string, number>()
  LILY_PATH.forEach((p, i) => {
    tiles[p.y][p.x] = T.LILY
    lilyOrder.set(keyOf(p.x, p.y), i)
  })
  const lilyDecoy = new Map<string, 'frog' | 'shell'>()
  for (const d of LILY_DECOYS) {
    tiles[d.y][d.x] = T.LILY
    lilyDecoy.set(keyOf(d.x, d.y), d.kind)
  }

  for (const soil of SOILS) tiles[soil.y][soil.x] = T.SOIL
  for (const p of PASTURE) tiles[p.y][p.x] = T.PASTURE
  stampRoads(tiles)

  const gateAt = new Map<string, string>()
  for (const door of DOORS) {
    for (const t of door.tiles) {
      if (door.id) {
        tiles[t.y][t.x] = T.GATE
        gateAt.set(keyOf(t.x, t.y), door.id)
      } else {
        tiles[t.y][t.x] = T.PATH
      }
    }
  }

  const mist = new Set<string>()
  for (let y = NORTH_DAM.y0; y <= NORTH_DAM.y1; y++) {
    for (let x = NORTH_DAM.x0; x <= NORTH_DAM.x1; x++) mist.add(keyOf(x, y))
  }

  const waterTiles: Point[] = []
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = tiles[y][x]
      if (t === T.WATER || t === T.WATER2 || t === T.DEEP || t === T.DEEP2) waterTiles.push({ x, y })
    }
  }

  return { w: MAP_W, h: MAP_H, tiles, gateAt, mist, lilyOrder, lilyDecoy, waterTiles }
}

function stampRoads(tiles: number[][]): void {
  const road = (x: number, y: number) => {
    const tile = tiles[y]?.[x]
    if (tile === undefined || tile === T.WATER || tile === T.DEEP || tile === T.LILY || tile === T.SOIL || tile === T.PASTURE) return
    tiles[y][x] = (x + y) % 2 === 0 ? T.PATH : T.PATH2
  }
  for (let x = 4; x <= 17; x++) road(x, 36)
  for (let x = 19; x <= 36; x++) {
    road(x, 32)
    road(x, 33)
  }
  for (let y = 34; y <= 36; y++) road(24, y)
  for (let y = 29; y <= 32; y++) road(28, y)
  for (let y = 33; y <= 36; y++) road(33, y)
  for (let x = 38; x <= 43; x++) {
    road(x, 33)
    road(x, 34)
  }
  for (let y = 27; y <= 36; y++) road(54, y)
  for (let y = 18; y <= 25; y++) road(54, y)
  for (let x = 38; x <= 54; x++) road(x, 19)
  for (let x = 19; x <= 36; x++) {
    road(x, 18)
    road(x, 19)
  }
  for (let y = 16; y <= 22; y++) road(24, y)
  for (let x = 4; x <= 17; x++) road(x, 19)
  for (let y = 6; y <= 11; y++) road(9, y)
  for (let x = 9; x <= 23; x++) road(x, 5)
  for (let x = 33; x <= 42; x++) road(x, 6)
}

function fillRect(
  tiles: number[][],
  rect: { x0: number; y0: number; x1: number; y1: number },
  index: number,
): void {
  for (let y = rect.y0; y <= rect.y1; y++) {
    for (let x = rect.x0; x <= rect.x1; x++) tiles[y][x] = index
  }
}

export interface WalkFlags {
  open: Set<string>
  blockLily?: boolean
  mistOpen?: boolean
}

export function canWalk(world: World, x: number, y: number, flags: WalkFlags): boolean {
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return false
  const gate = world.gateAt.get(keyOf(x, y))
  if (gate) return flags.open.has(gate)
  if (flags.mistOpen && world.mist.has(keyOf(x, y))) return true
  const tile = world.tiles[y][x]
  if (flags.blockLily && tile === T.LILY) return false
  return !isSolidIndex(tile)
}

export function worldToAscii(world: World, marks: { x: number; y: number; c: string }[] = []): string {
  const mark = new Map(marks.map((m) => [keyOf(m.x, m.y), m.c]))
  const rows: string[] = []
  for (let y = 0; y < world.h; y++) {
    let line = ''
    for (let x = 0; x < world.w; x++) {
      const tagged = mark.get(keyOf(x, y))
      if (tagged) {
        line += tagged
        continue
      }
      const gate = world.gateAt.get(keyOf(x, y))
      if (gate) {
        line += 'G'
        continue
      }
      const t = world.tiles[y][x]
      line += charFor(t)
    }
    rows.push(line)
  }
  return rows.join('\n')
}

function charFor(t: number): string {
  switch (t) {
    case T.VOID:
      return ' '
    case T.STONE:
    case T.STONE2:
      return '#'
    case T.WATER:
    case T.WATER2:
      return '~'
    case T.DEEP:
    case T.DEEP2:
      return 'w'
    case T.LILY:
      return 'o'
    case T.GATE:
      return 'G'
    case T.SOIL:
      return 's'
    case T.PASTURE:
      return 'p'
    default:
      return '.'
  }
}

export function tileCenter(x: number, y: number): { x: number; y: number } {
  return { x: x * 16 + 8, y: y * 16 + 8 }
}

export { zoneAt }

export const BLOOM_TILES = BLOOMS
