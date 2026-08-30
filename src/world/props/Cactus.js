import * as THREE from 'three'
import { mat } from '../../config/palette.js'

/**
 * Cacto. Recurso que devolve VIDA ao ser destruído (não EVO), o que dá ao
 * jogador uma forma de se curar no meio da savana.
 */
export const CactusProp = {
  id: 'cactus',
  flammable: true,
  hp: 45,
  evo: 5,
  /** Cura concedida ao destruir. */
  heal: 22,
  radius: 0.65,

  build(biome, rng) {
    const g = new THREE.Group()
    const scale = 0.8 + rng() * 0.6
    const c = 0x4f8f4a
    const bodyH = 1.9 * scale

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3 * scale, 0.34 * scale, bodyH, 7),
      mat(c),
    )
    body.position.y = bodyH / 2
    g.add(body)

    // Braços laterais
    const arms = Math.floor(rng() * 3)
    for (let i = 0; i < arms; i++) {
      const side = i % 2 === 0 ? 1 : -1
      const h = 0.75 * scale
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17 * scale, 0.19 * scale, h, 6),
        mat(c),
      )
      arm.position.set(side * 0.42 * scale, bodyH * (0.5 + rng() * 0.25), 0)
      arm.rotation.z = side * -0.9
      g.add(arm)
      const up = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * scale, 0.17 * scale, h * 0.9, 6),
        mat(c),
      )
      up.position.set(side * 0.66 * scale, bodyH * (0.5 + rng() * 0.25) + h * 0.42, 0)
      g.add(up)
    }

    // Florzinha no topo
    if (rng() > 0.5) {
      const flower = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16 * scale, 0),
        mat(0xff6b81),
      )
      flower.position.y = bodyH + 0.1 * scale
      g.add(flower)
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

  buildBurnt(scale = 1) {
    const g = new THREE.Group()
    const stump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 * scale, 0.32 * scale, 0.5 * scale, 7),
      mat(0x33291f),
    )
    stump.position.y = 0.25 * scale
    g.add(stump)
    return g
  },
}
export default CactusProp
