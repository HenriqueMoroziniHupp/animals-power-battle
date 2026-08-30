import * as THREE from 'three'
import { additiveMat } from '../config/palette.js'
import { ObjectPool } from '../core/ObjectPool.js'

/**
 * Explosão do laser — bola de fogo realista, curta e compacta.
 *
 * Substitui a versão antiga (esfera + anel horizontal gigante), que a 10
 * tiros/s empilhava vários "Saturnos" amarelos e escondia o player e os mobs.
 *
 * O que mudou e por quê:
 *  - SEM anel/onda de choque. Era ele que criava o disco amarelo enorme
 *    (chegava a 2.9x o raio) e dominava a tela.
 *  - Vida curta (0.26s contra 0.62s). Com cooldown de 0.1s, a explosão some
 *    quase junto com a próxima, em vez de acumular ~6 na tela.
 *  - Bola de fogo feita de VÁRIOS blobs que sobem e se afastam um pouco,
 *    lembrando fumaça/fogo real em vez de uma esfera perfeita.
 *  - Escala máxima ~1.0x o raio (antes 1.55x), então a explosão fica contida
 *    no ponto de impacto.
 *  - Clarão branco de 1 frame, que é o que dá a sensação de "estouro".
 */

const BLOBS = 5
const SPARKS = 6

export class ExplosionFX {
  constructor(scene, max = 5) {
    this.scene = scene
    this.max = max

    // Icosaedro de detalhe 0: bem facetado, combina com o low-poly.
    const blobGeo = new THREE.IcosahedronGeometry(1, 0)
    const flashGeo = new THREE.IcosahedronGeometry(1, 0)
    const sparkGeo = new THREE.TetrahedronGeometry(0.16, 0)
    // Anel da onda de choque: SO aparece com o booster de ataque ativo.
    const ringGeo = new THREE.RingGeometry(0.6, 1, 20)

    this.pool = new ObjectPool(
      () => {
        const group = new THREE.Group()

        // Clarão branco inicial — só nos primeiros instantes.
        // .clone(): cada explosao precisa da PROPRIA opacidade. additiveMat()
        // devolve material compartilhado por cor — mutar .opacity nele faria
        // todas as explosoes desvanecerem juntas. Clonado 1x aqui (pool fixo),
        // entao nao ha alocacao durante o combate.
        const flash = new THREE.Mesh(flashGeo, additiveMat(0xffffff, 1).clone())
        group.add(flash)

        // Bola de fogo: blobs com direções e tons próprios.
        const blobs = []
        for (let i = 0; i < BLOBS; i++) {
          // Do centro (claro/quente) para fora (escuro/frio).
          const t = i / (BLOBS - 1)
          const color = t < 0.4 ? 0xffd24a : t < 0.75 ? 0xff8c2a : 0xd94a1a
          const m = new THREE.Mesh(blobGeo, additiveMat(color, 1).clone())
          group.add(m)
          blobs.push({ mesh: m, dir: new THREE.Vector3(), spin: 0, scale: 1 })
        }

        // Onda de choque "Saturno" — escondida por padrao, ligada em spawn()
        // quando o poder esta aumentado.
        const ring = new THREE.Mesh(ringGeo, additiveMat(0xffaa44, 0.8).clone())
        ring.rotation.x = -Math.PI / 2
        ring.visible = false
        group.add(ring)

        const sparks = []
        for (let i = 0; i < SPARKS; i++) {
          const s = new THREE.Mesh(sparkGeo, additiveMat(0xffc860, 1).clone())
          group.add(s)
          sparks.push({ mesh: s, vel: new THREE.Vector3() })
        }

        group.visible = false
        this.scene.add(group)
        return {
          group, flash, blobs, ring, sparks,
          boosted: false,
          life: 0,
          maxLife: 0.26,
          radius: 1,
        }
      },
      (item) => { item.group.visible = false; item.life = 0 },
      max,
    )
  }

  /**
   * @param {THREE.Vector3} pos
   * @param {number} radius raio aproximado da bola de fogo
   * @param {number} [power] multiplicador de ataque (1 = normal, >1 = booster).
   *   Acima de 1 a explosao ganha a onda de choque em anel, que cresce junto
   *   com o poder — feedback visual de que o booster esta ativo.
   */
  spawn(pos, radius = 2, power = 1) {
    if (this.pool.activeCount >= this.max) {
      // Recicla a mais antiga em vez de perder o efeito.
      const oldest = this.pool.active.values().next().value
      if (oldest) this.pool.release(oldest)
    }
    const it = this.pool.acquire()
    it.group.position.copy(pos)
    it.group.visible = true
    it.life = 0
    it.radius = radius
    it.power = power
    it.boosted = power > 1.01

    // Anel so existe com o poder aumentado.
    it.ring.visible = it.boosted
    if (it.boosted) {
      it.ring.material.opacity = 0.8
      it.ring.scale.setScalar(0.01)
    }

    it.flash.scale.setScalar(radius * 0.5)
    it.flash.material.opacity = 1

    for (let i = 0; i < it.blobs.length; i++) {
      const b = it.blobs[i]
      // Direção aleatória, mas com viés para CIMA — fogo sobe.
      b.dir.set(
        (Math.random() - 0.5) * 1.6,
        Math.random() * 0.9 + 0.25,
        (Math.random() - 0.5) * 1.6,
      ).normalize()
      // O primeiro blob fica no centro, ancorando a bola.
      if (i === 0) b.dir.multiplyScalar(0)
      b.spin = (Math.random() - 0.5) * 6
      b.scale = 0.55 + Math.random() * 0.5
      b.mesh.position.set(0, 0, 0)
      b.mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      b.mesh.scale.setScalar(0.01)
    }

    for (const s of it.sparks) {
      s.mesh.position.set(0, 0, 0)
      s.vel.set(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.1 + 0.4,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(radius * (3 + Math.random() * 2.5))
      s.mesh.scale.setScalar(1)
    }
  }

  update(dt) {
    for (const it of [...this.pool.active]) {
      it.life += dt
      const k = it.life / it.maxLife
      if (k >= 1) { this.pool.release(it); continue }

      const r = it.radius

      // Clarão: só no comecinho, some rápido (k=0.22).
      const fk = Math.min(1, k / 0.22)
      it.flash.material.opacity = Math.max(0, 1 - fk)
      it.flash.scale.setScalar(r * (0.5 + fk * 0.9))

      // Bola de fogo: expande rápido e desacelera (ease-out forte).
      const grow = 1 - Math.pow(1 - k, 4)
      for (const b of it.blobs) {
        // Afasta pouco do centro: mantém a explosão compacta.
        b.mesh.position.copy(b.dir).multiplyScalar(r * 0.55 * grow)
        b.mesh.scale.setScalar(Math.max(0.01, r * b.scale * (0.3 + grow * 0.7)))
        b.mesh.rotation.y += b.spin * dt
        // Desaparece na segunda metade da vida.
        b.mesh.material.opacity = Math.max(0, 1 - Math.pow(k, 1.6) * 1.35)
      }

      // Onda de choque (so com booster): expande rapido e some.
      // Mantem o tempo curto da animacao nova — o anel vive os mesmos 0.26s.
      if (it.boosted) {
        const ease = 1 - Math.pow(1 - k, 3)
        // Quanto maior o poder, maior o anel.
        const reach = 2.2 + (it.power - 1) * 1.8
        it.ring.scale.setScalar(r * (0.4 + ease * reach))
        it.ring.material.opacity = Math.max(0, 0.8 - k * 1.15)
      }

      // Faíscas com gravidade.
      for (const s of it.sparks) {
        s.mesh.position.addScaledVector(s.vel, dt)
        s.vel.y -= 14 * dt
        s.mesh.rotation.x += dt * 12
        s.mesh.scale.setScalar(Math.max(0.01, 1 - k))
        s.mesh.material.opacity = Math.max(0, 1 - k * 1.5)
      }
    }
  }
}
