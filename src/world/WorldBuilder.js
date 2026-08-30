import * as THREE from 'three'
import { Prop } from '../entities/Prop.js'
import { Water } from './Water.js'
import { BALANCE } from '../config/balance.js'

/** PRNG determinístico, igual ao do Terrain. */
function makeRng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Povoa o bioma: props espalhados pelo terreno e água.
 * Também mantém a população de mobs (spawn em anel ao redor do player e
 * reciclagem dos que ficam longe demais).
 */
export class WorldBuilder {
  constructor(scene, terrain, collision, biome, seed = 4242) {
    this.scene = scene
    this.terrain = terrain
    this.collision = collision
    this.biome = biome
    this.rng = makeRng(seed)

    /** @type {Prop[]} */
    this.props = []
    this.water = new Water(biome, terrain.size, scene)

    this._placeProps()
  }

  _placeProps() {
    const counts = this.biome.props
    const waterLevel = this.biome.water.level
    const limit = this.terrain.half - 16

    for (const [kind, target] of Object.entries(counts)) {
      if (!target) continue
      let placed = 0
      let attempts = 0
      const maxAttempts = target * 12

      while (placed < target && attempts < maxAttempts) {
        attempts++
        const x = (this.rng() * 2 - 1) * limit
        const z = (this.rng() * 2 - 1) * limit
        const y = this.terrain.getHeightAt(x, z)

        // Não nasce dentro d'água nem na área de spawn do player.
        if (y < waterLevel + 0.4) continue
        if (Math.hypot(x, z) < 9) continue

        // Encostas muito íngremes ficam livres.
        const nrm = this.terrain.getNormalAt(x, z)
        if (nrm.y < 0.82) continue

        // Evita sobreposição com props já colocados.
        const near = this.collision.query(x, z, 2.4, (b) => b.static)
        if (near.length > 0) continue

        const prop = new Prop(kind, new THREE.Vector3(x, y, z), this.biome, this.rng, this.scene)
        this.collision.add(prop)
        this.props.push(prop)
        placed++
      }
    }
  }

  /** Remove um prop destruído do mundo. */
  removeProp(prop) {
    this.collision.remove(prop)
    const i = this.props.indexOf(prop)
    if (i >= 0) this.props.splice(i, 1)
  }

  /**
   * Sorteia uma posição válida no anel de spawn ao redor do player.
   * @returns {THREE.Vector3|null}
   */
  findSpawnPoint(playerPos) {
    const { min, max } = BALANCE.spawnRing
    const waterLevel = this.biome.water.level
    const limit = this.terrain.half - 14

    for (let i = 0; i < 24; i++) {
      const ang = this.rng() * Math.PI * 2
      const dist = min + this.rng() * (max - min)
      const x = playerPos.x + Math.cos(ang) * dist
      const z = playerPos.z + Math.sin(ang) * dist
      if (Math.abs(x) > limit || Math.abs(z) > limit) continue

      const y = this.terrain.getHeightAt(x, z)
      if (y < waterLevel + 0.5) continue

      const nrm = this.terrain.getNormalAt(x, z)
      if (nrm.y < 0.8) continue

      const blocked = this.collision.query(x, z, 2.2, (b) => b.solid)
      if (blocked.length > 0) continue

      return new THREE.Vector3(x, y, z)
    }
    return null
  }

  update(dt) {
    this.water.update(dt)
  }

  dispose() {
    for (const p of this.props) {
      this.collision.remove(p)
      p.dispose()
    }
    this.props.length = 0
    this.water.dispose()
  }
}
