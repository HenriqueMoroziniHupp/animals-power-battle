import * as THREE from 'three'
import { additiveMat } from '../../config/palette.js'
import { ATTACKS } from '../../config/balance.js'

const ORIGIN = new THREE.Vector3()
const DIR = new THREE.Vector3()
const TO = new THREE.Vector3()

/**
 * Chamas: cone frontal curto, dano ALTO por tick enquanto segurado.
 * Incendeia props inflamáveis (plantações, árvores, cactos).
 */
export class FlameAttack {
  constructor(ctx) {
    this.cfg = ATTACKS.flame
    this.id = this.cfg.id
    this.name = this.cfg.name
    this.cooldown = 0

    this.scene = ctx.scene
    this.collision = ctx.collision
    this.terrain = ctx.terrain
    this.combat = ctx.combat
    // NAO usar `this.fire`: sombrearia o metodo fire() do prototipo.
    this.fireSystem = ctx.fire
    this.audio = ctx.audio

    this.active = false
    this._t = 0

    // Partículas de chama pooled (billboards aditivos).
    this.group = new THREE.Group()
    this.group.visible = false
    this.scene.add(this.group)

    const geo = new THREE.IcosahedronGeometry(0.34, 0)
    this.particles = []
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Mesh(geo, additiveMat(i % 3 === 0 ? 0xffdd55 : 0xff5522, 0.9))
      m.userData.seed = Math.random()
      this.group.add(m)
      this.particles.push(m)
    }
  }

  get ready() { return this.cooldown <= 0 }
  get continuous() { return true }

  fire(player, camera) {
    if (!this.ready) return false
    this.cooldown = this.cfg.cooldown
    this.active = true

    player.getMuzzle(ORIGIN)
    player.getForward(DIR)

    const range = this.cfg.range
    const halfAngle = (this.cfg.coneAngle * Math.PI) / 180
    const cosLimit = Math.cos(halfAngle)

    const dmg = player.atk * this.cfg.damageMult * this.combat.attackMultiplier

    // Todos os alvos dentro do cone levam dano por tick.
    const near = this.collision.query(
      ORIGIN.x, ORIGIN.z, range,
      (b) => b !== player && !b.dead,
    )

    for (const b of near) {
      TO.set(b.position.x - ORIGIN.x, 0, b.position.z - ORIGIN.z)
      const d = TO.length()
      if (d > range || d < 0.001) continue
      TO.divideScalar(d)
      const dot = TO.x * DIR.x + TO.z * DIR.z
      if (dot < cosLimit) continue

      this.combat.damageTarget(b, dmg, player)

      // Incendeia plantas atingidas.
      if (b.flammable && !b.burning && Math.random() < this.cfg.igniteChance) {
        this.fireSystem?.ignite(b)
      }
    }

    this.audio?.playFlameLoop()
    return true
  }

  stop() {
    this.active = false
    this.group.visible = false
    this.audio?.stopFlameLoop()
  }

  update(dt, player) {
    if (this.cooldown > 0) this.cooldown -= dt
    this._t += dt

    if (!this.active || !player) {
      if (this.group.visible) this.group.visible = false
      return
    }

    player.getMuzzle(ORIGIN)
    player.getForward(DIR)
    this.group.visible = true
    this.group.position.copy(ORIGIN)

    // Distribui as partículas ao longo do cone, com "sopro" animado.
    const range = this.cfg.range
    const spread = Math.tan((this.cfg.coneAngle * Math.PI) / 180)

    for (let i = 0; i < this.particles.length; i++) {
      const m = this.particles[i]
      const seed = m.userData.seed
      // Progresso cíclico ao longo do jato.
      const k = ((this._t * 1.9 + seed) % 1)
      const dist = k * range
      const w = spread * dist

      m.position.set(
        DIR.x * dist + (Math.sin(seed * 31 + this._t * 7) * w * 0.55),
        0.15 + Math.sin(seed * 17 + this._t * 5) * w * 0.4,
        DIR.z * dist + (Math.cos(seed * 23 + this._t * 6) * w * 0.55),
      )
      const s = 0.35 + k * 1.15
      m.scale.setScalar(s)
      m.material.opacity = Math.max(0, 0.95 - k * 1.05)
    }

    // Desliga sozinho se o botão foi solto (o Game chama stop()).
    this.active = false
  }
}
