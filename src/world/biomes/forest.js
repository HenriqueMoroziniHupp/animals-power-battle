/**
 * Floresta — bioma inicial (níveis 1-9).
 * Verdes saturados, relevo suave, muita árvore e pouca pedra.
 */
export default {
  id: 'forest',
  name: 'FLORESTA',
  desc: 'Verde, densa e cheia de presas fáceis.',

  // Céu e iluminação
  sky: 0x8fd4ef,
  fogDensity: 0.011,
  hemiSky: 0xcdeeff,
  hemiGround: 0x3f5a2a,
  sunColor: 0xfff6e0,
  sunIntensity: 2.1,

  // Rampa de cor do terreno por altura (baixo → alto)
  ground: {
    low: 0x4f7a34,    // grama em sombra / vales
    mid: 0x6fa843,    // grama viva
    high: 0x8fc75a,   // topos ensolarados
    rock: 0x7d8a76,   // encostas íngremes
    sand: 0xd9c48a,   // margem d'água
  },

  // Relevo
  terrain: {
    amplitude: 9.0,
    frequency: 0.030,
    octaves: 4,
  },

  water: { level: -4.2, color: 0x3aa6c9 },

  // Densidade de props (contagens-alvo no mundo)
  props: {
    tree: 150,
    bush: 70,
    rock: 26,
    cactus: 0,
  },

  // Mobs que nascem aqui e seu peso relativo de spawn
  spawns: [
    { id: 'coelho', weight: 3 },
    { id: 'capivara', weight: 2 },
    { id: 'javali', weight: 2 },
  ],
}
