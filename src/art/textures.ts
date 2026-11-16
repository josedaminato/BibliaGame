import Phaser from 'phaser'
import { T, TILE_COUNT } from '../world/tiles'

const C = {
  void: '#14182b',
  void2: '#101426',
  dark: '#1c2444',
  dark2: '#171d38',
  path: '#e0c08a',
  path2: '#c9a56e',
  pebble: '#f4e2bc',
  floor: '#efd392',
  sprout: '#7dce55',
  dirt: '#b0723e',
  dirt2: '#8a552c',
  grass: '#3f9d45',
  grass2: '#2f7d38',
  blade: '#b6eb74',
  water: '#3b92d4',
  water2: '#67b7ea',
  deep: '#1c5c9c',
  foam: '#e7f6ff',
  lily: '#79c85a',
  lily2: '#3e8f3a',
  sand: '#f0d7a4',
  sand2: '#e4c48a',
  soil: '#6a3d24',
  hill: '#d2bea4',
  hill2: '#b79d84',
  pasture: '#d5f07a',
  reed: '#c5d15a',
  reed2: '#6d8a32',
  flower: '#f27aaa',
  flower2: '#ffe08a',
  stone: '#667484',
  stone2: '#46525f',
  mortar: '#2c3540',
  gate: '#8fd0ff',
  gold: '#ffd56a',
  rest: '#f6e3a4',
  mist: '#dceaf8',
  white: '#fff8ee',
  ink: '#241c16',
  hair: '#3a2a24',
  skin: '#f0b07a',
  skin2: '#d4895c',
  blush: '#e9897a',
  scarf: '#ffe08a',
  cloak: '#e15a3a',
  cloak2: '#b83c28',
  boot: '#3a2a24',
  tunic: '#3d6fbf',
  tunic2: '#c44b6a',
  wool: '#f4ecdf',
  hop: '#7dba6a',
  stripe: '#e2b15c',
  fish: '#f28c4b',
  bird: '#5dade2',
  beak: '#f2b143',
}

type Ctx = CanvasRenderingContext2D

function canvas(w: number, h: number): { canvas: HTMLCanvasElement; g: Ctx } {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const g = el.getContext('2d')
  if (!g) throw new Error('No se pudo preparar el lienzo.')
  g.imageSmoothingEnabled = false
  return { canvas: el, g }
}

function rect(g: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color
  g.fillRect(x, y, w, h)
}

function px(g: Ctx, x: number, y: number, color: string): void {
  g.fillStyle = color
  g.fillRect(x, y, 1, 1)
}

function tile(
  g: Ctx,
  index: number,
  draw: (paint: (x: number, y: number, color: string) => void) => void,
  fill: string,
): void {
  const ox = index * 16
  rect(g, ox, 0, 16, 16, fill)
  draw((x, y, color) => px(g, ox + x, y, color))
}

function specks(paint: (x: number, y: number, color: string) => void, color: string, seed: number): void {
  for (let i = 0; i < 8; i++) {
    const x = (seed * 5 + i * 7) % 14
    const y = (seed * 3 + i * 5) % 14
    paint(1 + x, 1 + y, color)
  }
}

export function buildArt(scene: Phaser.Scene): void {
  const tiles = canvas(TILE_COUNT * 16, 16)
  drawTiles(tiles.g)
  scene.textures.addImage('tiles', tiles.canvas as unknown as HTMLImageElement)

  const hero = canvas(16 * 12, 16)
  const facings = ['down', 'left', 'right', 'up'] as const
  facings.forEach((facing, group) => {
    ;([0, 1, 2] as const).forEach((step, s) => {
      drawHero(hero.g, (group * 3 + s) * 16, 0, facing, step)
    })
  })
  scene.textures.addSpriteSheet('hero', hero.canvas as unknown as HTMLImageElement, { frameWidth: 16, frameHeight: 16 })

  const people = canvas(16 * 4, 16)
  drawPerson(people.g, 0, 0, C.tunic, 0)
  drawPerson(people.g, 16, 0, C.tunic, 1)
  drawPerson(people.g, 32, 0, C.tunic2, 0)
  drawPerson(people.g, 48, 0, C.tunic2, 1)
  scene.textures.addSpriteSheet('people', people.canvas as unknown as HTMLImageElement, { frameWidth: 16, frameHeight: 16 })

  add(scene, 'chispa', 16, 16, (g) => drawChispa(g, 0, 0, false))
  add(scene, 'chispa2', 16, 16, (g) => drawChispa(g, 0, 0, true))
  add(scene, 'light', 16, 16, (g) => drawGlow(g, C.gold, 5))
  add(scene, 'firefly', 16, 16, (g) => drawGlow(g, '#d6ff8a', 3))
  add(scene, 'orb-mayor', 16, 16, (g) => drawOrb(g, C.gold, 6))
  add(scene, 'orb-menor', 16, 16, (g) => drawOrb(g, '#dfe7ff', 4))
  add(scene, 'orb-stars', 16, 16, (g) => drawStarCluster(g))
  add(scene, 'ped-mayor', 16, 16, (g) => drawPedestal(g, 'sun'))
  add(scene, 'ped-menor', 16, 16, (g) => drawPedestal(g, 'moon'))
  add(scene, 'ped-stars', 16, 16, (g) => drawPedestal(g, 'stars'))
  add(scene, 'fish', 16, 16, (g) => drawFish(g))
  add(scene, 'bird', 16, 16, (g) => drawBird(g, false))
  add(scene, 'bird2', 16, 16, (g) => drawBird(g, true))
  add(scene, 'wool', 16, 16, (g) => drawWool(g))
  add(scene, 'hopper', 16, 16, (g) => drawHopper(g))
  add(scene, 'striped', 16, 16, (g) => drawStriped(g))
  add(scene, 'tree', 16, 24, (g) => drawTree(g, true))
  add(scene, 'tree-bare', 16, 24, (g) => drawTree(g, false))
  add(scene, 'sprout', 16, 16, (g) => drawSprout(g))
  add(scene, 'sign', 16, 16, (g) => drawSign(g))
  add(scene, 'shell', 16, 16, (g) => drawShell(g))
  add(scene, 'spring', 16, 16, (g) => drawSpring(g))
  add(scene, 'starbit', 16, 16, (g) => drawStarBit(g))
  add(scene, 'rest', 16, 16, (g) => drawRestMark(g))
  add(scene, 'shadow', 16, 8, (g) => {
    g.fillStyle = 'rgba(20,16,30,0.35)'
    g.fillRect(3, 2, 10, 3)
    g.fillRect(4, 1, 8, 5)
  })
  add(scene, 'pixel', 4, 4, (g) => {
    g.fillStyle = '#fff8ee'
    g.fillRect(0, 0, 4, 4)
  })
  add(scene, 'arrow', 12, 12, (g) => {
    g.fillStyle = '#ffe08a'
    g.fillRect(5, 1, 2, 8)
    g.fillRect(3, 6, 6, 2)
    g.fillRect(4, 8, 4, 2)
    g.fillStyle = '#241c16'
    g.fillRect(5, 2, 2, 1)
  })

  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith('__')) continue
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
  }

  const walk = (key: string, frames: number[]) => {
    if (scene.anims.exists(key)) return
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers('hero', { frames }),
      frameRate: 8,
      repeat: -1,
    })
  }
  walk('walk-down', [1, 0, 2, 0])
  walk('walk-left', [4, 3, 5, 3])
  walk('walk-right', [7, 6, 8, 6])
  walk('walk-up', [10, 9, 11, 9])
}

function add(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Ctx) => void): void {
  const made = canvas(w, h)
  draw(made.g)
  scene.textures.addImage(key, made.canvas as unknown as HTMLImageElement)
}

function drawTiles(g: Ctx): void {
  tile(g, T.VOID, (p) => specks(p, C.void2, 1), C.void)
  tile(g, T.DARK, (p) => specks(p, C.void, 2), C.dark)
  tile(g, T.DARK2, (p) => specks(p, C.void2, 4), C.dark2)
  tile(g, T.PATH, (p) => {
    p(3, 11, C.path2)
    p(10, 6, C.pebble)
    p(6, 4, C.path2)
    rectLine(p)
  }, C.path)
  tile(g, T.PATH2, (p) => {
    p(8, 9, C.pebble)
    p(2, 5, C.path2)
    rectLine(p)
  }, C.path)
  tile(g, T.FLOOR, (p) => {
    p(4, 4, C.sprout)
    p(11, 9, C.blade)
    p(7, 12, C.path2)
  }, C.floor)
  tile(g, T.DIRT, (p) => {
    p(3, 4, C.dirt2)
    p(10, 8, C.dirt2)
    p(6, 12, C.soil)
  }, C.dirt)
  tile(g, T.GRASS, (p) => grass(p, 0), C.grass)
  tile(g, T.GRASS2, (p) => grass(p, 2), C.grass2)
  tile(g, T.WATER, (p) => {
    for (let x = 1; x < 15; x++) p(x, 4, C.foam)
    for (let x = 2; x < 14; x += 2) p(x, 10, C.water2)
  }, C.water)
  tile(g, T.WATER2, (p) => {
    for (let x = 1; x < 15; x++) p(x, 9, C.foam)
    for (let x = 1; x < 14; x += 2) p(x, 3, C.water2)
  }, C.water)
  tile(g, T.DEEP, (p) => {
    for (let x = 2; x < 14; x += 3) p(x, 6, C.water)
  }, C.deep)
  tile(g, T.DEEP2, (p) => {
    for (let x = 3; x < 14; x += 3) p(x, 11, C.water)
  }, C.deep)
  tile(g, T.LILY, (p) => {
    for (let y = 5; y <= 10; y++) for (let x = 4; x <= 11; x++) if ((x - 7) ** 2 + (y - 7) ** 2 < 14) p(x, y, C.lily)
    p(8, 6, C.lily2)
    p(6, 8, C.blade)
    p(11, 4, C.foam)
  }, C.water)
  tile(g, T.SOIL, (p) => {
    for (let x = 3; x <= 12; x++) p(x, 9, C.dirt2)
    for (let y = 6; y <= 9; y++) for (let x = 4; x <= 11; x++) p(x, y, C.soil)
    p(6, 7, C.dirt)
  }, C.dirt)
  tile(g, T.SAND, (p) => {
    p(4, 5, C.sand2)
    p(11, 8, C.pebble)
    p(7, 12, C.sand2)
  }, C.sand)
  tile(g, T.STONE, (p) => bricks(p, 0), C.stone)
  tile(g, T.STONE2, (p) => bricks(p, 1), C.stone2)
  tile(g, T.HILL, (p) => {
    p(3, 10, C.hill2)
    p(12, 5, C.hill2)
    p(7, 7, C.sand)
  }, C.hill)
  tile(g, T.PASTURE, (p) => {
    grass(p, 1)
    p(8, 8, C.flower)
    p(5, 5, C.flower2)
  }, C.pasture)
  tile(g, T.REED, (p) => {
    p(4, 3, C.reed2)
    p(4, 6, C.reed2)
    p(4, 9, C.reed2)
    p(9, 4, C.reed2)
    p(9, 8, C.reed2)
    p(12, 6, C.reed2)
  }, C.sand)
  tile(g, T.FLOWER, (p) => {
    grass(p, 0)
    flowerAt(p, 7, 7)
  }, C.grass)
  tile(g, T.GATE, (p) => {
    for (let y = 1; y < 15; y++) {
      p(2, y, C.stone2)
      p(3, y, C.stone)
      p(12, y, C.stone)
      p(13, y, C.stone2)
      if (y % 2 === 0) {
        p(6, y, C.gold)
        p(8, y, C.gate)
        p(10, y, C.white)
      }
    }
  }, '#24324c')
  tile(g, T.REST, (p) => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      p(8 + Math.round(Math.cos(a) * 5), 8 + Math.round(Math.sin(a) * 5), C.hill2)
    }
    p(8, 8, C.gold)
  }, C.rest)
  tile(g, T.MIST, (p) => {
    for (let y = 3; y < 14; y += 3) for (let x = 1; x < 15; x++) if ((x + y) % 3 !== 0) p(x, y, C.white)
  }, C.mist)
}

function rectLine(p: (x: number, y: number, color: string) => void): void {
  for (let x = 0; x < 16; x++) p(x, 15, C.path2)
}

function grass(p: (x: number, y: number, color: string) => void, shift: number): void {
  p(2 + shift, 4, C.blade)
  p(3 + shift, 5, C.blade)
  p(8, 8, C.grass2)
  p(12, 3, C.blade)
  p(11, 4, C.grass2)
  p(5, 12, C.blade)
}

function bricks(p: (x: number, y: number, color: string) => void, alt: number): void {
  for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) p(x, y, C.mortar)
  for (let x = alt ? 0 : 8; x < 16; x += 8) for (let y = 0; y < 16; y++) p(x, y, C.mortar)
}

function flowerAt(p: (x: number, y: number, color: string) => void, x: number, y: number): void {
  p(x, y, C.flower2)
  p(x - 1, y, C.flower)
  p(x + 1, y, C.flower)
  p(x, y - 1, C.flower)
  p(x, y + 1, C.flower)
}

function drawHero(g: Ctx, ox: number, oy: number, facing: 'down' | 'left' | 'right' | 'up', step: 0 | 1 | 2): void {
  const flip = facing === 'right'
  const bob = step === 1 ? -1 : 0
  const p = (x: number, y: number, color: string) => px(g, ox + (flip ? 15 - x : x), oy + y, color)
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) p(x + xx, y + yy, color)
  }
  const leg = (left: boolean, shift: number) => {
    const x = left ? 5 : 9
    r(x + shift, 12, 2, 2, C.cloak2)
    r(x + shift, 14, 2, 1, C.boot)
  }
  if (facing === 'up') {
    r(4, 1 + bob, 8, 5, C.hair)
    r(5, 2 + bob, 6, 2, '#2a1e1a')
    r(4, 6 + bob, 8, 2, C.scarf)
    r(4, 8 + bob, 8, 4, C.cloak)
    r(6, 9 + bob, 4, 1, C.cloak2)
  } else if (facing === 'down') {
    r(5, 1 + bob, 6, 2, C.hair)
    r(4, 2 + bob, 8, 2, C.hair)
    r(5, 4 + bob, 6, 3, C.skin)
    p(6, 5 + bob, C.ink)
    p(9, 5 + bob, C.ink)
    p(7, 6 + bob, C.blush)
    p(8, 6 + bob, C.blush)
    r(4, 7 + bob, 8, 2, C.scarf)
    p(5, 7 + bob, C.white)
    r(4, 9 + bob, 8, 3, C.cloak)
    r(6, 10 + bob, 4, 1, C.cloak2)
  } else {
    r(5, 1 + bob, 6, 2, C.hair)
    r(4, 2 + bob, 7, 2, C.hair)
    r(4, 4 + bob, 6, 3, C.skin)
    p(5, 5 + bob, C.ink)
    p(6, 6 + bob, C.blush)
    r(4, 7 + bob, 7, 2, C.scarf)
    r(4, 9 + bob, 7, 3, C.cloak)
    p(8, 10 + bob, C.cloak2)
  }
  const spread = step === 0 ? 0 : step === 1 ? -1 : 1
  if (facing === 'left' || facing === 'right') {
    leg(true, step === 2 ? 1 : 0)
    leg(false, step === 1 ? -1 : 0)
  } else {
    leg(true, spread > 0 ? -1 : 0)
    leg(false, spread < 0 ? 1 : 0)
  }
}

function drawPerson(g: Ctx, ox: number, oy: number, tunic: string, step: number): void {
  const p = (x: number, y: number, color: string) => px(g, ox + x, oy + y, color)
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) p(x + xx, y + yy, color)
  }
  const bob = step ? -1 : 0
  r(5, 1 + bob, 6, 4, C.hair)
  r(5, 4 + bob, 6, 3, C.skin)
  p(6, 5 + bob, C.ink)
  p(9, 5 + bob, C.ink)
  r(4, 7 + bob, 8, 5, tunic)
  r(6, 8 + bob, 4, 1, C.white)
  const shift = step ? 1 : 0
  r(5 - shift, 12, 2, 3, tunic)
  r(9 + shift, 12, 2, 3, C.boot)
  r(5 - shift, 14, 2, 1, C.boot)
  r(9 + shift, 13, 2, 2, tunic)
}

function drawChispa(g: Ctx, ox: number, oy: number, alt: boolean): void {
  const p = (x: number, y: number, c: string) => px(g, ox + x, oy + y, c)
  p(8, 3, C.white)
  p(8, 12, C.gold)
  p(3, 8, C.gold)
  p(12, 8, C.white)
  for (let y = 6; y <= 9; y++) for (let x = 6; x <= 9; x++) p(x, y, alt ? C.white : C.gold)
  p(7, 7, C.white)
}

function drawGlow(g: Ctx, color: string, radius: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5)
      if (d < radius) px(g, x, y, d < 2 ? C.white : color)
    }
  }
}

function drawOrb(g: Ctx, color: string, radius: number): void {
  drawGlow(g, color, radius)
  px(g, 6, 6, C.white)
}

function drawStarCluster(g: Ctx): void {
  const star = (x: number, y: number) => {
    px(g, x, y, C.white)
    px(g, x - 1, y, C.gold)
    px(g, x + 1, y, C.gold)
    px(g, x, y - 1, C.gold)
    px(g, x, y + 1, C.gold)
  }
  star(5, 6)
  star(10, 5)
  star(8, 10)
}

function drawPedestal(g: Ctx, kind: 'sun' | 'moon' | 'stars'): void {
  rect(g, 3, 10, 10, 4, C.stone)
  rect(g, 5, 8, 6, 2, C.stone2)
  rect(g, 2, 13, 12, 2, C.stone2)
  if (kind === 'sun') {
    for (let y = 2; y <= 6; y++) for (let x = 6; x <= 9; x++) px(g, x, y, C.gold)
  } else if (kind === 'moon') {
    for (let y = 2; y <= 6; y++) for (let x = 6; x <= 9; x++) px(g, x, y, '#dfe7ff')
    px(g, 6, 3, C.hill)
    px(g, 6, 4, C.hill)
    px(g, 6, 5, C.hill)
  } else {
    px(g, 6, 3, C.gold)
    px(g, 9, 4, C.white)
    px(g, 7, 6, C.gold)
  }
}

function drawFish(g: Ctx): void {
  rect(g, 4, 6, 7, 4, C.fish)
  rect(g, 10, 7, 2, 2, '#ffd0a8')
  px(g, 11, 5, C.fish)
  px(g, 12, 6, C.fish)
  px(g, 11, 10, C.fish)
  px(g, 12, 9, C.fish)
  px(g, 6, 7, C.ink)
  px(g, 5, 8, C.white)
}

function drawBird(g: Ctx, up: boolean): void {
  rect(g, 5, 7, 6, 4, C.bird)
  rect(g, 10, 8, 3, 2, C.beak)
  px(g, 7, 8, C.ink)
  if (up) {
    rect(g, 6, 4, 4, 3, '#8fd0f2')
  } else {
    rect(g, 6, 9, 4, 3, '#3d88b8')
  }
  px(g, 6, 12, C.beak)
  px(g, 8, 12, C.beak)
}

function drawWool(g: Ctx): void {
  for (let y = 3; y <= 10; y++) for (let x = 3; x <= 12; x++) if ((x - 7) ** 2 + (y - 6) ** 2 < 22) px(g, x, y, C.wool)
  px(g, 6, 6, C.ink)
  px(g, 9, 6, C.ink)
  px(g, 7, 8, '#e7b2aa')
  rect(g, 5, 12, 2, 3, C.hill2)
  rect(g, 9, 12, 2, 3, C.hill2)
}

function drawHopper(g: Ctx): void {
  rect(g, 6, 1, 2, 4, C.hop)
  rect(g, 9, 1, 2, 4, C.hop)
  px(g, 6, 1, '#f0b07a')
  px(g, 9, 1, '#f0b07a')
  for (let y = 6; y <= 11; y++) for (let x = 4; x <= 11; x++) px(g, x, y, C.hop)
  px(g, 6, 8, C.ink)
  px(g, 9, 8, C.ink)
  rect(g, 4, 12, 2, 3, C.grass2)
  rect(g, 10, 12, 2, 3, C.grass2)
}

function drawStriped(g: Ctx): void {
  rect(g, 2, 7, 10, 5, C.stripe)
  rect(g, 11, 6, 3, 4, '#f0d7a4')
  px(g, 12, 7, C.ink)
  for (let x = 4; x <= 9; x += 2) rect(g, x, 7, 1, 5, '#a87432')
  rect(g, 3, 12, 2, 3, '#a87432')
  rect(g, 8, 12, 2, 3, '#a87432')
  px(g, 1, 8, C.stripe)
  px(g, 1, 9, '#a87432')
}

function drawTree(g: Ctx, leafy: boolean): void {
  rect(g, 7, 14, 2, 10, '#6b3f2a')
  if (leafy) {
    for (let y = 2; y <= 14; y++) {
      for (let x = 2; x <= 13; x++) {
        if ((x - 7.5) ** 2 + (y - 8) ** 2 < 28) px(g, x, y, (x + y) % 5 === 0 ? C.blade : C.grass)
      }
    }
    px(g, 5, 7, C.flower)
    px(g, 10, 10, C.flower2)
  } else {
    px(g, 4, 8, '#6b3f2a')
    px(g, 5, 7, '#6b3f2a')
    px(g, 11, 9, '#8a552c')
    px(g, 10, 6, '#6b3f2a')
  }
}

function drawSprout(g: Ctx): void {
  rect(g, 7, 8, 2, 6, C.grass2)
  px(g, 5, 8, C.blade)
  px(g, 6, 7, C.blade)
  px(g, 9, 7, C.blade)
  px(g, 10, 8, C.sprout)
  px(g, 8, 6, C.flower)
}

function drawSign(g: Ctx): void {
  rect(g, 7, 6, 2, 9, '#6b3f2a')
  rect(g, 3, 3, 10, 6, C.path)
  rect(g, 3, 3, 10, 1, C.path2)
  px(g, 5, 5, C.ink)
  px(g, 7, 5, C.ink)
  px(g, 9, 5, C.ink)
  px(g, 6, 7, C.ink)
}

function drawShell(g: Ctx): void {
  for (let y = 5; y <= 11; y++) for (let x = 4; x <= 11; x++) if ((x - 7) ** 2 + (y - 8) ** 2 < 16) px(g, x, y, y % 2 ? C.flower2 : C.sand)
  px(g, 7, 8, C.white)
}

function drawSpring(g: Ctx): void {
  for (let y = 6; y <= 12; y++) for (let x = 4; x <= 12; x++) px(g, x, y, C.water2)
  for (let x = 5; x <= 11; x++) px(g, x, 7, C.foam)
  flowerAt((x, y, c) => px(g, x, y, c), 3, 5)
  flowerAt((x, y, c) => px(g, x, y, c), 12, 4)
}

function drawStarBit(g: Ctx): void {
  drawStarCluster(g)
  px(g, 8, 8, C.white)
}

function drawRestMark(g: Ctx): void {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    rect(g, 6 + Math.round(Math.cos(a) * 5), 6 + Math.round(Math.sin(a) * 5), 3, 3, C.stone)
  }
  px(g, 7, 7, C.gold)
  px(g, 8, 7, C.gold)
  px(g, 7, 8, C.white)
  px(g, 8, 8, C.gold)
}
