/**
 * Terras Rochosas — bioma final (nível 22+).
 * Cinzas com topo esverdeado, relevo agressivo, os mobs mais fortes.
 */
export default {
  id: 'rocky',
  name: 'MONTANHAS NEVADAS',
  desc: 'O reino congelado onde só os gigantes sobrevivem.',

  sky: 0x5baaf0,
  fogDensity: 0.0075,
  hemiSky: 0xe0f2fe,
  hemiGround: 0x8ba2b8,
  sunColor: 0xffffff,
  sunIntensity: 2.35,

  ground: {
    low: 0x526275,    // rocha escura fria nos vales e fendas
    mid: 0xd8e8f8,    // neve compacta / manto gélido
    high: 0xffffff,   // neve pura e brilhante nos picos e platôs
    rock: 0x3e4d5f,   // paredões escarpados de granito glacial
    sand: 0xc4dbef,   // gelo costeiro na beira d'água
  },

  terrain: {
    amplitude: 14.0,
    frequency: 0.030,
    octaves: 5,
  },

  water: { level: -6.0, color: 0x18a3c7 },

  props: {
    tree: 75,
    bush: 35,
    rock: 85,
    cactus: 0,
  },

  spawns: [
    { id: 'javali', weight: 2 },
    { id: 'hiena', weight: 2 },
    { id: 'leao', weight: 3 },
    { id: 'rinoceronte', weight: 3 },
  ],
}
