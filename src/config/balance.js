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

  /**
   * ATK no nível N, dada a espécie atual.
   *
   * Conta só os níveis ganhos DENTRO da espécie: o baseAtk de cada espécie
   * já embute o poder acumulado até seu nível de estreia (a escada foi
   * desenhada a ~10%/nível — urso no 27 dá 99, Big Kong estreia com 105).
   * Multiplicar pelo nível global contava esse crescimento duas vezes:
   * o Big Kong estreava com ATK ~729 e matava qualquer mob com um tiro.
   */
  atkAt(level, species) {
    const levelsInSpecies = Math.max(0, level - species.minLevel)
    return Math.round(species.baseAtk * (1 + levelsInSpecies * 0.1))
  },

  /**
   * Dano de um mob contra o player, escalado pelo nível do player.
   *
   * O HP do player cresce ~16%/nível (mais os saltos de evolução), mas o
   * `atk` de cada mob é uma constante fixa no arquivo da espécie — sem essa
   * escala o dano relativo de um mob despenca conforme o player sobe de
   * nível dentro do mesmo bioma, e o jogo fica cada vez mais fácil.
   */
  mobAtkAt(mobBaseAtk, playerLevel) {
    return Math.round(mobBaseAtk * (1 + (playerLevel - 1) * 0.14))
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
    attack: { duration: 120, multiplier: 1.5, maxStacks: 3 },
    evo: { duration: 120, multiplier: 2, maxStacks: 2 },
  },

  /** Níveis que disparam troca de bioma. */
  biomeThresholds: [
    { level: 1, biome: 'forest' },
    { level: 10, biome: 'savanna' },
    { level: 22, biome: 'rocky' },
    // Marco final: concluiu as rochosas, volta ao lar — e fica nele para
    // sempre (biomeForLevel pega o ÚLTIMO threshold alcançado).
    { level: 34, biome: 'forestFinal' },
  ],

  /** Orçamento de entidades vivas — segura o framerate no mobile. */
  maxActiveMobs: 40,
  /** Intervalo entre tentativas de spawn de mob, em segundos. */
  mobSpawnInterval: 0.8,
  /**
   * Spawn acelerado para espécies com `spawnSurge` (Super Calango): a
   * explosão máxima limpa grupos inteiros num tiro, então o mundo precisa
   * repor mobs bem mais rápido para manter a pressão — e o espetáculo.
   */
  surgeSpawn: { interval: 0.25, maxActiveMobs: 50 },
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

    /**
     * Auxílio de mira: o tiro corrige em direção a mobs que passariam perto.
     * Sem isso é preciso mirar quase exatamente no bicho, o que fica bem
     * difícil quando ele está se movendo e te atacando.
     */
    /**
     * Auxílio de mira que DECAI COM A DISTÂNCIA: forte de perto, fraco de longe.
     *
     * Cuidado com a geometria: um cone de ângulo FIXO perdoa mais quanto mais
     * longe está o alvo (a tolerância lateral cresce com a distância —
     * 2.4 unidades a 5 un., mas 16.6 a 34 un.), que é o inverso do desejado.
     * Por isso interpolamos ângulo E força entre `near` e `far`.
     *
     * O ângulo é medido SÓ NO PLANO HORIZONTAL: num terreno inclinado o
     * desnível sozinho consumia todo o cone (11.8° de 12°) e o auxílio nunca
     * agia. Ver spec/03-armadilhas.md #11.
     */
    aimAssist: {
      /** Até esta distância o auxílio está no máximo. */
      nearDist: 6,
      /** A partir desta distância o auxílio é mínimo (e some no `range`). */
      farDist: 26,
      /** Meio-ângulo do cone (graus) perto e longe. */
      nearAngle: 30,
      farAngle: 7,
      /** Fração da correção aplicada perto e longe (1 = trava no alvo). */
      nearStrength: 1,
      farStrength: 0.35,
      /** Alcance máximo da busca. */
      range: 34,
    },
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

    /**
     * Auxílio de mira das chamas. Como o jato é curto (7-9.8 unidades), as
     * distâncias são menores que as do laser — mas a mesma ideia vale:
     * agressivo de perto, discreto no limite do alcance.
     */
    aimAssist: {
      nearDist: 2.5,
      farDist: 8,
      nearAngle: 34,
      farAngle: 10,
      nearStrength: 0.9,
      farStrength: 0.3,
      range: 11,
    },
  },
}

/**
 * Laser duplo (Super Calango): mesmos números do laser comum — a cadência
 * TOTAL continua 10 tiros/s, só alternando o lado do corpo a cada disparo,
 * então o DPS não muda e o balance fica intacto.
 */
ATTACKS.doubleLaser = {
  ...ATTACKS.laser,
  id: 'doubleLaser',
  name: 'Laser Duplo',
}
