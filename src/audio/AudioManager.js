/**
 * Áudio 100% sintetizado em runtime (Web Audio API).
 * Sem nenhum arquivo de som — mantém o bundle mínimo, requisito das
 * plataformas de jogos casuais.
 *
 * O AudioContext só é criado no primeiro gesto do usuário (política de
 * autoplay dos browsers e das plataformas).
 */
export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null
    this.master = null
    this.muted = localStorage.getItem('pab_muted') === '1'
    this._flameNodes = null
    this._noiseBuffer = null
  }

  /** Chamado no primeiro clique/toque. */
  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.5
    this.master.connect(this.ctx.destination)
    this._noiseBuffer = this._makeNoise(1.0)
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }
  suspend() {
    if (this.ctx?.state === 'running') this.ctx.suspend()
  }

  setMuted(m) {
    this.muted = m
    localStorage.setItem('pab_muted', m ? '1' : '0')
    if (this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02)
    }
  }

  _makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return buf
  }

  _noiseSource() {
    const s = this.ctx.createBufferSource()
    s.buffer = this._noiseBuffer
    s.loop = true
    return s
  }

  /** Envelope ADSR simplificado. */
  _env(gain, t, attack, decay, peak = 1) {
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  }

  /** @param {'hit'|'laser'|'explosion'|'evo'|'hurt'|'death'|'kill'|'levelup'} name */
  play(name) {
    if (!this.ctx || this.muted) return
    const t = this.ctx.currentTime
    switch (name) {
      case 'hit': return this._hit(t)
      case 'laser': return this._laser(t)
      case 'explosion': return this._explosion(t)
      case 'evo':
      case 'levelup': return this._evo(t)
      case 'hurt': return this._hurt(t)
      case 'death': return this._death(t)
      case 'kill': return this._kill(t)
    }
  }

  _hit(t) {
    const src = this._noiseSource()
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(2200, t)
    f.frequency.exponentialRampToValueAtTime(400, t + 0.09)
    const g = this.ctx.createGain()
    this._env(g, t, 0.004, 0.1, 0.45)
    src.connect(f); f.connect(g); g.connect(this.master)
    src.start(t); src.stop(t + 0.14)
  }

  _laser(t) {
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(1400, t)
    o.frequency.exponentialRampToValueAtTime(180, t + 0.22)
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900
    f.Q.value = 4
    const g = this.ctx.createGain()
    this._env(g, t, 0.005, 0.24, 0.32)
    o.connect(f); f.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.3)
  }

  _explosion(t) {
    const src = this._noiseSource()
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(900, t)
    f.frequency.exponentialRampToValueAtTime(90, t + 0.55)
    const g = this.ctx.createGain()
    this._env(g, t, 0.008, 0.6, 0.55)
    src.connect(f); f.connect(g); g.connect(this.master)
    src.start(t); src.stop(t + 0.7)
  }

  _evo(t) {
    // Arpejo ascendente: sensação de progressão.
    const notes = [392, 523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator()
      o.type = 'triangle'
      o.frequency.value = freq
      const g = this.ctx.createGain()
      const st = t + i * 0.07
      this._env(g, st, 0.01, 0.26, 0.3)
      o.connect(g); g.connect(this.master)
      o.start(st); o.stop(st + 0.32)
    })
  }

  _kill(t) {
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.setValueAtTime(660, t)
    o.frequency.exponentialRampToValueAtTime(1320, t + 0.1)
    const g = this.ctx.createGain()
    this._env(g, t, 0.005, 0.12, 0.18)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.16)
  }

  _hurt(t) {
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.setValueAtTime(320, t)
    o.frequency.exponentialRampToValueAtTime(90, t + 0.18)
    const g = this.ctx.createGain()
    this._env(g, t, 0.005, 0.2, 0.3)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 0.24)
  }

  _death(t) {
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(420, t)
    o.frequency.exponentialRampToValueAtTime(55, t + 0.9)
    const g = this.ctx.createGain()
    this._env(g, t, 0.01, 0.95, 0.35)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + 1.0)
  }

  /** Loop contínuo enquanto o lança-chamas estiver ativo. */
  playFlameLoop() {
    if (!this.ctx || this.muted || this._flameNodes) return
    const t = this.ctx.currentTime
    const src = this._noiseSource()
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 700
    f.Q.value = 1.2
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.06)
    // LFO dá o "crepitar".
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 11
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 260
    lfo.connect(lfoGain); lfoGain.connect(f.frequency)

    src.connect(f); f.connect(g); g.connect(this.master)
    src.start(t); lfo.start(t)
    this._flameNodes = { src, g, lfo }
  }

  stopFlameLoop() {
    if (!this._flameNodes) return
    const { src, g, lfo } = this._flameNodes
    const t = this.ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setValueAtTime(g.gain.value, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    try { src.stop(t + 0.12); lfo.stop(t + 0.12) } catch {}
    this._flameNodes = null
  }
}
