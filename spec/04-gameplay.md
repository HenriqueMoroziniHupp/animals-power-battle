# Gameplay e Balanceamento

Todos os números vivem em `src/config/balance.js`.

## Progressão

| Nível | Espécie | HP base | ATK base |
|---|---|---|---|
| 1 | Calango | 100 | 10 |
| 5 | Raposa | 165 | 17 |
| 10 | Lobo | 260 | 28 |
| 16 | Pantera | 400 | 44 |
| 22 | Urso | 640 | 66 |
| 28 | Big Kong | 1000 | 105 |

- EVO para subir de nível: `90 * 1.18^(n-1)`
- HP no nível n: `base + (n-1) * base * 0.16`
- ATK no nível n: `base + (n-1) * base * 0.22`
- Level up cura por completo
- Crítico: 15% de chance, 1.5x

Biomas trocam nos níveis **10** (Savana) e **22** (Rochosas), com interstitial.

## Ataques

### Laser (tecla 1 / Q)
- **Contínuo**: segurar mantém atirando, teto de **10 tiros/s** (cooldown 0.1s)
- Alcance 35 unidades, clampado pela distância visível (nunca sai da tela)
- Para no primeiro alvo sólido (pedra, árvore, mob)
- Explosão no impacto + dano em área (55% do dano) + cratera + mancha no chão
- Visual da explosão: bola de fogo compacta de 0.26s (curta de propósito,
  para não empilhar efeitos na cadência máxima)
- **Auxílio de mira** (vale para laser E chamas): o tiro se direciona ao alvo
  (mob OU item) mais próximo dentro de um cone à frente. A agressividade
  **decai com a distância** — forte de perto, discreto de longe.

| Distância | Cone | Correção | Acerto (erro ±20°) |
|---|---|---|---|
| 8 un | 30° | 100% | **100%** |
| 16 un | ~18° | ~65% | **56%** |
| 28 un | 7° | 35% | **11%** |

  Config em `ATTACKS.laser.aimAssist` e `ATTACKS.flame.aimAssist`
  (as chamas usam distâncias menores, já que o jato é curto).
- Dano: 100% do ATK

### Chamas (tecla 2 / E)
- Cone frontal de 7 unidades, meio-ângulo 25°
- Dano alto por tick (52% do ATK a cada 0.12s)
- Incendeia props inflamáveis (50% de chance por tick)
- Fogo consome o prop e se propaga; teto de 22 focos simultâneos

## Mobs

| Mob | Comportamento | HP | ATK | Visão | EVO | Biomas |
|---|---|---|---|---|---|---|
| Coelho | neutro | 40 | 4 | 14 | 14 | floresta |
| Capivara | neutro | 110 | 9 | 15 | 30 | floresta, savana |
| Javali | neutro | 150 | 16 | 18 | 42 | todos |
| Hiena | agressivo | 180 | 22 | 22 | 55 | savana, rochosas |
| Leão | agressivo | 300 | 34 | 26 | 90 | savana, rochosas |
| Rinoceronte | agressivo | 560 | 52 | 24 | 160 | rochosas |

**FSM:** IDLE → WANDER → CHASE → ATTACK → FLEE

- **Neutros** só perseguem depois de levar dano; fogem abaixo de 20% de HP
- **Agressivos** perseguem ao entrar no raio de visão e lutam até o fim
- Teto de 40 mobs ativos; reciclados além de 95 unidades
- Spawn em anel de 28 a 78 unidades ao redor do player

## Recursos

| Prop | HP | EVO | Inflamável | Extra |
|---|---|---|---|---|
| Árvore | 60 | 12 | sim | vira toco queimado |
| Arbusto | 28 | 6 | sim | vira cinzas |
| Pedra | 90 | 18 | **não** | bloqueia o laser |
| Cacto | 45 | 5 | sim | **cura 22 HP** |

## Boosters (por anúncio)

| Booster | Efeito | Duração | Stacks |
|---|---|---|---|
| Attack Booster | +20% dano | 120s | até 3 |
| EVO Mining | 2x EVO | 120s | até 2 |

Stacks multiplicam: 3 stacks de ataque = 1.2³ ≈ 1.73x.
