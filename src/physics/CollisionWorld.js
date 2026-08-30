import * as THREE from 'three'

/**
 * Colisão leve por esferas sobre um uniform grid.
 *
 * Não usamos Cannon/Rapier de propósito: o jogo é de solo, sem empilhamento
 * nem rotação de corpos, então esfera-esfera + heightmap resolve tudo por
 * uma fração do custo de CPU e sem KB extra no bundle.
 */

const CELL = 8

export class CollisionWorld {
  constructor(terrain) {
    this.terrain = terrain
    /** @type {Map<string, Set<object>>} célula -> corpos */
    this.cells = new Map()
    /** @type {Set<object>} todos os corpos registrados */
    this.bodies = new Set()
  }

  _key(cx, cz) {
    return `${cx},${cz}`
  }

  _cellOf(x, z) {
    return [Math.floor(x / CELL), Math.floor(z / CELL)]
  }

  /**
   * Registra um corpo. O objeto precisa expor `position` (THREE.Vector3),
   * `radius` (number) e `solid` (boolean).
   */
  add(body) {
    if (this.bodies.has(body)) return
    this.bodies.add(body)
    body._cellKey = null
    this.refresh(body)
  }

  remove(body) {
    if (!this.bodies.delete(body)) return
    if (body._cellKey != null) {
      const set = this.cells.get(body._cellKey)
      if (set) {
        set.delete(body)
        if (set.size === 0) this.cells.delete(body._cellKey)
      }
      body._cellKey = null
    }
  }

  /** Reposiciona o corpo no grid se ele mudou de célula. */
  refresh(body) {
    const [cx, cz] = this._cellOf(body.position.x, body.position.z)
    const key = this._key(cx, cz)
    if (key === body._cellKey) return

    if (body._cellKey != null) {
      const old = this.cells.get(body._cellKey)
      if (old) {
        old.delete(body)
        if (old.size === 0) this.cells.delete(body._cellKey)
      }
    }
    let set = this.cells.get(key)
    if (!set) {
      set = new Set()
      this.cells.set(key, set)
    }
    set.add(body)
    body._cellKey = key
  }

  /**
   * Corpos nas 9 células ao redor de (x,z), dentro de `range`.
   * @param {(body:object)=>boolean} [filter]
   * @returns {object[]}
   */
  query(x, z, range, filter = null) {
    const out = []
    const [cx, cz] = this._cellOf(x, z)
    const span = Math.max(1, Math.ceil(range / CELL))

    for (let dz = -span; dz <= span; dz++) {
      for (let dx = -span; dx <= span; dx++) {
        const set = this.cells.get(this._key(cx + dx, cz + dz))
        if (!set) continue
        for (const b of set) {
          if (b.dead) continue
          if (filter && !filter(b)) continue
          const d = Math.hypot(b.position.x - x, b.position.z - z)
          if (d <= range + b.radius) out.push(b)
        }
      }
    }
    return out
  }

  /**
   * Empurra `body` para fora de todos os corpos sólidos que ele penetra.
   * Resolve no plano XZ (o Y é ditado pelo terreno).
   */
  resolve(body) {
    if (!body.solid) return
    const near = this.query(
      body.position.x,
      body.position.z,
      body.radius + 4,
      (b) => b !== body && b.solid,
    )

    for (const other of near) {
      const dx = body.position.x - other.position.x
      const dz = body.position.z - other.position.z
      const minDist = body.radius + other.radius
      let d = Math.hypot(dx, dz)

      if (d >= minDist) continue

      // Degenerado (centros coincidentes): empurra numa direção qualquer.
      if (d < 1e-4) {
        body.position.x += minDist
        continue
      }
      const push = (minDist - d) / d
      // Props estáticos não se movem: o corpo dinâmico absorve todo o empurrão.
      if (other.static) {
        body.position.x += dx * push
        body.position.z += dz * push
      } else {
        body.position.x += dx * push * 0.5
        body.position.z += dz * push * 0.5
        other.position.x -= dx * push * 0.5
        other.position.z -= dz * push * 0.5
      }
    }
  }

  /**
   * Marcha um raio pelo grid e devolve o primeiro corpo sólido atingido.
   * Mais barato e previsível que THREE.Raycaster contra centenas de meshes,
   * e nos dá controle sobre o passo.
   *
   * @param {THREE.Vector3} origin
   * @param {THREE.Vector3} dir normalizado
   * @param {number} maxDist
   * @param {(b:object)=>boolean} [filter]
   * @returns {{body:object|null, point:THREE.Vector3, distance:number, hitTerrain:boolean}}
   */
  raymarch(origin, dir, maxDist, filter = null) {
    const step = 0.5
    const point = new THREE.Vector3()
    const steps = Math.ceil(maxDist / step)

    for (let i = 1; i <= steps; i++) {
      const dist = Math.min(i * step, maxDist)
      point.copy(dir).multiplyScalar(dist).add(origin)

      // Bateu no chão?
      const groundY = this.terrain.getHeightAt(point.x, point.z)
      if (point.y <= groundY) {
        point.y = groundY
        return { body: null, point, distance: dist, hitTerrain: true }
      }

      // Bateu em alguém?
      const near = this.query(point.x, point.z, step + 2.5, filter)
      for (const b of near) {
        const dx = point.x - b.position.x
        const dz = point.z - b.position.z
        const dy = point.y - (b.position.y + (b.hitHeight ?? b.radius))
        // Cápsula grosseira: generoso em Y, preciso em XZ.
        if (Math.hypot(dx, dz) <= b.radius && Math.abs(dy) <= (b.hitHeight ?? b.radius) + 1.2) {
          return { body: b, point, distance: dist, hitTerrain: false }
        }
      }
    }

    point.copy(dir).multiplyScalar(maxDist).add(origin)
    return { body: null, point, distance: maxDist, hitTerrain: false }
  }

  clear() {
    this.cells.clear()
    this.bodies.clear()
  }
}
