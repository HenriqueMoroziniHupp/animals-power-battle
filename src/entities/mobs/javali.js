import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Javali — neutro mas perigoso quando provocado. Presas e carga. */
export default {
  id: 'javali',
  name: 'Javali',
  behavior: 'neutral',
  hp: 150, atk: 16, speed: 7.8,
  visionRadius: 18, attackRange: 2.2, attackCooldown: 1.1,
  xp: 42, radius: 0.95, scale: 1,
  biomes: ['forest', 'savanna', 'rocky'],

  build(biome, rng) {
    const g = new THREE.Group()
    const fur = mat(0x5a4636)
    const dark = mat(0x3c2e24)

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.6), fur)
    body.position.y = 0.78
    g.add(body)

    // Cachaço alto característico
    const hump = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.7), dark)
    hump.position.set(0, 1.24, 0.42)
    g.add(hump)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.58, 0.8), fur)
    head.position.set(0, 0.85, 1.14)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.32), dark)
    snout.position.set(0, 0.7, 1.6)
    g.add(snout)

    // Presas curvas
    for (const sx of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 3), mat(CREATURE.horn))
      tusk.position.set(sx * 0.18, 0.78, 1.66)
      tusk.rotation.set(-0.5, 0, sx * 0.25)
      g.add(tusk)
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), mat(0xff6b4a))
      eye.position.set(sx * 0.21, 1.0, 1.44)
      g.add(eye)
    }

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.22, 0.52, 0.22)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, dark)
      l.position.set(sx * 0.36, 0.26, sz * 0.55)
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
