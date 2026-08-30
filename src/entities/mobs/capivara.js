import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Capivara — neutra, resistente, lenta. Bom XP para o risco. */
export default {
  id: 'capivara',
  name: 'Capivara',
  behavior: 'neutral',
  hp: 110, atk: 9, speed: 5.5,
  visionRadius: 15, attackRange: 2.0, attackCooldown: 1.5,
  xp: 30, radius: 0.85, scale: 1,
  biomes: ['forest', 'savanna'],

  build(biome, rng) {
    const g = new THREE.Group()
    const fur = mat(0x9c7248)
    const dark = mat(0x6f4f30)

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.5), fur)
    body.position.y = 0.62
    g.add(body)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.68), fur)
    head.position.set(0, 0.78, 1.02)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.3), dark)
    snout.position.set(0, 0.68, 1.42)
    g.add(snout)

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.06), mat(CREATURE.eye))
      eye.position.set(sx * 0.2, 0.92, 1.3)
      g.add(eye)
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.07), dark)
      ear.position.set(sx * 0.24, 1.06, 0.92)
      g.add(ear)
    }

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.22, 0.4, 0.22)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, dark)
      l.position.set(sx * 0.32, 0.2, sz * 0.5)
      g.add(l); legs.push(l)
    }

    // Só o corpo principal projeta sombra (ver nota nos props).
    let first = true
    g.traverse(o => {
      if (!o.isMesh) return
      o.castShadow = first
      o.receiveShadow = true
      first = false
    })
    g.userData.legs = legs
    return g
  },
}
