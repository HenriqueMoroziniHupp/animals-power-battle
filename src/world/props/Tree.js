import * as THREE from 'three'
import { mat } from '../../config/palette.js'

/**
 * Árvore poligonal. Inflamável — as chamas a incendeiam e ela vira toco.
 * A forma varia por bioma: conífera na floresta, acácia (copa achatada) na
 * savana, retorcida nas rochosas.
 */
export const TreeProp = {
  id: 'tree',
  flammable: true,
  hp: 60,
  evo: 12,
  radius: 1.0,

  /**
   * @param {object} biome
   * @param {() => number} rng
   */
  build(biome, rng) {
    const g = new THREE.Group()
    const trunkColor = biome.id === 'rocky' ? 0x3d3027 : 0x6b4a2f
    const leafBase = biome.ground.high

    const scale = 0.85 + rng() * 0.55
    const trunkH = 2.2 * scale

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, trunkH, 5),
      mat(trunkColor),
    )
    trunk.position.y = trunkH / 2
    g.add(trunk)

    if (biome.id === 'savanna') {
      // Acácia: copa larga e achatada.
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7 * scale, 1.1 * scale, 0.5 * scale, 7),
        mat(0x6f8f3a),
      )
      canopy.position.y = trunkH + 0.2 * scale
      g.add(canopy)
      const canopy2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1 * scale, 0.7 * scale, 0.4 * scale, 6),
        mat(0x82a344),
      )
      canopy2.position.y = trunkH + 0.6 * scale
      g.add(canopy2)
    } else if (biome.id === 'rocky') {
      // Pinheiro nevado: cones empilhados com camadas de neve fresca no topo.
      for (let i = 0; i < 3; i++) {
        const r = (1.3 - i * 0.32) * scale
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(r, 1.45 * scale, 6),
          mat(i === 2 ? 0xf8fbff : i === 1 ? 0xcbe3f5 : 0x294957),
        )
        cone.position.y = trunkH + 0.35 * scale + i * 0.85 * scale
        g.add(cone)
      }
    } else {
      // Conífera: cones empilhados.
      for (let i = 0; i < 3; i++) {
        const r = (1.35 - i * 0.34) * scale
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(r, 1.5 * scale, 6),
          mat(i === 0 ? 0x3f6b2a : i === 1 ? leafBase : 0x8fc75a),
        )
        cone.position.y = trunkH + 0.35 * scale + i * 0.85 * scale
        g.add(cone)
      }
    }

    // Só o volume principal projeta sombra: com centenas de props, cada mesh
    // que projeta custa uma draw call extra no passe de profundidade.
    let first = true
    g.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = first
      o.receiveShadow = true
      first = false
    })
    g.userData.scaleFactor = scale
    return g
  },

  /** Versão queimada: só o tronco carbonizado. */
  buildBurnt(scale = 1) {
    const g = new THREE.Group()
    const trunkH = 1.5 * scale
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, trunkH, 5),
      mat(0x2a2320),
    )
    trunk.position.y = trunkH / 2
    trunk.castShadow = true
    g.add(trunk)
    return g
  },
}
export default TreeProp
