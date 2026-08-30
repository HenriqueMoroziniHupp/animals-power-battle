# Power Animal Battle

Jogo 3D low-poly de navegador — cace, evolua e domine três biomas.
Three.js + Vite, sem assets binários (toda a geometria é procedural).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build de produção
```

## Controles

| | Desktop | Mobile |
|---|---|---|
| Mover | `WASD` / setas | joystick (metade esquerda da tela) |
| Mirar / girar câmera | mouse | arrastar na metade direita |
| Atacar | `Espaço` ou clique | botão ⚔️ |
| Trocar ataque | `1`/`2` ou `Q`/`E` | botões 💥 / 🔥 |

## Ataques

- **Laser** — alcance longo (clampado pela distância visível), dano médio,
  explode no impacto, causa dano em área e **abre cratera no terreno**.
- **Chamas** — cone curto, dano alto por tick, **incendeia** plantas; o fogo
  consome o prop e se propaga para vizinhos inflamáveis (teto de 22 focos).

## Progressão

Calango (1) → Raposa (5) → Lobo (10) → Pantera (16) → Urso (22) → Big Kong (28).
Biomas trocam nos níveis 10 (Savana) e 22 (Terras Rochosas), com interstitial.

## Monetização

`src/monetization/AdManager.js` é agnóstico de SDK:

```js
AdManager.showRewardedAd(onSuccess, onFail)   // boosters
AdManager.showInterstitialAd(onComplete)      // game over / troca de bioma
```

Em dev usa `MockAdapter` (anúncio simulado com contagem regressiva).
Para publicar, inclua o `<script>` do SDK no `index.html` e **descomente** as
chamadas no adapter correspondente em `src/monetization/adapters/`:

- `PokiAdapter.js` — `PokiSDK.rewardedBreak()`
- `CrazyGamesAdapter.js` — `SDK.ad.requestAd('rewarded')`
- `YouTubePlayablesAdapter.js` — `ytgame.ads.*`

A detecção é automática; para testar um adapter localmente use `?sdk=poki`.
O jogo pausa (loop + áudio) durante qualquer anúncio, como as plataformas exigem.

## Ajustes rápidos

- `src/config/balance.js` — curvas de XP/HP/ATK, boosters, limites de spawn.
- `src/config/palette.js` — cache de materiais compartilhados.
- `src/world/biomes/*.js` — cores, relevo, densidade de props, tabela de mobs.

> **Atenção ao mexer em `biome.terrain.amplitude`:** as cores do terreno são
> relativas à amplitude. Depois de alterar, confira a proporção de areia/água
> (alvo: ~10% areia, <5% água).

## Estrutura

```
src/
├─ core/          loop, cena, câmera, input, estados
├─ world/         terreno, biomas, props, água, povoamento
├─ entities/      player, 6 espécies, 6 mobs (1 arquivo cada), barras de vida
├─ combat/        dano/EVO, números flutuantes, 2 ataques
├─ fx/            explosão, fogo, impacto (todos pooled)
├─ physics/       grid de colisão + raymarch
├─ ui/            HUD, joystick, boosters, overlays
├─ audio/         Web Audio sintético (sem arquivos de som)
└─ monetization/  AdManager + 4 adapters
```

## Notas de performance

O shadow map é estático (só re-renderiza quando o sol se move) e os materiais
são compartilhados por cor. Para medir FPS, use um Chrome **sem automação**:
```js
game.sampleFps(120); // depois: game._fpsResult
```
Medições feitas através de DevTools/CDP não são confiáveis para este projeto.
