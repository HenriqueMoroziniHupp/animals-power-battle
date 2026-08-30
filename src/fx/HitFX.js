import * as THREE from 'three'
import { additiveMat } from '../config/palette.js'
import { ObjectPool } from '../core/ObjectPool.js'

/** Faíscas curtas no ponto de impacto de um golpe. */
export class HitFX {
  constructor(scene, max = 14) {
    this.scene = scene
    this.max = max
    const geo = new THREE.TetrahedronGeometry(0.14, 0)

    this.pool = new ObjectPool(
      () => {
        const group = new THREE.Group()
        const parts = []
        for (let i = 0; i < 5; i++) {
          const m = new THREE.Mesh(geo, additiveMat(0xffffff, 1))
          group.add(m)
          parts.push({ mesh: m, vel: new THREE.Vector3() })
        }
        group.visible = false
        this.scene.add(group)
        return { group, parts, life: 0, maxLife: 0.32 }
      },
      (it) => { it.group.visible = false; it.life = 0 },
      max,
    )
  }

  spawn(pos, color = 0xffffff) {
    if (this.pool.activeCount >= this.max) return
    const it = this.pool.acquire()
    it.group.position.copy(pos)
    it.group.visible = true
    it.life = 0
    for (const p of it.parts) {
      p.mesh.material = additiveMat(color, 1)
      p.mesh.position.set(0, 0, 0)
      p.vel.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.4,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(3 + Math.random() * 3)
    }
  }

  update(dt) {
    for (const it of [...this.pool.active]) {
      it.life += dt
      const k = it.life / it.maxLife
      if (k >= 1) { this.pool.release(it); continue }
      for (const p of it.parts) {
        p.mesh.position.addScaledVector(p.vel, dt)
        p.vel.y -= 10 * dt
        p.mesh.scale.setScalar(Math.max(0.01, 1 - k))
      }
    }
  }
}
