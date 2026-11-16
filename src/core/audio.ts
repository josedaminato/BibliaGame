import type { Settings } from './save'
import type { Mood, SfxName } from '../world/logic'

const N = {
  A2: 110,
  B2: 123.47,
  C3: 130.81,
  Db3: 138.59,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
}

interface Pattern {
  step: number
  lead: number[]
  harm: number[]
  bass: number[]
  gain: number
  wave: OscillatorType
  legato: boolean
}

const REST: number[] = []

const PATTERNS: Record<Mood, Pattern> = {
  explore: {
    step: 0.28,
    gain: 0.16,
    wave: 'triangle',
    legato: false,
    lead: [N.C4, N.E4, N.G4, N.E4, N.A4, N.G4, N.E4, N.D4, N.C4, N.D4, N.E4, N.G4, N.A4, N.G4, N.E4, N.C4, N.F4, N.G4, N.A4, N.G4, N.E4, N.D4, N.C4, N.D4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.C4, 0],
    harm: [N.E4, 0, N.G4, 0, N.C5, 0, N.G4, 0, N.E4, 0, N.G4, 0, N.C5, 0, N.G4, 0, N.A4, 0, N.C5, 0, N.A4, 0, N.G4, 0, N.G4, 0, N.C5, 0, N.G4, 0, N.E4, 0],
    bass: [N.C3, 0, N.G3, 0, N.A3, 0, N.E3, 0, N.F3, 0, N.C3, 0, N.G3, 0, N.C3, 0, N.F3, 0, N.C3, 0, N.A3, 0, N.G3, 0, N.C3, 0, N.G3, 0, N.C3, 0, N.C3, 0],
  },
  mystery: {
    step: 0.36,
    gain: 0.11,
    wave: 'triangle',
    legato: true,
    lead: [N.A3, N.C4, N.E4, 0, N.D4, N.E4, N.C4, N.A3, N.G3, N.A3, N.C4, 0, N.E4, N.D4, N.C4, 0],
    harm: [N.E4, 0, 0, 0, N.F4, 0, 0, 0, N.D4, 0, 0, 0, N.E4, 0, 0, 0],
    bass: [N.A2, 0, N.E3, 0, N.D3, 0, N.A2, 0, N.G3, 0, N.D3, 0, N.A2, 0, N.E3, 0],
  },
  humor: {
    step: 0.2,
    gain: 0.14,
    wave: 'square',
    legato: false,
    lead: [N.G4, N.G4, N.A4, 0, N.B4, N.A4, N.G4, N.E4, N.G4, N.A4, N.B4, N.D5, N.B4, N.A4, N.G4, 0],
    harm: [N.B4, 0, N.D5, 0, N.D5, 0, N.B4, 0, N.B4, 0, N.D5, 0, N.G5, 0, N.D5, 0],
    bass: [N.G3, 0, N.D3, 0, N.G3, 0, N.D3, 0, N.G3, 0, N.D3, 0, N.G3, 0, N.G3, 0],
  },
  danger: {
    step: 0.34,
    gain: 0.08,
    wave: 'sine',
    legato: false,
    lead: [N.C3, 0, 0, N.C3, N.C3, 0, N.Db3, 0],
    harm: REST,
    bass: [N.C3, 0, 0, 0, N.C3, 0, 0, 0],
  },
  drama: {
    step: 0.46,
    gain: 0.12,
    wave: 'sine',
    legato: true,
    lead: [N.E4, 0, N.G4, 0, N.D4, 0, N.F4, 0, N.C4, 0, N.E4, 0, N.D4, 0, N.B2, 0],
    harm: [N.G4, 0, N.B4, 0, N.F4, 0, N.A4, 0, N.E4, 0, N.G4, 0, N.F4, 0, N.D4, 0],
    bass: [N.C3, 0, 0, 0, N.B2, 0, 0, 0, N.A2, 0, 0, 0, N.G3, 0, 0, 0],
  },
  victory: {
    step: 0.18,
    gain: 0.16,
    wave: 'triangle',
    legato: false,
    lead: [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.E5, N.C5, 0, 0, 0, 0, 0, 0, 0, 0],
    harm: [0, 0, N.E4, 0, N.G4, 0, N.C5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bass: [N.C3, 0, N.G3, 0, N.C3, 0, N.G3, 0, N.C3, 0, 0, 0, 0, 0, 0, 0],
  },
  solemn: {
    step: 0.52,
    gain: 0.08,
    wave: 'sine',
    legato: true,
    lead: [N.C4, 0, 0, 0, N.G4, 0, 0, 0, N.E4, 0, 0, 0, N.D4, 0, 0, 0],
    harm: [N.E4, 0, 0, 0, N.B4, 0, 0, 0, N.G4, 0, 0, 0, N.F4, 0, 0, 0],
    bass: [N.C3, 0, 0, 0, N.G3, 0, 0, 0, N.A2, 0, 0, 0, N.G3, 0, 0, 0],
  },
  silence: { step: 0.5, gain: 0, wave: 'sine', legato: false, lead: [0], harm: [0], bass: [0] },
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private duckGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private noise: AudioBuffer | null = null
  private timer = 0
  private nextTime = 0
  private stepIndex = 0
  private prevLead = 0
  private prevHarm = 0
  private unlocked = false
  private started = false
  ambient: Mood = 'silence'
  private current: Mood = 'silence'
  private stingUntil = 0
  private settings: Settings = { music: true, sfx: true, musicVolume: 0.7, sfxVolume: 0.8, touch: 'auto' }
  private ducked = false

  bindSettings(get: () => Settings): void {
    this.readSettings = get
  }

  private readSettings: () => Settings = () => this.settings

  unlock(): void {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    if (!this.ctx) {
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.duckGain = this.ctx.createGain()
      this.musicGain = this.ctx.createGain()
      this.sfxGain = this.ctx.createGain()
      this.filter = this.ctx.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.value = 1600
      this.musicGain.connect(this.filter)
      this.filter.connect(this.duckGain)
      this.duckGain.connect(this.master)
      this.sfxGain.connect(this.master)
      this.master.connect(this.ctx.destination)
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      this.noise = buffer
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.unlocked = true
    this.applySettings()
    if (this.duckGain) this.duckGain.gain.value = this.ducked ? 0.35 : 1
    this.ensure()
  }

  applySettings(): void {
    this.settings = this.readSettings()
    if (!this.musicGain || !this.sfxGain) return
    const music = this.settings.music ? 0.9 * this.settings.musicVolume : 0
    const sfx = this.settings.sfx ? this.settings.sfxVolume : 0
    this.musicGain.gain.setTargetAtTime(music, this.ctx!.currentTime, 0.05)
    this.sfxGain.gain.setTargetAtTime(sfx, this.ctx!.currentTime, 0.03)
  }

  setAmbient(mood: Mood): void {
    this.ambient = mood
    if (this.ctx && this.ctx.currentTime < this.stingUntil) return
    this.switchTo(mood)
  }

  sting(mood: Mood, ms: number): void {
    this.stingUntil = (this.ctx?.currentTime ?? 0) + ms / 1000
    this.switchTo(mood)
    window.setTimeout(() => {
      if (this.ctx && this.ctx.currentTime >= this.stingUntil - 0.05) this.switchTo(this.ambient)
    }, ms)
  }

  duck(on: boolean): void {
    this.ducked = on
    if (!this.duckGain || !this.ctx) return
    this.duckGain.gain.setTargetAtTime(on ? 0.35 : 1, this.ctx.currentTime, 0.08)
  }

  sfx(name: SfxName): void {
    if (!this.unlocked || !this.ctx || !this.sfxGain || !this.settings.sfx) return
    const bus = this.sfxGain
    const t = this.ctx.currentTime
    if (name === 'step') this.noiseBurst(t, 0.045, 900, 0.04)
    else if (name === 'splash') this.noiseBurst(t, 0.18, 500, 0.18)
    else if (name === 'ui') this.tone(t, 640, 0.07, 'square', 0.05, bus)
    else if (name === 'no') {
      this.tone(t, 196, 0.1, 'triangle', 0.06, bus)
      this.tone(t + 0.08, 164, 0.12, 'triangle', 0.05, bus)
    } else if (name === 'sparkle') {
      ;[523, 659, 784].forEach((f, i) => this.tone(t + i * 0.05, f, 0.12, 'triangle', 0.06, bus))
    } else if (name === 'grow') {
      this.tone(t, 330, 0.2, 'sine', 0.06, bus)
      this.tone(t + 0.08, 494, 0.22, 'sine', 0.05, bus)
    } else if (name === 'chime') {
      this.tone(t, 523, 0.22, 'triangle', 0.07, bus)
      this.tone(t + 0.06, 784, 0.28, 'triangle', 0.05, bus)
    } else if (name === 'discover') {
      ;[392, 523, 659].forEach((f, i) => this.tone(t + i * 0.07, f, 0.18, 'triangle', 0.06, bus))
    } else if (name === 'place') this.tone(t, 440, 0.1, 'square', 0.04, bus)
    else if (name === 'fanfare') {
      ;[523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.11, f, 0.28, 'triangle', 0.07, bus))
    }
  }

  private switchTo(mood: Mood): void {
    if (this.current === mood && this.started) return
    this.current = mood
    this.stepIndex = 0
    this.prevLead = 0
    this.prevHarm = 0
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.05
    this.ensure()
  }

  private ensure(): void {
    if (!this.unlocked || this.started) return
    this.started = true
    this.timer = window.setInterval(() => this.tick(), 80)
  }

  private tick(): void {
    if (!this.ctx || !this.filter || !this.unlocked) return
    if (document.hidden) {
      this.nextTime = 0
      return
    }
    if (this.ctx.currentTime >= this.stingUntil && this.current !== this.ambient && this.stingUntil > 0) {
      this.switchTo(this.ambient)
    }
    const pattern = PATTERNS[this.current]
    if (!pattern || pattern.gain <= 0 || this.current === 'silence') return
    if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + 0.02
    const horizon = this.ctx.currentTime + 0.22
    while (this.nextTime < horizon) {
      this.schedule(pattern, this.stepIndex, this.nextTime)
      this.nextTime += pattern.step
      this.stepIndex = (this.stepIndex + 1) % pattern.lead.length
    }
  }

  private schedule(pattern: Pattern, index: number, time: number): void {
    if (!this.filter) return
    const lead = pattern.lead[index] ?? 0
    const harm = pattern.harm[index] ?? 0
    const bass = pattern.bass[index] ?? 0
    const dur = pattern.step * (pattern.legato ? 2.15 : 0.92)
    if (lead && (!pattern.legato || lead !== this.prevLead)) {
      this.tone(time, lead, dur, pattern.wave, pattern.gain, this.filter)
    }
    if (harm && (!pattern.legato || harm !== this.prevHarm)) {
      this.tone(time, harm, dur, 'sine', pattern.gain * 0.45, this.filter)
    }
    if (bass) this.tone(time, bass, pattern.step * 0.95, 'sine', pattern.gain * 0.7, this.filter)
    this.prevLead = lead
    this.prevHarm = harm
  }

  private tone(time: number, freq: number, dur: number, type: OscillatorType, gain: number, dest: AudioNode): void {
    if (!this.ctx || freq <= 0 || gain <= 0) return
    const osc = this.ctx.createOscillator()
    const amp = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, time)
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.02)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.05, dur))
    osc.connect(amp)
    amp.connect(dest)
    osc.start(time)
    osc.stop(time + dur + 0.03)
  }

  private noiseBurst(time: number, dur: number, freq: number, gain: number): void {
    if (!this.ctx || !this.noise || !this.sfxGain) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(freq, time)
    filter.Q.value = 0.7
    const amp = this.ctx.createGain()
    amp.gain.setValueAtTime(gain, time)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    src.connect(filter)
    filter.connect(amp)
    amp.connect(this.sfxGain)
    src.start(time)
    src.stop(time + dur)
  }
}

export const audio = new AudioEngine()
