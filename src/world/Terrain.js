import * as THREE from 'three'

/**
 * Terreno poligonal gerado por ruído.
 *
 * IMPORTANTE — fonte única de verdade:
 * o array `heights` é gerado primeiro e a malha é deslocada amostrando esse
 * mesmo array. O ruído nunca é calculado duas vezes. Assim `getHeightAt()`
 * (usado por player, mobs e câmera) concorda exatamente com o que se vê,
 * e as crateras funcionam mutando o array e reenviando os vértices afetados.
 *
 * Convenção de eixos: a PlaneGeometry nasce no plano XY e é rotacionada
 * -PI/2 em X, o que leva o +Y local para o -Z do mundo. Indexamos o array
 * direto em espaço de mundo para que essa conversão exista num lugar só.
 */

/** PRNG determinístico (mulberry32) — mesmo seed, mesmo mundo. */
function makeRng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Value noise 2D com interpolação suave, sobre um grid de gradientes aleatórios. */
class ValueNoise {
  constructor(seed) {
    const rng = makeRng(seed)
    this.size = 256
    this.table = new Float32Array(this.size * this.size)
    for (let i = 0; i < this.table.length; i++) this.table[i] = rng()
  }

  _at(ix, iy) {
    const s = this.size
    const x = ((ix % s) + s) % s
    const y = ((iy % s) + s) % s
    return this.table[y * s + x]
  }

  /** @returns {number} 0..1 */
  sample(x, y) {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = x - x0
    const fy = y - y0
    // smoothstep
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)

    const a = this._at(x0, y0)
    const b = this._at(x0 + 1, y0)
    const c = this._at(x0, y0 + 1)
    const d = this._at(x0 + 1, y0 + 1)

    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
  }

  /** Ruído fractal (soma de oitavas). @returns {number} -1..1 aprox. */
  fbm(x, y, octaves) {
    let sum = 0
    let amp = 1
    let freq = 1
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += this.sample(x * freq, y * freq) * amp
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return (sum / norm) * 2 - 1
  }
}

export class Terrain {
  /**
   * @param {object} biome definição do bioma (ver world/biomes/)
   * @param {number} [seed]
   * @param {number} [size] lado do mundo em unidades
   * @param {number} [segments] resolução da malha
   */
  constructor(biome, seed = 1337, size = 200, segments = 96) {
    this.size = size
    this.segments = segments
    this.half = size / 2
    /** Espaçamento entre vértices, em unidades de mundo. */
    this.step = size / segments
    this.seed = seed

    this.noise = new ValueNoise(seed)
    this.biome = biome

    const n = segments + 1
    this.gridN = n
    /** Heightmap em espaço de mundo, indexado [iz * n + ix]. */
    this.heights = new Float32Array(n * n)

    /** Crateras nunca descem abaixo disto (ver makeCrater). */
    this._craterFloor = (biome.water?.level ?? -99) + 0.8

    this._generateHeights()
    this._buildMesh()
  }

  // ---------- índices ----------

  /** Converte x de mundo → índice de coluna (float). */
  _ixOf(x) { return (x + this.half) / this.step }
  /** Converte z de mundo → índice de linha (float). */
  _izOf(z) { return (z + this.half) / this.step }
  /** Converte índice de coluna → x de mundo. */
  _xOf(ix) { return ix * this.step - this.half }
  /** Converte índice de linha → z de mundo. */
  _zOf(iz) { return iz * this.step - this.half }

  _generateHeights() {
    const { amplitude, frequency, octaves } = this.biome.terrain
    const n = this.gridN

    for (let iz = 0; iz < n; iz++) {
      const z = this._zOf(iz)
      for (let ix = 0; ix < n; ix++) {
        const x = this._xOf(ix)
        let h = this.noise.fbm(x * frequency, z * frequency, octaves) * amplitude

        // Bacia suave no centro: garante uma área jogável plana no spawn.
        const d = Math.hypot(x, z)
        const flatten = Math.min(1, Math.max(0, (d - 6) / 14))
        h *= flatten

        // Borda elevada: "parede" natural que contém o player no mapa.
        const edge = Math.max(Math.abs(x), Math.abs(z)) / this.half
        if (edge > 0.78) {
          const t = (edge - 0.78) / 0.22
          h += t * t * 16
        }

        this.heights[iz * n + ix] = h
      }
    }
  }

  _buildMesh() {
    const n = this.gridN
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments)
    geo.rotateX(-Math.PI / 2) // XY -> XZ; +Y local vira -Z do mundo

    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      // Amostra o MESMO array que getHeightAt usa — nunca recalcula o ruído.
      const ix = Math.round(this._ixOf(x))
      const iz = Math.round(this._izOf(z))
      const h = this.heights[iz * n + ix]
      pos.setY(i, h)
    }

    geo.computeVertexNormals()
    this._paintVertexColors(geo, colors)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.geometry = geo
    this.material = new THREE.MeshLambertMaterial({
      flatShading: true,
      vertexColors: true,
    })

    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.receiveShadow = true
    this.mesh.castShadow = false
    this.mesh.name = 'terrain'
  }

  /** Colore cada vértice por altura e inclinação, usando a rampa do bioma. */
  _paintVertexColors(geo, colors) {
    const g = this.biome.ground
    const cLow = new THREE.Color(g.low)
    const cMid = new THREE.Color(g.mid)
    const cHigh = new THREE.Color(g.high)
    const cRock = new THREE.Color(g.rock)
    const cSand = new THREE.Color(g.sand)
    const waterLevel = this.biome.water?.level ?? -99

    const pos = geo.attributes.position
    const nrm = geo.attributes.normal
    const tmp = new THREE.Color()
    const amp = this.biome.terrain.amplitude

    for (let i = 0; i < pos.count; i++) {
      const h = pos.getY(i)
      // Inclinação: normal.y == 1 é plano, 0 é vertical.
      const slope = 1 - nrm.getY(i)

      // Rampa centrada em h=0 (altura tipica do terreno): abaixo vai para
      // `low`, acima para `high`, com `mid` dominando o meio. Normalizar por
      // `amp` mantem a proporcao de cores igual em todos os biomas.
      const t = Math.min(1, Math.max(0, (h + amp * 0.55) / (amp * 1.1)))
      if (t < 0.5) tmp.copy(cLow).lerp(cMid, t / 0.5)
      else tmp.copy(cMid).lerp(cHigh, (t - 0.5) / 0.5)

      // Encostas íngremes viram rocha.
      if (slope > 0.22) {
        tmp.lerp(cRock, Math.min(1, (slope - 0.22) / 0.4))
      }
      // Faixa de areia junto à água — a largura acompanha a amplitude do
      // bioma, senão terrenos mais acidentados ficam quase todos "de areia".
      const sandBand = Math.max(0.6, amp * 0.10)
      if (h < waterLevel + sandBand) {
        tmp.lerp(cSand, Math.min(1, (waterLevel + sandBand - h) / (sandBand * 1.4)))
      }

      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
  }

  // ---------- consulta ----------

  /**
   * Altura do terreno em (x, z) por interpolação bilinear. O(1).
   * Chamado todo frame pelo player, por cada mob e pela câmera.
   */
  getHeightAt(x, z) {
    const n = this.gridN
    let fx = this._ixOf(x)
    let fz = this._izOf(z)

    // Fora do mapa: devolve a borda mais próxima.
    fx = Math.min(n - 1.001, Math.max(0, fx))
    fz = Math.min(n - 1.001, Math.max(0, fz))

    const ix = Math.floor(fx)
    const iz = Math.floor(fz)
    const tx = fx - ix
    const tz = fz - iz

    const h00 = this.heights[iz * n + ix]
    const h10 = this.heights[iz * n + ix + 1]
    const h01 = this.heights[(iz + 1) * n + ix]
    const h11 = this.heights[(iz + 1) * n + ix + 1]

    const a = h00 * (1 - tx) + h10 * tx
    const b = h01 * (1 - tx) + h11 * tx
    return a * (1 - tz) + b * tz
  }

  /** Normal aproximada do terreno em (x,z), por diferenças finitas. */
  getNormalAt(x, z, out = new THREE.Vector3()) {
    const e = this.step
    const hL = this.getHeightAt(x - e, z)
    const hR = this.getHeightAt(x + e, z)
    const hD = this.getHeightAt(x, z - e)
    const hU = this.getHeightAt(x, z + e)
    return out.set(hL - hR, 2 * e, hD - hU).normalize()
  }

  /**
   * Mantém uma posição dentro dos limites jogáveis.
   *
   * A margem precisa ser MAIOR que o início da parede de borda (78% de `half`,
   * ver _generateHeights). Com margem pequena o player subia a parede e via
   * além do mapa — só o plano d'água, tela metade azul.
   */
  clampToWorld(v, margin = 26) {
    const lim = this.half - margin
    v.x = Math.min(lim, Math.max(-lim, v.x))
    v.z = Math.min(lim, Math.max(-lim, v.z))
    return v
  }

  // ---------- destruição (cratera) ----------

  /**
   * Rebaixa o terreno num raio, criando uma cratera.
   * Muta `heights` (fonte de verdade) e reenvia só os vértices afetados,
   * de modo que a colisão e o visual continuam concordando.
   *
   * @returns {boolean} true se algum vértice mudou
   */
  makeCrater(x, z, radius, depth) {
    const n = this.gridN
    const minIx = Math.max(0, Math.floor(this._ixOf(x - radius)))
    const maxIx = Math.min(n - 1, Math.ceil(this._ixOf(x + radius)))
    const minIz = Math.max(0, Math.floor(this._izOf(z - radius)))
    const maxIz = Math.min(n - 1, Math.ceil(this._izOf(z + radius)))
    if (minIx > maxIx || minIz > maxIz) return false

    let changed = false
    for (let iz = minIz; iz <= maxIz; iz++) {
      const wz = this._zOf(iz)
      for (let ix = minIx; ix <= maxIx; ix++) {
        const wx = this._xOf(ix)
        const d = Math.hypot(wx - x, wz - z)
        if (d > radius) continue
        // Perfil suave (cosseno): fundo no centro, borda intacta.
        const falloff = 0.5 + 0.5 * Math.cos((d / radius) * Math.PI)
        const vi = iz * n + ix
        // Piso da cratera: nunca cava abaixo da água. Sem isso, o disparo
        // contínuo (10/s) afundava o terreno abaixo do nível d'água e a rampa
        // de cor pintava tudo de AREIA, criando manchas amarelas enormes.
        const newH = this.heights[vi] - depth * falloff
        if (newH < this._craterFloor) {
          if (this.heights[vi] <= this._craterFloor) continue
          this.heights[vi] = this._craterFloor
        } else {
          this.heights[vi] = newH
        }
        changed = true
      }
    }
    if (changed) this._refreshRegion(minIx, maxIx, minIz, maxIz)
    return changed
  }

  /**
   * Reenvia posição/normal/cor apenas da região afetada.
   * A geometria da PlaneGeometry tem exatamente gridN x gridN vértices na
   * mesma ordem de linhas, então o índice do vértice coincide com o do
   * heightmap — o que torna a atualização parcial direta.
   */
  _refreshRegion(minIx, maxIx, minIz, maxIz) {
    const n = this.gridN
    const pos = this.geometry.attributes.position

    for (let iz = minIz; iz <= maxIz; iz++) {
      for (let ix = minIx; ix <= maxIx; ix++) {
        const vi = iz * n + ix
        pos.setY(vi, this.heights[vi])
      }
    }
    pos.needsUpdate = true

    // O laser dispara ate 10x/s, entao NAO da para recalcular normais e
    // repintar os ~9.4k vertices a cada cratera. Marcamos como sujo e o
    // trabalho pesado acontece no maximo algumas vezes por segundo, em
    // flushCraters(), acumulando a regiao afetada.
    this._dirty = this._dirty
      ? {
          minIx: Math.min(this._dirty.minIx, minIx),
          maxIx: Math.max(this._dirty.maxIx, maxIx),
          minIz: Math.min(this._dirty.minIz, minIz),
          maxIz: Math.max(this._dirty.maxIz, maxIz),
        }
      : { minIx, maxIx, minIz, maxIz }
  }

  /**
   * Aplica o trabalho pesado das crateras acumuladas (normais + cores).
   * Chamado pelo Game no maximo algumas vezes por segundo.
   * @returns {boolean} true se havia algo pendente
   */
  flushCraters() {
    if (!this._dirty) return false
    this._dirty = null

    // computeVertexNormals precisa da malha inteira para as normais das bordas
    // ficarem corretas, mas agora roda no maximo ~4x/s em vez de 10x/s.
    this.geometry.computeVertexNormals()
    const colors = this.geometry.attributes.color.array
    this._paintVertexColors(this.geometry, colors)
    this.geometry.attributes.color.needsUpdate = true
    return true
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
