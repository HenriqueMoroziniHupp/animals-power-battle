import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Coelho — neutro, fraco, rápido. Presa fácil do início. */
export default {
  id: 'coelho',
  name: 'Coelho',
  behavior: 'neutral',
  hp: 40, atk: 4, speed: 7.5,
  visionRadius: 14, attackRange: 1.6, attackCooldown: 1.4,
  xp: 14, radius: 0.55, scale: 1,
  biomes: ['forest'],

  build(biome, rng) {
    const g = new THREE.Group()
    const fur = mat(0xd8cfc0)
    const inner = mat(0xf0d8d8)

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.75), fur)
    body.position.y = 0.4
    g.add(body)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), fur)
    head.position.set(0, 0.66, 0.48)
    g.add(head)

    // Orelhas longas
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.06), fur)
      ear.position.set(sx * 0.12, 1.0, 0.44)
      ear.rotation.z = sx * 0.15
      g.add(ear)
      const ein = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.04), inner)
      ein.position.set(sx * 0.12, 1.0, 0.47)
      g.add(ein)
    }

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), mat(CREATURE.eye))
      eye.position.set(sx * 0.13, 0.72, 0.66)
      g.add(eye)
    }

    const tail = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat(0xffffff))
    tail.position.set(0, 0.46, -0.42)
    g.add(tail)

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.13, 0.24, 0.15)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, fur)
      l.position.set(sx * 0.18, 0.13, sz * 0.24)
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
