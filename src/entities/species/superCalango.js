import * as THREE from 'three'
import { mat, additiveMat, CREATURE } from '../../config/palette.js'

/**
 * Super Calango — a forma final (nível 34). O protagonista de volta, agora
 * como um dragão verde: maior que todas as outras espécies, escamas em
 * chamas vivas e dois canhões de laser, um de cada lado do corpo.
 *
 * As chamas usam UM material aditivo CLONADO (nunca o do cache — animar a
 * opacity do compartilhado piscaria o FlameAttack e os FX da mesma cor).
 * A animação roda via `g.userData.animate(dt)`, chamado por Player.update.
 */
export default {
  id: 'superCalango',
  name: 'Super Calango',
  minLevel: 34,
  scale: 1.35,
  radius: 1.0,
  speed: 10.5,
  baseHp: 1300,
  // Continuidade da escada (~10%/nível): 105 * 1.1^6 ≈ 186.
  baseAtk: 186,
  colors: { body: 0x4faf3a, belly: 0xd8e8a0, accent: 0x2f7a24 },
  /** Capability lida pelo Game: usa o DoubleLaserAttack no lugar do laser. */
  dualLasers: true,
  /** Spawn acelerado de mobs (BALANCE.surgeSpawn): mais alvos para o poder máximo. */
  spawnSurge: true,
  /** Deslocamento lateral dos canhões (unidades locais, × scale). */
  muzzleOffset: 0.7,
  /** Dragão é mais alto que o 1.2 padrão do getMuzzle. */
  muzzleHeight: 1.6,

  build() {
    const g = new THREE.Group()
    const body = mat(this.colors.body)
    const belly = mat(this.colors.belly)
    const accent = mat(this.colors.accent)

    // Tronco alongado
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 2.4), body)
    torso.position.y = 0.85
    g.add(torso)

    // Barriga clara
    const under = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.26, 2.0), belly)
    under.position.y = 0.52
    g.add(under)

    // Pescoço em dois degraus subindo
    const neckA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), body)
    neckA.position.set(0, 1.2, 1.35)
    g.add(neckA)
    const neckB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.5), body)
    neckB.position.set(0, 1.5, 1.7)
    g.add(neckB)

    // Cabeça com focinho alongado de dragão
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.8), body)
    head.position.set(0, 1.82, 2.05)
    g.add(head)
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.7), accent)
    snout.position.set(0, 1.7, 2.6)
    g.add(snout)

    // Narinas
    const nostrilGeo = new THREE.BoxGeometry(0.09, 0.09, 0.08)
    for (const sx of [-1, 1]) {
      const n = new THREE.Mesh(nostrilGeo, mat(CREATURE.eye))
      n.position.set(sx * 0.14, 1.82, 2.92)
      g.add(n)
    }

    // Olhos
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1)
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mat(CREATURE.eye))
      eye.position.set(sx * 0.26, 1.98, 2.42)
      g.add(eye)
    }

    // Chifres inclinados para trás
    const hornGeo = new THREE.ConeGeometry(0.1, 0.5, 4)
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(hornGeo, mat(CREATURE.horn))
      horn.position.set(sx * 0.26, 2.2, 1.8)
      horn.rotation.x = -0.7
      g.add(horn)
    }

    // Asas: dois segmentos finos por lado em "V" dobrado
    const wingInnerGeo = new THREE.BoxGeometry(1.1, 0.06, 0.55)
    const wingOuterGeo = new THREE.BoxGeometry(1.3, 0.05, 0.45)
    const wings = []
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(sx * 0.6, 1.35, 0.35)
      const inner = new THREE.Mesh(wingInnerGeo, accent)
      inner.position.set(sx * 0.5, 0.2, 0)
      inner.rotation.z = sx * 0.45
      pivot.add(inner)
      const outer = new THREE.Mesh(wingOuterGeo, accent)
      outer.position.set(sx * 1.15, 0.62, 0)
      outer.rotation.z = sx * -0.25
      pivot.add(outer)
      pivot.userData.side = sx
      g.add(pivot)
      wings.push(pivot)
    }

    // Crista dorsal (herança visual do calango, agora maior)
    const spikeGeo = new THREE.ConeGeometry(0.16, 0.42, 4)
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(spikeGeo, accent)
      s.position.set(0, 1.32 - i * 0.02, 0.95 - i * 0.5)
      g.add(s)
    }

    // Cauda em segmentos decrescentes + ponta em cone
    const tailGeo = new THREE.BoxGeometry(0.44, 0.36, 0.62)
    const tailLen = 4
    for (let i = 0; i < tailLen; i++) {
      const t = new THREE.Mesh(tailGeo, body)
      const k = i / tailLen
      t.position.set(0, 0.76 - k * 0.18, -1.4 - i * 0.52)
      t.scale.setScalar(1 - k * 0.4)
      g.add(t)
    }
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), accent)
    tailTip.rotation.x = -Math.PI / 2
    tailTip.position.set(0, 0.42, -3.55)
    g.add(tailTip)

    // Escamas: placas achatadas sobre dorso e flancos (estáticas, baratas)
    const scaleGeo = new THREE.BoxGeometry(0.3, 0.06, 0.34)
    const scaleSpots = [
      [-0.45, 1.28, 0.7], [0.45, 1.28, 0.7],
      [-0.45, 1.28, 0.1], [0.45, 1.28, 0.1],
      [-0.45, 1.28, -0.5], [0.45, 1.28, -0.5],
      [-0.28, 1.05, -1.5], [0.28, 1.05, -1.5],
      [-0.2, 0.88, -2.1], [0.2, 0.88, -2.1],
    ]
    for (const [x, y, z] of scaleSpots) {
      const sc = new THREE.Mesh(scaleGeo, accent)
      sc.position.set(x, y, z)
      g.add(sc)
    }

    // Chamas sobre as escamas: cones aditivos com UM material clonado.
    // noFlash: a piscada de dano não deve trocar esse material (aditivo,
    // sem emissive — a variante de flash ficaria errada e vazaria no cache).
    const flameMat = additiveMat(0xff8c2f, 0.9).clone()
    const flameGeo = new THREE.ConeGeometry(0.14, 0.4, 4)
    const flames = []
    const flameSpots = [
      [-0.45, 1.5, 0.7], [0.45, 1.5, 0.7],
      [-0.45, 1.5, 0.1], [0.45, 1.5, 0.1],
      [-0.45, 1.5, -0.5], [0.45, 1.5, -0.5],
      [-0.28, 1.26, -1.5], [0.28, 1.26, -1.5],
    ]
    for (const [x, y, z] of flameSpots) {
      const f = new THREE.Mesh(flameGeo, flameMat)
      f.position.set(x, y, z)
      f.userData.noFlash = true
      g.add(f)
      flames.push(f)
    }

    // Patas (nome `legs` é obrigatório: Player._syncMesh anima por ele)
    const legGeo = new THREE.BoxGeometry(0.32, 0.62, 0.32)
    const legs = []
    for (const sx of [-1, 1]) {
      for (const sz of [1, -1]) {
        const leg = new THREE.Mesh(legGeo, accent)
        leg.position.set(sx * 0.66, 0.32, sz * 0.8)
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

    // Animação das chamas e das asas — sem alocação por frame.
    let t = 0
    g.userData.animate = (dt) => {
      t += dt
      for (let i = 0; i < flames.length; i++) {
        const f = flames[i]
        f.scale.y = 1 + Math.sin(t * 7 + i * 1.7) * 0.35
        f.rotation.y = Math.sin(t * 3 + i) * 0.3
      }
      flameMat.opacity = 0.75 + Math.sin(t * 11) * 0.2
      for (const w of wings) {
        w.rotation.z = w.userData.side * Math.sin(t * 2) * 0.08
      }
    }
    // Materiais próprios (não do cache): descartados na troca de espécie.
    g.userData.disposables = [flameMat]
    return g
  },
}
