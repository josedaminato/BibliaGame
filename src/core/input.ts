class InputController {
  private keys = new Set<string>()
  private touchX = 0
  private touchY = 0
  private interactEdge = false
  private pauseEdge = false

  constructor() {
    window.addEventListener('keydown', (event) => {
      const onControl =
        event.target instanceof Element && Boolean(event.target.closest('button, a, input, textarea'))
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault()
      if (event.key === ' ' && !onControl) event.preventDefault()
      if (event.repeat) return
      if (event.key === 'Escape') {
        this.pauseEdge = true
        return
      }
      if (onControl) return
      const key = event.key.toLowerCase()
      if (key === 'e' || key === ' ') this.interactEdge = true
      this.keys.add(key)
    })
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase())
    })
    window.addEventListener('blur', () => this.clearHeld())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clearHeld()
    })
  }

  setTouch(x: number, y: number): void {
    this.touchX = x
    this.touchY = y
  }

  queueInteract(): void {
    this.interactEdge = true
  }

  direction(): { x: number; y: number } {
    let x = 0
    let y = 0
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1
    if (x === 0 && y === 0) {
      x = this.touchX
      y = this.touchY
    }
    if (x === 0 && y === 0) return { x: 0, y: 0 }
    const len = Math.hypot(x, y) || 1
    return { x: x / len, y: y / len }
  }

  consumeInteract(): boolean {
    const value = this.interactEdge
    this.interactEdge = false
    return value
  }

  consumePause(): boolean {
    const value = this.pauseEdge
    this.pauseEdge = false
    return value
  }

  flush(): void {
    this.interactEdge = false
    this.pauseEdge = false
    this.clearHeld()
  }

  private clearHeld(): void {
    this.keys.clear()
    this.touchX = 0
    this.touchY = 0
  }
}

export const input = new InputController()
