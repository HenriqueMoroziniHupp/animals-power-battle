/**
 * Terras Rochosas — bioma final (nível 22+).
 * Cinzas com topo esverdeado, relevo agressivo, os mobs mais fortes.
 */
export default {
  id: 'rocky',
  name: 'TERRAS ROCHOSAS',
  desc: 'Só os gigantes sobrevivem aqui.',

  sky: 0xa8b6c4,
  fogDensity: 0.016,
  hemiSky: 0xd6e2ee,
  hemiGround: 0x4a4f52,
  sunColor: 0xf0f4ff,
  sunIntensity: 1.95,

  ground: {
    low: 0x5c6360,    // rocha em sombra
    mid: 0x7b8480,    // rocha cinza
    high: 0x6f9152,   // topo esverdeado (musgo)
    rock: 0x8f9894,
    sand: 0xb8b09c,
  },

  terrain: {
    amplitude: 13.0,
    frequency: 0.032,
    octaves: 5,
  },

  water: { level: -6.0, color: 0x3f7d92 },

  props: {
    tree: 30,
    bush: 34,
    rock: 96,
    cactus: 14,
  },

  spawns: [
    { id: 'javali', weight: 2 },
    { id: 'hiena', weight: 2 },
    { id: 'leao', weight: 3 },
    { id: 'rinoceronte', weight: 3 },
  ],
}
