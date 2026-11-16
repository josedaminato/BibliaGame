import Phaser from 'phaser'
import { audio } from './core/audio'
import { input } from './core/input'
import { session } from './core/session'
import { BootScene } from './scenes/BootScene'
import { CreationScene } from './scenes/CreationScene'
import { MenuScene } from './scenes/MenuScene'
import { PreviewScene } from './scenes/PreviewScene'
import { ui } from './ui/ui'
import './styles.css'

ui.init()
audio.bindSettings(() => session.data.settings)

const unlock = () => audio.unlock()
window.addEventListener('pointerdown', unlock)
window.addEventListener('keydown', unlock)

document.addEventListener('touchmove', (event) => {
  const target = event.target
  if (target instanceof Element && target.closest('.can-scroll')) return
  event.preventDefault()
}, { passive: false })

document.addEventListener('contextmenu', (event) => {
  if (event.target instanceof Element && event.target.closest('#app')) event.preventDefault()
})

window.addEventListener('error', (event) => {
  const overlay = document.getElementById('overlay')
  if (!overlay || overlay.childElementCount > 0) return
  overlay.textContent = 'El juego encontró un problema al arrancar. Recargá la página.'
})

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 400,
  height: 240,
  backgroundColor: '#14182b',
  pixelArt: true,
  roundPixels: true,
  banner: false,
  fps: { target: 60, forceSetTimeOut: true },
  audio: { noAudio: true },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 400, height: 240 },
  scene: [BootScene, MenuScene, CreationScene, PreviewScene],
  input: { activePointers: 3 },
})

void input
