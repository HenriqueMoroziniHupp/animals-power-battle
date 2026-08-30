import * as THREE from 'three'
import { additiveMat } from '../config/palette.js'
import { BALANCE } from '../config/balance.js'

/**
 * Sistema de incêndio: chamas anexadas a props inflamáveis.
 *
 * As chamas do ataque de fogo incendeiam plantas; o fogo consome o prop ao
 * longo do tempo, pode se propagar para vizinhos inflamáveis e respeita um
 * teto global de focos simultâneos (BALANCE.maxActiveFires).
 */
export class FireSystem {
  constructor(scene, collision, world, combat) {
    this.scene = scene
    this.collision = collision
    this.world = world
    this.combat = combat
    /** @type {Set<object>} props em chamas */
    this.burning = new Set()

    // Geometria compartilhada das línguas de fogo.
    this._flameGeo = new THREE.ConeGeometry(0.28, 0.8, 5)
  }

  get count() { return this.burning.size }

  /** @param {object} prop @returns {boolean} pegou fogo? */
  ignite(prop) {
    if (!prop || prop.dead || prop.burning || !prop.flammable) return false
    if (this.burning.size >= BALANCE.maxActiveFires) return false

    prop.burning = true
    prop.burnTime = 0

    // Anexa as chamas visuais ao mesh do prop.
    const group = new THREE.Group()
    const n = 3
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this._flameGeo, additiveMat(i === 0 ? 0xffcc44 : 0xff5522, 0.9))
      const a = (i / n) * Math.PI * 2
      m.position.set(Math.cos(a) * 0.3, 0.6 + i * 0.25, Math.sin(a) * 0.3)
      m.userData.phase = Math.random() * 6
      group.add(m)
    }
    group.scale.setScalar(prop.scaleFactor ?? 1)
    prop.mesh.add(group)
    prop.fire = group

    this.burning.add(prop)
    return true
  }

  _extinguish(prop) {
    if (prop.fire) {
      prop.mesh?.remove?.(prop.fire)
      prop.fire.traverse?.((o) => { if (o.isMesh) o.geometry?.dispose?.() })
      prop.fire = null
    }
    prop.burning = false
    this.burning.delete(prop)
  }

  update(dt, t) {
    for (const prop of [...this.burning]) {
      if (prop.dead) { this._extinguish(prop); continue }

      prop.burnTime += dt

      // Anima as línguas de fogo.
      if (prop.fire) {
        for (const m of prop.fire.children) {
          const ph = m.userData.phase
          m.scale.y = 0.75 + Math.sin(t * 9 + ph) * 0.3
          m.scale.x = m.scale.z = 0.85 + Math.cos(t * 7 + ph) * 0.15
          m.rotation.y += dt * 2
        }
      }

      // Dano por segundo do fogo.
      const dps = 14
      const died = prop.takeDamage(dps * dt, null)
      if (died) {
        this.combat?.onPropDestroyed(prop, true)
        this._extinguish(prop)
        continue
      }

      // Propagação para vizinhos inflamáveis.
      if (prop.burnTime > 1.4 && Math.random() < 0.35 * dt) {
        const near = this.collision.query(
          prop.position.x, prop.position.z, 4.5,
          (b) => b.static && b.flammable && !b.burning && !b.dead,
        )
        if (near.length) this.ignite(near[Math.floor(Math.random() * near.length)])
      }
    }
  }

  clear() {
    for (const p of [...this.burning]) this._extinguish(p)
    this.burning.clear()
  }
}
