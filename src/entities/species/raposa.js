import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Raposa — 2ª forma (nível 5). Ágil, orelhas grandes, cauda farta. */
export default {
  id: 'raposa',
  name: 'Raposa',
  minLevel: 5,
  scale: 1.0,
  radius: 0.9,
  speed: 11.5,
  baseHp: 165,
  baseAtk: 17,
  colors: { body: 0xe08030, belly: 0xf5e6d0, accent: 0x2e2a28 },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 1.9), body)
    torso.position.y = 0.85
    g.add(torso)

    const under = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.22, 1.6), belly)
    under.position.y = 0.56
    g.add(under)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.72), body)
    head.position.set(0, 1.12, 1.16)
    g.add(head)

    // Focinho pontudo
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.6, 4), belly)
    snout.rotation.x = Math.PI / 2
    snout.position.set(0, 1.02, 1.66)
    g.add(snout)

    // Orelhas triangulares
    const earGeo = new THREE.ConeGeometry(0.2, 0.46, 4)
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, body)
      ear.position.set(sx * 0.26, 1.6, 1.0)
      g.add(ear)
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 4), accent)
      inner.position.set(sx * 0.26, 1.58, 1.06)
      g.add(inner)
    }

    const eyeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(CREATURE.eye))
      eye.position.set(sx * 0.23, 1.26, 1.44)
      g.add(eye)
    }

    // Cauda farta com ponta clara
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.1), body)
    tail.position.set(0, 0.95, -1.35)
    tail.rotation.x = -0.3
    g.add(tail)
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.4), belly)
    tip.position.set(0, 1.12, -1.95)
    g.add(tip)

    const legGeo = new THREE.BoxGeometry(0.24, 0.62, 0.24)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.42, 0.32, sz * 0.62)
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
