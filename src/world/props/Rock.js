import * as THREE from 'three'
import { mat } from '../../config/palette.js'

/**
 * Pedra mineralável. NÃO é inflamável; bloqueia o laser e dá EVO ao quebrar.
 * É o principal recurso de EVO do jogo.
 */
export const RockProp = {
  id: 'rock',
  flammable: false,
  hp: 90,
  evo: 18,
  radius: 1.0,

  build(biome, rng) {
    const g = new THREE.Group()
    const scale = 0.7 + rng() * 0.8
    const base = biome.ground.rock

    const main = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8 * scale, 0),
      mat(base),
    )
    main.position.y = 0.55 * scale
    main.rotation.set(rng() * 3, rng() * 3, rng() * 3)
    main.scale.y = 0.75 + rng() * 0.4
    g.add(main)

    // Lascas menores ao redor
    const n = 1 + Math.floor(rng() * 2)
    for (let i = 0; i < n; i++) {
      const chip = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3 * scale, 0),
        mat(biome.id === 'rocky' ? 0x6f7874 : base),
      )
      chip.position.set(
        (rng() - 0.5) * 1.5 * scale,
        0.2 * scale,
        (rng() - 0.5) * 1.5 * scale,
      )
      chip.rotation.set(rng() * 3, rng() * 3, rng() * 3)
      g.add(chip)
    }

    // Veio mineral brilhante: sinaliza que dá EVO.
    const vein = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.22 * scale, 0),
      mat(0x4fc3f7, { emissive: 0x123d52 }),
    )
    vein.position.set(0, 0.95 * scale, 0.32 * scale)
    g.add(vein)

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
}
export default RockProp
