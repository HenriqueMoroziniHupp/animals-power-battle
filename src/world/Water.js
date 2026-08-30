import * as THREE from 'three'

/**
 * Corpos d'água: um plano translúcido no nível do bioma.
 * Sem shader próprio — só um leve ondular vertical, barato e suficiente
 * para o estilo low-poly.
 */
export class Water {
  constructor(biome, size, scene) {
    this.level = biome.water.level
    const geo = new THREE.PlaneGeometry(size, size, 1, 1)
    geo.rotateX(-Math.PI / 2)

    this.material = new THREE.MeshLambertMaterial({
      color: biome.water.color,
      transparent: true,
      opacity: 0.72,
      flatShading: true,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.position.y = this.level
    this.mesh.renderOrder = 1
    this.mesh.name = 'water'
    scene.add(this.mesh)

    this._t = 0
  }

  update(dt) {
    this._t += dt
    // Ondular sutil.
    this.mesh.position.y = this.level + Math.sin(this._t * 0.8) * 0.06
  }

  dispose() {
    this.mesh.parent?.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
