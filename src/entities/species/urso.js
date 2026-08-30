import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Urso — 5ª forma (nível 22). Massivo, lento, muito resistente. */
export default {
  id: 'urso',
  name: 'Urso',
  minLevel: 22,
  scale: 1.85,
  radius: 1.6,
  speed: 9.5,
  baseHp: 640,
  baseAtk: 66,
  colors: { body: 0x6b4a2f, belly: 0x9c7b52, accent: 0x4a3220 },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 2.6), body)
    torso.position.y = 1.5
    g.add(torso)

    // Corcunda característica
    const hump = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.2), body)
    hump.position.set(0, 2.4, 0.6)
    g.add(hump)

    const under = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 2.2), belly)
    under.position.y = 0.95
    g.add(under)

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 1.0), body)
    head.position.set(0, 2.05, 1.72)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.55), belly)
    snout.position.set(0, 1.86, 2.28)
    g.add(snout)

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.14), accent)
    nose.position.set(0, 1.92, 2.58)
    g.add(nose)

    // Orelhas redondas
    const earGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 6)
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, accent)
      ear.rotation.x = Math.PI / 2
      ear.position.set(sx * 0.42, 2.6, 1.6)
      g.add(ear)
    }

    const eyeGeo = new THREE.BoxGeometry(0.13, 0.13, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(CREATURE.eye))
      eye.position.set(sx * 0.28, 2.2, 2.2)
      g.add(eye)
    }

    const clawGeo = new THREE.ConeGeometry(0.09, 0.26, 3)
    const legGeo = new THREE.BoxGeometry(0.5, 0.95, 0.5)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.66, 0.5, sz * 0.88)
        g.add(leg)
        legs.push(leg)
        for (let c = -1; c <= 1; c++) {
          const claw = new THREE.Mesh(clawGeo, mat(CREATURE.claw))
          claw.rotation.x = Math.PI
          claw.position.set(sx * 0.66 + c * 0.14, 0.06, sz * 0.88 + 0.24)
          g.add(claw)
        }
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
