# Publicação e Monetização

## AdManager — agnóstico de SDK

```js
AdManager.showRewardedAd(onSuccess, onFail)   // boosters
AdManager.showInterstitialAd(onComplete)      // game over / troca de bioma
```

A detecção de plataforma é automática. Em desenvolvimento cai no `MockAdapter`,
que simula o anúncio com contagem regressiva (botão "pular" após 3s **não**
concede recompensa).

O jogo **pausa** (loop + áudio) durante qualquer anúncio — exigência das três
plataformas. Interstitials têm cooldown mínimo de 45s.

## Ativar um SDK real

1. Incluir o `<script>` do SDK no `index.html`
2. **Descomentar** as chamadas no adapter correspondente:

| Plataforma | Arquivo | Chamada |
|---|---|---|
| Poki | `adapters/PokiAdapter.js` | `PokiSDK.rewardedBreak()` |
| CrazyGames | `adapters/CrazyGamesAdapter.js` | `SDK.ad.requestAd('rewarded')` |
| YouTube Playables | `adapters/YouTubePlayablesAdapter.js` | `ytgame.ads.*` |

Para testar um adapter localmente: `?sdk=poki` na URL.

## Requisitos das plataformas atendidos

- `base: './'` no Vite — o bundle roda a partir de qualquer caminho
- Sem assets binários; tudo procedural
- ~144 KB gzip
- Áudio só inicia após gesto do usuário (política de autoplay)
- Pausa automática quando a aba perde o foco
- `gameplayStart()` / `gameplayStop()` sinalizados ao SDK

## Suporte mobile (verificado)

| Item | Status |
|---|---|
| Detecção de toque (`pointer: coarse`) | joystick e botões automáticos |
| Qualidade automática | `low` + pixelRatio 1.5 em mobile |
| Multitouch | andar + atirar + girar câmera simultaneamente |
| Retrato 390×844 / 360×640 | controles dentro da tela, sem rolagem |
| Paisagem 844×390 | HUD reorganiza, sem sobreposição |
| Notch | `viewport-fit=cover` + `safe-area-inset` |
| Toque interrompido | `pointercancel` zera o input sem travar |

## PENDENTE: medir FPS em aparelho real

**O FPS em celular NÃO foi verificado de forma confiável.**

Medições através do Chrome automatizado (CDP) deram valores contraditórios — de
60 a 21 FPS na mesma build. O experimento decisivo: esconder todos os props,
desligar sombras e esconder o terreno mudou o frame time em menos de 2 quadros.
Custo por frame constante independente do que é desenhado = teto imposto pela
automação, não pelo jogo. Amostras com `bestMs: 0.1` confirmam a interferência.

**Como medir de verdade:**
```bash
npm run dev   # anotar o IP de rede que o Vite mostra
```
Acessar `http://<ip>:5173` pelo celular na mesma Wi-Fi e, no console:
```js
game.sampleFps(120)   // depois: game._fpsResult
```
(`sampleFps` mede de DENTRO do loop, sem `requestAnimationFrame` concorrente.)

**Se o desempenho decepcionar:** o próximo passo é agrupar os props em
`InstancedMesh`. Estava no plano original e foi descartado com base numa medição
que depois se mostrou contaminada — a questão segue **em aberto**.
