export type ZoneId =
  | 'start'
  | 'day1'
  | 'day2'
  | 'day3'
  | 'day4'
  | 'day5'
  | 'day6'
  | 'day7'

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

export const MAP_W = 59
export const MAP_H = 42

export const ROOMS: Record<ZoneId, Rect> = {
  start: { x0: 1, y0: 26, x1: 18, y1: 40 },
  day1: { x0: 18, y0: 26, x1: 37, y1: 40 },
  day2: { x0: 37, y0: 26, x1: 57, y1: 40 },
  day3: { x0: 37, y0: 12, x1: 57, y1: 26 },
  day4: { x0: 18, y0: 12, x1: 37, y1: 26 },
  day5: { x0: 1, y0: 12, x1: 18, y1: 26 },
  day6: { x0: 1, y0: 1, x1: 32, y1: 12 },
  day7: { x0: 32, y0: 1, x1: 56, y1: 12 },
}

export const SPAWN = { x: 8, y: 36 }

export interface Point {
  x: number
  y: number
}

export interface LightDef extends Point {
  id: string
  brighten: Rect
}

export const LIGHTS: LightDef[] = [
  { id: 'light0', x: 24, y: 36, brighten: { x0: 20, y0: 34, x1: 28, y1: 38 } },
  { id: 'light1', x: 28, y: 29, brighten: { x0: 24, y0: 27, x1: 33, y1: 32 } },
  { id: 'light2', x: 33, y: 34, brighten: { x0: 30, y0: 32, x1: 36, y1: 38 } },
]

export const LILY_PATH: Point[] = [
  { x: 44, y: 34 },
  { x: 45, y: 34 },
  { x: 45, y: 33 },
  { x: 46, y: 33 },
  { x: 47, y: 33 },
  { x: 47, y: 34 },
  { x: 48, y: 34 },
  { x: 49, y: 34 },
  { x: 49, y: 35 },
  { x: 50, y: 35 },
  { x: 51, y: 35 },
  { x: 52, y: 35 },
]

export const LILY_DECOYS: { x: number; y: number; kind: 'frog' | 'shell' }[] = [
  { x: 45, y: 35, kind: 'frog' },
  { x: 45, y: 36, kind: 'frog' },
  { x: 44, y: 33, kind: 'shell' },
  { x: 44, y: 32, kind: 'shell' },
]

export const SHELL = { x: 44, y: 32 }
export const FROG = { x: 45, y: 35 }

export const SEEDS: Point[] = [
  { x: 41, y: 16 },
  { x: 50, y: 15 },
  { x: 45, y: 23 },
]

export const SOILS: Point[] = [
  { x: 42, y: 20 },
  { x: 48, y: 18 },
  { x: 53, y: 22 },
]

export const BLOOMS: Point[][] = [
  [
    { x: 43, y: 20 },
    { x: 42, y: 21 },
  ],
  [
    { x: 49, y: 18 },
    { x: 48, y: 17 },
  ],
  [
    { x: 52, y: 22 },
    { x: 53, y: 23 },
  ],
]

export const TREES: Point[] = [
  { x: 39, y: 14 },
  { x: 56, y: 15 },
  { x: 40, y: 24 },
  { x: 46, y: 6 },
  { x: 50, y: 4 },
]

export const SPRING = { x: 55, y: 14 }

export type LuminaryId = 'mayor' | 'menor' | 'stars'

export const PEDESTALS: Record<LuminaryId, Point> = {
  mayor: { x: 22, y: 16 },
  menor: { x: 28, y: 16 },
  stars: { x: 33, y: 16 },
}

export const ORBS: Record<LuminaryId, Point> = {
  mayor: { x: 23, y: 22 },
  menor: { x: 29, y: 22 },
  stars: { x: 34, y: 21 },
}

export const SECRET_STAR = { x: 20, y: 22 }

export const FISH: Point[] = [
  { x: 6, y: 18 },
  { x: 12, y: 18 },
]

export const FISH_HOME: Point[] = [
  { x: 6, y: 22 },
  { x: 13, y: 23 },
]

export const BIRDS: Point[] = [
  { x: 4, y: 15 },
  { x: 13, y: 16 },
]

export const BIRD_PERCH: Point[] = [
  { x: 5, y: 13 },
  { x: 14, y: 13 },
]

export const ANIMALS: Point[] = [
  { x: 7, y: 8 },
  { x: 12, y: 8 },
  { x: 15, y: 9 },
]

export const PASTURE: Point[] = [
  { x: 24, y: 4 },
  { x: 25, y: 4 },
  { x: 26, y: 5 },
  { x: 27, y: 5 },
  { x: 24, y: 5 },
  { x: 25, y: 6 },
]

export const ANIMAL_HOME: Point[] = [
  { x: 24, y: 4 },
  { x: 26, y: 5 },
  { x: 25, y: 6 },
]

export const HUMAN_PATH: Point[] = [
  { x: 5, y: 10 },
  { x: 10, y: 8 },
  { x: 16, y: 7 },
  { x: 22, y: 6 },
]

export const REST = { x: 44, y: 6 }

export const SIGNS = {
  intro: { x: 8, y: 33 },
  day1: { x: 21, y: 33 },
  water: { x: 40, y: 33 },
  garden: { x: 42, y: 24 },
  sky: { x: 34, y: 20 },
  coast: { x: 16, y: 19 },
  meadow: { x: 10, y: 10 },
  tide: { x: 15, y: 20 },
  whistle: { x: 20, y: 9 },
}

export const CHECKPOINTS: Point[] = [
  { x: 8, y: 36 },
  { x: 39, y: 33 },
  { x: 54, y: 24 },
  { x: 35, y: 19 },
  { x: 16, y: 19 },
  { x: 9, y: 10 },
  { x: 34, y: 6 },
]

export interface Door {
  id: string | null
  tiles: Point[]
}

export const DOORS: Door[] = [
  {
    id: null,
    tiles: [
      { x: 18, y: 32 },
      { x: 18, y: 33 },
    ],
  },
  {
    id: 'gate12',
    tiles: [
      { x: 37, y: 32 },
      { x: 37, y: 33 },
    ],
  },
  {
    id: 'gate23',
    tiles: [
      { x: 54, y: 26 },
      { x: 55, y: 26 },
    ],
  },
  {
    id: 'gate34',
    tiles: [
      { x: 37, y: 18 },
      { x: 37, y: 19 },
    ],
  },
  {
    id: 'gate45',
    tiles: [
      { x: 18, y: 18 },
      { x: 18, y: 19 },
    ],
  },
  {
    id: 'gate56',
    tiles: [
      { x: 8, y: 12 },
      { x: 9, y: 12 },
    ],
  },
  {
    id: 'gate67',
    tiles: [
      { x: 32, y: 5 },
      { x: 32, y: 6 },
    ],
  },
]

export const WATER_RECT = { x0: 44, y0: 30, x1: 52, y1: 37 }
export const DEEP_RECT = { x0: 46, y0: 31, x1: 50, y1: 36 }
export const NORTH_DAM = { x0: 44, y0: 27, x1: 52, y1: 29 }
export const SOUTH_DAM = { x0: 44, y0: 38, x1: 52, y1: 39 }
export const COAST_WATER = { x0: 3, y0: 22, x1: 16, y1: 24 }

export function zoneAt(x: number, y: number): ZoneId | null {
  for (const id of Object.keys(ROOMS) as ZoneId[]) {
    const r = ROOMS[id]
    if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) return id
  }
  return null
}

export function keyOf(x: number, y: number): string {
  return `${x},${y}`
}
