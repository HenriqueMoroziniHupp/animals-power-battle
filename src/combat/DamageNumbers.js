import * as THREE from 'three'
import { ObjectPool } from '../core/ObjectPool.js'

const TMP = new THREE.Vector3()

/**
 * Números de dano flutuantes, em DOM pooled.
 * Sobem e desaparecem; a posição vem da projeção do ponto 3D.
 */
export class DamageNumbers {
  constructor(layerEl, camera, max = 28) {
    this.layer = layerEl
    this.camera = camera

    this.pool = new ObjectPool(
      () => {
        const el = document.createElement('div')
        el.className = 'dmg-num'
        el.style.display = 'none'
        this.layer.appendChild(el)
        return { el, life: 0, maxLife: 1, pos: new THREE.Vector3(), vy: 0 }
      },
      (item) => {
        item.el.style.display = 'none'
        item.life = 0
      },
      max,
    )
    this.max = max
  }

  /**
   * @param {THREE.Vector3} worldPos
   * @param {number|string} value
   * @param {'normal'|'crit'|'heal'|'player-hurt'} kind
   */
  spawn(worldPos, value, kind = 'normal') {
    if (this.pool.activeCount >= this.max) return
    const item = this.pool.acquire()
    item.pos.copy(worldPos)
    item.pos.x += (Math.random() - 0.5) * 0.8
    item.pos.z += (Math.random() - 0.5) * 0.8
    item.life = 0
    item.maxLife = kind === 'crit' ? 1.1 : 0.85
    item.vy = 2.6

    item.el.className = 'dmg-num' + (kind !== 'normal' ? ' ' + kind : '')
    item.el.textContent = typeof value === 'number' ? Math.round(value) : value
    item.el.style.display = 'block'
    item.el.style.opacity = '1'
  }

  update(dt) {
    const w = window.innerWidth
    const h = window.innerHeight

    for (const item of [...this.pool.active]) {
      item.life += dt
      if (item.life >= item.maxLife) {
        this.pool.release(item)
        continue
      }
      item.pos.y += item.vy * dt
      item.vy -= 3.2 * dt

      TMP.copy(item.pos).project(this.camera)
      if (TMP.z > 1) {
        item.el.style.display = 'none'
        continue
      }
      const sx = (TMP.x * 0.5 + 0.5) * w
      const sy = (-TMP.y * 0.5 + 0.5) * h
      const k = item.life / item.maxLife
      item.el.style.display = 'block'
      item.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${(1 + (1 - k) * 0.25).toFixed(2)})`
      item.el.style.opacity = String(Math.max(0, 1 - k * k))
    }
  }

  clear() {
    this.pool.releaseAll()
  }
}
