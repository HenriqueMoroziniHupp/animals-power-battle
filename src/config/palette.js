import * as THREE from 'three'

/**
 * Cache global de materiais por cor.
 * Todos os props/mobs/espécies compartilham materiais — isso mantém o número
 * total de materiais na casa das dezenas em vez de milhares, o que é o que
 * segura o framerate no mobile.
 */
const materialCache = new Map()

/**
 * Material Lambert flat-shaded compartilhado para a cor dada.
 * @param {number} color hex, ex.: 0x7ec850
 * @param {{emissive?: number, transparent?: boolean, opacity?: number}} [opts]
 * @returns {THREE.MeshLambertMaterial}
 */
export function mat(color, opts = {}) {
  const key = `${color}|${opts.emissive ?? 0}|${opts.transparent ?? false}|${opts.opacity ?? 1}`
  let m = materialCache.get(key)
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      emissive: opts.emissive ?? 0x000000,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    })
    materialCache.set(key, m)
  }
  return m
}

/** Material aditivo (usado por FX: laser, chamas, explosão). */
export function additiveMat(color, opacity = 1) {
  const key = `add|${color}|${opacity}`
  let m = materialCache.get(key)
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    materialCache.set(key, m)
  }
  return m
}

/**
 * Versão "piscada de dano" de um material, também compartilhada.
 *
 * Como os materiais são compartilhados entre entidades, NUNCA mutamos
 * `material.emissive` para piscar — isso acenderia todas as criaturas da
 * mesma cor de uma vez. Em vez disso trocamos a *referência* do material
 * durante a piscada e restauramos depois: barato e sem alocação.
 *
 * @param {THREE.Material} base
 * @returns {THREE.Material}
 */
export function flashVariantOf(base) {
  const key = `flash|${base.uuid}`
  let m = materialCache.get(key)
  if (!m) {
    m = base.clone()
    m.emissive = new THREE.Color(0x992222)
    m.color = new THREE.Color(0xffdddd)
    materialCache.set(key, m)
  }
  return m
}

export function disposeMaterialCache() {
  for (const m of materialCache.values()) m.dispose()
  materialCache.clear()
}

/** Paleta compartilhada por criaturas (independente de bioma). */
export const CREATURE = {
  eye: 0x14181c,
  eyeShine: 0xffffff,
  claw: 0xf0e6d2,
  tongue: 0xff6b81,
  horn: 0xe8dcc0,
}
