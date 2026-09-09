/**
 * Trilha sonora: "Guerra na Selva Selvagem" (Jungle Combat & Wild Hunt).
 * 100% sintetizada em tempo real via Web Audio API.
 * 
 * - Estética: Tambores de guerra tribais, percussão de madeira oca (bambu/woodblock),
 *   baixo terroso acústico, balafon/marimba da floresta e flauta guerreira de bambu.
 * - Zero vibe "cyber" ou sintetizador eletrônico moderno: sons puramente orgânicos e acústicos da natureza.
 * - Andamento: 130 BPM (ritmo veloz de caça, esquiva e combate entre animais selvagens).
 * - Escala: Lá Menor / Dórico Selvagem (A Minor / Dorian), trazendo tensão, perigo e aventura primal.
 */

const NOTES = {
  // Baixo Terroso / Raízes da Selva
  A1: 55.00, B1: 61.74, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
  A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  // Balafon / Marimba de Tronco
  A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  // Flauta Selvagem de Bambu / Chamado da Floresta
  A5: 880.00, B5: 987.77, C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00,
}

// 16 compassos x 16 semicolcheias = 256 passos por ciclo (~29.5 segundos)
const TOTAL_STEPS = 256
const BPM = 130
const STEP_SEC = 60 / BPM / 4

// Progressão tonal: Caça na floresta, perseguição e emboscada
const SECTIONS = [
  'Am', 'Am', 'Am', 'Am',   // O cerco começa / passos na mata
  'Dm', 'Dm', 'F',  'Em',   // Fuga e disparos entre as árvores
  'Am', 'G',  'F',  'Em',   // Confronto direto entre feras
  'Dm', 'F',  'E7', 'E7',   // Clímax da batalha tribal / turnaround
]

// Padrões de marimba de tronco / balafon tribal (polirritmia africana/selvagem de combate)
const BALAFON_MAP = {
  Am: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4],
  Dm: [NOTES.D4, NOTES.F4, NOTES.A4, NOTES.D5],
  F:  [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4],
  Em: [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.E4],
  G:  [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4],
  E7: [NOTES.E3, NOTES.Gs3 ?? 207.65, NOTES.B3, NOTES.D4],
}

// Baixo acústico terroso com síncopes de perseguição
const BASS_MAP = {
  Am: [
    NOTES.A2, null, NOTES.A2, NOTES.C3,
    null, NOTES.A2, null, NOTES.E2,
    NOTES.A2, null, NOTES.A2, null,
    NOTES.G2, null, NOTES.A2, null,
  ],
  Dm: [
    NOTES.D2, null, NOTES.D2, NOTES.F2,
    null, NOTES.D2, null, NOTES.A2,
    NOTES.D2, null, NOTES.D2, null,
    NOTES.C2, null, NOTES.D2, null,
  ],
  F: [
    NOTES.F2, null, NOTES.F2, NOTES.A2,
    null, NOTES.F2, null, NOTES.C2,
    NOTES.F2, null, NOTES.F2, null,
    NOTES.E2, null, NOTES.F2, null,
  ],
  Em: [
    NOTES.E2, null, NOTES.E2, NOTES.G2,
    null, NOTES.E2, null, NOTES.B2,
    NOTES.E2, null, NOTES.E2, null,
    NOTES.D2, null, NOTES.E2, null,
  ],
  G: [
    NOTES.G2, null, NOTES.G2, NOTES.B2,
    null, NOTES.G2, null, NOTES.D2,
    NOTES.G2, null, NOTES.G2, null,
    NOTES.F2, null, NOTES.G2, null,
  ],
  E7: [
    NOTES.E2, NOTES.E2, NOTES.Gs2 ?? 103.83, NOTES.B2,
    NOTES.E2, NOTES.E2, NOTES.D2, NOTES.B2,
    NOTES.E2, NOTES.E2, NOTES.Gs2 ?? 103.83, NOTES.B2,
    NOTES.E2, NOTES.G2, NOTES.A2, NOTES.B2,
  ],
}

// Melodia de Flauta Selvagem de Bambu (tema de combate selvagem, tiroteio e fuga)
const MELODY = {
  // Compasso 0 (Passos 0-15): O chamado selvagem de ataque
  0:  { freq: NOTES.A5, len: 3, slur: true },
  4:  { freq: NOTES.C6, len: 2 },
  6:  { freq: NOTES.D6, len: 2 },
  8:  { freq: NOTES.E6, len: 4, vibrato: true },
  12: { freq: NOTES.D6, len: 2 },
  14: { freq: NOTES.C6, len: 2 },

  // Compasso 1 (Passos 16-31): Rápido contra-ataque tribal
  16: { freq: NOTES.A5, len: 4, vibrato: true },
  20: { freq: NOTES.E5, len: 2 },
  22: { freq: NOTES.G5, len: 2 },
  24: { freq: NOTES.A5, len: 6, vibrato: true },

  // Compasso 2 (Passos 32-47): Flauta rítmica em disparos
  32: { freq: NOTES.A5, len: 2 },
  34: { freq: NOTES.C6, len: 2 },
  36: { freq: NOTES.E6, len: 3, slur: true },
  40: { freq: NOTES.G6, len: 3 },
  44: { freq: NOTES.E6, len: 3 },

  // Compasso 3 (Passos 48-63): Pouso suspenso na folhagem
  48: { freq: NOTES.D6, len: 6, vibrato: true },
  56: { freq: NOTES.C6, len: 2 },
  58: { freq: NOTES.B5, len: 2 },
  60: { freq: NOTES.A5, len: 4 },

  // Compasso 4 (Passos 64-79): Dm - Tiros rápidos e perseguição
  64: { freq: NOTES.D6, len: 3, slur: true },
  68: { freq: NOTES.F6, len: 2 },
  70: { freq: NOTES.E6, len: 2 },
  72: { freq: NOTES.D6, len: 4, vibrato: true },
  76: { freq: NOTES.A5, len: 2 },
  78: { freq: NOTES.C6, len: 2 },

  // Compasso 5 (Passos 80-95)
  80: { freq: NOTES.D6, len: 5, vibrato: true },
  86: { freq: NOTES.E6, len: 2 },
  88: { freq: NOTES.F6, len: 6, vibrato: true },

  // Compasso 6 (Passos 96-111): F - Acorde majestoso da selva
  96:  { freq: NOTES.C6, len: 3 },
  100: { freq: NOTES.D6, len: 2 },
  102: { freq: NOTES.C6, len: 2 },
  104: { freq: NOTES.A5, len: 4, vibrato: true },
  108: { freq: NOTES.G5, len: 3 },

  // Compasso 7 (Passos 112-127): Em - Tensão de predador à espreita
  112: { freq: NOTES.E5, len: 6, vibrato: true },
  120: { freq: NOTES.G5, len: 3 },
  124: { freq: NOTES.B5, len: 4, slur: true },

  // Compasso 8 (Passos 128-143): SEÇÃO B - Batalha Tribal de Alta Energia
  128: { freq: NOTES.A6, len: 3, vibrato: true },
  132: { freq: NOTES.G6, len: 2 },
  134: { freq: NOTES.E6, len: 3 },
  138: { freq: NOTES.D6, len: 2 },
  140: { freq: NOTES.E6, len: 4, vibrato: true },

  // Compasso 9 (Passos 144-159): Escapada rítmica
  144: { freq: NOTES.G6, len: 3 },
  148: { freq: NOTES.E6, len: 2 },
  150: { freq: NOTES.D6, len: 3 },
  154: { freq: NOTES.C6, len: 4, vibrato: true },

  // Compasso 10 (Passos 160-175): Choque de projéteis e ataques
  160: { freq: NOTES.F6, len: 3 },
  164: { freq: NOTES.E6, len: 2 },
  166: { freq: NOTES.D6, len: 3 },
  170: { freq: NOTES.A5, len: 4, vibrato: true },

  // Compasso 11 (Passos 176-191): Eco na floresta profunda
  176: { freq: NOTES.B5, len: 4 },
  180: { freq: NOTES.C6, len: 2 },
  182: { freq: NOTES.B5, len: 2 },
  184: { freq: NOTES.E5, len: 6, vibrato: true },

  // Compasso 12 (Passos 192-207): Corrida final
  192: { freq: NOTES.D6, len: 2 },
  194: { freq: NOTES.E6, len: 2 },
  196: { freq: NOTES.F6, len: 3, slur: true },
  200: { freq: NOTES.E6, len: 2 },
  202: { freq: NOTES.D6, len: 2 },
  204: { freq: NOTES.A5, len: 4 },

  // Compasso 13 (Passos 208-223)
  208: { freq: NOTES.C6, len: 3 },
  212: { freq: NOTES.D6, len: 2 },
  214: { freq: NOTES.E6, len: 3 },
  218: { freq: NOTES.G6, len: 6, vibrato: true },

  // Compasso 14 (Passos 224-239): Subida frenética de combate com tambores
  224: { freq: NOTES.A6, len: 3, vibrato: true },
  228: { freq: NOTES.G6, len: 2 },
  230: { freq: NOTES.E6, len: 2 },
  232: { freq: NOTES.D6, len: 2 },
  234: { freq: NOTES.C6, len: 2 },
  236: { freq: NOTES.B5, len: 3 },

  // Compasso 15 (Passos 240-255): Apito de guerra antes do reinício do cerco
  240: { freq: NOTES.A5, len: 6, vibrato: true },
  248: { freq: NOTES.E5, len: 4 },
}

export class BackgroundMusic {
  /**
   * @param {AudioContext} ctx
   * @param {GainNode} destinationNode
   */
  constructor(ctx, destinationNode) {
    this.ctx = ctx

    // Ganho principal da música
    this.bgmGain = this.ctx.createGain()
    this.bgmGain.gain.value = 0.24
    this.bgmGain.connect(destinationNode)

    // Filtro acústico geral que confere calor e ressonância de floresta úmida
    this.forestFilter = this.ctx.createBiquadFilter()
    this.forestFilter.type = 'lowpass'
    this.forestFilter.frequency.value = 4200
    this.forestFilter.Q.value = 0.6
    this.forestFilter.connect(this.bgmGain)

    this._isPlaying = false
    this._currentStep = 0
    this._nextNoteTime = 0
    this._timerId = null

    // Ruído orgânico para chocalho/maraca de sementes e sopro de ar
    this._noiseBuffer = this._buildNoise(0.6)
  }

  _buildNoise(duration) {
    const len = Math.floor(this.ctx.sampleRate * duration)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1
    }
    return buf
  }

  start() {
    if (this._isPlaying) return
    this._isPlaying = true
    this._currentStep = 0
    this._nextNoteTime = this.ctx.currentTime + 0.05
    this._scheduleLoop()
  }

  stop() {
    this._isPlaying = false
    if (this._timerId) {
      clearInterval(this._timerId)
      this._timerId = null
    }
  }

  _scheduleLoop() {
    const lookahead = 0.1
    this._timerId = setInterval(() => {
      if (!this._isPlaying || this.ctx.state !== 'running') return

      // Se o tempo acumulado ficou para trás (ex: aba em segundo plano ou suspensa),
      // reposiciona o cursor no tempo atual para evitar rajada de nós de áudio acumulados.
      if (this._nextNoteTime < this.ctx.currentTime) {
        this._nextNoteTime = this.ctx.currentTime + 0.05
      }

      while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
        this._playStep(this._currentStep, this._nextNoteTime)
        this._currentStep = (this._currentStep + 1) % TOTAL_STEPS
        this._nextNoteTime += STEP_SEC
      }
    }, 25)
  }

  _playStep(step, t) {
    const bar = Math.floor(step / 16)
    const stepInBar = step % 16
    const chord = SECTIONS[bar]

    // 1. Percussão Selvagem (Tambores de guerra da selva, chocalhos e batidas em madeira)
    this._playJunglePercussion(stepInBar, bar, t)

    // 2. Baixo Terroso Acústico (Pluck de raiz/corda de caça)
    const bassPattern = BASS_MAP[chord]
    const bassNote = bassPattern ? bassPattern[stepInBar] : null
    if (bassNote) {
      this._synthEarthyBass(bassNote, t, STEP_SEC * 1.4)
    }

    // 3. Balafon / Marimba tribal de troncos ocos
    if (step % 2 === 0) {
      const balNotes = BALAFON_MAP[chord]
      const balIdx = (Math.floor(step / 2)) % 4
      const balNote = balNotes[balIdx]
      this._synthBalafon(balNote, t, STEP_SEC * 1.3)
    }

    // 4. Flauta Selvagem de Bambu (Tema épico e veloz de batalha)
    const lead = MELODY[step]
    if (lead) {
      this._synthJungleFlute(lead.freq, t, lead.len * STEP_SEC * 0.94, lead.vibrato, lead.slur)
    }
  }

  _playJunglePercussion(stepInBar, bar, t) {
    const isFillBar = (bar === 7 || bar === 15) && stepInBar >= 10

    if (isFillBar) {
      // Repique frenético de toms e tambores de guerra anunciando emboscada
      if (stepInBar % 2 === 0) {
        this._synthWarDrum(t, 0.7)
      } else {
        this._synthJungleTom(t, 260, 110, 0.45)
      }
      this._synthWoodBlock(t, 0.3)
      return
    }

    // Tambor de Guerra Primal (Bumbo grave de couro esticado): passos 0, 6, 8, 14
    if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 14) {
      this._synthWarDrum(t, 0.75)
    }

    // Toms selvagens (congas/atabaques de mata): passos 4 e 12 (com toques rápidos em 2 e 10)
    if (stepInBar === 4 || stepInBar === 12) {
      this._synthJungleTom(t, 240, 95, 0.5)
    } else if (stepInBar === 2 || stepInBar === 10) {
      this._synthJungleTom(t, 340, 140, 0.3)
    }

    // Batidas em tronco de madeira oca (Woodblock orgânico): contratempos 3, 7, 11, 15
    if (stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 15) {
      this._synthWoodBlock(t, 0.22)
    }

    // Chocalho de sementes / maraca da floresta: ritmo contínuo
    const isAccent = (stepInBar % 2 === 0)
    this._synthSeedShaker(t, isAccent ? 0.14 : 0.07)
  }

  /**
   * Tambor de guerra primal (som profundo e orgânico de tambor tribal de couro)
   */
  _synthWarDrum(t, volume = 0.7) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(125, t)
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08)

    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16)

    osc.connect(gain)
    gain.connect(this.forestFilter)

    osc.start(t)
    osc.stop(t + 0.18)
  }

  /**
   * Tom tribal / conga da selva (ressonância de pele animal e madeira)
   */
  _synthJungleTom(t, freqStart, freqEnd, volume = 0.4) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freqStart, t)
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + 0.09)

    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)

    osc.connect(gain)
    gain.connect(this.forestFilter)

    osc.start(t)
    osc.stop(t + 0.14)
  }

  /**
   * Batida em madeira oca / bambu (Woodblock 100% acústico)
   */
  _synthWoodBlock(t, volume = 0.25) {
    const noise = this.ctx.createBufferSource()
    noise.buffer = this._noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1250 // Ressonância oca de madeira
    filter.Q.value = 7.5

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.forestFilter)

    noise.start(t)
    noise.stop(t + 0.04)
  }

  /**
   * Chocalho de sementes / maraca indígena
   */
  _synthSeedShaker(t, volume = 0.1) {
    const noise = this.ctx.createBufferSource()
    noise.buffer = this._noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6500

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.forestFilter)

    noise.start(t)
    noise.stop(t + 0.045)
  }

  /**
   * Baixo terroso / acústico da floresta (corda grossa puxada, ataque seco e quente)
   */
  _synthEarthyBass(freq, t, dur) {
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    // Onda triangular quente e aveludada
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)

    // Filtro simulando a caixa acústica de madeira
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(360, t)
    filter.frequency.exponentialRampToValueAtTime(160, t + dur * 0.8)
    filter.Q.value = 1.2

    // Ataque rápido e decaimento percussivo (pluck acústico)
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.38, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.forestFilter)

    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  /**
   * Balafon / Marimba de troncos da mata (ressonância harmônica de madeira percutida)
   */
  _synthBalafon(freq, t, dur) {
    const fundamental = this.ctx.createOscillator()
    const overtone = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    fundamental.type = 'sine'
    fundamental.frequency.setValueAtTime(freq, t)

    // Sobretom inarmônico característico de blocos de madeira percutidos (2.76x)
    overtone.type = 'sine'
    overtone.frequency.setValueAtTime(freq * 2.76, t)

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.16, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

    fundamental.connect(gain)
    overtone.connect(gain)
    gain.connect(this.forestFilter)

    fundamental.start(t)
    overtone.start(t)
    fundamental.stop(t + dur + 0.02)
    overtone.stop(t + dur + 0.02)
  }

  /**
   * Flauta Selvagem de Bambu (som aerado com ar real e vibrato expressivo de caça)
   */
  _synthJungleFlute(freq, t, dur, useVibrato = false, useSlur = false) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    // Sopro de ar (ruído aerofone característico de flauta de bambu)
    const breath = this.ctx.createBufferSource()
    breath.buffer = this._noiseBuffer
    const breathFilter = this.ctx.createBiquadFilter()
    breathFilter.type = 'bandpass'
    breathFilter.frequency.value = Math.min(freq * 1.5, 3000)
    breathFilter.Q.value = 3.0
    const breathGain = this.ctx.createGain()
    breathGain.gain.setValueAtTime(0.035, t)
    breathGain.gain.exponentialRampToValueAtTime(0.005, t + dur)

    breath.connect(breathFilter)
    breathFilter.connect(breathGain)
    breathGain.connect(this.forestFilter)

    osc.type = 'sine'

    if (useSlur) {
      // Ligadura de ar / portamento expressivo
      osc.frequency.setValueAtTime(freq * 0.92, t)
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.07)
    } else {
      osc.frequency.setValueAtTime(freq, t)
    }

    // Vibrato natural da respiração
    if (useVibrato && dur > 0.2) {
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 5.2 // Modulação suave da coluna de ar
      lfoGain.gain.setValueAtTime(0, t)
      lfoGain.gain.setValueAtTime(0, t + 0.09)
      lfoGain.gain.linearRampToValueAtTime(5.5, t + 0.22)

      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      lfo.start(t)
      lfo.stop(t + dur + 0.02)
    }

    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(0.20, t + 0.018)
    gain.gain.setValueAtTime(0.18, t + dur * 0.7)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

    osc.connect(gain)
    gain.connect(this.forestFilter)

    breath.start(t)
    osc.start(t)
    breath.stop(t + dur + 0.02)
    osc.stop(t + dur + 0.02)
  }
}
