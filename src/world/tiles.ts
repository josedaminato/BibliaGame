export const TILE = 16

export const T = {
  VOID: 0,
  DARK: 1,
  DARK2: 2,
  PATH: 3,
  PATH2: 4,
  FLOOR: 5,
  DIRT: 6,
  GRASS: 7,
  GRASS2: 8,
  WATER: 9,
  WATER2: 10,
  DEEP: 11,
  DEEP2: 12,
  LILY: 13,
  SOIL: 14,
  SAND: 15,
  STONE: 16,
  STONE2: 17,
  HILL: 18,
  PASTURE: 19,
  REED: 20,
  FLOWER: 21,
  GATE: 22,
  REST: 23,
  MIST: 24,
} as const

export const TILE_COUNT = 25

export const SOLID = new Set<number>([
  T.VOID,
  T.WATER,
  T.WATER2,
  T.DEEP,
  T.DEEP2,
  T.STONE,
  T.STONE2,
  T.GATE,
])

export function isSolidIndex(index: number): boolean {
  return SOLID.has(index)
}
