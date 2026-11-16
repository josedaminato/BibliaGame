import Phaser from 'phaser'

const IDLE: Record<'down' | 'left' | 'right' | 'up', number> = {
  down: 0,
  left: 3,
  right: 6,
  up: 9,
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: 'down' | 'left' | 'right' | 'up' = 'down'

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(8, 6)
    body.setOffset(4, 9)
    body.setMaxVelocity(96, 96)
    this.setDepth(y)
  }

  move(dir: { x: number; y: number }): void {
    this.setVelocity(dir.x * 92, dir.y * 92)
    if (dir.x === 0 && dir.y === 0) {
      if (this.anims.isPlaying) this.anims.stop()
      this.setFrame(IDLE[this.facing])
      return
    }
    if (Math.abs(dir.y) > Math.abs(dir.x)) this.facing = dir.y > 0 ? 'down' : 'up'
    else this.facing = dir.x > 0 ? 'right' : 'left'
    const key = `walk-${this.facing}`
    if (this.anims.currentAnim?.key !== key || !this.anims.isPlaying) this.play(key, true)
    this.setDepth(this.y)
  }
}
