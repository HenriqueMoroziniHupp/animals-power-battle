import * as THREE from 'three'
import { getDefaultFov } from '../ui/ZoomSlider.js'

/**
 * Dono do renderer, da cena, da câmera e das luzes.
 * Também centraliza o ajuste de qualidade (alta/baixa) usado pelo menu.
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'default',
      stencil: false,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Sombras estáticas: só re-renderiza quando o sol se move (ver update()).
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()

    this.baseFov = getDefaultFov()
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.5,
      400,
    )
    this.camera.position.set(0, 14, 18)

    // Sol direcional — a fonte das sombras suaves.
    this.sun = new THREE.DirectionalLight(0xffffff, 2.1)
    this.sun.position.set(38, 56, 24)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 160
    this.sun.shadow.bias = -0.0012
    this.sun.shadow.normalBias = 0.02
    const s = 60
    this.sun.shadow.camera.left = -s
    this.sun.shadow.camera.right = s
    this.sun.shadow.camera.top = s
    this.sun.shadow.camera.bottom = -s
    this.scene.add(this.sun)
    // O alvo do sol acompanha o player (definido em update()).
    this.scene.add(this.sun.target)

    // Luz de preenchimento céu/chão: dá o visual vibrante do low-poly.
    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x6b5a3e, 1.0)
    this.scene.add(this.hemi)

    this.isTouch = window.matchMedia('(pointer: coarse)').matches
    this.quality = this.isTouch ? 'low' : 'high'
    this.applyQuality(this.quality)

    // Prevenção de perda permanente de contexto WebGL (essencial em mobile e trocas de aba)
    this._onContextLost = (e) => {
      e.preventDefault()
      console.warn('[SceneManager] WebGL context lost - prevenção ativada para permitir restauração.')
    }
    this._onContextRestored = () => {
      console.log('[SceneManager] WebGL context restored - reconfigurando renderizador.')
      const w = Math.max(1, window.innerWidth)
      const h = Math.max(1, window.innerHeight)
      this.renderer.setSize(w, h)
      this.renderer.shadowMap.needsUpdate = true
      this.applyQuality(this.quality)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
    }
    this.canvas.addEventListener('webglcontextlost', this._onContextLost, false)
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored, false)

    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize)
    window.addEventListener('orientationchange', this._onResize)
  }

  /** Aplica a paleta do bioma: cor do céu, fog e tom das luzes. */
  applyBiome(biome) {
    const sky = new THREE.Color(biome.sky)
    this.scene.background = sky
    this.scene.fog = new THREE.FogExp2(sky.getHex(), biome.fogDensity ?? 0.012)
    this.hemi.color.set(biome.hemiSky ?? biome.sky)
    this.hemi.groundColor.set(biome.hemiGround ?? 0x6b5a3e)
    this.sun.color.set(biome.sunColor ?? 0xffffff)
    this.sun.intensity = biome.sunIntensity ?? 2.1
  }

  /**
   * 'high' = pixelRatio até 1.5 e shadow map 1024.
   * 'low'  = pixelRatio até 1.0 e shadow map 512 (mobile).
   */
  applyQuality(quality) {
    this.quality = quality
    const maxDpr = quality === 'high' ? 1.5 : 1.0
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))

    const size = quality === 'high' ? 1024 : 512
    if (this.sun.shadow.mapSize.width !== size) {
      this.sun.shadow.mapSize.set(size, size)
      // Força a recriação do shadow map na próxima renderização.
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose()
        this.sun.shadow.map = null
      }
    }
  }

  /**
   * Mantém o frustum de sombra centrado no player.
   *
   * O shadow map só é re-renderizado quando o sol realmente se move: seguir o
   * player todo frame invalidava o mapa a cada quadro, dobrando o custo de
   * desenho (passe de profundidade + passe de cor) sem ganho visual.
   */
  update(focusPos) {
    if (!focusPos) return
    const d = this._lastShadowFocus
      ? Math.hypot(focusPos.x - this._lastShadowFocus.x, focusPos.z - this._lastShadowFocus.z)
      : Infinity

    if (d > 6) {
      this.sun.target.position.copy(focusPos)
      this.sun.target.updateMatrixWorld()
      this.sun.position.set(focusPos.x + 38, focusPos.y + 56, focusPos.z + 24)
      this._lastShadowFocus = { x: focusPos.x, z: focusPos.z }
      this.renderer.shadowMap.needsUpdate = true
    }
  }

  /** Campo de visão (graus): usado pelo slider de zoom no mobile. */
  setFov(fov) {
    if (!Number.isFinite(fov) || fov <= 0) return
    this.baseFov = fov
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.applyQuality(this.quality)
  }

  render() {
    // Evita tentar renderizar em contexto WebGL perdido
    try {
      if (this.renderer.getContext()?.isContextLost()) return
      this.renderer.render(this.scene, this.camera)
    } catch (err) {
      console.warn('[SceneManager] Falha no frame de renderização:', err)
    }
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this._onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('orientationchange', this._onResize)
    this.renderer.dispose()
  }
}
