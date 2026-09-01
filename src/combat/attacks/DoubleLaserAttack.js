import * as THREE from 'three'
import { additiveMat } from '../../config/palette.js'
import { ATTACKS } from '../../config/balance.js'
import { applyAimAssist } from './aimAssist.js'

const DIR = new THREE.Vector3()
const ORIGIN = new THREE.Vector3()
const MID = new THREE.Vector3()

const COLOR_CORE_BASE = new THREE.Color(0x66e0ff)
const COLOR_GLOW_BASE = new THREE.Color(0x2288ff)
const _tmpColor = new THREE.Color()

/**
 * Laser duplo (Super Calango): cadência intercalada de dois lasers, um de
 * cada lado do corpo. Variante isolada do LaserAttack — mesmo contrato,
 * reutilizável por qualquer espécie com `dualLasers`.
 *
 * A cadência ACELERA enquanto o gatilho é segurado: começa em `rampUp.
 * startRate` tiros/s e sobe `ratePerSecond` por segundo até `maxRate`
 * (spin-up de metralhadora giratória). Ao atingir o teto, o feixe muda de
 * azul para vermelho/laranja (`cfg.maxColor`) — sinal visual claro de poder
 * máximo. `stop()` reseta a rampa: soltar e segurar de novo começa devagar.
 *
 * Dois pares de feixe (core+glow), um por lado, cada um com vida própria:
 * no teto de cadência (cooldown 0.06s) cada lado dispara a cada 0.12s, e o
 * feixe vive 0.15s — com um único par o feixe "teleportaria" de lado. Os
 * materiais são CLONES: o fade muta a opacity e a cor da rampa muta o
 * `.color`, e mutar o material aditivo do cache apagaria o feixe do
 * LaserAttack original e os FX da mesma cor.
 */
export class DoubleLaserAttack {
  constructor(ctx) {
    this.cfg = ATTACKS.doubleLaser
    this.id = this.cfg.id
    this.name = this.cfg.name
    this.cooldown = 0
    /** Segundos de gatilho seguro nesta rajada (rampa de cadência). */
    this._holdTime = 0
    /** true enquanto `fire()` está sendo chamado a cada frame (gatilho seguro). */
    this._firing = false

    this.scene = ctx.scene
    this.collision = ctx.collision
    this.terrain = ctx.terrain
    this.combat = ctx.combat
    this.explosions = ctx.explosions
    this.scorch = ctx.scorch
    /** @type {(() => Array<object>)|null} devolve os mobs vivos */
    this.getMobs = ctx.getMobs ?? null
    /** @type {(() => Array<object>)|null} devolve os props do mundo */
    this.getProps = ctx.getProps ?? null
    this.audio = ctx.audio

    // Geometrias compartilhadas entre os dois pares.
    const coreGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 6, 1, true)
    coreGeo.rotateX(Math.PI / 2) // eixo do cilindro passa a apontar em +Z
    const glowGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 6, 1, true)
    glowGeo.rotateX(Math.PI / 2)

    this._pairs = [this._makePair(coreGeo, glowGeo), this._makePair(coreGeo, glowGeo)]
    /** Alterna a cada disparo: -1 esquerda, +1 direita. */
    this._side = 1
  }

  _makePair(coreGeo, glowGeo) {
    const core = new THREE.Mesh(coreGeo, additiveMat(0x66e0ff, 1).clone())
    const glow = new THREE.Mesh(glowGeo, additiveMat(0x2288ff, 0.4).clone())
    core.visible = false
    glow.visible = false
    this.scene.add(core)
    this.scene.add(glow)
    return { core, glow, life: 0 }
  }

  get ready() { return this.cooldown <= 0 }

  /** Contínuo: segurar o botão mantém atirando (a cadência acelera com a rampa). */
  get continuous() { return true }

  /** Taxa atual de tiros/s, dado o tempo de gatilho seguro (rampa linear). */
  _currentRate() {
    const r = this.cfg.rampUp
    return Math.min(r.maxRate, r.startRate + this._holdTime * r.ratePerSecond)
  }

  /** 0 no início da rampa, 1 no teto — usado para o fade azul → vermelho. */
  _rampT() {
    const r = this.cfg.rampUp
    const span = r.maxRate - r.startRate
    if (span <= 0) return 1
    return Math.min(1, (this._currentRate() - r.startRate) / span)
  }

  /**
   * @param {object} player
   * @param {THREE.Camera} camera usada para limitar o alcance ao visível
   */
  fire(player, camera) {
    this._firing = true
    if (!this.ready) return false
    // Cooldown dinâmico: quanto mais tempo de gatilho, mais rápido o tiro.
    this.cooldown = 1 / this._currentRate()

    this._side = -this._side
    player.getMuzzle(ORIGIN, this._side)
    player.getForward(DIR)
    // O auxílio parte do canhão deslocado: os dois feixes convergem no alvo.
    applyAimAssist(ORIGIN, DIR, player, this)

    // Alcance nunca maior que o que cabe na tela.
    const visible = Math.max(12, camera.far * 0.12)
    const maxRange = Math.min(this.cfg.range, visible)

    const hit = this.collision.raymarch(
      ORIGIN, DIR, maxRange,
      (b) => b.solid && b !== player,
    )

    this._showBeam(this._pairs[this._side === 1 ? 0 : 1], ORIGIN, hit.point)

    const dmg = player.atk * this.cfg.damageMult * this.combat.attackMultiplier
    // Alvo direto leva dano cheio.
    if (hit.body) this.combat.damageTarget(hit.body, dmg, player)

    // Explosão + dano em área + cratera — idêntico ao LaserAttack.
    const power = this.combat.attackMultiplier
    const boostScale = 1 + (power - 1) * 0.5
    this.explosions.spawn(
      hit.point,
      this.cfg.explosionRadius * 0.38 * boostScale,
      power,
    )
    this.combat.areaDamage(
      hit.point, this.cfg.explosionRadius,
      dmg * this.cfg.splashMult, player, hit.body,
    )
    this.terrain.makeCrater(
      hit.point.x, hit.point.z,
      this.cfg.craterRadius * (1 + (power - 1) * 1.1),
      this.cfg.craterDepth * (1 + (power - 1) * 1.6),
    )
    this.scorch?.spawn(hit.point, this.cfg.craterRadius * (1 + (power - 1) * 0.9))
    this.audio?.play('laser')
    this.audio?.play('explosion')
    return true
  }

  _showBeam(pair, from, to) {
    const dist = from.distanceTo(to)
    MID.copy(from).add(to).multiplyScalar(0.5)

    // Cor desliza de azul (início da rampa) para vermelho/laranja (teto de
    // cadência) — o mesmo lerp de cor do core e do glow.
    const t = this._rampT()
    const maxColor = this.cfg.maxColor
    for (const m of [pair.core, pair.glow]) {
      m.position.copy(MID)
      m.lookAt(to)
      m.scale.set(1, 1, Math.max(0.01, dist))
      m.visible = true
      m.material.opacity = m === pair.core ? 1 : 0.4
      const base = m === pair.core ? COLOR_CORE_BASE : COLOR_GLOW_BASE
      const target = m === pair.core ? maxColor.core : maxColor.glow
      m.material.color.copy(base).lerp(_tmpColor.set(target), t)
    }
    pair.life = 0.15
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt
    // A rampa só avança enquanto o gatilho está de fato sendo segurado
    // (fire() chamado neste frame); `stop()` já zera tudo ao soltar.
    if (this._firing) this._holdTime += dt
    this._firing = false
    for (const pair of this._pairs) {
      if (pair.life <= 0) continue
      pair.life -= dt
      const k = Math.max(0, pair.life / 0.15)
      pair.core.material.opacity = k
      pair.glow.material.opacity = k * 0.4
      if (pair.life <= 0) {
        pair.core.visible = false
        pair.glow.visible = false
      }
    }
  }

  /** Solta o gatilho: a próxima rajada volta a começar devagar. */
  stop() {
    this._holdTime = 0
    this._firing = false
  }
}
