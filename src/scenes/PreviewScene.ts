import Phaser from 'phaser'
import { audio } from '../core/audio'
import { input } from '../core/input'
import { EDEN_BLURB } from '../data/copy'
import { Player } from '../entities/Player'
import { T } from '../world/tiles'
import { ui } from '../ui/ui'

const W = 18
const H = 13

export class PreviewScene extends Phaser.Scene {
  private player!: Player
  private mode: 'play' | 'read' = 'play'

  constructor() {
    super('preview')
  }

  create(): void {
    input.flush()
    const data: number[][] = Array.from({ length: H }, () => Array(W).fill(T.GRASS))
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) data[y][x] = T.STONE
        else if ((x + y) % 4 === 0) data[y][x] = T.GRASS2
      }
    }
    for (let y = 3; y <= 10; y++) data[y][8] = T.PATH
    data[2][8] = T.GATE
    data[2][9] = T.GATE
    for (const [x, y] of [[3, 4], [14, 5], [5, 8], [13, 9], [11, 6]]) data[y][x] = T.FLOWER
    const map = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 })
    const tileset = map.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0, 0)
    const layer = tileset ? map.createLayer(0, tileset, 0, 0) : null
    if (!layer) throw new Error('No se pudo abrir la puerta del jardín.')
    layer.setCollision([T.STONE, T.STONE2, T.GATE])
    this.player = new Player(this, 8 * 16 + 8, 10 * 16 + 8)
    this.physics.add.collider(this.player, layer)
    this.add.image(4 * 16 + 8, 4 * 16 + 14, 'tree').setOrigin(0.5, 1)
    this.add.image(14 * 16 + 8, 7 * 16 + 14, 'tree').setOrigin(0.5, 1)
    const sign = this.add.image(6 * 16 + 8, 8 * 16 + 8, 'sign')
    this.add.image(8 * 16 + 8, 2 * 16, 'light').setDepth(20)
    this.cameras.main.setZoom(2)
    this.cameras.main.roundPixels = true
    this.cameras.main.startFollow(this.player, true, 0.16, 0.16)
    this.cameras.main.setBounds(0, 0, W * 16, H * 16)
    this.cameras.main.setBackgroundColor('#7fbf6a')
    document.body.style.background = '#7fbf6a'
    ui.enterPlay({
      onPause: () => this.exit(),
      onRelato: () => this.read(),
      pauseLabel: 'Volver',
    })
    ui.setLayoutListener(() => this.scale.refresh())
    ui.setFirmament({ mode: 'green', constellation: false })
    ui.updateHud({
      dayLabel: 'Después',
      title: 'El jardín del Edén',
      hint: 'Podés caminar hasta la puerta. Todavía no se abre.',
      action: '',
      doneDays: 7,
      current: false,
    })
    audio.setAmbient('explore')
    this.input.on('pointerdown', () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })
    this.time.delayedCall(60, () => this.scale.refresh())
    this.events.once('shutdown', () => ui.leavePlay())
    void sign
  }

  update(): void {
    if (this.mode === 'read') {
      this.player.setVelocity(0)
      if (input.consumeInteract() || input.consumePause()) ui.backOut()
      return
    }
    if (input.consumePause()) {
      this.exit()
      return
    }
    this.player.move(input.direction())
    const gate = Phaser.Math.Distance.Between(this.player.x, this.player.y, 8 * 16 + 8, 3 * 16)
    const sign = Phaser.Math.Distance.Between(this.player.x, this.player.y, 6 * 16 + 8, 8 * 16 + 8)
    const near = gate < 28 || sign < 22
    ui.updateHud({
      dayLabel: 'Después',
      title: 'El jardín del Edén',
      hint: EDEN_BLURB[1],
      action: near ? (ui.touchPreferred() ? 'Mirar la puerta' : 'E o Espacio · Mirar la puerta') : '',
      doneDays: 7,
      current: false,
    })
    if (input.consumeInteract() && near) {
      ui.toast(EDEN_BLURB[0] + ' ' + EDEN_BLURB[2])
      audio.sfx('chime')
    } else input.consumeInteract()
  }

  private read(): void {
    this.mode = 'read'
    ui.showRelato(
      [{
        day: 2,
        title: 'El jardín',
        ref: 'Génesis 2',
        text: 'El relato sigue con un jardín plantado por Dios, un lugar para vivir y cuidar. Esta pantalla es solo la puerta: el nivel se jugará más adelante.',
      }],
      () => {
        this.mode = 'play'
        ui.closeOverlay()
      },
    )
  }

  private exit(): void {
    input.flush()
    this.scene.start('menu', { screen: 'chapters' })
  }
}
