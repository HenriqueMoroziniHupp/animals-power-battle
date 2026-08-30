import * as THREE from 'three'

/**
 * Manchas de queimado deixadas no chão pelas explosões do laser.
 *
 * São planos horizontais pousados sobre o terreno, seguindo a inclinação
 * local. Ficam num pool circular de tamanho fixo: ao estourar o limite, a
 * mancha mais antiga é reaproveitada — assim o mapa nunca acumula geometria
 * infinita mesmo com 10 tiros por segundo.
 */
export class ScorchMarks {
  /**
   * @param {THREE.Scene} scene
   * @param {import('../world/Terrain.js').Terrain} terrain
   * @param {number} [max] quantas manchas simultâneas
   */
  constructor(scene, terrain, max = 48) {
    this.scene = scene
    this.terrain = terrain
    this.max = max
    this.index = 0

    // Textura procedural: um borrão radial escuro, sem arquivo de imagem.
    const tex = this._makeTexture()

    this.material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      // polygonOffset evita z-fighting com o terreno logo abaixo.
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      color: 0x000000,
    })

    const geo = new THREE.PlaneGeometry(1, 1)
    geo.rotateX(-Math.PI / 2)

    /** @type {THREE.Mesh[]} */
    this.marks = []
    for (let i = 0; i < max; i++) {
      const m = new THREE.Mesh(geo, this.material)
      m.visible = false
      m.renderOrder = 2
      this.scene.add(m)
      this.marks.push(m)
    }
  }

  _makeTexture() {
    const size = 64
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')

    // Gradiente radial: opaco no centro, transparente na borda.
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)')
    g.addColorStop(0.75, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)

    // Ruído para a borda não ficar um círculo perfeito.
    const img = ctx.getImageData(0, 0, size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 0.75 + Math.random() * 0.5
      img.data[i + 3] = Math.min(255, img.data[i + 3] * n)
    }
    ctx.putImageData(img, 0, 0)

    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  /**
   * Deixa uma mancha em (x, z), acompanhando a inclinação do terreno.
   * @param {THREE.Vector3} pos
   * @param {number} radius
   */
  spawn(pos, radius = 3) {
    const m = this.marks[this.index]
    this.index = (this.index + 1) % this.max

    const y = this.terrain.getHeightAt(pos.x, pos.z)
    m.position.set(pos.x, y + 0.06, pos.z)

    // Alinha o plano com a normal do terreno para não flutuar em encostas.
    const n = this.terrain.getNormalAt(pos.x, pos.z)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)
    // Gira aleatoriamente em torno da normal para não repetir o mesmo desenho.
    m.rotateY(Math.random() * Math.PI * 2)

    const s = radius * (0.55 + Math.random() * 0.3)
    m.scale.set(s, 1, s)
    m.visible = true
  }

  /** Reposiciona as manchas depois que o terreno muda (cratera/rebuild). */
  clear() {
    for (const m of this.marks) m.visible = false
    this.index = 0
  }

  dispose() {
    for (const m of this.marks) m.parent?.remove(m)
    this.marks[0]?.geometry.dispose()
    this.material.map?.dispose()
    this.material.dispose()
    this.marks.length = 0
  }
}
