import * as THREE from 'three'
import { flashVariantOf } from '../config/palette.js'

/**
 * Base de tudo que existe no mundo com posição, vida e hitbox:
 * player, mobs e props destrutíveis.
 */
export class Entity {
  constructor({ position, radius = 1, hp = 100, solid = true, static: isStatic = false }) {
    this.position = position ? position.clone() : new THREE.Vector3()
    this.radius = radius
    this.hp = hp
    this.maxHp = hp
    this.solid = solid
    this.static = isStatic
    this.dead = false

    /** Altura usada pelo raymarch para o teste em Y. */
    this.hitHeight = radius

    /** @type {THREE.Object3D|null} */
    this.mesh = null

    /** Piscada branca ao levar dano. */
    this._flash = 0
  }

  /**
   * @param {number} amount
   * @param {object} [source] quem causou o dano
   * @returns {boolean} true se este golpe matou
   */
  takeDamage(amount, source = null) {
    if (this.dead) return false
    this.hp -= amount
    this._flash = 0.14
    this.onDamage?.(amount, source)
    if (this.hp <= 0) {
      this.hp = 0
      this.dead = true
      this.onDeath?.(source)
      return true
    }
    return false
  }

  heal(amount) {
    if (this.dead) return
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  get hpPercent() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0
  }

  /**
   * Aplica a piscada de dano.
   * Os materiais são COMPARTILHADOS entre entidades (ver config/palette.js),
   * então trocamos a referência do material em vez de mutar o material —
   * mutar acenderia todas as criaturas da mesma cor ao mesmo tempo.
   */
  updateFlash(dt) {
    if (this._flash <= 0) return
    const wasOn = this._flashApplied === true
    this._flash -= dt
    const on = this._flash > 0

    if (on === wasOn || !this.mesh) return

    this.mesh.traverse((o) => {
      if (!o.isMesh) return
      // Meshes de FX embutidos na criatura (ex.: chamas aditivas do Super
      // Calango) não participam da piscada: a variante de flash de um
      // material aditivo sem emissive ficaria errada e vazaria no cache.
      if (o.userData.noFlash) return
      if (on) {
        o.userData.baseMaterial = o.material
        o.material = flashVariantOf(o.material)
      } else if (o.userData.baseMaterial) {
        o.material = o.userData.baseMaterial
        o.userData.baseMaterial = null
      }
    })
    this._flashApplied = on
  }

  dispose() {
    if (this.mesh?.parent) this.mesh.parent.remove(this.mesh)
    this.mesh?.traverse?.((o) => {
      if (o.isMesh) o.geometry?.dispose?.()
    })
    this.mesh = null
  }
}
