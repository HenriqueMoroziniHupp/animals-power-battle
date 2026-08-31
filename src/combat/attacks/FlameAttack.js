import * as THREE from 'three'
import { additiveMat } from '../../config/palette.js'
import { ATTACKS } from '../../config/balance.js'
import { applyAimAssist } from './aimAssist.js'

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
    /** @type {(() => Array<object>)|null} */
    this.getMobs = ctx.getMobs ?? null
    /** @type {(() => Array<object>)|null} */
    this.getProps = ctx.getProps ?? null

    this.active = false
    this._hold = 0
    this._t = 0

    // Partículas de chama pooled (billboards aditivos).
    this.group = new THREE.Group()
    this.group.visible = false
    this.scene.add(this.group)

    // Partículas densas para parecer fogo de verdade, não bolas - MAIOR!
    const geo = new THREE.TetrahedronGeometry(0.25)
    this.particles = []
    // MUITAS partículas para densidade visual alta
    for (let i = 0; i < 200; i++) {
      let color
      const ratio = i / 200
      if (ratio < 0.1) {
        color = 0xffffff // Branco
      } else if (ratio < 0.25) {
        color = 0xffffaa // Amarelo claro
      } else if (ratio < 0.4) {
        color = 0xffff00 // Amarelo puro
      } else if (ratio < 0.55) {
        color = 0xffaa00 // Laranja
      } else if (ratio < 0.7) {
        color = 0xff6600 // Laranja queimado
      } else if (ratio < 0.85) {
        color = 0xff2200 // Vermelho
      } else {
        color = 0xaa0000 // Vermelho escuro
      }
      const m = new THREE.Mesh(geo, additiveMat(color, 1.0).clone())
      m.userData.seed = Math.random()
      m.userData.index = i
      this.group.add(m)
      this.particles.push(m)
    }
  }

  get ready() { return this.cooldown <= 0 }
  get continuous() { return true }

  fire(player, camera) {
    // A janela de graca e' renovada SEMPRE que o Game pede fogo, mesmo em
    // cooldown. Antes so' renovava quando `ready`, e como o cooldown (0.12s)
    // cobre ~7 de cada 8 frames a 60fps, o jato apagava entre os ticks.
    this._hold = 0.12
    this.active = true
    this.group.visible = true

    if (!this.ready) return false
    this.cooldown = this.cfg.cooldown
    // Janela de graca: sobrevive aos frames entre dois fire().
    this._hold = 0.12

    player.getMuzzle(ORIGIN)
    player.getForward(DIR)
    // Auxílio de mira: gira a direção do CONE inteiro para o alvo mais
    // próximo, entao o jato inteiro (dano + visual) acompanha.
    applyAimAssist(ORIGIN, DIR, player, this, this.cfg.aimAssist)

    // Com o booster o jato alcanca mais longe e abre um pouco mais.
    const power = this.combat.attackMultiplier
    const range = this.cfg.range * (1 + (power - 1) * 0.55)
    const halfAngle = ((this.cfg.coneAngle * (1 + (power - 1) * 0.35)) * Math.PI) / 180
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
    this._hold = 0
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
    // Mesma correcao do dano: o visual nao pode apontar para outro lado.
    applyAimAssist(ORIGIN, DIR, player, this, this.cfg.aimAssist)
    this.group.visible = true
    this.group.position.copy(ORIGIN)

    // Distribui as partículas ao longo do cone, com "sopro" animado.
    // Usa o MESMO alcance/angulo do dano: o visual nunca deve mentir sobre
    // ate onde o jato realmente machuca.
    const power = this.combat.attackMultiplier
    const boost = power - 1
    const range = this.cfg.range * (1 + boost * 0.55)
    const spread = Math.tan(((this.cfg.coneAngle * (1 + boost * 0.35)) * Math.PI) / 180)

    for (let i = 0; i < this.particles.length; i++) {
      const m = this.particles[i]
      const seed = m.userData.seed
      const idx = m.userData.index

      // Progresso ao longo do jato (começa na origem, vai até range)
      const k = ((this._t * 3.5 + seed * 0.15) % 1)
      const dist = k * range
      const w = spread * dist

      // Ângulo ao redor do cone
      const angle = (seed * 12.5) % (Math.PI * 2)

      // Raio dentro do cone (mais apertado perto da origem, mais aberto na ponta)
      const coneRadius = w * (0.4 + Math.sin(seed * 7) * 0.2)

      // Posição base no cone cônico
      let baseX = Math.cos(angle) * coneRadius
      let baseZ = Math.sin(angle) * coneRadius

      // Fluxo do fogo: sobe enquanto avança
      const upwardFlow = dist * 0.15

      // Turbulência suave e contínua (não exagerada)
      const turbX = Math.sin(this._t * 8 + seed * 15 + idx * 0.3) * w * 0.3
      const turbZ = Math.cos(this._t * 7.5 + seed * 11 + idx * 0.25) * w * 0.3

      m.position.set(
        DIR.x * dist + baseX + turbX,
        0.15 + upwardFlow,
        DIR.z * dist + baseZ + turbZ,
      )

      // Tamanho maior e visível
      const sizeVar = Math.sin(this._t * 10 + idx * 0.5) * 0.3
      const s = (0.6 + sizeVar) * (1 + boost * 0.4)
      m.scale.setScalar(Math.max(0.4, s))

      // Opacidade: transparente no início e fim, opaco no meio
      const opacityProfile = Math.sin(k * Math.PI) // 0 -> 1 -> 0
      const opacity = opacityProfile * (0.95 + boost * 0.05)
      m.material.opacity = opacity
    }

    // NAO zerar `active` aqui: isso apagava o jato por um frame entre o
    // update() e o proximo fire(), fazendo a chama piscar. Em vez disso,
    // `_hold` decai e so' apaga se fire() parar mesmo de ser chamado.
    this._hold -= dt
    if (this._hold <= 0) {
      this.active = false
      this.group.visible = false
    }
  }
}
