import * as THREE from 'three'
import { mat } from '../../config/palette.js'

/** Arbusto / plantação. Inflamável, barato de destruir, pouco EVO. */
export const BushProp = {
  id: 'bush',
  flammable: true,
  hp: 28,
  evo: 6,
  radius: 0.7,

  build(biome, rng) {
    const g = new THREE.Group()
    const scale = 0.7 + rng() * 0.5
    const c = biome.id === 'savanna' ? 0x8a9440 : biome.id === 'rocky' ? 0x5f7448 : 0x4f8f35

    const n = 2 + Math.floor(rng() * 2)
    for (let i = 0; i < n; i++) {
      const blob = new THREE.Mesh(
        new THREE.IcosahedronGeometry((0.42 + rng() * 0.3) * scale, 0),
        mat(i === 0 ? c : biome.ground.high),
      )
      blob.position.set(
        (rng() - 0.5) * 0.7 * scale,
        0.34 * scale + rng() * 0.2 * scale,
        (rng() - 0.5) * 0.7 * scale,
      )
      g.add(blob)
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
    const ash = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3 * scale, 0),
      mat(0x332c28),
    )
    ash.position.y = 0.2 * scale
    ash.scale.y = 0.4
    g.add(ash)
    return g
  },
}
export default BushProp
