import * as THREE from 'three'

const TMP = new THREE.Vector3()

/**
 * Barras de vida + nome, projetadas do mundo 3D para a tela.
 *
 * Elementos DOM são pooled e há um teto rígido de barras simultâneas
 * (as mais próximas), para não causar thrash de layout com dezenas de mobs.
 */
export class HealthBarManager {
  constructor(layerEl, camera, maxBars = 20, maxDistance = 55) {
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

    // Pool fixo de candidatos para evitar criar objetos a cada frame
    this._candidatePool = []
    for (let i = 0; i < 60; i++) {
      this._candidatePool.push({ e: null, d: 0 })
    }
    this._activeCandidates = []
  }

  /**
   * @param {Array<object>} entities mobs vivos
   * @param {THREE.Vector3} focus posição do player (para ordenar por distância)
   */
  update(entities, focus) {
    const cam = this.camera
    const w = window.innerWidth
    const h = window.innerHeight
    const maxDistSq = this.maxDistance * this.maxDistance

    // Seleciona os mais próximos dentro do alcance reaproveitando objetos
    this._activeCandidates.length = 0
    let poolIdx = 0
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i]
      if (e.dead) continue
      const dx = e.position.x - focus.x
      const dz = e.position.z - focus.z
      const d2 = dx * dx + dz * dz
      if (d2 > maxDistSq) continue

      const item = this._candidatePool[poolIdx++]
      if (item) {
        item.e = e
        item.d = d2
        this._activeCandidates.push(item)
      }
    }
    this._activeCandidates.sort((a, b) => a.d - b.d)

    const n = Math.min(this._activeCandidates.length, this.maxBars)
    for (let i = 0; i < n; i++) {
      const { e } = this._activeCandidates[i]
      const el = this.pool[i]

      TMP.set(e.position.x, e.position.y + (e.hitHeight ?? 1) * 2.1 + 0.6, e.position.z)
      TMP.project(cam)

      // Atrás da câmera ou fora da tela: esconde.
      if (TMP.z > 1 || TMP.x < -1.2 || TMP.x > 1.2 || TMP.y < -1.2 || TMP.y > 1.2) {
        if (el.style.display !== 'none') el.style.display = 'none'
        continue
      }

      const sx = Math.round((TMP.x * 0.5 + 0.5) * w)
      const sy = Math.round((-TMP.y * 0.5 + 0.5) * h)

      // Zona morta no topo: placar e botão de menu
      if (sy < 62) {
        if (el.style.display !== 'none') el.style.display = 'none'
        continue
      }

      if (el.style.display !== 'block') el.style.display = 'block'
      if (el._lastSx !== sx || el._lastSy !== sy) {
        el._lastSx = sx
        el._lastSy = sy
        el.style.transform = `translate3d(${sx}px, ${sy}px, 0)`
      }

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
