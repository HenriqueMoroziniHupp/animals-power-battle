import * as THREE from 'three'
import { mat, CREATURE } from '../../config/palette.js'

/** Big Kong — forma final (nível 28). Bípede, braços enormes, dano brutal. */
export default {
  id: 'bigKong',
  name: 'Big Kong',
  minLevel: 28,
  scale: 1.7,
  radius: 1.5,
  speed: 10.0,
  baseHp: 1000,
  baseAtk: 105,
  colors: { body: 0x3a3540, belly: 0x8a7f6d, accent: 0x24202a },

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    // Tronco vertical (bípede)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.1, 1.4), body)
    torso.position.y = 2.3
    g.add(torso)

    // Peitoral claro
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.3), belly)
    chest.position.set(0, 2.5, 0.72)
    g.add(chest)

    // Ombros largos
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 1.3), body)
    shoulders.position.y = 3.2
    g.add(shoulders)

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.05), body)
    head.position.set(0, 3.95, 0.18)
    g.add(head)

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.66, 0.3), belly)
    face.position.set(0, 3.85, 0.72)
    g.add(face)

    const browRidge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.35), accent)
    browRidge.position.set(0, 4.24, 0.66)
    g.add(browRidge)

    const eyeGeo = new THREE.BoxGeometry(0.16, 0.16, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(0xffd166))
      eye.position.set(sx * 0.26, 4.02, 0.86)
      g.add(eye)
    }

    // Braços enormes que quase tocam o chão
    const armGeo = new THREE.BoxGeometry(0.62, 1.9, 0.62)
    const fistGeo = new THREE.BoxGeometry(0.8, 0.7, 0.8)
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, body)
      arm.position.set(sx * 1.5, 2.45, 0.1)
      g.add(arm)
      const fist = new THREE.Mesh(fistGeo, accent)
      fist.position.set(sx * 1.5, 1.4, 0.15)
      g.add(fist)
    }

    // Pernas curtas e grossas
    const legGeo = new THREE.BoxGeometry(0.75, 1.25, 0.8)
    const legs = []
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, accent)
      leg.position.set(sx * 0.56, 0.65, 0)
      g.add(leg)
      legs.push(leg)
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 1.1), belly)
      foot.position.set(sx * 0.56, 0.16, 0.24)
      g.add(foot)
    }

    // Presas
    const fangGeo = new THREE.ConeGeometry(0.1, 0.3, 3)
    for (const sx of [-1, 1]) {
      const f = new THREE.Mesh(fangGeo, mat(CREATURE.claw))
      f.rotation.x = Math.PI
      f.position.set(sx * 0.22, 3.6, 0.82)
      g.add(f)
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
    g.userData.biped = true
    return g
  },
}
