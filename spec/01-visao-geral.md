# Animals Power Battle — Visão Geral

Jogo 3D low-poly de navegador no estilo "Low-Poly Wilderness / Survival RPG".
Cace recursos e animais, acumule EVO, evolua de espécie e domine três biomas.

Preparado para publicação em **YouTube Playables, CrazyGames e Poki**.

## Requisitos originais

| Área | Requisito |
|---|---|
| Build | Vite + JavaScript moderno |
| Engine 3D | Three.js, `flatShading: true`, iluminação solar vibrante |
| Física | Leve, para movimentação e colisões |
| HUD | HTML5 + CSS3 sobre o `<canvas>`, responsivo |
| Áudio | Efeitos de ataque, dano e level up |
| Estilo | Low-poly / flat-shaded, cores sólidas, sombras suaves |
| Cores por fase | Floresta esverdeada, savana amarelada, rochosas acinzentadas |
| Desktop | WASD/setas, mouse para mirar, espaço/clique para atacar |
| Mobile | Joystick virtual (esquerda) + botão de ataque (direita) |
| Câmera | Orbital em 3ª pessoa com amortecimento |
| Player | Começa pequeno (calango), evolui de espécie |
| Mobs | Passivos (recursos), neutros e agressivos com raio de visão |
| Barras de vida | Nome + barra flutuante projetada do 3D para a tela |
| Combate | Dano flutuante, som de impacto, animação de ataque |
| Ataques | Laser (longo, explosivo, destrói mapa) e Chamas (curto, alto dano, incendeia) |
| HUD | Menu, placar, boosters de anúncio, nível, barra de EVO, HP, ATK |
| Monetização | `AdManager` agnóstico de SDK |
| Entrega | Um arquivo por mob, ataque e animal jogável |

## Decisões travadas com o usuário

1. **Física customizada leve** (sem Cannon-es / Rapier.js).
   Colisão esfera-esfera sobre uniform grid + raymarch próprio.
   *Motivo:* bundle mínimo para as plataformas e baixo custo de CPU em mobile.

2. **Biomas por progressão de nível**: Floresta (1) → Savana (10) → Rochosas (22),
   com interstitial na transição.

3. **JavaScript ESM + JSDoc**, sem TypeScript.

4. **Escopo completo jogável**: 3 biomas, 6 espécies, 6 mobs, 2 ataques.

## Resultado

- **61 arquivos JS**, ~5.700 linhas
- Dependência de runtime: **apenas `three`**
- **Zero assets binários** — toda geometria e todo áudio são procedurais
- Build de produção: **~144 KB gzip**
