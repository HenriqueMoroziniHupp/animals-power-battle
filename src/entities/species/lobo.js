import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Lobo — 3ª forma (nível 10). Peito largo, presas à mostra. */
export default {
  id: 'lobo',
  name: 'Lobo',
  minLevel: 10,
  scale: 1.25,
  radius: 1.1,
  speed: 11.0,
  baseHp: 260,
  baseAtk: 28,
  colors: { body: 0x7d8794, belly: 0xd5dbe2, accent: 0x4a525c },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 2.2), body)
    torso.position.y = 1.05
    g.add(torso)

    // Peitoral mais alto
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.9, 0.9), body)
    chest.position.set(0, 1.15, 0.85)
    g.add(chest)

    const under = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.26, 1.9), belly)
    under.position.y = 0.68
    g.add(under)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.85), body)
    head.position.set(0, 1.5, 1.4)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), accent)
    snout.position.set(0, 1.36, 1.95)
    g.add(snout)

    // Presas
    const fangGeo = new THREE.ConeGeometry(0.07, 0.22, 3)
    for (const sx of [-1, 1]) {
      const f = new THREE.Mesh(fangGeo, mat(CREATURE.claw))
      f.rotation.x = Math.PI
      f.position.set(sx * 0.15, 1.2, 2.12)
      g.add(f)
    }

    const earGeo = new THREE.ConeGeometry(0.22, 0.5, 4)
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, accent)
      ear.position.set(sx * 0.3, 2.0, 1.24)
      g.add(ear)
    }

    const eyeGeo = new THREE.BoxGeometry(0.15, 0.12, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(0xffd166))
      eye.position.set(sx * 0.26, 1.64, 1.76)
      g.add(eye)
    }

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.3), body)
    tail.position.set(0, 1.15, -1.6)
    tail.rotation.x = -0.42
    g.add(tail)

    const legGeo = new THREE.BoxGeometry(0.3, 0.78, 0.3)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.5, 0.4, sz * 0.75)
        g.add(leg)
        legs.push(leg)
      }
    }

    // Só o corpo principal projeta sombra (ver nota nos props).
    let first = true
    g.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = first
      o.receiveShadow = true
      first = false
    })
    g.userData.legs = legs
    return g
  },
}
