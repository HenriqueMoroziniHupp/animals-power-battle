import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Rinoceronte — o mais duro do jogo. Lento, blindado, carga devastadora. */
export default {
  id: 'rinoceronte',
  name: 'Rinoceronte',
  behavior: 'aggressive',
  hp: 560, atk: 52, speed: 7.0,
  visionRadius: 24, attackRange: 3.2, attackCooldown: 1.6,
  xp: 160, radius: 1.5, scale: 1,
  biomes: ['rocky'],

  build(biome, rng) {
    const g = new THREE.Group()
    const hide = mat(0x7d8288)
    const dark = mat(0x5a5f65)

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.25, 2.5), hide)
    body.position.y = 1.3
    g.add(body)

    // Placas dorsais
    for (let i = 0; i < 3; i++) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.22, 0.6), dark)
      plate.position.set(0, 1.98, 0.7 - i * 0.75)
      g.add(plate)
    }

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.1), hide)
    head.position.set(0, 1.32, 1.7)
    g.add(head)

    // Chifre grande + pequeno
    const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.85, 5), mat(CREATURE.horn))
    horn1.position.set(0, 1.85, 2.16)
    horn1.rotation.x = -0.32
    g.add(horn1)
    const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 5), mat(CREATURE.horn))
    horn2.position.set(0, 1.78, 1.66)
    horn2.rotation.x = -0.2
    g.add(horn2)

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), mat(0x2a2420))
      eye.position.set(sx * 0.36, 1.5, 2.06)
      g.add(eye)
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 6), dark)
      ear.position.set(sx * 0.34, 1.85, 1.36)
      g.add(ear)
    }

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.44, 0.85, 0.44)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, dark)
      l.position.set(sx * 0.56, 0.42, sz * 0.85)
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
