import forest from './forest.js'
import savanna from './savanna.js'
import rocky from './rocky.js'
import { BALANCE } from '../../config/balance.js'

export const BIOMES = {
  forest,
  savanna,
  rocky,
  // Marco final (nível 34): a MESMA floresta (mesmo id → mesma seed de
  // terreno em Game._rebuildWorld), só o card de apresentação muda.
  forestFinal: {
    ...forest,
    name: 'FLORESTA ANCESTRAL',
    desc: 'De volta ao lar. Agora como Super Calango.',
  },
}

/** Bioma correspondente ao nível do player (suporta override ?biome=rocky na URL para debug/testes). */
export function biomeForLevel(level) {
  if (typeof window !== 'undefined' && window.location?.search) {
    const override = new URLSearchParams(window.location.search).get('biome')
    if (override && BIOMES[override]) return BIOMES[override]
  }
  let chosen = BALANCE.biomeThresholds[0]
  for (const t of BALANCE.biomeThresholds) {
    if (level >= t.level) chosen = t
  }
  return BIOMES[chosen.biome]
}

/** true se `level` é exatamente um marco de troca de bioma. */
export function isBiomeThreshold(level) {
  return BALANCE.biomeThresholds.some((t) => t.level === level && t.level > 1)
}
