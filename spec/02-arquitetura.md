# Arquitetura

## Stack

| Camada | Escolha |
|---|---|
| Build | Vite 6 (`base: './'` — obrigatório para as plataformas) |
| 3D | `three` ^0.170, `MeshLambertMaterial` flat-shaded |
| Física | Módulo próprio (`src/physics/`) |
| UI | HTML/CSS sobre o canvas, `pointer-events` seletivo |
| Áudio | Web Audio API sintetizada em runtime |

## Estrutura

```
src/
├─ core/          loop, cena, câmera, input, estados, pool
├─ world/         terreno, biomas, props, água, povoamento
├─ entities/      player, 6 espécies, 6 mobs, barras de vida
├─ combat/        dano/EVO, números flutuantes, 2 ataques
├─ fx/            explosão, fogo, impacto, manchas (todos pooled)
├─ physics/       grid de colisão + raymarch
├─ ui/            HUD, joystick, botões, boosters, overlays
├─ audio/         AudioManager sintético
├─ monetization/  AdManager + 4 adapters
└─ config/        balance.js, palette.js
```

## Princípios que sustentam o desempenho

### 1. Materiais compartilhados
`config/palette.js` mantém um cache por cor. Centenas de objetos usam dezenas
de materiais.

> **Nunca mutar um material compartilhado** para um efeito de uma entidade —
> isso acende todas as criaturas da mesma cor. Para a piscada de dano,
> `Entity.updateFlash()` troca a *referência* do material e restaura depois.

### 2. Heightmap como fonte única de verdade
`world/Terrain.js` gera o array `heights` primeiro e desloca a malha amostrando
esse mesmo array. O ruído nunca é calculado duas vezes, então `getHeightAt()`
(usado por player, mobs e câmera todo frame) concorda exatamente com o visível.

**Invariante verificado:** para `PlaneGeometry` com `rotateX(-PI/2)`, o índice do
vértice `i` é exatamente `iz * n + ix` (n = segments+1), e `v0` cai em
`(-half, -half)`. Testado: 0 divergências em 81 vértices. É isso que permite as
crateras atualizarem só a região afetada.

### 3. Tudo pooled
Partículas, explosões, números de dano, barras de vida e manchas usam
`core/ObjectPool.js` ou pools circulares. Nenhuma alocação durante o combate.

### 4. Sombras estáticas
`shadowMap.autoUpdate = false`; só re-renderiza quando o sol se move mais de 6
unidades. Antes o sol seguia o player todo frame, invalidando o mapa a cada
quadro. Só o volume principal de cada objeto projeta sombra.

## Ordem de atualização no loop (importa!)

```
input.tick → camera.update (devolve yaw efetivo) → player.update(yaw)
→ ataques → mobs → fogo → crateras (throttled) → UI
```

A câmera atualiza **antes** do player e devolve o yaw efetivo. O player se move
relativo a esse yaw — usar o `aimYaw` cru faria a direção do movimento divergir
do que se vê na tela.
