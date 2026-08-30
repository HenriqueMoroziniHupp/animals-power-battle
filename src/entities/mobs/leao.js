import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Leão — predador clássico da savana. Juba, alto dano, longa visão. */
export default {
  id: 'leao',
  name: 'Leão',
  behavior: 'aggressive',
  hp: 300, atk: 34, speed: 8.8,
  visionRadius: 26, attackRange: 2.8, attackCooldown: 1.2,
  xp: 90, radius: 1.15, scale: 1,
  biomes: ['savanna', 'rocky'],

  build(biome, rng) {
    const g = new THREE.Group()
    const fur = mat(0xd9a441)
    const mane = mat(0x8a5a24)
    const dark = mat(0xb07c30)

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 2.0), fur)
    body.position.y = 1.05
    g.add(body)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.78), fur)
    head.position.set(0, 1.45, 1.3)
    g.add(head)

    // Juba: anel de blocos ao redor da cabeça
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.26), mane)
      m.position.set(Math.cos(a) * 0.56, 1.45 + Math.sin(a) * 0.56, 1.16)
      m.rotation.z = a
      g.add(m)
    }

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.36), dark)
    snout.position.set(0, 1.32, 1.76)
    g.add(snout)

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), mat(0x2e2a1a))
      eye.position.set(sx * 0.2, 1.56, 1.66)
      g.add(eye)
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 3), mat(CREATURE.claw))
      fang.rotation.x = Math.PI
      fang.position.set(sx * 0.12, 1.14, 1.88)
      g.add(fang)
    }

    // Cauda com tufo
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.0), fur)
    tail.position.set(0, 1.2, -1.4)
    tail.rotation.x = -0.35
    g.add(tail)
    const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), mane)
    tuft.position.set(0, 1.42, -1.9)
    g.add(tuft)

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.28, 0.72, 0.28)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, dark)
      l.position.set(sx * 0.42, 0.36, sz * 0.7)
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
