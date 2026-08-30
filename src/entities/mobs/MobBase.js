import * as THREE from 'three'
import { Entity } from '../Entity.js'

const TMP = new THREE.Vector3()

/** Estados da IA. */
export const MOB_STATE = {
  IDLE: 'idle',
  WANDER: 'wander',
  CHASE: 'chase',
  ATTACK: 'attack',
  FLEE: 'flee',
}

/**
 * Máquina de estados compartilhada por todos os mobs.
 * Cada arquivo de mob só declara dados + build(); o comportamento vem daqui.
 *
 * behavior:
 *  - 'neutral'    vagueia; só persegue depois de ser atacado
 *  - 'aggressive' persegue quem entrar no raio de visão
 */
export class Mob extends Entity {
  /**
   * @param {object} def definição do mob (ver entities/mobs/*.js)
   * @param {THREE.Vector3} position
   * @param {object} ctx { scene, terrain, collision, biome, rng }
   */
  constructor(def, position, ctx) {
    super({
      position,
      radius: def.radius,
      hp: def.hp,
      solid: true,
    })

    this.def = def
    this.name = def.name
    this.behavior = def.behavior
    this.atk = def.atk
    this.speed = def.speed
    this.visionRadius = def.visionRadius
    this.attackRange = def.attackRange
    this.evoValue = def.xp

    this.terrain = ctx.terrain
    this.collision = ctx.collision
    this.scene = ctx.scene
    this.rng = ctx.rng

    this.state = MOB_STATE.IDLE
    this.stateTime = 0
    this.facing = this.rng() * Math.PI * 2
    this.attackCooldown = 0
    /** Alvo do wander. */
    this._wanderTarget = new THREE.Vector3()
    this._walkPhase = this.rng() * 10
    /** Quem provocou este mob (neutros só perseguem depois de apanhar). */
    this.aggroSource = null
    this.aggroTimer = 0

    this.mesh = def.build(ctx.biome ?? null, this.rng)
    this.scaleFactor = def.scale ?? 1
    this.mesh.scale.setScalar(this.scaleFactor)
    this.mesh.position.copy(position)
    this.scene.add(this.mesh)

    this.hitHeight = this.radius * 1.5
    this._pickWanderTarget()
  }

  _pickWanderTarget() {
    const ang = this.rng() * Math.PI * 2
    const dist = 6 + this.rng() * 14
    this._wanderTarget.set(
      this.position.x + Math.cos(ang) * dist,
      0,
      this.position.z + Math.sin(ang) * dist,
    )
    this.terrain.clampToWorld(this._wanderTarget, 16)
  }

  _setState(s) {
    if (this.state === s) return
    this.state = s
    this.stateTime = 0
  }

  /** Neutros entram em fúria ao levar dano. */
  onDamage(amount, source) {
    if (source && this.behavior === 'neutral') {
      this.aggroSource = source
      this.aggroTimer = 12
      this._setState(MOB_STATE.CHASE)
    }
  }

  /**
   * @param {number} dt
   * @param {object} player
   * @param {object} combat sistema de combate (para aplicar dano)
   */
  update(dt, player, combat) {
    if (this.dead) return

    this.stateTime += dt
    if (this.attackCooldown > 0) this.attackCooldown -= dt
    if (this.aggroTimer > 0) {
      this.aggroTimer -= dt
      if (this.aggroTimer <= 0) this.aggroSource = null
    }

    const distToPlayer = Math.hypot(
      player.position.x - this.position.x,
      player.position.z - this.position.z,
    )

    this._think(dt, player, distToPlayer, combat)
    this._move(dt)
    this.updateFlash(dt)
    this._syncMesh()
  }

  _think(dt, player, dist, combat) {
    const lowHp = this.hpPercent < 0.2
    const provoked = this.aggroSource === player

    switch (this.state) {
      case MOB_STATE.IDLE:
        if (this.stateTime > 1 + this.rng() * 2) {
          this._pickWanderTarget()
          this._setState(MOB_STATE.WANDER)
        }
        if (this._shouldChase(dist, provoked)) this._setState(MOB_STATE.CHASE)
        break

      case MOB_STATE.WANDER: {
        const d = Math.hypot(
          this._wanderTarget.x - this.position.x,
          this._wanderTarget.z - this.position.z,
        )
        if (d < 1.5 || this.stateTime > 8) this._setState(MOB_STATE.IDLE)
        if (this._shouldChase(dist, provoked)) this._setState(MOB_STATE.CHASE)
        break
      }

      case MOB_STATE.CHASE:
        // Neutros fogem quando muito feridos; agressivos lutam até o fim.
        if (lowHp && this.behavior === 'neutral') {
          this._setState(MOB_STATE.FLEE)
          break
        }
        if (dist <= this.attackRange) {
          this._setState(MOB_STATE.ATTACK)
        } else if (!this._shouldChase(dist, provoked) && dist > this.visionRadius * 1.6) {
          this.aggroSource = null
          this._setState(MOB_STATE.IDLE)
        }
        break

      case MOB_STATE.ATTACK:
        if (dist > this.attackRange * 1.25) {
          this._setState(MOB_STATE.CHASE)
          break
        }
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.def.attackCooldown ?? 1.2
          combat?.mobAttackPlayer(this, player)
        }
        break

      case MOB_STATE.FLEE:
        if (this.stateTime > 5 || dist > this.visionRadius * 1.5) {
          this._setState(MOB_STATE.IDLE)
        }
        break
    }
  }

  _shouldChase(dist, provoked) {
    if (this.behavior === 'aggressive') return dist < this.visionRadius
    return provoked && dist < this.visionRadius * 1.8
  }

  _move(dt) {
    let tx = null
    let tz = null
    let speed = this.speed

    switch (this.state) {
      case MOB_STATE.WANDER:
        tx = this._wanderTarget.x
        tz = this._wanderTarget.z
        speed *= 0.45
        break
      case MOB_STATE.CHASE:
        if (this.aggroSource || this.behavior === 'aggressive') {
          tx = this._chaseX
          tz = this._chaseZ
        }
        break
      case MOB_STATE.FLEE:
        tx = this.position.x - (this._chaseX - this.position.x)
        tz = this.position.z - (this._chaseZ - this.position.z)
        speed *= 1.15
        break
    }

    if (tx !== null && tz !== null) {
      const dx = tx - this.position.x
      const dz = tz - this.position.z
      const d = Math.hypot(dx, dz)
      if (d > 0.05) {
        this.position.x += (dx / d) * speed * dt
        this.position.z += (dz / d) * speed * dt
        const target = Math.atan2(dx, dz)
        let diff = target - this.facing
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        this.facing += diff * Math.min(1, 8 * dt)
        this._walkPhase += dt * speed * 0.85
      }
    }

    this.terrain.clampToWorld(this.position, 10)
    this.collision.refresh(this)
    this.collision.resolve(this)
  }

  /** O Game injeta a posição do player antes do update (evita acoplamento). */
  setChaseTarget(x, z) {
    this._chaseX = x
    this._chaseZ = z
  }

  _syncMesh() {
    const y = this.terrain.getHeightAt(this.position.x, this.position.z)
    this.position.y = y
    this.mesh.position.set(this.position.x, y, this.position.z)
    this.mesh.rotation.y = this.facing

    const moving = this.state === MOB_STATE.WANDER || this.state === MOB_STATE.CHASE || this.state === MOB_STATE.FLEE
    const bob = moving ? Math.sin(this._walkPhase * 2) * 0.05 : 0
    this.mesh.position.y += bob * this.scaleFactor

    const legs = this.mesh.userData.legs
    if (legs && moving) {
      for (let i = 0; i < legs.length; i++) {
        const off = i % 2 === 0 ? 0 : Math.PI
        legs[i].rotation.x = Math.sin(this._walkPhase * 2 + off) * 0.45
      }
    }
  }
}
