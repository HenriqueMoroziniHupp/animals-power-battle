import * as THREE from 'three'
import { Entity } from './Entity.js'
import { speciesForLevel, isEvolutionLevel } from './species/index.js'
import { BALANCE } from '../config/balance.js'

const TMP = new THREE.Vector3()

/**
 * O jogador: movimento no espaço da câmera, stats, EVO e evolução de espécie.
 */
export class Player extends Entity {
  constructor(scene, terrain, collision) {
    const species = speciesForLevel(1)
    super({
      position: new THREE.Vector3(0, 0, 0),
      radius: species.radius,
      hp: species.baseHp,
      solid: true,
    })

    this.scene = scene
    this.terrain = terrain
    this.collision = collision

    this.level = 1
    this.evo = 0
    this.evoNeeded = BALANCE.evoForLevel(1)
    this.totalEvo = 0
    this.kills = 0

    this.species = species
    this.maxHp = BALANCE.maxHpAt(1, species.baseHp)
    this.hp = this.maxHp
    this.atk = BALANCE.atkAt(1, species)

    this.facing = 0
    this.velocity = new THREE.Vector3()
    this.timeSinceHurt = 99
    this.invuln = 0
    this._walkPhase = 0
    /** Pulso de escala ao evoluir. */
    this._evoPulse = 0

    /** @type {Array<(e:object)=>void>} */
    this.listeners = []

    this.mesh = species.build()
    this.mesh.scale.setScalar(species.scale)
    this.scene.add(this.mesh)

    this.hitHeight = species.radius * 1.4
    this.collision.add(this)
    this._syncMesh()
  }

  on(fn) { this.listeners.push(fn) }
  _emit(type, data = {}) { for (const fn of this.listeners) fn({ type, ...data }) }

  // ---------------- movimento ----------------

  /**
   * @param {number} dt
   * @param {{x:number,z:number}} move eixo do input (-1..1)
   * @param {number} camYaw rotação da câmera
   */
  update(dt, move, camYaw) {
    this.timeSinceHurt += dt
    if (this.invuln > 0) this.invuln -= dt

    // Regeneração passiva depois de um tempo sem apanhar.
    if (this.timeSinceHurt > BALANCE.regenDelay && this.hp < this.maxHp) {
      this.heal(BALANCE.passiveRegen * dt * (this.maxHp / 100))
    }

    // Input relativo à câmera.
    // A câmera fica em target + (sin, cos)*dist, então:
    //   frente (W, move.z=-1) -> (-sin, -cos)  [para longe da câmera]
    //   direita (D, move.x=1) -> ( cos, -sin)  [90° horário a partir da frente]
    // Os dois eixos têm sinais DIFERENTES: negar ambos invertia o strafe.
    const sin = Math.sin(camYaw)
    const cos = Math.cos(camYaw)
    const wx = move.x * cos + move.z * sin
    const wz = -move.x * sin + move.z * cos

    const speed = this.species.speed
    const moving = Math.hypot(wx, wz) > 0.01

    if (moving) {
      this.position.x += wx * speed * dt
      this.position.z += wz * speed * dt
      // Vira suavemente para a direção do movimento.
      const targetFacing = Math.atan2(wx, wz)
      let diff = targetFacing - this.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.facing += diff * Math.min(1, 14 * dt)
      this._walkPhase += dt * speed * 0.9
    } else {
      this._walkPhase += dt * 1.6
    }

    this.terrain.clampToWorld(this.position)
    this.collision.refresh(this)
    this.collision.resolve(this)
    this.terrain.clampToWorld(this.position)

    if (this._evoPulse > 0) this._evoPulse -= dt

    this.updateFlash(dt)
    this._syncMesh(moving)
  }

  _syncMesh(moving = false) {
    const y = this.terrain.getHeightAt(this.position.x, this.position.z)
    this.position.y = y
    this.mesh.position.set(this.position.x, y, this.position.z)
    this.mesh.rotation.y = this.facing

    // Animação procedural: balanço do corpo + passos.
    const bob = moving ? Math.sin(this._walkPhase * 2) * 0.06 : Math.sin(this._walkPhase) * 0.02
    const pulse = this._evoPulse > 0 ? 1 + this._evoPulse * 0.5 : 1
    this.mesh.scale.setScalar(this.species.scale * pulse)
    this.mesh.position.y += bob * this.species.scale

    const legs = this.mesh.userData.legs
    if (legs && moving) {
      for (let i = 0; i < legs.length; i++) {
        const off = i % 2 === 0 ? 0 : Math.PI
        legs[i].rotation.x = Math.sin(this._walkPhase * 2 + off) * 0.5
      }
    } else if (legs) {
      for (const l of legs) l.rotation.x *= 0.85
    }
  }

  /** Ponto de origem dos ataques (boca/frente da criatura). */
  getMuzzle(out = new THREE.Vector3()) {
    const s = this.species.scale
    out.set(
      this.position.x + Math.sin(this.facing) * 1.6 * s,
      this.position.y + 1.2 * s,
      this.position.z + Math.cos(this.facing) * 1.6 * s,
    )
    return out
  }

  getForward(out = new THREE.Vector3()) {
    return out.set(Math.sin(this.facing), 0, Math.cos(this.facing)).normalize()
  }

  // ---------------- dano e EVO ----------------

  takeDamage(amount, source = null) {
    if (this.invuln > 0 || this.dead) return false
    this.invuln = BALANCE.hurtInvuln
    this.timeSinceHurt = 0
    const killed = super.takeDamage(amount, source)
    this._emit('hurt', { amount })
    if (killed) this._emit('death')
    return killed
  }

  /** @param {number} amount já multiplicado pelo booster de EVO. */
  addEvo(amount) {
    if (this.dead) return
    this.evo += amount
    this.totalEvo += amount
    this._emit('evo', { amount })

    while (this.evo >= this.evoNeeded) {
      this.evo -= this.evoNeeded
      this._levelUp()
    }
  }

  _levelUp() {
    this.level += 1
    this.evoNeeded = BALANCE.evoForLevel(this.level)

    const next = speciesForLevel(this.level)
    const evolved = next.id !== this.species.id
    if (evolved) this._changeSpecies(next)

    this.maxHp = BALANCE.maxHpAt(this.level, this.species.baseHp)
    this.hp = this.maxHp // level up cura por completo
    this.atk = BALANCE.atkAt(this.level, this.species)
    this._evoPulse = 0.45

    this._emit('levelup', {
      level: this.level,
      evolved,
      species: this.species,
      isEvolutionLevel: isEvolutionLevel(this.level),
    })
  }

  _changeSpecies(next) {
    this.collision.remove(this)

    this.mesh.parent?.remove(this.mesh)
    this.mesh.traverse((o) => { if (o.isMesh) o.geometry?.dispose?.() })

    this.species = next
    this.radius = next.radius
    this.hitHeight = next.radius * 1.4
    this.mesh = next.build()
    this.mesh.scale.setScalar(next.scale)
    this.scene.add(this.mesh)

    this.collision.add(this)
  }

  /**
   * Reinicia para uma nova partida, opcionalmente RETOMANDO um progresso.
   *
   * @param {{level?:number, evo?:number, totalEvo?:number, kills?:number}} [progresso]
   *   Sem argumento, começa do zero. Com ele, o jogador volta no nível salvo —
   *   é o que preserva o progresso ao morrer e ao recarregar a página.
   */
  reset(progresso = null) {
    const level = Math.max(1, Math.floor(progresso?.level ?? 1))
    const especie = speciesForLevel(level)
    if (especie.id !== this.species.id) this._changeSpecies(especie)

    this.level = level
    this.evoNeeded = BALANCE.evoForLevel(level)
    // O EVO parcial nunca pode exceder o necessário para o nível.
    this.evo = Math.min(Math.max(0, progresso?.evo ?? 0), this.evoNeeded)
    this.totalEvo = Math.max(0, progresso?.totalEvo ?? 0)
    this.kills = Math.max(0, Math.floor(progresso?.kills ?? 0))

    this.maxHp = BALANCE.maxHpAt(level, especie.baseHp)
    this.hp = this.maxHp
    this.atk = BALANCE.atkAt(level, especie)
    this.dead = false
    this.invuln = 0
    this.timeSinceHurt = 99
    this.position.set(0, 0, 0)
    this.facing = 0
    this.collision.refresh(this)
    this._syncMesh()
  }
}
