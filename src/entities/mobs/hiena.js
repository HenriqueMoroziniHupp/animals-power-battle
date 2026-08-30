import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Hiena — agressiva, rápida, caça em bando pela savana. */
export default {
  id: 'hiena',
  name: 'Hiena',
  behavior: 'aggressive',
  hp: 180, atk: 22, speed: 9.2,
  visionRadius: 22, attackRange: 2.3, attackCooldown: 1.0,
  xp: 55, radius: 0.9, scale: 1,
  biomes: ['savanna', 'rocky'],

  build(biome, rng) {
    const g = new THREE.Group()
    const fur = mat(0xa8905c)
    const dark = mat(0x6b5a3c)
    const spot = mat(0x4a3f2c)

    // Dorso inclinado (frente mais alta)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 1.6), fur)
    body.position.set(0, 0.9, 0)
    body.rotation.x = -0.08
    g.add(body)

    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.8, 0.7), fur)
    shoulder.position.set(0, 1.05, 0.6)
    g.add(shoulder)

    // Manchas
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), spot)
      s.position.set((rng()-0.5)*0.7, 1.05 + (rng()-0.5)*0.4, (rng()-0.5)*1.3)
      g.add(s)
    }

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.7), fur)
    head.position.set(0, 1.2, 1.16)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.42), dark)
    snout.position.set(0, 1.08, 1.62)
    g.add(snout)

    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.08), dark)
      ear.position.set(sx * 0.24, 1.56, 1.06)
      g.add(ear)
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.06), mat(0xffcc44))
      eye.position.set(sx * 0.19, 1.3, 1.46)
      g.add(eye)
    }

    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 3), mat(CREATURE.claw))
    fang.rotation.x = Math.PI
    fang.position.set(0, 0.94, 1.76)
    g.add(fang)

    const legs = []
    const legGeo = new THREE.BoxGeometry(0.2, 0.62, 0.2)
    for (const sx of [-1, 1]) for (const sz of [1, -1]) {
      const l = new THREE.Mesh(legGeo, dark)
      l.position.set(sx * 0.32, 0.31, sz * 0.55)
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
