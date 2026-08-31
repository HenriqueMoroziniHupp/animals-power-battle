import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Pantera — 4ª forma (nível 16). Escura, musculosa, muito rápida. */
export default {
  id: 'pantera',
  name: 'Pantera',
  minLevel: 16,
  scale: 1.15,
  radius: 1.0,
  speed: 12.0,
  baseHp: 400,
  baseAtk: 44,
  colors: { body: 0x2f2b3a, belly: 0x50485f, accent: 0x1a1720 },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.0, 2.5), body)
    torso.position.y = 1.2
    g.add(torso)

    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, 1.0), body)
    shoulder.position.set(0, 1.35, 0.95)
    g.add(shoulder)

    const under = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 2.2), belly)
    under.position.y = 0.78
    g.add(under)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.82, 0.9), body)
    head.position.set(0, 1.72, 1.6)
    g.add(head)

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.5), accent)
    snout.position.set(0, 1.56, 2.12)
    g.add(snout)

    // Olhos felinos brilhantes
    const eyeGeo = new THREE.BoxGeometry(0.17, 0.1, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(0x9ef01a))
      eye.position.set(sx * 0.28, 1.86, 2.0)
      g.add(eye)
    }

    const earGeo = new THREE.ConeGeometry(0.2, 0.4, 4)
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, accent)
      ear.position.set(sx * 0.32, 2.22, 1.5)
      g.add(ear)
    }

    // Cauda longa curvada
    const tailGeo = new THREE.BoxGeometry(0.3, 0.3, 0.66)
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(tailGeo, body)
      const k = i / 4
      t.position.set(0, 1.25 + k * 0.42, -1.5 - i * 0.56)
      t.rotation.x = -0.3 - k * 0.35
      t.scale.setScalar(1 - k * 0.28)
      g.add(t)
    }

    // Garras
    const clawGeo = new THREE.ConeGeometry(0.06, 0.18, 3)
    const legGeo = new THREE.BoxGeometry(0.34, 0.88, 0.34)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.54, 0.46, sz * 0.85)
        g.add(leg)
        legs.push(leg)
        const claw = new THREE.Mesh(clawGeo, mat(CREATURE.claw))
        claw.rotation.x = Math.PI
        claw.position.set(sx * 0.54, 0.06, sz * 0.85 + 0.16)
        g.add(claw)
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
