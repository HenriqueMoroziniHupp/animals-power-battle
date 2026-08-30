import coelho from './coelho.js'
import capivara from './capivara.js'
import javali from './javali.js'
import hiena from './hiena.js'
import leao from './leao.js'
import rinoceronte from './rinoceronte.js'

export const MOBS = { coelho, capivara, javali, hiena, leao, rinoceronte }

/**
 * Sorteia um id de mob segundo a tabela de pesos do bioma.
 * @param {object} biome
 * @param {() => number} rng
 */
export function pickMobFor(biome, rng) {
  const table = biome.spawns ?? []
  if (!table.length) return null
  let total = 0
  for (const e of table) total += e.weight
  let r = rng() * total
  for (const e of table) {
    r -= e.weight
    if (r <= 0) return e.id
  }
  return table[table.length - 1].id
}
