import * as THREE from 'three'
import { SceneManager } from './SceneManager.js'
import { CameraController } from './CameraController.js'
import { InputManager } from './InputManager.js'
import { GameState, STATE } from './GameState.js'
import { Terrain } from '../world/Terrain.js'
import { CollisionWorld } from '../physics/CollisionWorld.js'
import { Player } from '../entities/Player.js'
import { Mob } from '../entities/mobs/MobBase.js'
import { MOBS, pickMobFor } from '../entities/mobs/index.js'
import { HealthBarManager } from '../entities/HealthBar3D.js'
import { biomeForLevel, isBiomeThreshold } from '../world/biomes/index.js'
import { WorldBuilder } from '../world/WorldBuilder.js'
import { CombatSystem } from '../combat/CombatSystem.js'
import { DamageNumbers } from '../combat/DamageNumbers.js'
import { createAttacks } from '../combat/attacks/index.js'
import { ExplosionFX } from '../fx/ExplosionFX.js'
import { HitFX } from '../fx/HitFX.js'
import { ScorchMarks } from '../fx/ScorchMarks.js'
import { FireSystem } from '../fx/FireFX.js'
import { AudioManager } from '../audio/AudioManager.js'
import { AdManager } from '../monetization/AdManager.js'
import { BoosterManager } from '../monetization/Boosters.js'
import { HUD } from '../ui/HUD.js'
import { BoosterPanel } from '../ui/BoosterPanel.js'
import { Overlays } from '../ui/Overlays.js'
import { Joystick } from '../ui/Joystick.js'
import { TouchButtons } from '../ui/TouchButtons.js'
import { BALANCE } from '../config/balance.js'

/** Orquestrador: monta o mundo, roda o loop e conecta todos os sistemas. */
export class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.scene3d = new SceneManager(canvas)
    this.input = new InputManager(canvas)
    this.state = new GameState(STATE.MENU)
    this.audio = new AudioManager()

    this.biome = biomeForLevel(1)
    this.scene3d.applyBiome(this.biome)

    this.terrain = new Terrain(this.biome, 1337)
    this.scene3d.scene.add(this.terrain.mesh)

    this.collision = new CollisionWorld(this.terrain)
    this.world = new WorldBuilder(
      this.scene3d.scene, this.terrain, this.collision, this.biome, 4242,
    )
    this.player = new Player(this.scene3d.scene, this.terrain, this.collision)

    this.camera = new CameraController(this.scene3d.camera, this.terrain)
    this.camera.setSpeciesScale(this.player.species.scale)

    // --- FX e combate ---
    this.explosions = new ExplosionFX(this.scene3d.scene)
    this.hitFX = new HitFX(this.scene3d.scene)
    this.scorch = new ScorchMarks(this.scene3d.scene, this.terrain)
    this.damageNumbers = new DamageNumbers(
      document.getElementById('damage-layer'), this.scene3d.camera,
    )
    this.healthBars = new HealthBarManager(
      document.getElementById('healthbar-layer'), this.scene3d.camera,
    )

    this.boosters = new BoosterManager()
    this.combat = new CombatSystem({
      player: this.player,
      collision: this.collision,
      damageNumbers: this.damageNumbers,
      hitFX: this.hitFX,
      audio: this.audio,
      boosters: this.boosters,
      world: this.world,
    })
    this.fire = new FireSystem(
      this.scene3d.scene, this.collision, this.world, this.combat,
    )

    this.attacks = createAttacks({
      scene: this.scene3d.scene,
      collision: this.collision,
      terrain: this.terrain,
      combat: this.combat,
      explosions: this.explosions,
      scorch: this.scorch,
      fire: this.fire,
      audio: this.audio,
    })
    this.currentAttack = this.attacks.laser

    /** @type {Mob[]} */
    this.mobs = []
    this._mobRng = Math.random

    // --- UI ---
    this.hud = new HUD()
    this.boosterPanel = new BoosterPanel(this.boosters, AdManager, this.audio)
    this.overlays = new Overlays({
      onPlay: () => this.startGame(),
      onResume: () => this.resume(),
      onRestart: () => this.restart(),
      onToggleSound: () => this.toggleSound(),
      onToggleQuality: () => this.toggleQuality(),
    })
    this.overlays.setSoundState(!this.audio.muted)
    this.overlays.setQualityState(this.scene3d.quality)

    if (this.input.isTouch) {
      document.getElementById('touch-layer').hidden = false
      this.joystick = new Joystick(
        document.getElementById('joystick'),
        document.getElementById('joystick-knob'),
        this.input,
      )
    }
    this.touchButtons = new TouchButtons(
      document.getElementById('attack-btn'), this.input,
      (id) => this.setAttack(id),
    )

    // --- eventos ---
    this.player.on((e) => this._onPlayerEvent(e))
    // gameOver() e' idempotente (checa STATE.GAMEOVER), entao os dois
    // caminhos de morte podem coexistir sem disparar duas vezes.
    this.combat.on((e) => { if (e.type === 'playerDeath') this.gameOver() })

    AdManager.init({
      onPause: () => this.pauseForAd(),
      onResume: () => this.resumeFromAd(),
    })

    this.clock = new THREE.Clock()
    this._raf = null
    this._t = 0
    this._spawnTimer = 0

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.is(STATE.PLAYING)) this.pause()
    })
  }

  // ---------------- ciclo de vida ----------------

  start() {
    this.overlays.showStart()
    this.hud.update(this.player, this.boosters.status())
    this._loop()
  }

  startGame() {
    this.audio.init()
    this.audio.resume()
    this.overlays.hideStart()
    this.state.set(STATE.PLAYING)
    this.input.setEnabled(true)
    AdManager.gameplayStart()
  }

  pause() {
    if (!this.state.is(STATE.PLAYING)) return
    this.state.set(STATE.PAUSED)
    this.input.setEnabled(false)
    this.currentAttack.stop()
    this.audio.suspend()
  }

  resume() {
    this.overlays.hideMenu()
    if (this.state.is(STATE.GAMEOVER)) return
    this.state.set(STATE.PLAYING)
    this.input.setEnabled(true)
    this.audio.resume()
  }

  pauseForAd() {
    this._stateBeforeAd = this.state.current
    this.state.set(STATE.AD)
    this.input.setEnabled(false)
    this.currentAttack.stop()
    this.audio.suspend()
  }

  resumeFromAd() {
    if (this._stateBeforeAd === STATE.PLAYING) {
      this.state.set(STATE.PLAYING)
      this.input.setEnabled(true)
      this.audio.resume()
    } else {
      this.state.set(this._stateBeforeAd ?? STATE.MENU)
    }
  }

  gameOver() {
    if (this.state.is(STATE.GAMEOVER)) return
    this.state.set(STATE.GAMEOVER)
    this.input.setEnabled(false)
    this.currentAttack.stop()
    AdManager.gameplayStop()
    this.overlays.showGameOver(this.player)
    AdManager.showInterstitialAd()
  }

  restart() {
    this.overlays.hideAll()
    this._clearMobs()
    this.fire.clear()
    this.scorch.clear()
    this.damageNumbers.clear()
    this.healthBars.clear()
    this.boosters.reset()
    this.player.reset()
    this.camera.setSpeciesScale(this.player.species.scale)
    this.camera.snap()

    // Volta ao bioma inicial se estava em outro.
    const first = biomeForLevel(1)
    if (first.id !== this.biome.id) this._rebuildWorld(first)

    this.state.set(STATE.PLAYING)
    this.input.setEnabled(true)
    this.audio.resume()
    AdManager.gameplayStart()
  }

  toggleSound() {
    this.audio.init()
    this.audio.setMuted(!this.audio.muted)
    this.overlays.setSoundState(!this.audio.muted)
  }

  toggleQuality() {
    const next = this.scene3d.quality === 'high' ? 'low' : 'high'
    this.scene3d.applyQuality(next)
    this.overlays.setQualityState(next)
  }

  setAttack(id) {
    const next = this.attacks[id]
    if (!next || next === this.currentAttack) return
    this.currentAttack.stop()
    this.currentAttack = next
    this.hud.setActiveWeapon(id)
  }

  // ---------------- eventos do player ----------------

  _onPlayerEvent(e) {
    // A morte do player pode vir de QUALQUER fonte (mob, fogo, explosao do
    // proprio laser, dano em area) — nao apenas de mobAttackPlayer(). Ouvir
    // o evento do Player cobre todos os casos.
    if (e.type === 'death') {
      this.gameOver()
      return
    }
    if (e.type === 'levelup') {
      this.audio.play('levelup')
      this.camera.setSpeciesScale(this.player.species.scale)
      if (isBiomeThreshold(e.level)) this._transitionBiome(e.level)
    }
  }

  async _transitionBiome(level) {
    const next = biomeForLevel(level)
    if (next.id === this.biome.id) return

    this.state.set(STATE.BIOME_TRANSITION)
    this.input.setEnabled(false)
    this.currentAttack.stop()

    await this.overlays.showBiome(next, 2000)
    this._rebuildWorld(next)
    await new Promise((r) => AdManager.showInterstitialAd(r))

    this.state.set(STATE.PLAYING)
    this.input.setEnabled(true)
  }

  _rebuildWorld(biome) {
    this._clearMobs()
    this.fire.clear()

    this.world.dispose()
    this.scene3d.scene.remove(this.terrain.mesh)
    this.terrain.dispose()
    this.collision.clear()

    this.biome = biome
    this.scene3d.applyBiome(biome)
    this.terrain = new Terrain(biome, 1337 + biome.id.length)
    this.scene3d.scene.add(this.terrain.mesh)

    // Os sistemas guardam referência ao terreno: atualiza todas.
    this.collision.terrain = this.terrain
    this.camera.terrain = this.terrain
    this.player.terrain = this.terrain
    this.attacks.laser.terrain = this.terrain
    this.attacks.flame.terrain = this.terrain
    this.scorch.terrain = this.terrain
    this.scorch.clear()

    this.world = new WorldBuilder(
      this.scene3d.scene, this.terrain, this.collision, biome, 4242,
    )
    this.combat.world = this.world
    this.fire.world = this.world

    // Reinsere o player no novo mundo.
    this.player.position.set(0, this.terrain.getHeightAt(0, 0), 0)
    this.collision.add(this.player)
    this.camera.snap()
  }

  // ---------------- mobs ----------------

  _clearMobs() {
    for (const m of this.mobs) {
      this.collision.remove(m)
      m.dispose()
    }
    this.mobs.length = 0
  }

  _updateSpawning(dt) {
    this._spawnTimer -= dt
    if (this._spawnTimer > 0) return
    this._spawnTimer = 0.8

    // Recicla os que ficaram longe demais.
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i]
      const d = Math.hypot(
        m.position.x - this.player.position.x,
        m.position.z - this.player.position.z,
      )
      if (m.dead || d > BALANCE.mobRecycleDistance) {
        this.collision.remove(m)
        m.dispose()
        this.mobs.splice(i, 1)
      }
    }

    if (this.mobs.length >= BALANCE.maxActiveMobs) return

    const id = pickMobFor(this.biome, Math.random)
    const def = MOBS[id]
    if (!def) return

    const pos = this.world.findSpawnPoint(this.player.position)
    if (!pos) return

    const mob = new Mob(def, pos, {
      scene: this.scene3d.scene,
      terrain: this.terrain,
      collision: this.collision,
      biome: this.biome,
      rng: Math.random,
    })
    this.collision.add(mob)
    this.mobs.push(mob)
  }

  // ---------------- loop ----------------

  _loop = () => {
    this._raf = requestAnimationFrame(this._loop)
    const rawDt = this.clock.getDelta()
    const dt = Math.min(rawDt, 1 / 20)
    this._t += dt

    // Amostragem de FPS a partir do PROPRIO loop (util para diagnostico;
    // medir com um rAF paralelo dá números irreais sob automação).
    if (this._fpsSamples) {
      this._fpsSamples.push(rawDt * 1000)
      if (this._fpsSamples.length >= this._fpsTarget) {
        const a = this._fpsSamples.slice().sort((x, y) => x - y)
        this._fpsResult = {
          median: +(1000 / a[Math.floor(a.length / 2)]).toFixed(1),
          p95: +(1000 / a[Math.floor(a.length * 0.95)]).toFixed(1),
          medianMs: +a[Math.floor(a.length / 2)].toFixed(2),
          frames: a.length,
        }
        this._fpsSamples = null
      }
    }

    if (this.state.isRunning()) this.update(dt)

    // FX e UI continuam animando mesmo pausado (feedback visual).
    this.explosions.update(dt)
    this.hitFX.update(dt)
    this.damageNumbers.update(dt)

    // Boosters e HUD seguem fora do PLAYING: o bonus continua correndo no
    // relogio e o jogador precisa ver o tempo restante mesmo no game over.
    if (!this.state.isRunning()) {
      this.boosters.update(dt)
      this.hud.update(this.player, this.boosters.status())
      this.boosterPanel.update(this.boosters.status())
    }

    this.scene3d.render()
  }

  update(dt) {
    // Troca de arma pedida pelo teclado.
    const sw = this.input.consumeSwitch()
    if (sw) this.setAttack(sw)

    this.world.update(dt)
    this.boosters.update(dt)

    // ORDEM IMPORTA: a câmera atualiza PRIMEIRO e devolve o yaw efetivo (que
    // inclui o auto-alinhamento). O player se move relativo a ESSE yaw — usar
    // o `input.aimYaw` cru faria a direção do movimento divergir do que se vê.
    this.input.tick(dt)
    const mv = this.input.move
    const moving = Math.hypot(mv.x, mv.z) > 0.01

    /**
     * Auto-alinhamento da câmera — o alvo é o EIXO LATERAL do input, não a
     * direção de movimento.
     *
     * Por que NÃO perseguir a direção de movimento:
     *  - Andando de ré (S) a correção é exatamente 180°: os dois sentidos de
     *    giro empatam, o sinal alterna a cada frame e a tela TREME sem nunca
     *    virar (bug reportado; reproduzido: yaw oscilando 0.0000 / -0.1131).
     *  - Mesmo resolvido o tremor, uma cambalhota de 180° ao andar de ré é
     *    desorientador.
     *
     * O que fazemos: a câmera gira em resposta ao componente LATERAL do input
     * (A/D e diagonais), suavemente. Andar reto (W ou S puro) não gira nada —
     * sem tremor e sem cambalhota. Como o boneco vira para a direção do
     * movimento, andando de ré ele fica de frente para o que vem pela frente.
     */
    const camYaw = this.camera.update(dt, this.player.position, this.input.aimYaw, {
      strafe: mv.x,
      moving,
      timeSinceLook: this.input.timeSinceLook,
    })

    this.player.update(dt, this.input.move, camYaw)
    this.scene3d.update(this.player.position)

    // Ataques.
    const atk = this.currentAttack
    if (atk.continuous) {
      if (this.input.attackHeld) atk.fire(this.player, this.scene3d.camera)
      else atk.stop()
    } else if (this.input.consumeAttackPress()) {
      atk.fire(this.player, this.scene3d.camera)
    }
    atk.update(dt, this.player)

    // Mobs.
    this._updateSpawning(dt)
    for (const m of this.mobs) {
      m.setChaseTarget(this.player.position.x, this.player.position.z)
      m.update(dt, this.player, this.combat)
    }

    this.fire.update(dt, this._t)

    // Crateras: o trabalho pesado (normais + cores) roda no maximo ~4x/s.
    this._craterFlush = (this._craterFlush ?? 0) - dt
    if (this._craterFlush <= 0) {
      this.terrain.flushCraters()
      this._craterFlush = 0.25
    }

    // UI.
    this.healthBars.update(this.mobs, this.player.position)
    this.hud.update(this.player, this.boosters.status())
    this.boosterPanel.update(this.boosters.status())
  }

  /** Inicia uma amostragem de FPS medida de dentro do loop. */
  sampleFps(frames = 180) {
    this._fpsSamples = []
    this._fpsTarget = frames
    this._fpsResult = null
  }

  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this.scene3d.dispose()
    this.terrain.dispose()
    this.world.dispose()
  }
}
