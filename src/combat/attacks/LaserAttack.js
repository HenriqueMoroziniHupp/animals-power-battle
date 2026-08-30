import * as THREE from 'three'
import { additiveMat } from '../../config/palette.js'
import { ATTACKS } from '../../config/balance.js'

const DIR = new THREE.Vector3()
const ORIGIN = new THREE.Vector3()
const MID = new THREE.Vector3()

/**
 * Raio laser: alcance longo, dano médio, explode no ponto de impacto.
 *
 * O alcance é clampado pela distância visível para nunca sair da tela do
 * player. Colide com o primeiro alvo sólido (pedra, árvore, mob) ou com o
 * terreno. A explosão causa dano em área e abre uma cratera no terreno.
 */
export class LaserAttack {
  constructor(ctx) {
    this.cfg = ATTACKS.laser
    this.id = this.cfg.id
    this.name = this.cfg.name
    this.cooldown = 0

    this.scene = ctx.scene
    this.collision = ctx.collision
    this.terrain = ctx.terrain
    this.combat = ctx.combat
    this.explosions = ctx.explosions
    this.scorch = ctx.scorch
    this.audio = ctx.audio

    // Feixe: cilindro esticado ao longo de Z, reaproveitado a cada disparo.
    const geo = new THREE.CylinderGeometry(0.16, 0.16, 1, 6, 1, true)
    geo.rotateX(Math.PI / 2) // eixo do cilindro passa a apontar em +Z
    this.beam = new THREE.Mesh(geo, additiveMat(0x66e0ff, 1))
    this.beam.visible = false
    this.scene.add(this.beam)

    const glowGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 6, 1, true)
    glowGeo.rotateX(Math.PI / 2)
    this.glow = new THREE.Mesh(glowGeo, additiveMat(0x2288ff, 0.4))
    this.glow.visible = false
    this.scene.add(this.glow)

    this._beamLife = 0
  }

  get ready() { return this.cooldown <= 0 }

  /**
   * Contínuo: segurar o botão mantém atirando. A cadência é limitada pelo
   * cooldown (0.1s = 10 tiros/s), não pela taxa de quadros.
   */
  get continuous() { return true }

  /**
   * @param {object} player
   * @param {THREE.Camera} camera usada para limitar o alcance ao visível
   */
  fire(player, camera) {
    if (!this.ready) return false
    this.cooldown = this.cfg.cooldown

    player.getMuzzle(ORIGIN)
    player.getForward(DIR)

    // Alcance nunca maior que o que cabe na tela.
    const visible = Math.max(12, camera.far * 0.12)
    const maxRange = Math.min(this.cfg.range, visible)

    const hit = this.collision.raymarch(
      ORIGIN, DIR, maxRange,
      (b) => b.solid && b !== player,
    )

    this._showBeam(ORIGIN, hit.point)

    const dmg = player.atk * this.cfg.damageMult * this.combat.attackMultiplier
    // Alvo direto leva dano cheio.
    if (hit.body) this.combat.damageTarget(hit.body, dmg, player)

    // Explosão + dano em área + cratera.
    // 0.38: o visual fica menor que o raio de DANO (4.2), mantendo a
    // explosao contida no ponto de impacto mesmo a 10 tiros/s.
    // O multiplicador do booster vai junto: com o poder aumentado a explosao
    // ganha a onda de choque em anel e fica maior.
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
    // Com o poder aumentado a cratera fica bem maior e mais funda —
    // destruicao de solo visivelmente mais forte.
    // O piso de `Terrain._craterFloor` continua garantindo que nem a versao
    // turbinada cave abaixo da agua (senao volta a mancha amarela).
    this.terrain.makeCrater(
      hit.point.x, hit.point.z,
      this.cfg.craterRadius * (1 + (power - 1) * 1.1),
      this.cfg.craterDepth * (1 + (power - 1) * 1.6),
    )
    // Mancha de queimado permanente no chão do impacto, na mesma proporcao.
    this.scorch?.spawn(hit.point, this.cfg.craterRadius * (1 + (power - 1) * 0.9))
    this.audio?.play('laser')
    this.audio?.play('explosion')
    return true
  }

  _showBeam(from, to) {
    const dist = from.distanceTo(to)
    MID.copy(from).add(to).multiplyScalar(0.5)

    for (const m of [this.beam, this.glow]) {
      m.position.copy(MID)
      m.lookAt(to)
      m.scale.set(1, 1, Math.max(0.01, dist))
      m.visible = true
      m.material.opacity = m === this.beam ? 1 : 0.4
    }
    this._beamLife = 0.15
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt
    if (this._beamLife > 0) {
      this._beamLife -= dt
      const k = Math.max(0, this._beamLife / 0.15)
      this.beam.material.opacity = k
      this.glow.material.opacity = k * 0.4
      if (this._beamLife <= 0) {
        this.beam.visible = false
        this.glow.visible = false
      }
    }
  }

  stop() {}
}
