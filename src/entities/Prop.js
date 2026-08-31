import { Entity } from './Entity.js'
import { PROPS } from '../world/props/index.js'

/**
 * Elemento estático do cenário (árvore, arbusto, pedra, cacto).
 * É uma Entity para poder levar dano, pegar fogo e devolver EVO/vida.
 */
export class Prop extends Entity {
  /**
   * @param {string} kind chave em PROPS
   * @param {THREE.Vector3} position
   * @param {object} biome
   * @param {() => number} rng
   * @param {THREE.Scene} scene
   */
  constructor(kind, position, biome, rng, scene) {
    const def = PROPS[kind]
    super({
      position,
      radius: def.radius,
      hp: def.hp,
      solid: true,
      static: true,
    })

    this.kind = kind
    this.def = def
    this.flammable = def.flammable
    this.evoValue = def.evo
    this.healValue = def.heal ?? 0
    this.scene = scene
    this.biome = biome

    this.mesh = def.build(biome, rng)
    this.scaleFactor = this.mesh.userData.scaleFactor ?? 1
    this.mesh.position.copy(position)
    this.mesh.rotation.y = rng() * Math.PI * 2
    scene.add(this.mesh)

    this.radius = def.radius * this.scaleFactor
    this.hitHeight = this.radius * 1.6
    this.maxHp = def.hp * this.scaleFactor
    this.hp = this.maxHp

    /** Estado de incêndio (gerido por FireSystem). */
    this.burning = false
    this.burnTime = 0
    /** @type {object|null} efeito visual de fogo anexado */
    this.fire = null

    /** Tempo desde que foi destruído (para restauração) */
    this.timeSinceDestroyed = 0
    /** Tempo máximo antes de restaurar (em segundos) */
    this.restoreDelay = 10
    /** Se foi queimado (alteração permanente visual) */
    this.isBurnt = false
  }

  /** Substitui a malha pela versão queimada, se a espécie tiver uma. */
  toBurnt() {
    if (!this.def.buildBurnt) return false
    const pos = this.mesh.position.clone()
    const rotY = this.mesh.rotation.y
    this.mesh.parent?.remove(this.mesh)
    this.mesh.traverse((o) => { if (o.isMesh) o.geometry?.dispose?.() })

    this.mesh = this.def.buildBurnt(this.scaleFactor)
    this.mesh.position.copy(pos)
    this.mesh.rotation.y = rotY
    this.scene.add(this.mesh)
    this.isBurnt = true
    return true
  }

  /** Restaura a árvore à versão normal. */
  restore() {
    if (!this.dead) return false

    const pos = this.mesh.position.clone()
    const rotY = this.mesh.rotation.y

    // Remove mesh antiga (queimada ou destruída)
    if (this.scene.children.includes(this.mesh)) {
      this.scene.remove(this.mesh)
    }
    this.mesh.traverse((o) => { if (o.isMesh) o.geometry?.dispose?.() })

    // Reconstrói a mesh original
    const biome = this.biome
    const rng = () => Math.random()
    this.mesh = this.def.build(biome, rng)
    this.mesh.position.copy(pos)
    this.mesh.rotation.y = rotY
    this.scaleFactor = this.mesh.userData.scaleFactor ?? 1
    this.scene.add(this.mesh)

    // Restaura estado completamente
    this.isBurnt = false
    this.dead = false
    this.burning = false
    this.hp = this.maxHp
    this.flammable = this.def.flammable
    this.solid = true
    this.mesh.visible = true
    this.timeSinceDestroyed = 0
    this._counted = false

    return true
  }

  /** Atualiza o estado de restauração. */
  update(dt) {
    if (this.dead) {
      this.timeSinceDestroyed += dt
      if (this.timeSinceDestroyed >= this.restoreDelay) {
        this.restore()
      }
    }
  }
}
