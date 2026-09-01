import calango from './calango.js'
import raposa from './raposa.js'
import lobo from './lobo.js'
import pantera from './pantera.js'
import urso from './urso.js'
import bigKong from './bigKong.js'
import superCalango from './superCalango.js'

/** Escada evolutiva, em ordem crescente de minLevel. */
export const SPECIES_LADDER = [calango, raposa, lobo, pantera, urso, bigKong, superCalango]

export const SPECIES = Object.fromEntries(SPECIES_LADDER.map((s) => [s.id, s]))

/** Espécie correspondente ao nível dado. */
export function speciesForLevel(level) {
  let chosen = SPECIES_LADDER[0]
  for (const s of SPECIES_LADDER) {
    if (level >= s.minLevel) chosen = s
  }
  return chosen
}

/** true se `level` é exatamente o nível de estreia de uma espécie (exceto a inicial). */
export function isEvolutionLevel(level) {
  return SPECIES_LADDER.some((s) => s.minLevel === level && s.minLevel > 1)
}
