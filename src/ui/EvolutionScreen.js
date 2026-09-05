import * as THREE from 'three'
import { t } from '../i18n/index.js'

/**
 * Tela de evolução: mostra em 3D o animal que o jogador acabou de virar e o
 * PRÓXIMO da escada — o gancho de engajamento é o jogador ver que existe algo
 * maior à frente até chegar ao Super Calango.
 *
 * Renderer/cena próprios num canvas do overlay: a cena do jogo nunca é tocada.
 * Os modelos vêm de `species.build()` (puro). Na saída, dispose de geometrias
 * e de `userData.disposables` — NUNCA dos materiais compartilhados da paleta.
 */
export class EvolutionScreen {
  constructor() {
    this.el = document.getElementById('overlay-evolution')
    this.canvas = document.getElementById('evolution-canvas')
    this.els = {
      curName: document.getElementById('evo-current-name'),
      nextName: document.getElementById('evo-next-name'),
      nextLevel: document.getElementById('evo-next-level'),
      btn: document.getElementById('btn-evo-continue'),
    }

    this.renderer = null
    /** @type {{group: THREE.Group, baseYaw: number, baseScale: number}[]} */
    this._models = []
    this._raf = null
    this._resolve = null
    this._t = 0

    this.els.btn.addEventListener('click', () => this._close(true))
    window.addEventListener('resize', () => {
      if (!this.el.classList.contains('hidden')) this._resize()
    })
  }

  /**
   * Exibe a tela. Resolve quando o jogador toca em CONTINUAR.
   * @param {object} current espécie recém-alcançada
   * @param {object|null} next próxima da escada (null = topo: Super Calango)
   */
  show(current, next) {
    if (this._resolve) this._close(true)
    this._ensureRenderer()

    const curKey = 'species.' + current.id
    const curName = t(curKey)
    this.els.curName.textContent = curName !== curKey ? curName : current.name

    const isMax = !next
    this.el.classList.toggle('evo-max', isMax)
    if (next) {
      const nextKey = 'species.' + next.id
      const nextName = t(nextKey)
      this.els.nextName.textContent = nextName !== nextKey ? nextName : next.name
      this.els.nextLevel.textContent = t('evolution.levelPrefix', { level: next.minLevel })
    }

    this._buildModels(current, next)
    this.el.classList.remove('hidden')
    this._resize()

    this._t = 0
    this._lastMs = performance.now()
    this._tick()
    return new Promise((resolve) => { this._resolve = resolve })
  }

  /** Fecha sem resolver a Promise (usado quando o jogo reinicia por fora). */
  abort() { this._close(false) }

  _close(resolve) {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
    this.el.classList.add('hidden')
    this._disposeModels()
    const r = this._resolve
    this._resolve = null
    if (resolve) r?.()
  }

  // ---------------- cena ----------------

  _ensureRenderer() {
    if (this.renderer) return
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: true,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 2, 0.1, 50)
    this.camera.position.set(0, 1.7, 6.6)
    this.camera.lookAt(0, 1.0, 0)

    // Mesmo par de luzes do SceneManager: Lambert fica preto sem luz.
    const sun = new THREE.DirectionalLight(0xffffff, 2.1)
    sun.position.set(6, 10, 8)
    this.scene.add(sun)
    this.scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x6b5a3e, 1.0))

    // "Sombras" de contato: um disco escuro sob cada animal.
    this._shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.3,
    })
    this._shadows = [0, 1].map(() => {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), this._shadowMat)
      disc.rotation.x = -Math.PI / 2
      disc.position.y = 0.01
      this.scene.add(disc)
      return disc
    })
  }

  _buildModels(current, next) {
    this._disposeModels()
    const specs = next ? [current, next] : [current]
    const xs = next ? [-2.5, 2.5] : [0]
    // Esquerda olha para a direita e vice-versa: os dois em diagonal de 45°
    // de frente para a câmera. Sozinho (nível máximo), diagonal simples.
    const yaws = next ? [Math.PI / 4, -Math.PI / 4] : [Math.PI / 4]

    const groups = specs.map((s) => {
      const g = s.build()
      g.scale.setScalar(s.scale)
      return g
    })

    // Fator comum de enquadramento: preserva a diferença de tamanho entre as
    // espécies (o próximo parecer MAIOR é parte do apelo).
    const box = new THREE.Box3()
    let maxH = 0
    for (const g of groups) {
      box.setFromObject(g)
      maxH = Math.max(maxH, box.max.y - box.min.y)
    }
    const fit = 2.2 / Math.max(maxH, 0.001)

    this._models = groups.map((g, i) => {
      g.scale.multiplyScalar(fit)
      g.position.set(xs[i], 0, 0)
      g.rotation.y = yaws[i]
      this.scene.add(g)
      return { group: g, baseYaw: yaws[i], baseScale: g.scale.x }
    })

    for (const [i, m] of this._models.entries()) {
      box.setFromObject(m.group)
      const w = box.max.x - box.min.x

      const disc = this._shadows[i]
      disc.position.x = m.group.position.x
      const footprint = Math.max(w, box.max.z - box.min.z)
      disc.scale.setScalar(Math.max(footprint / 2.4, 0.5))
    }
    this._shadows.forEach((o, i) => { o.visible = i < this._models.length })
  }

  _disposeModels() {
    for (const { group } of this._models) {
      this.scene.remove(group)
      group.traverse((o) => o.geometry?.dispose?.())
      group.userData.disposables?.forEach((d) => d.dispose())
    }
    this._models.length = 0
  }

  _resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  _tick = () => {
    if (this.el.classList.contains('hidden')) return
    this._raf = requestAnimationFrame(this._tick)

    const now = performance.now()
    const dt = Math.min((now - this._lastMs) / 1000, 1 / 20)
    this._lastMs = now
    this._t += dt

    for (const [i, m] of this._models.entries()) {
      // Balanço suave em torno dos 45° + respiração vertical.
      m.group.rotation.y = m.baseYaw + Math.sin(this._t * 0.9 + i * 1.7) * 0.12
      m.group.position.y = Math.sin(this._t * 2.0 + i * 1.3) * 0.04 + 0.04
      // O próximo (i=1) pulsa de leve: convite para continuar evoluindo.
      if (i === 1) {
        m.group.scale.setScalar(m.baseScale * (1 + Math.sin(this._t * 2.4) * 0.025))
      }
      m.group.userData.animate?.(dt)
    }

    this.renderer.render(this.scene, this.camera)
  }
}
