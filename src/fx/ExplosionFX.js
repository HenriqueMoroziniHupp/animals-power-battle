import * as THREE from 'three'
import { additiveMat } from '../config/palette.js'
import { ObjectPool } from '../core/ObjectPool.js'

/**
 * Explosão do laser: bola de fogo em expansão + onda de choque + faíscas.
 * Tudo pooled — nenhuma alocação durante o combate.
 */
export class ExplosionFX {
  constructor(scene, max = 6) {
    this.scene = scene
    this.max = max

    const sphereGeo = new THREE.IcosahedronGeometry(1, 1)
    const ringGeo = new THREE.RingGeometry(0.6, 1, 16)
    const sparkGeo = new THREE.TetrahedronGeometry(0.18, 0)

    this.pool = new ObjectPool(
      () => {
        const group = new THREE.Group()

        const core = new THREE.Mesh(sphereGeo, additiveMat(0xffdd66, 1))
        const flame = new THREE.Mesh(sphereGeo, additiveMat(0xff6622, 0.85))
        const ring = new THREE.Mesh(ringGeo, additiveMat(0xffaa44, 0.8))
        ring.rotation.x = -Math.PI / 2

        group.add(core, flame, ring)

        const sparks = []
        for (let i = 0; i < 8; i++) {
          const s = new THREE.Mesh(sparkGeo, additiveMat(0xffcc55, 1))
          group.add(s)
          sparks.push({ mesh: s, vel: new THREE.Vector3() })
        }

        group.visible = false
        this.scene.add(group)
        return { group, core, flame, ring, sparks, life: 0, maxLife: 0.62, radius: 1 }
      },
      (item) => { item.group.visible = false; item.life = 0 },
      max,
    )
  }

  /** @param {THREE.Vector3} pos @param {number} radius */
  spawn(pos, radius = 4) {
    if (this.pool.activeCount >= this.max) {
      // Recicla a mais antiga em vez de perder o efeito.
      const oldest = this.pool.active.values().next().value
      if (oldest) this.pool.release(oldest)
    }
    const it = this.pool.acquire()
    it.group.position.copy(pos)
    it.group.visible = true
    it.life = 0
    it.radius = radius

    for (const s of it.sparks) {
      s.mesh.position.set(0, 0, 0)
      s.vel.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.2 + 0.3,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(radius * (2.2 + Math.random() * 2))
    }
  }

  update(dt) {
    for (const it of [...this.pool.active]) {
      it.life += dt
      const k = it.life / it.maxLife
      if (k >= 1) { this.pool.release(it); continue }

      const ease = 1 - Math.pow(1 - k, 3)
      const r = it.radius

      it.core.scale.setScalar(r * (0.25 + ease * 0.75))
      it.core.material.opacity = Math.max(0, 1 - k * 1.7)

      it.flame.scale.setScalar(r * (0.4 + ease * 1.15))
      it.flame.material.opacity = Math.max(0, 0.85 - k * 1.1)

      it.ring.scale.setScalar(r * (0.5 + ease * 2.4))
      it.ring.material.opacity = Math.max(0, 0.8 - k * 1.3)

      for (const s of it.sparks) {
        s.mesh.position.addScaledVector(s.vel, dt)
        s.vel.y -= 9 * dt
        s.mesh.rotation.x += dt * 8
        s.mesh.rotation.y += dt * 6
        s.mesh.material.opacity = Math.max(0, 1 - k * 1.4)
        s.mesh.scale.setScalar(Math.max(0.01, 1 - k))
      }
    }
  }
}
