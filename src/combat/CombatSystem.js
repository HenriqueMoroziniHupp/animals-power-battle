import * as THREE from 'three'
import { BALANCE } from '../config/balance.js'

const TMP = new THREE.Vector3()

/**
 * Resolve todo o dano do jogo, concede EVO/cura e dispara os efeitos.
 * É o ponto central: ataques, mobs e fogo chamam aqui.
 */
export class CombatSystem {
  constructor(ctx) {
    this.player = ctx.player
    this.collision = ctx.collision
    this.damageNumbers = ctx.damageNumbers
    this.hitFX = ctx.hitFX
    this.audio = ctx.audio
    this.boosters = ctx.boosters
    this.world = ctx.world

    /** @type {Array<(e:object)=>void>} */
    this.listeners = []
  }

  on(fn) { this.listeners.push(fn) }
  _emit(type, data = {}) { for (const fn of this.listeners) fn({ type, ...data }) }

  /** Multiplicador de ataque vindo do booster de anúncio. */
  get attackMultiplier() {
    return this.boosters?.attackMultiplier ?? 1
  }

  get evoMultiplier() {
    return this.boosters?.evoMultiplier ?? 1
  }

  /**
   * Aplica dano do player a um alvo (mob ou prop).
   * @param {object} target
   * @param {number} baseDamage
   * @param {object} source
   */
  damageTarget(target, baseDamage, source) {
    if (!target || target.dead || target === source) return

    const crit = Math.random() < BALANCE.critChance
    const dmg = baseDamage * (crit ? BALANCE.critMultiplier : 1)

    TMP.set(target.position.x, target.position.y + (target.hitHeight ?? 1) * 1.6, target.position.z)
    this.damageNumbers?.spawn(TMP, dmg, crit ? 'crit' : 'normal')
    this.hitFX?.spawn(TMP, crit ? 0xffd166 : 0xffffff)
    this.audio?.play('hit')

    const died = target.takeDamage(dmg, source)
    if (died) this._onTargetDeath(target)
  }

  /**
   * Dano em área (explosão do laser).
   * @param {THREE.Vector3} center
   * @param {number} radius
   * @param {number} damage
   * @param {object} source
   * @param {object} [exclude] alvo direto, que já levou dano cheio
   */
  areaDamage(center, radius, damage, source, exclude = null) {
    const hits = this.collision.query(
      center.x, center.z, radius,
      (b) => b !== source && b !== exclude && !b.dead && b !== this.player,
    )
    for (const b of hits) {
      const d = Math.hypot(b.position.x - center.x, b.position.z - center.z)
      // Queda linear com a distância.
      const falloff = Math.max(0.2, 1 - d / radius)
      this.damageTarget(b, damage * falloff, source)
    }
  }

  /** Mob acertou o player. */
  mobAttackPlayer(mob, player) {
    if (player.dead) return
    const dmg = BALANCE.mobAtkAt(mob.atk, player.level)
    const died = player.takeDamage(dmg, mob)

    TMP.set(player.position.x, player.position.y + 2, player.position.z)
    this.damageNumbers?.spawn(TMP, dmg, 'player-hurt')
    this.hitFX?.spawn(TMP, 0xff4d6d)
    this.audio?.play('hurt')

    if (died) {
      this.audio?.play('death')
      this._emit('playerDeath')
    }
  }

  _onTargetDeath(target) {
    // Prop destruído
    if (target.static) {
      this.onPropDestroyed(target, false)
      return
    }
    // Mob abatido
    const evo = (target.evoValue ?? 0) * this.evoMultiplier
    this.player.kills += 1
    this.player.addEvo(evo)

    TMP.set(target.position.x, target.position.y + 2, target.position.z)
    this.damageNumbers?.spawn(TMP, `+${Math.round(evo)} EVO`, 'heal')
    this.audio?.play('kill')
    this._emit('mobKilled', { mob: target })
  }

  /**
   * @param {object} prop
   * @param {boolean} byFire true se morreu queimado
   */
  onPropDestroyed(prop, byFire) {
    if (prop._counted) return
    prop._counted = true

    const evo = (prop.evoValue ?? 0) * this.evoMultiplier
    if (evo > 0) {
      this.player.addEvo(evo)
      TMP.set(prop.position.x, prop.position.y + 1.5, prop.position.z)
      this.damageNumbers?.spawn(TMP, `+${Math.round(evo)} EVO`, 'heal')
    }
    if (prop.healValue > 0) {
      this.player.heal(prop.healValue)
      TMP.set(prop.position.x, prop.position.y + 2.2, prop.position.z)
      this.damageNumbers?.spawn(TMP, `+${prop.healValue} HP`, 'heal')
    }

    // Vira toco queimado ou fica invisível.
    const becameBurnt = byFire && prop.toBurnt()
    if (becameBurnt) {
      // Toco continua bloqueando, mas não é mais alvo.
      // Será restaurado após o delay.
      prop.solid = true
      prop.flammable = false
    } else {
      // Sem fogo: fica invisível mas será restaurado
      prop.mesh.visible = false
      prop.solid = false
    }
    // Nenhum prop é removido - todos renascem após o delay
    this._emit('propDestroyed', { prop, byFire })
  }
}
