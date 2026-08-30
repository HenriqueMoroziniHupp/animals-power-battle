/**
 * Savana — bioma intermediário (níveis 10-21).
 * Amarelos e terra avermelhada, relevo aberto, predadores de verdade.
 */
export default {
  id: 'savanna',
  name: 'SAVANA',
  desc: 'Predadores maiores. Recompensas maiores.',

  sky: 0xf2c98a,
  fogDensity: 0.013,
  hemiSky: 0xffe6b8,
  hemiGround: 0x8a5a2b,
  sunColor: 0xfff0c4,
  sunIntensity: 2.35,

  ground: {
    low: 0xa8762f,    // terra avermelhada nos vales
    mid: 0xd4a94a,    // capim seco
    high: 0xe8c96a,   // dunas ensolaradas
    rock: 0x9a7f5c,
    sand: 0xe6d4a0,
  },

  terrain: {
    amplitude: 7.0,
    frequency: 0.024,
    octaves: 3,
  },

  water: { level: -3.4, color: 0x4a9ab0 },

  props: {
    tree: 52,     // acácias esparsas
    bush: 46,
    rock: 40,
    cactus: 38,
  },

  spawns: [
    { id: 'capivara', weight: 2 },
    { id: 'javali', weight: 2 },
    { id: 'hiena', weight: 3 },
    { id: 'leao', weight: 2 },
  ],
}
