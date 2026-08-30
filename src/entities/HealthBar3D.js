import * as THREE from 'three'

const TMP = new THREE.Vector3()

/**
 * Barras de vida + nome, projetadas do mundo 3D para a tela.
 *
 * Elementos DOM são pooled e há um teto rígido de barras simultâneas
 * (as mais próximas), para não causar thrash de layout com dezenas de mobs.
 */
export class HealthBarManager {
  constructor(layerEl, camera, maxBars = 25, maxDistance = 55) {
    this.layer = layerEl
    this.camera = camera
    this.maxBars = maxBars
    this.maxDistance = maxDistance

    /** @type {HTMLElement[]} */
    this.pool = []
    for (let i = 0; i < maxBars; i++) {
      const el = document.createElement('div')
      el.className = 'mob-bar'
      el.innerHTML = '<span class="mob-bar-name"></span><div class="mob-bar-track"><div class="mob-bar-fill"></div></div>'
      el.style.display = 'none'
      this.layer.appendChild(el)
      this.pool.push(el)
    }
    this._candidates = []
  }

  /**
   * @param {Array<object>} entities mobs vivos
   * @param {THREE.Vector3} focus posição do player (para ordenar por distância)
   */
  update(entities, focus) {
    const cam = this.camera
    const w = window.innerWidth
    const h = window.innerHeight

    // Seleciona os mais próximos dentro do alcance.
    this._candidates.length = 0
    for (const e of entities) {
      if (e.dead) continue
      const d = Math.hypot(e.position.x - focus.x, e.position.z - focus.z)
      if (d > this.maxDistance) continue
      this._candidates.push({ e, d })
    }
    this._candidates.sort((a, b) => a.d - b.d)

    const n = Math.min(this._candidates.length, this.maxBars)
    for (let i = 0; i < n; i++) {
      const { e } = this._candidates[i]
      const el = this.pool[i]

      TMP.set(e.position.x, e.position.y + (e.hitHeight ?? 1) * 2.1 + 0.6, e.position.z)
      TMP.project(cam)

      // Atrás da câmera ou fora da tela: esconde.
      if (TMP.z > 1 || TMP.x < -1.2 || TMP.x > 1.2 || TMP.y < -1.2 || TMP.y > 1.2) {
        el.style.display = 'none'
        continue
      }

      const sx = (TMP.x * 0.5 + 0.5) * w
      const sy = (-TMP.y * 0.5 + 0.5) * h

      // Zona morta no topo: o placar e o botao de menu ficam ali e as barras
      // de vida passavam por cima deles (visto em 360x640).
      if (sy < 62) {
        el.style.display = 'none'
        continue
      }

      el.style.display = 'block'
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`

      // Só toca o DOM quando o valor muda de verdade.
      if (el._name !== e.name) {
        el.firstChild.textContent = e.name
        el._name = e.name
      }
      const pct = Math.round(e.hpPercent * 100)
      if (el._pct !== pct) {
        el.lastChild.firstChild.style.width = pct + '%'
        el._pct = pct
      }
      const cls = e.behavior === 'aggressive' ? 'mob-bar hostile'
        : e.behavior === 'neutral' ? 'mob-bar neutral' : 'mob-bar'
      if (el._cls !== cls) {
        el.className = cls
        el._cls = cls
      }
    }

    for (let i = n; i < this.maxBars; i++) {
      if (this.pool[i].style.display !== 'none') this.pool[i].style.display = 'none'
    }
  }

  clear() {
    for (const el of this.pool) el.style.display = 'none'
  }
}
