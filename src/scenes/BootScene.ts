import Phaser from 'phaser'
import { buildArt } from '../art/textures'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create(): void {
    buildArt(this)
    this.scene.start('menu')
  }
}
