import forest from './forest.js'
import savanna from './savanna.js'
import rocky from './rocky.js'
import { BALANCE } from '../../config/balance.js'

export const BIOMES = { forest, savanna, rocky }

/** Bioma correspondente ao nível do player. */
export function biomeForLevel(level) {
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
