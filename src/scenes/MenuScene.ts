import Phaser from 'phaser'
import { audio } from '../core/audio'
import { input } from '../core/input'
import { session } from '../core/session'
import { freshState } from '../world/logic'
import { ui } from '../ui/ui'

export class MenuScene extends Phaser.Scene {
  private pending = ''
  private clouds: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('menu')
  }

  init(data: { screen?: string }): void {
    this.pending = data?.screen ?? ''
  }

  create(): void {
    this.paint()
    audio.setAmbient('explore')
    input.flush()
    if (this.pending === 'chapters') this.openChapters()
    else this.openMenu()
    this.input.on('pointerdown', () => {
      audio.unlock()
      audio.setAmbient('explore')
    })
  }

  update(_time: number, delta: number): void {
    for (const cloud of this.clouds) {
      cloud.x += delta * 0.012
      if (cloud.x > 460) cloud.x = -80
    }
    if (input.consumePause()) {
      if (ui.screen !== 'menu') ui.backOut()
    } else {
      input.consumeInteract()
    }
  }

  private openMenu(): void {
    ui.showMenu({
      onNew: () => this.newGame(),
      onContinue: () => this.play(),
      onChapters: () => this.openChapters(),
      onSettings: () => ui.showSettings(() => this.openMenu()),
    })
  }

  private openChapters(): void {
    ui.showChapters({
      onPlay: () => {
        if (!session.data.creation) {
          session.data.creation = freshState()
          session.data.pos = null
          session.commit()
        }
        this.play()
      },
      onPreview: () => {
        if (!session.data.edenUnlocked) return
        input.flush()
        this.scene.start('preview')
      },
      onBack: () => this.openMenu(),
    })
  }

  private newGame(): void {
    const start = () => {
      session.data.creation = freshState()
      session.data.pos = null
      session.data.edenUnlocked = false
      session.commit()
      this.play()
    }
    if (session.data.creation) {
      ui.confirm('¿Empezar de nuevo? Se reemplaza el progreso de La creación.', start, () => this.openMenu())
      return
    }
    start()
  }

  private play(): void {
    input.flush()
    this.scene.start('creation')
  }

  private paint(): void {
    this.cameras.main.setBackgroundColor('#243056')
    document.body.style.background = '#243056'
    const game = document.getElementById('game')
    if (game) game.style.background = '#243056'
    const g = this.add.graphics()
    for (let y = 0; y < 168; y++) {
      const t = y / 168
      const r = Math.round(36 + t * 200)
      const gc = Math.round(48 + t * 120)
      const b = Math.round(110 - t * 20)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gc, b))
      g.fillRect(0, y, 400, 1)
    }
    g.fillStyle(0xf6d98a)
    g.fillCircle(78, 54, 16)
    g.fillStyle(0xfff1c4)
    g.fillCircle(78, 54, 8)
    g.fillStyle(0x2f7d38)
    g.fillRect(0, 176, 400, 70)
    g.fillStyle(0x3f9d45)
    g.fillEllipse(70, 170, 180, 36)
    g.fillEllipse(300, 176, 200, 40)
    g.fillStyle(0xe0c08a)
    g.fillRect(168, 176, 64, 70)
    this.add.image(78, 186, 'tree').setOrigin(0.5, 1).setScale(3)
    this.add.image(330, 188, 'tree').setOrigin(0.5, 1).setScale(3)
    const hero = this.add.sprite(200, 214, 'hero', 0).setScale(3).setOrigin(0.5, 1)
    hero.play('walk-down')
    const spark = this.add.image(168, 150, 'chispa').setScale(3)
    this.tweens.add({ targets: spark, y: 142, duration: 700, yoyo: true, repeat: -1 })
    for (const x of [40, 180, 300]) {
      const cloud = this.add.rectangle(x, 40 + (x % 30), 46, 12, 0xfff8ee, 0.85)
      this.clouds.push(cloud)
    }
  }
}
