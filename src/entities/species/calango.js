import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Calango — a criatura inicial. Pequena, rápida, frágil. */
export default {
  id: 'calango',
  name: 'Calango',
  minLevel: 1,
  scale: 0.8,
  radius: 0.7,
  speed: 10.5,
  baseHp: 100,
  baseAtk: 10,
  colors: { body: 0x6fbf4a, belly: 0xd8e8a0, accent: 0x4a8f2f },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    // Tronco alongado
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 1.7), body)
    torso.position.y = 0.55
    g.add(torso)

    // Barriga clara
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 1.4), belly)
    under.position.y = 0.34
    g.add(under)

    // Cabeça
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.7), body)
    head.position.set(0, 0.72, 1.06)
    g.add(head)

    // Focinho
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.34), accent)
    snout.position.set(0, 0.64, 1.5)
    g.add(snout)

    // Olhos
    const eyeGeo = new THREE.BoxGeometry(0.13, 0.13, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(CREATURE.eye))
      eye.position.set(sx * 0.2, 0.86, 1.3)
      g.add(eye)
    }

    // Crista dorsal
    const spikeGeo = new THREE.ConeGeometry(0.11, 0.26, 4)
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(spikeGeo, accent)
      s.position.set(0, 0.86, 0.55 - i * 0.4)
      g.add(s)
    }

    // Cauda em segmentos
    const tailGeo = new THREE.BoxGeometry(0.3, 0.24, 0.5)
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(tailGeo, body)
      const k = i / 3
      t.position.set(0, 0.5 - k * 0.1, -0.95 - i * 0.42)
      t.scale.setScalar(1 - k * 0.35)
      g.add(t)
    }

    // Patas
    const legGeo = new THREE.BoxGeometry(0.2, 0.42, 0.2)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.44, 0.22, sz * 0.55)
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
