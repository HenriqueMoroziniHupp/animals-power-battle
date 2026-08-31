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

    // Anexa chamas de verdade - muitas partículas pequenas formando fogo real.
    const group = new THREE.Group()
    const n = 40
    for (let i = 0; i < n; i++) {
      // Cores gradiente fogo
      let color
      const ratio = i / n
      if (ratio < 0.15) color = 0xffffff
      else if (ratio < 0.3) color = 0xffffcc
      else if (ratio < 0.45) color = 0xffff00
      else if (ratio < 0.6) color = 0xffaa00
      else if (ratio < 0.75) color = 0xff6600
      else if (ratio < 0.9) color = 0xff2200
      else color = 0xaa0000

      // Cones maiores para formar textura de fogo bem visível
      const flameGeo = new THREE.ConeGeometry(0.3, 0.8, 4)
      const m = new THREE.Mesh(flameGeo, additiveMat(color, 0.98))
      const a = (i / n) * Math.PI * 2
      const r = 0.12 + Math.sin(i * 1.5) * 0.08
      const y = 0.15 + (i / n) * 0.5
      m.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
      m.userData.phase = Math.random() * 6.28
      m.userData.layer = i
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

      // Anima as chamas como fogo real - fluxo fluido para cima.
      if (prop.fire) {
        for (const m of prop.fire.children) {
          const ph = m.userData.phase
          const layer = m.userData.layer

          // Movimento fluxo: sobe suavemente
          const flowUp = Math.sin(t * 5 + ph) * 0.05
          m.position.y += flowUp * dt * 0.3

          // Oscilação de altura simula fogo ondulante
          const heightWave = Math.sin(t * 6 + ph) * 0.08
          m.position.y += heightWave * dt * 0.2

          // Movimento lateral suave (vento, turbulência)
          const swayX = Math.sin(t * 4 + ph * 1.5) * 0.1
          const swayZ = Math.cos(t * 3.5 + ph * 1.3) * 0.1
          m.position.x += swayX * dt * 0.25
          m.position.z += swayZ * dt * 0.25

          // Pulsação de altura
          const pulse = Math.sin(t * 7 + ph) * 0.3 + Math.sin(t * 4.5 + ph * 0.8) * 0.2
          m.scale.y = Math.max(0.6, 0.8 + pulse)
          m.scale.x = 0.8 + Math.sin(t * 5.5 + ph) * 0.2
          m.scale.z = 0.8 + Math.cos(t * 5 + ph) * 0.2

          // Rotação leve (flama naturalmente gira)
          m.rotation.z += dt * (3 + Math.sin(t * 5 + ph) * 2)
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
