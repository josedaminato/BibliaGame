import Phaser from 'phaser'
import { audio } from '../core/audio'
import { input } from '../core/input'
import { session } from '../core/session'
import { COMPLETE_SUMMARY } from '../data/copy'
import {
  ANIMALS,
  BIRD_PERCH,
  BIRDS,
  BLOOMS,
  FISH,
  FISH_HOME,
  HUMAN_PATH,
  LIGHTS,
  LILY_PATH,
  ORBS,
  PASTURE,
  PEDESTALS,
  REST,
  ROOMS,
  SEEDS,
  SECRET_STAR,
  SHELL,
  SIGNS,
  SOILS,
  SPAWN,
  SPRING,
  TREES,
  keyOf,
  zoneAt,
  type LuminaryId,
  type Point,
} from '../world/content'
import { buildWorld, canWalk, tileCenter, type World } from '../world/creationMap'
import { bfs } from '../world/pathing'
import { T, isSolidIndex } from '../world/tiles'
import {
  apply,
  checkpointFor,
  completedDay,
  freshState,
  guideTarget,
  hasFruit,
  inventoryLines,
  objective,
  openGateIds,
  refsFor,
  skyView,
  zoneMood,
  type CreationState,
  type Effect,
} from '../world/logic'
import { Player } from '../entities/Player'
import { secretsLine, ui } from '../ui/ui'

interface Marker {
  id: string
  tx: number
  ty: number
  sprite: Phaser.GameObjects.Sprite
  prompt: string
  active: () => boolean
}

interface Critter {
  index: number
  tx: number
  ty: number
  sprite: Phaser.GameObjects.Sprite
  home: boolean
  cool: number
}

const SKY: Record<string, string> = {
  void: '#14182b',
  dawn: '#e39a62',
  waters: '#6eaddd',
  green: '#7fbf6a',
  lights: '#1b2144',
  life: '#5aa6d6',
  rest: '#f0c97a',
}

const SURPRISE: Point[] = [
  { x: 22, y: 35 },
  { x: 26, y: 31 },
  { x: 31, y: 30 },
  { x: 34, y: 37 },
]

export class CreationScene extends Phaser.Scene {
  private world!: World
  private layer!: Phaser.Tilemaps.TilemapLayer
  private player!: Player
  private shadow!: Phaser.GameObjects.Image
  private chispa!: Phaser.GameObjects.Image
  private firefly!: Phaser.GameObjects.Image
  private arrow!: Phaser.GameObjects.Image
  private held!: Phaser.GameObjects.Image
  private state!: CreationState
  private markers: Marker[] = []
  private fish: Critter[] = []
  private animals: Critter[] = []
  private birds: { index: number; sprite: Phaser.GameObjects.Sprite; flying: boolean }[] = []
  private sprouts: Phaser.GameObjects.Image[] = []
  private trees: Phaser.GameObjects.Image[] = []
  private pedGlows = new Map<LuminaryId, Phaser.GameObjects.Image>()
  private humans: Phaser.GameObjects.Sprite[] = []
  private humanT = 1
  private humanStarted = false
  private mode: 'play' | 'pause' | 'dialogue' | 'modal' | 'resting' = 'play'
  private restTimer = 0
  private lastTile = ''
  private zone = ''
  private lastGood = { x: 0, y: 0 }
  private stuck = 0
  private saveAcc = 0
  private lostAcc = 0
  private progress = ''
  private stepAcc = 0
  private waterAcc = 0
  private waterOn = false
  private followAcc = 0
  private gateAt = 0
  private warnedGate = false
  private meadowHint = false
  private learned = false
  private controlsUntil = 0
  private skipPersist = false
  private onHide = () => this.persist()

  constructor() {
    super('creation')
  }

  create(): void {
    this.skipPersist = false
    this.markers = []
    this.fish = []
    this.animals = []
    this.birds = []
    this.sprouts = []
    this.trees = []
    this.pedGlows = new Map()
    this.humans = []
    this.humanT = 1
    this.humanStarted = false
    this.mode = 'play'
    this.lastTile = ''
    this.zone = ''
    this.stuck = 0
    this.lostAcc = 0
    this.progress = ''
    this.warnedGate = false
    this.meadowHint = false
    this.learned = false
    input.flush()
    this.world = buildWorld()
    this.state = session.data.creation ?? freshState()
    session.data.creation = this.state
    const map = this.make.tilemap({ data: this.world.tiles, tileWidth: 16, tileHeight: 16 })
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0, 0)
    const layer = tileset ? map.createLayer(0, tileset, 0, 0) : null
    if (!layer) throw new Error('No se pudo crear el escenario.')
    this.layer = layer
    this.layer.setCollision([T.VOID, T.WATER, T.WATER2, T.DEEP, T.DEEP2, T.STONE, T.STONE2, T.GATE])
    this.syncTiles()

    const start = session.data.pos ?? tileCenter(SPAWN.x, SPAWN.y)
    this.player = new Player(this, start.x, start.y)
    this.physics.add.collider(this.player, this.layer)
    this.lastGood = { x: start.x, y: start.y }
    this.shadow = this.add.image(start.x, start.y, 'shadow')
    this.chispa = this.add.image(start.x, start.y, 'chispa')
    this.firefly = this.add.image(0, 0, 'firefly').setVisible(false)
    this.held = this.add.image(0, 0, 'orb-mayor').setVisible(false)
    this.arrow = this.add.image(0, 0, 'arrow').setScrollFactor(0).setDepth(100000).setVisible(false)
    this.cameras.main.setZoom(2)
    this.cameras.main.roundPixels = true
    this.cameras.main.startFollow(this.player, true, 0.16, 0.16)
    this.cameras.main.setBounds(0, 0, this.world.w * 16, this.world.h * 16)
    this.physics.world.setBounds(0, 0, this.world.w * 16, this.world.h * 16)
    this.spawnWorld()
    this.syncProps()
    this.ensureHumans()
    this.applySky()
    ui.enterPlay({ onPause: () => this.openPause(), onRelato: () => this.openRelato() })
    ui.setLayoutListener(() => this.scale.refresh())
    this.refreshHud()
    audio.setAmbient(zoneMood(zoneAt(Math.floor(start.x / 16), Math.floor(start.y / 16)) ?? 'start', this.state))
    this.controlsUntil = this.time.now + 24000
    if (!this.state.welcomed) {
      this.state.welcomed = true
      this.persist()
      ui.toast(ui.touchPreferred()
        ? 'Todo está quieto y oscuro. Caminá con las flechas y tocá Mirar.'
        : 'Todo está quieto y oscuro. Caminá con las flechas o WASD. E o Espacio para mirar.')
    }
    if (this.state.rested && !this.state.summaryDismissed) {
      this.time.delayedCall(500, () => {
        if (this.mode === 'play') this.openComplete()
      })
    }
    document.addEventListener('visibilitychange', this.onHide)
    window.addEventListener('beforeunload', this.onHide)
    this.input.on('pointerdown', () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    this.events.once('shutdown', () => this.tearDown())
    this.time.delayedCall(60, () => this.scale.refresh())
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
      const self = this
      ;(window as unknown as { __dep?: unknown }).__dep = {
        get pos() { return { x: self.player.x, y: self.player.y } },
        get state() { return self.state },
        get mode() { return self.mode },
        get zone() { return self.zone },
      }
    }
  }

  private tearDown(): void {
    document.removeEventListener('visibilitychange', this.onHide)
    window.removeEventListener('beforeunload', this.onHide)
    if (!this.skipPersist) this.persist()
    ui.leavePlay()
    audio.duck(false)
  }

  update(time: number, delta: number): void {
    this.animateCompanions(time)
    if (this.mode === 'dialogue') {
      this.player.setVelocity(0)
      if (input.consumeInteract() || input.consumePause()) ui.advanceDialogue()
      return
    }
    if (this.mode === 'pause' || this.mode === 'modal') {
      this.player.setVelocity(0)
      input.consumeInteract()
      if (input.consumePause()) {
        if (ui.screen === 'settings' || ui.screen === 'relato' || ui.screen === 'confirm') ui.backOut()
        else if (this.mode === 'modal') this.dismissSummary()
        else this.closePause()
      }
      return
    }
    if (this.mode === 'resting') {
      this.player.setVelocity(0)
      input.consumeInteract()
      input.consumePause()
      this.restTimer -= delta
      if (this.restTimer <= 0) {
        this.mode = 'play'
        this.commit(apply(this.state, { type: 'interact', id: 'rest' }))
      }
      return
    }

    if (input.consumePause()) {
      this.openPause()
      return
    }
    const dir = input.direction()
    this.player.move(dir)
    this.shadow.setPosition(this.player.x, this.player.y + 6).setDepth(this.player.y - 2)
    this.shoveFish(delta)
    this.followAnimals(delta)
    this.updateHumans(delta, time)
    this.flapBirds(time)
    this.enterTile()
    this.warnGate()
    this.unstick(delta)
    const prompt = this.nearestPrompt()
    if (input.consumeInteract()) this.tryInteract(prompt?.id)
    this.refreshHud(prompt?.prompt ?? null)
    this.updateGuide(delta)
    this.watchZone()
    this.watchHumans()
    this.animateWater(delta)
    this.footstep(delta, dir)
    this.saveAcc += delta
    if (this.saveAcc > 2200) {
      this.saveAcc = 0
      this.persist()
    }
  }

  private spawnWorld(): void {
    const signPrompt: Record<string, string> = {
      intro: 'Leer la piedra',
      day1: 'Leer la señal',
      water: 'Leer la señal',
      garden: 'Leer la señal',
      sky: 'Leer la señal',
      coast: 'Leer la señal',
      meadow: 'Leer la señal',
      tide: 'Llamar a la marea',
      whistle: 'Silbar suave',
    }
    for (const [id, pos] of Object.entries(SIGNS)) {
      this.addMarker(id, pos.x, pos.y, 'sign', signPrompt[id] ?? 'Leer', () => true)
    }
    LIGHTS.forEach((light, index) => {
      this.addMarker(light.id, light.x, light.y, 'light', 'Mirar el resplandor', () => !this.state.lights[index])
    })
    SEEDS.forEach((seed, index) => {
      this.addMarker(`seed${index}`, seed.x, seed.y, 'sprout', 'Juntar semilla', () => this.state.lilyDone && !this.state.seeds[index])
    })
    SOILS.forEach((soil, index) => {
      const mark = this.addMarker(`soil${index}`, soil.x, soil.y, 'sign', 'Dejar una semilla', () => this.state.lilyDone && !this.state.planted[index])
      mark.sprite.setVisible(false)
      const sprout = this.add.image(tileCenter(soil.x, soil.y).x, tileCenter(soil.x, soil.y).y - 4, 'sprout').setVisible(false)
      this.sprouts.push(sprout)
    })
    ;(Object.keys(ORBS) as LuminaryId[]).forEach((id) => {
      this.addMarker(`orb-${id}`, ORBS[id].x, ORBS[id].y, `orb-${id}`, 'Tomar la luz', () => this.state.planted.every(Boolean) && !this.state.orbs[id])
      this.addMarker(`ped-${id}`, PEDESTALS[id].x, PEDESTALS[id].y, `ped-${id}`, 'Dejar la luz', () => this.state.planted.every(Boolean) && !this.state.placed[id])
      const glow = this.add.image(tileCenter(PEDESTALS[id].x, PEDESTALS[id].y).x, tileCenter(PEDESTALS[id].x, PEDESTALS[id].y).y - 10, `orb-${id}`)
      glow.setVisible(false)
      this.pedGlows.set(id, glow)
    })
    FISH.forEach((spot, index) => {
      const home = this.state.fish[index]
      const at = home ? FISH_HOME[index] : spot
      const pos = tileCenter(at.x, at.y)
      const sprite = this.add.sprite(pos.x, pos.y, 'fish')
      this.fish.push({ index, tx: at.x, ty: at.y, sprite, home, cool: 0 })
    })
    BIRDS.forEach((spot, index) => {
      const free = this.state.birds[index]
      const at = free ? BIRD_PERCH[index] : spot
      const pos = tileCenter(at.x, at.y)
      const sprite = this.add.sprite(pos.x, pos.y, 'bird')
      this.birds.push({ index, sprite, flying: false })
      this.addMarker(`bird${index}`, spot.x, spot.y, 'bird', 'Soltar el ave', () => this.luminariesReady() && !this.state.birds[index])
      const marker = this.markers[this.markers.length - 1]
      marker.sprite.destroy()
      marker.sprite = sprite
    })
    const kinds = ['wool', 'hopper', 'striped']
    ANIMALS.forEach((spot, index) => {
      const home = this.state.animals[index]
      const at = home ? [ { x: 24, y: 4 }, { x: 26, y: 5 }, { x: 25, y: 6 } ][index] : spot
      const pos = tileCenter(at.x, at.y)
      const sprite = this.add.sprite(pos.x, pos.y, kinds[index]).setDepth(pos.y)
      this.animals.push({ index, tx: at.x, ty: at.y, sprite, home, cool: 0 })
    })
    this.addMarker('shell', SHELL.x, SHELL.y, 'shell', 'Mirar la concha', () => this.state.lights.every(Boolean) && !this.state.secrets.shell)
    this.addMarker('spring', SPRING.x, SPRING.y, 'spring', 'Mirar el manantial', () => this.state.lilyDone && !this.state.secrets.spring)
    this.addMarker('star', SECRET_STAR.x, SECRET_STAR.y, 'starbit', 'Mirar la estrella', () => this.state.planted.every(Boolean) && !this.state.secrets.star)
    this.addMarker('rest', REST.x, REST.y, 'rest', 'Descansar', () => this.state.humansSeen)
    TREES.forEach((spot, index) => {
      const pos = tileCenter(spot.x, spot.y)
      const tree = this.add.image(pos.x, pos.y + 6, index >= 3 ? 'tree' : 'tree-bare').setOrigin(0.5, 1).setDepth(pos.y)
      this.trees.push(tree)
    })
  }

  private addMarker(id: string, tx: number, ty: number, texture: string, prompt: string, active: () => boolean): Marker {
    const pos = tileCenter(tx, ty)
    const sprite = this.add.sprite(pos.x, pos.y, texture).setDepth(pos.y)
    const marker = { id, tx, ty, sprite, prompt, active }
    this.markers.push(marker)
    return marker
  }

  private commit(step: { state: CreationState; effects: Effect[] }): void {
    const previous = this.state
    this.state = step.state
    session.data.creation = this.state
    if (this.state.rested) session.data.edenUnlocked = true
    session.commit()
    for (let i = 0; i < 3; i++) {
      if (!previous.lights[i] && this.state.lights[i]) this.burst(LIGHTS[i].x, LIGHTS[i].y, 0xffd56a)
    }
    this.syncTiles()
    this.syncProps()
    this.ensureHumans()
    this.applySky()
    this.refreshHud()
    for (const effect of step.effects) this.playEffect(effect)
  }

  private playEffect(effect: Effect): void {
    if (effect.type === 'toast') ui.toast(effect.text)
    else if (effect.type === 'sfx') audio.sfx(effect.name)
    else if (effect.type === 'ambient') audio.setAmbient(effect.mood)
    else if (effect.type === 'sting') audio.sting(effect.mood, effect.ms)
    else if (effect.type === 'dialogue') {
      this.mode = 'dialogue'
      this.player.setVelocity(0)
      ui.openDialogue(effect.lines, () => { this.mode = 'play' })
    } else if (effect.type === 'humans') this.ensureHumans()
    else if (effect.type === 'complete') this.openComplete()
  }

  private syncTiles(): void {
    const open = new Set(openGateIds(this.state))
    for (const [key, id] of this.world.gateAt) {
      const [x, y] = key.split(',').map(Number)
      this.paint(x, y, open.has(id) ? T.PATH : T.GATE)
    }
    this.state.lights.forEach((on, index) => {
      if (on) this.brighten(LIGHTS[index].brighten)
    })
    if (this.state.lights.every(Boolean)) {
      this.brighten({ x0: ROOMS.day1.x0 + 1, y0: ROOMS.day1.y0 + 1, x1: ROOMS.day1.x1 - 1, y1: ROOMS.day1.y1 - 1 })
      for (const spot of SURPRISE) this.paint(spot.x, spot.y, T.FLOWER)
    }
    if (this.state.lilyDone) {
      for (const key of this.world.mist) {
        const [x, y] = key.split(',').map(Number)
        this.paint(x, y, T.MIST)
      }
    }
    this.state.planted.forEach((on, index) => {
      if (!on) return
      for (const bloom of BLOOMS[index]) this.paint(bloom.x, bloom.y, T.FLOWER)
    })
  }

  private brighten(rect: { x0: number; y0: number; x1: number; y1: number }): void {
    for (let y = rect.y0; y <= rect.y1; y++) {
      for (let x = rect.x0; x <= rect.x1; x++) {
        const tile = this.layer.getTileAt(x, y)
        if (tile && (tile.index === T.DARK || tile.index === T.DARK2)) this.paint(x, y, T.FLOOR)
      }
    }
  }

  private paint(x: number, y: number, index: number): void {
    const tile = this.layer.putTileAt(index, x, y)
    if (tile) tile.setCollision(isSolidIndex(index))
  }

  private syncProps(): void {
    const leafy = this.state.planted.every(Boolean)
    this.trees.forEach((tree, index) => {
      if (index < 3) tree.setTexture(leafy ? 'tree' : 'tree-bare')
    })
    this.sprouts.forEach((sprout, index) => sprout.setVisible(this.state.planted[index]))
    for (const id of ['mayor', 'menor', 'stars'] as LuminaryId[]) {
      this.pedGlows.get(id)?.setVisible(this.state.placed[id])
    }
    for (const marker of this.markers) {
      if (marker.id.startsWith('light')) marker.sprite.setVisible(!this.state.lights[Number(marker.id.slice(5))])
      if (marker.id.startsWith('seed')) marker.sprite.setVisible(!this.state.seeds[Number(marker.id.slice(4))])
      if (marker.id.startsWith('orb-')) {
        const id = marker.id.slice(4) as LuminaryId
        marker.sprite.setVisible(!this.state.orbs[id])
      }
      if (marker.id === 'shell') marker.sprite.setVisible(!this.state.secrets.shell)
      if (marker.id === 'star') marker.sprite.setVisible(!this.state.secrets.star)
    }
    this.fish.forEach((fish, index) => {
      if (this.state.fish[index] && !fish.home) {
        fish.home = true
        const spot = FISH_HOME[index]
        fish.tx = spot.x
        fish.ty = spot.y
        const pos = tileCenter(spot.x, spot.y)
        fish.sprite.setPosition(pos.x, pos.y)
      }
    })
    this.animals.forEach((animal, index) => {
      if (this.state.animals[index] && !animal.home) {
        animal.home = true
        const spot = [{ x: 24, y: 4 }, { x: 26, y: 5 }, { x: 25, y: 6 }][index]
        animal.tx = spot.x
        animal.ty = spot.y
        const pos = tileCenter(spot.x, spot.y)
        animal.sprite.setPosition(pos.x, pos.y)
      }
    })
  }

  private ensureHumans(): void {
    if (!this.state.animals.every(Boolean)) return
    if (this.humans.length === 0) {
      const start = tileCenter(HUMAN_PATH[0].x, HUMAN_PATH[0].y)
      this.humans = [
        this.add.sprite(start.x, start.y, 'people', 0),
        this.add.sprite(start.x - 12, start.y + 8, 'people', 2),
      ]
    }
    if (this.state.humansArrived || this.state.humansSeen) {
      this.humanT = 1
      this.placeHumans(1)
      return
    }
    if (!this.humanStarted) {
      this.humanStarted = true
      this.humanT = 0
    }
  }

  private updateHumans(delta: number, time: number): void {
    if (!this.humanStarted || this.state.humansArrived) {
      this.humans.forEach((sprite, index) => sprite.setFrame(index === 0 ? 0 : 2))
      return
    }
    this.humanT = Math.min(1, this.humanT + delta / 3800)
    this.placeHumans(this.humanT)
    const frame = Math.floor(time / 160) % 2
    this.humans[0]?.setFrame(frame)
    this.humans[1]?.setFrame(2 + frame)
    if (this.humanT >= 1 && !this.state.humansArrived) this.commit(apply(this.state, { type: 'arrive-humans' }))
  }

  private placeHumans(t: number): void {
    const lead = this.pointOnPath(t)
    const follow = this.pointOnPath(Math.max(0, t - 0.16))
    this.humans[0]?.setPosition(lead.x, lead.y).setDepth(lead.y)
    this.humans[1]?.setPosition(follow.x, follow.y).setDepth(follow.y)
  }

  private pointOnPath(t: number): { x: number; y: number } {
    const pts = HUMAN_PATH.map((spot) => tileCenter(spot.x, spot.y))
    const scaled = Phaser.Math.Clamp(t, 0, 1) * (pts.length - 1)
    const index = Math.min(pts.length - 2, Math.floor(scaled))
    const fraction = scaled - index
    return {
      x: Phaser.Math.Linear(pts[index].x, pts[index + 1].x, fraction),
      y: Phaser.Math.Linear(pts[index].y, pts[index + 1].y, fraction),
    }
  }

  private watchHumans(): void {
    if (!this.state.humansArrived || this.state.humansSeen) return
    const dest = tileCenter(HUMAN_PATH[HUMAN_PATH.length - 1].x, HUMAN_PATH[HUMAN_PATH.length - 1].y)
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, dest.x, dest.y) < 46) {
      this.commit(apply(this.state, { type: 'see-humans' }))
    }
  }

  private shoveFish(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    const moving = Math.hypot(body.velocity.x, body.velocity.y) > 8
    let fx = 0
    let fy = 0
    if (Math.abs(body.velocity.x) > Math.abs(body.velocity.y)) fx = Math.sign(body.velocity.x)
    else if (Math.abs(body.velocity.y) > 0) fy = Math.sign(body.velocity.y)
    for (const fish of this.fish) {
      fish.cool = Math.max(0, fish.cool - delta)
      if (fish.home) continue
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.sprite.x, fish.sprite.y)
      if (dist > 16) continue
      if (moving && fish.cool <= 0 && (fx !== 0 || fy !== 0)) {
        const nx = fish.tx + fx
        const ny = fish.ty + fy
        if (this.fishCanEnter(nx, ny, fish)) {
          const water = this.isCoastWater(nx, ny)
          this.moveCritter(fish, nx, ny)
          if (water) this.homeFish(fish)
          continue
        }
      }
      if (dist < 12) {
        const angle = Math.atan2(this.player.y - fish.sprite.y, this.player.x - fish.sprite.x)
        this.player.x += Math.cos(angle) * (12 - dist)
        this.player.y += Math.sin(angle) * (12 - dist)
      }
    }
  }

  private followAnimals(delta: number): void {
    if (!hasFruit(this.state)) return
    this.followAcc += delta
    if (this.followAcc < 480) return
    this.followAcc = 0
    const px = Math.floor(this.player.x / 16)
    const py = Math.floor(this.player.y / 16)
    for (const animal of this.animals) {
      if (animal.home || animal.cool > 0 || this.state.animals[animal.index]) continue
      if (this.isPasture(animal.tx, animal.ty)) {
        this.homeAnimal(animal)
        continue
      }
      const dist = Math.abs(animal.tx - px) + Math.abs(animal.ty - py)
      if (dist === 0 || dist > 5) continue
      const options = this.neighbors(animal.tx, animal.ty).filter((spot) => this.animalCanEnter(spot.x, spot.y, animal))
      options.sort((a, b) => {
        const da = Math.abs(a.x - px) + Math.abs(a.y - py)
        const db = Math.abs(b.x - px) + Math.abs(b.y - py)
        return dist <= 1 ? db - da : da - db
      })
      const next = options[0]
      if (!next) continue
      this.moveCritter(animal, next.x, next.y)
      if (this.isPasture(next.x, next.y)) this.homeAnimal(animal)
    }
  }

  private fishCanEnter(x: number, y: number, self: Critter): boolean {
    if (this.occupied(x, y, self)) return false
    if (this.isCoastWater(x, y)) return true
    return zoneAt(x, y) === 'day5' && canWalk(this.world, x, y, { open: this.gates() })
  }

  private animalCanEnter(x: number, y: number, self: Critter): boolean {
    if (zoneAt(x, y) !== 'day6') return false
    if (this.occupied(x, y, self)) return false
    return canWalk(this.world, x, y, { open: this.gates() })
  }

  private occupied(x: number, y: number, self: Critter): boolean {
    return [...this.fish, ...this.animals].some((critter) => critter !== self && !critter.home && critter.tx === x && critter.ty === y)
  }

  private isCoastWater(x: number, y: number): boolean {
    const tile = this.world.tiles[y]?.[x]
    return zoneAt(x, y) === 'day5' && (tile === T.WATER || tile === T.WATER2 || tile === T.DEEP || tile === T.DEEP2)
  }

  private isPasture(x: number, y: number): boolean {
    return PASTURE.some((spot) => spot.x === x && spot.y === y)
  }

  private neighbors(x: number, y: number): Point[] {
    return [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ]
  }

  private moveCritter(critter: Critter, x: number, y: number): void {
    critter.tx = x
    critter.ty = y
    critter.cool = 300
    const pos = tileCenter(x, y)
    this.tweens.add({
      targets: critter.sprite,
      x: pos.x,
      y: pos.y,
      duration: 150,
      onUpdate: () => critter.sprite.setDepth(critter.sprite.y),
    })
  }

  private homeFish(fish: Critter): void {
    if (this.state.fish[fish.index] || !this.luminariesReady()) return
    fish.home = true
    const spot = FISH_HOME[fish.index]
    this.moveCritter(fish, spot.x, spot.y)
    this.commit(apply(this.state, { type: 'fish-home', index: fish.index }))
  }

  private homeAnimal(animal: Critter): void {
    if (this.state.animals[animal.index] || !this.state.fish.every(Boolean) || !this.state.birds.every(Boolean)) return
    animal.home = true
    this.commit(apply(this.state, { type: 'animal-home', index: animal.index }))
  }

  private nudgeFish(): void {
    let moved = false
    for (const fish of this.fish) {
      if (fish.home || this.state.fish[fish.index]) continue
      const path = bfs(
        { x: fish.tx, y: fish.ty },
        (x, y) => this.isCoastWater(x, y),
        (x, y) => this.fishCanEnter(x, y, fish) && !this.isCoastWater(x, y),
      )
      const next = path?.[1]
      if (!next) continue
      moved = true
      if (this.isCoastWater(next.x, next.y)) this.homeFish(fish)
      else this.moveCritter(fish, next.x, next.y)
    }
    ui.toast(moved ? 'La marea acomoda un paso.' : 'Los peces ya están en el agua.')
  }

  private nudgeAnimals(): void {
    let moved = false
    for (const animal of this.animals) {
      if (animal.home || this.state.animals[animal.index]) continue
      const path = bfs(
        { x: animal.tx, y: animal.ty },
        (x, y) => this.isPasture(x, y),
        (x, y) => this.animalCanEnter(x, y, animal),
      )
      const next = path?.[1]
      if (!next) continue
      moved = true
      this.moveCritter(animal, next.x, next.y)
      if (this.isPasture(next.x, next.y)) this.homeAnimal(animal)
    }
    if (!moved) ui.toast(this.state.animals.every(Boolean) ? 'Ya están en el prado.' : 'No hay un paso libre.')
  }

  private enterTile(): void {
    const foot = this.foot()
    const key = keyOf(foot.x, foot.y)
    if (key === this.lastTile) return
    this.lastTile = key
    const order = this.world.lilyOrder.get(key)
    const decoy = this.world.lilyDecoy.get(key) ?? null
    if (order === undefined && !decoy) return
    this.commit(apply(this.state, { type: 'lily', order: order ?? null, decoy }))
  }

  private tryInteract(id?: string): void {
    const marker = id ? this.markers.find((item) => item.id === id) : this.nearestPrompt()
    if (!marker || !marker.active()) {
      if (this.nearRest() && !this.state.humansSeen) ui.toast('El descanso llega después de ver la creación.')
      return
    }
    this.learned = true
    if (marker.id === 'tide') {
      this.nudgeFish()
      audio.sfx('splash')
      return
    }
    if (marker.id === 'whistle') {
      this.nudgeAnimals()
      audio.sfx('ui')
      return
    }
    if (marker.id === 'rest') {
      if (this.state.rested) {
        this.openComplete()
        return
      }
      this.mode = 'resting'
      this.restTimer = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 350 : 1200
      audio.setAmbient('solemn')
      ui.toast('El séptimo día. Un momento de calma.')
      return
    }
    if (marker.id.startsWith('bird')) {
      const index = Number(marker.id.slice(4))
      this.birds[index].flying = true
      const step = apply(this.state, { type: 'interact', id: marker.id })
      this.flyBird(index)
      this.commit(step)
      return
    }
    this.commit(apply(this.state, { type: 'interact', id: marker.id }))
  }

  private flyBird(index: number): void {
    const bird = this.birds[index]
    const perch = tileCenter(BIRD_PERCH[index].x, BIRD_PERCH[index].y)
    this.tweens.add({
      targets: bird.sprite,
      x: perch.x,
      y: perch.y - 8,
      duration: 650,
      onComplete: () => {
        bird.flying = false
        bird.sprite.setPosition(perch.x, perch.y)
      },
    })
  }

  private nearestPrompt(): Marker | undefined {
    let best: Marker | undefined
    let bestDist = 26
    for (const marker of this.markers) {
      if (!marker.active() || !marker.sprite.visible && !marker.id.startsWith('bird') && !marker.id.startsWith('soil') && !marker.id.startsWith('ped')) continue
      const pos = tileCenter(marker.tx, marker.ty)
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, marker.id.startsWith('bird') ? marker.sprite.x : pos.x, marker.id.startsWith('bird') ? marker.sprite.y : pos.y)
      if (dist < bestDist) {
        best = marker
        bestDist = dist
      }
    }
    return best
  }

  private nearRest(): boolean {
    const pos = tileCenter(REST.x, REST.y)
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, pos.x, pos.y) < 28
  }

  private warnGate(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body
    if (Math.hypot(body.velocity.x, body.velocity.y) < 8) return
    const facing = this.facingTile()
    const id = this.world.gateAt.get(keyOf(facing.x, facing.y))
    if (!id || this.gates().has(id)) return
    if (this.time.now < this.gateAt) return
    this.gateAt = this.time.now + 2600
    if (!this.warnedGate) {
      this.warnedGate = true
      audio.sting('danger', 800)
    }
    audio.sfx('no')
    ui.toast('Todavía hay algo por ver de este lado.')
  }

  private unstick(delta: number): void {
    const foot = this.foot()
    if (canWalk(this.world, foot.x, foot.y, { open: this.gates(), mistOpen: this.state.lilyDone })) {
      this.stuck = 0
      this.lastGood = { x: this.player.x, y: this.player.y }
      return
    }
    this.stuck += delta
    if (this.stuck > 500) {
      this.player.setPosition(this.lastGood.x, this.lastGood.y)
      this.player.setVelocity(0)
      this.stuck = 0
    }
  }

  private watchZone(): void {
    const zone = zoneAt(this.foot().x, this.foot().y)
    if (!zone || zone === this.zone) return
    this.zone = zone
    audio.setAmbient(zoneMood(zone, this.state))
    if (zone === 'day6' && hasFruit(this.state) && !this.state.animals.every(Boolean) && !this.meadowHint) {
      this.meadowHint = true
      ui.toast('El fruto del jardín atrae a los animales. Caminá hasta el prado.')
    }
  }

  private updateGuide(delta: number): void {
    const guide = guideTarget(this.state)
    const key = JSON.stringify(this.state.lights) + this.state.lilyStep + this.state.holding + this.state.planted.join('') + this.state.fish.join('') + this.state.birds.join('') + this.state.animals.join('') + String(this.state.humansSeen) + String(this.state.rested)
    if (key !== this.progress) {
      this.progress = key
      this.lostAcc = 0
    } else this.lostAcc += delta
    if (!guide || this.state.rested) {
      this.arrow.setVisible(false)
      return
    }
    const worldPoint = tileCenter(guide.x, guide.y)
    const cam = this.cameras.main
    const sx = (worldPoint.x - cam.worldView.x) * cam.zoom
    const sy = (worldPoint.y - cam.worldView.y) * cam.zoom
    const inside = sx > 20 && sy > 20 && sx < cam.width - 20 && sy < cam.height - 20
    this.arrow.setVisible(!inside)
    if (inside) return
    const angle = Math.atan2(sy - cam.height / 2, sx - cam.width / 2)
    this.arrow.setPosition(Phaser.Math.Clamp(sx, 16, cam.width - 16), Phaser.Math.Clamp(sy, 16, cam.height - 16))
    this.arrow.setRotation(angle - Math.PI / 2)
    this.arrow.setAlpha(this.lostAcc > 18000 ? 1 : 0.6)
  }

  private animateCompanions(time: number): void {
    this.chispa.setPosition(this.player.x - 9, this.player.y - 16 + Math.sin(time / 180) * 2).setDepth(this.player.depth + 1)
    this.chispa.setTexture(Math.floor(time / 150) % 2 ? 'chispa2' : 'chispa')
    if (!this.state.lilyDone && this.state.lights.every(Boolean)) {
      const step = LILY_PATH[Math.min(this.state.lilyStep, LILY_PATH.length - 1)]
      const pos = tileCenter(step.x, step.y)
      this.firefly.setVisible(true).setPosition(pos.x, pos.y + Math.sin(time / 150) * 2).setDepth(pos.y)
    } else this.firefly.setVisible(false)
    if (this.state.holding) {
      const texture = this.state.holding === 'mayor' ? 'orb-mayor' : this.state.holding === 'menor' ? 'orb-menor' : 'orb-stars'
      this.held.setVisible(true).setTexture(texture).setPosition(this.player.x, this.player.y - 18).setDepth(this.player.depth + 2)
    } else this.held.setVisible(false)
    for (const marker of this.markers) {
      if (marker.id.startsWith('light') && marker.sprite.visible) {
        marker.sprite.setScale(1 + Math.sin(time / 200 + marker.tx) * 0.08)
      }
    }
  }

  private flapBirds(time: number): void {
    for (const bird of this.birds) {
      if (bird.flying) continue
      bird.sprite.setTexture(Math.floor(time / 180 + bird.index) % 2 ? 'bird2' : 'bird')
      if (this.state.birds[bird.index]) {
        const perch = tileCenter(BIRD_PERCH[bird.index].x, BIRD_PERCH[bird.index].y)
        bird.sprite.setPosition(perch.x, perch.y + Math.sin(time / 200 + bird.index) * 1)
      }
    }
  }

  private animateWater(delta: number): void {
    this.waterAcc += delta
    if (this.waterAcc < 520) return
    this.waterAcc = 0
    this.waterOn = !this.waterOn
    for (const spot of this.world.waterTiles) {
      const tile = this.layer.getTileAt(spot.x, spot.y)
      if (!tile) continue
      if (tile.index === T.WATER || tile.index === T.WATER2) this.paint(spot.x, spot.y, this.waterOn ? T.WATER2 : T.WATER)
      else if (tile.index === T.DEEP || tile.index === T.DEEP2) this.paint(spot.x, spot.y, this.waterOn ? T.DEEP2 : T.DEEP)
    }
  }

  private footstep(delta: number, dir: { x: number; y: number }): void {
    if (dir.x === 0 && dir.y === 0) return
    this.stepAcc += delta
    if (this.stepAcc < 260) return
    this.stepAcc = 0
    audio.sfx('step')
  }

  private refreshHud(prompt?: string | null): void {
    const goal = objective(this.state)
    const day = completedDay(this.state)
    let action = prompt ?? ''
    if (!action && !this.learned && this.time.now < this.controlsUntil && day === 0) {
      action = ui.touchPreferred() ? 'Flechas para caminar · botón Mirar' : 'Flechas o WASD · E o Espacio para mirar'
    } else if (action && !ui.touchPreferred()) action = `E o Espacio · ${action}`
    const sky = skyView(this.state)
    ui.setFirmament({ mode: sky.mode, constellation: sky.constellation })
    ui.updateHud({
      dayLabel: goal.dayLabel,
      title: goal.title,
      hint: goal.hint,
      action,
      doneDays: day,
      current: !this.state.rested && day < 7,
    })
  }

  private applySky(): void {
    const color = SKY[skyView(this.state).mode] ?? SKY.void
    this.cameras.main.setBackgroundColor(color)
    document.body.style.background = color
    const game = document.getElementById('game')
    if (game) game.style.background = color
  }

  private openPause(): void {
    this.mode = 'pause'
    this.player.setVelocity(0)
    audio.duck(true)
    const goal = objective(this.state)
    ui.showPause({
      objective: goal.title,
      hint: goal.hint,
      items: inventoryLines(this.state),
      secrets: secretsLine(this.state),
      onResume: () => this.closePause(),
      onRelato: () => this.openRelato(),
      onSettings: () => ui.showSettings(() => this.openPause()),
      onEntrance: () => {
        this.returnToEntrance()
        this.closePause()
      },
      onNudge: () => {
        this.nudgeFish()
        this.nudgeAnimals()
        if (!this.state.lilyDone && this.state.lights.every(Boolean)) {
          this.state.lilyStep = 0
          this.persist()
          ui.toast('La luciérnaga volvió al primer lirio.')
        }
      },
      onRestart: () => ui.confirm('¿Volver a empezar La creación?', () => this.restartLevel(), () => this.openPause()),
      onMenu: () => {
        this.persist()
        this.scene.start('menu')
      },
    })
  }

  private closePause(): void {
    this.mode = 'play'
    audio.duck(false)
    ui.closeOverlay()
  }

  private openRelato(): void {
    this.mode = 'pause'
    this.player.setVelocity(0)
    audio.duck(true)
    ui.showRelato(refsFor(this.state), () => this.closePause())
  }

  private openComplete(): void {
    this.mode = 'modal'
    this.player.setVelocity(0)
    audio.duck(true)
    audio.setAmbient('solemn')
    ui.showComplete({
      summary: COMPLETE_SUMMARY,
      ref: 'Referencia: Génesis 1:1–2:3',
      secrets: secretsLine(this.state),
      onStroll: () => this.dismissSummary(),
      onPreview: () => {
        this.markSummary()
        this.scene.start('preview')
      },
      onChapters: () => {
        this.markSummary()
        this.scene.start('menu', { screen: 'chapters' })
      },
    })
  }

  private dismissSummary(): void {
    this.markSummary()
    this.mode = 'play'
    audio.duck(false)
    ui.closeOverlay()
  }

  private markSummary(): void {
    if (!this.state.summaryDismissed) {
      this.state.summaryDismissed = true
      this.persist()
    }
  }

  private returnToEntrance(): void {
    const spot = checkpointFor(this.state)
    const pos = tileCenter(spot.x, spot.y)
    this.player.setPosition(pos.x, pos.y)
    this.player.setVelocity(0)
    this.lastGood = { x: pos.x, y: pos.y }
    if (!this.state.lilyDone) this.state.lilyStep = 0
    for (const fish of this.fish) {
      if (fish.home || this.state.fish[fish.index]) continue
      const start = FISH[fish.index]
      fish.tx = start.x
      fish.ty = start.y
      const at = tileCenter(start.x, start.y)
      fish.sprite.setPosition(at.x, at.y)
    }
    for (const animal of this.animals) {
      if (animal.home || this.state.animals[animal.index]) continue
      const start = ANIMALS[animal.index]
      animal.tx = start.x
      animal.ty = start.y
      const at = tileCenter(start.x, start.y)
      animal.sprite.setPosition(at.x, at.y)
    }
    this.persist()
    ui.toast('Volviste a la entrada de esta zona.')
  }

  private restartLevel(): void {
    this.skipPersist = true
    session.data.creation = freshState()
    session.data.pos = null
    session.data.edenUnlocked = false
    session.commit()
    this.scene.restart()
  }

  private burst(tx: number, ty: number, color: number): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const pos = tileCenter(tx, ty)
    for (let i = 0; i < 8; i++) {
      const bit = this.add.image(pos.x, pos.y, 'pixel').setTint(color).setDepth(pos.y + 20)
      const angle = (Math.PI * 2 * i) / 8
      this.tweens.add({
        targets: bit,
        x: pos.x + Math.cos(angle) * 16,
        y: pos.y + Math.sin(angle) * 16,
        alpha: 0,
        duration: 380,
        onComplete: () => bit.destroy(),
      })
    }
  }

  private gates(): Set<string> {
    return new Set(openGateIds(this.state))
  }

  private luminariesReady(): boolean {
    return this.state.placed.mayor && this.state.placed.menor && this.state.placed.stars
  }

  private foot(): Point {
    return { x: Math.floor(this.player.x / 16), y: Math.floor((this.player.y + 4) / 16) }
  }

  private facingTile(): Point {
    const foot = this.foot()
    if (this.player.facing === 'left') return { x: foot.x - 1, y: foot.y }
    if (this.player.facing === 'right') return { x: foot.x + 1, y: foot.y }
    if (this.player.facing === 'up') return { x: foot.x, y: foot.y - 1 }
    return { x: foot.x, y: foot.y + 1 }
  }

  private persist(): void {
    session.data.creation = this.state
    if (this.player) session.data.pos = { x: this.player.x, y: this.player.y }
    session.commit()
  }
}
