/**
 * Curvas de progressão e constantes de balanceamento.
 * Ponto único de ajuste do "feel" do jogo.
 */

export const BALANCE = {
  /** EVO necessário para sair do nível N para N+1. */
  evoForLevel(level) {
    return Math.round(90 * Math.pow(1.18, level - 1))
  },

  /** HP máximo no nível N, dado o baseHp da espécie atual. */
  maxHpAt(level, baseHp) {
    return Math.round(baseHp + (level - 1) * baseHp * 0.16)
  },

  /** ATK no nível N, dado o baseAtk da espécie atual. */
  atkAt(level, baseAtk) {
    return Math.round(baseAtk + (level - 1) * baseAtk * 0.22)
  },

  /** Chance de acerto crítico e seu multiplicador. */
  critChance: 0.15,
  critMultiplier: 1.5,

  /** Regeneração passiva de HP por segundo (recompensa por não apanhar). */
  passiveRegen: 0.6,
  /** Só regenera depois de N segundos sem tomar dano. */
  regenDelay: 5,

  /** Invulnerabilidade após tomar dano, em segundos. */
  hurtInvuln: 0.45,

  /** Boosters de monetização. */
  boosters: {
    attack: { duration: 120, multiplier: 1.2, maxStacks: 3 },
    evo: { duration: 120, multiplier: 2, maxStacks: 2 },
  },

  /** Níveis que disparam troca de bioma. */
  biomeThresholds: [
    { level: 1, biome: 'forest' },
    { level: 10, biome: 'savanna' },
    { level: 22, biome: 'rocky' },
  ],

  /** Orçamento de entidades vivas — segura o framerate no mobile. */
  maxActiveMobs: 40,
  maxActiveProps: 260,
  /** Distância além da qual um mob é reciclado (respawn em outro lugar). */
  mobRecycleDistance: 95,
  /** Anel de spawn ao redor do player: nunca nasce em cima nem longe demais. */
  spawnRing: { min: 28, max: 78 },

  /** Cap global de focos de incêndio simultâneos. */
  maxActiveFires: 22,
}

/** Ataques — números centralizados aqui para facilitar o balanceamento. */
export const ATTACKS = {
  laser: {
    id: 'laser',
    name: 'Laser',
    /** 0.1s = teto de 10 tiros/s enquanto o botão estiver segurado. */
    cooldown: 0.1,
    /** Multiplicador sobre o ATK do player. */
    damageMult: 1.0,
    /** Alcance máximo em unidades (clampado pela distância visível). */
    range: 35,
    /** Raio da explosão no ponto de impacto. */
    explosionRadius: 4.2,
    /** Fração do dano aplicada aos alvos pegos pela explosão (não o alvo direto). */
    splashMult: 0.55,
    /** Profundidade da cratera aberta no terreno. */
    craterDepth: 0.35,
    craterRadius: 2.2,
  },
  flame: {
    id: 'flame',
    name: 'Chamas',
    /** Contínuo: dano por tick enquanto segurado. */
    cooldown: 0.12,
    damageMult: 0.52,
    range: 7,
    /** Meio-ângulo do cone, em graus. */
    coneAngle: 25,
    /** Chance por tick de incendiar um prop inflamável atingido. */
    igniteChance: 0.5,
  },
}
