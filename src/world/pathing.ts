import type { Point } from './content'

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
]

export function bfs(
  start: Point,
  isGoal: (x: number, y: number) => boolean,
  canWalk: (x: number, y: number) => boolean,
  limit = 4000,
): Point[] | null {
  const startKey = `${start.x},${start.y}`
  if (isGoal(start.x, start.y)) return [start]
  const queue: Point[] = [start]
  const prev = new Map<string, string | null>()
  prev.set(startKey, null)
  let guard = 0
  while (queue.length && guard++ < limit) {
    const cur = queue.shift()!
    for (const d of DIRS) {
      const nx = cur.x + d.x
      const ny = cur.y + d.y
      const k = `${nx},${ny}`
      if (prev.has(k)) continue
      const goal = isGoal(nx, ny)
      if (!goal && !canWalk(nx, ny)) continue
      prev.set(k, `${cur.x},${cur.y}`)
      const next = { x: nx, y: ny }
      if (goal) return reconstruct(prev, k)
      queue.push(next)
    }
  }
  return null
}

function reconstruct(prev: Map<string, string | null>, goalKey: string): Point[] {
  const out: Point[] = []
  let cur: string | null = goalKey
  while (cur) {
    const [x, y] = cur.split(',').map(Number)
    out.push({ x, y })
    cur = prev.get(cur) ?? null
  }
  out.reverse()
  return out
}

export function reachable(
  from: Point,
  to: Point,
  canWalk: (x: number, y: number) => boolean,
): boolean {
  return bfs(from, (x, y) => x === to.x && y === to.y, canWalk) !== null
}
