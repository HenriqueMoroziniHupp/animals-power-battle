# 07 — Integração Oficial Poki.com (SDK v2 e Publicação)

Plano e guia de referência técnica para a fase de testes avançados (**Web Fit Test**) e publicação global na **Poki.com**.

> [!NOTE]
> Este documento registra todas as alterações necessárias para ativar o **Poki SDK v2**, monetização real e conformidade total com o **Poki Inspector** e a equipe de QA da Poki.

---

## 1. Visão Geral da Integração

Na fase de protótipo (Level 1), a Poki aceita o build padrão sem SDK para avaliar a jogabilidade. Uma vez aprovado o gameplay, o jogo avança para os testes de plataforma e monetização, exigindo:

1. Inclusão oficial do script `poki-sdk.js` no `<head>`
2. Ativação dos eventos de ciclo de vida (`gameLoadingFinished`, `gameplayStart`, `gameplayStop`)
3. Acionamento de anúncios comerciais (`commercialBreak`) e recompensados (`rewardedBreak`)
4. Prevenção de rolagem acidental da página mãe (iframe)
5. Robustez absoluta em navegação anônima (sem quebras de `localStorage`)

---

## 2. Requisitos Técnicos da Poki (Hard Requirements)

* **Eventos sem repetição**: `gameplayStart()` nunca pode seguir outro `gameplayStart()`; `gameplayStop()` nunca pode seguir outro `gameplayStop()`.
* **Início de gameplay**: `gameplayStart()` deve disparar no primeiro gesto intencional do jogador (clique em "JOGAR"), nunca no carregamento da página.
* **Interrupção de gameplay**: `gameplayStop()` deve disparar em qualquer pausa, abertura de menu, morte/game over ou anúncio.
* **Timing de anúncios**: Não implementar timers internos rígidos que impeçam o SDK da Poki de decidir o momento ideal dos comerciais.
* **Prevenção de scroll**: Teclas de controle (`Space`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) e rolagem (`wheel`) devem ter `preventDefault()` para não mover a página da Poki.
* **Atalho de teclado**: Implementar tecla `ESC` para pausar/retomar o jogo.
* **Zero chamadas externas**: Nenhuma fonte, imagem ou biblioteca externa pode ser requisitada (bloqueio por política de privacidade da Poki).

---

## 3. Modificações de Código Passo a Passo

### 3.1. Inclusão do Script no HTML
No arquivo `index.html`, adicionar a tag oficial dentro da tag `<head>`:

```html
<!-- Poki SDK v2 -->
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

---

### 3.2. Implementação do `PokiAdapter.js`
No arquivo `src/monetization/adapters/PokiAdapter.js`, conectar os métodos reais do SDK:

```javascript
/**
 * Adaptador oficial Poki SDK v2.
 */
export class PokiAdapter {
  constructor() {
    this.id = 'poki'
  }

  static isAvailable() {
    return typeof window.PokiSDK !== 'undefined'
  }

  async init() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        await window.PokiSDK.init()
        console.log('[PokiSDK] Inicializado com sucesso')
      } catch (err) {
        console.warn('[PokiSDK] Falha na inicialização, continuando:', err)
      }
    }
  }

  gameLoadingFinished() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        window.PokiSDK.gameLoadingFinished()
      } catch (err) {
        console.warn('[PokiSDK] gameLoadingFinished falhou:', err)
      }
    }
  }

  async showRewarded() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        const success = await window.PokiSDK.rewardedBreak()
        return !!success
      } catch (err) {
        console.warn('[PokiSDK] rewardedBreak falhou:', err)
        return false
      }
    }
    return false
  }

  async showInterstitial() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        await window.PokiSDK.commercialBreak()
        return true
      } catch (err) {
        console.warn('[PokiSDK] commercialBreak falhou:', err)
        return true
      }
    }
    return true
  }

  gameplayStart() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        window.PokiSDK.gameplayStart()
      } catch (err) {
        console.warn('[PokiSDK] gameplayStart falhou:', err)
      }
    }
  }

  gameplayStop() {
    if (typeof window.PokiSDK !== 'undefined') {
      try {
        window.PokiSDK.gameplayStop()
      } catch (err) {
        console.warn('[PokiSDK] gameplayStop falhou:', err)
      }
    }
  }
}
```

---

### 3.3. Proteção e Gestão de Estado no `AdManager.js`
No arquivo `src/monetization/AdManager.js`:

1. **Guarda anti-duplicação de eventos**:
   ```javascript
   gameplayStart() {
     if (this._isPlaying) return
     this._isPlaying = true
     this.adapter?.gameplayStart?.()
   }

   gameplayStop() {
     if (!this._isPlaying) return
     this._isPlaying = false
     this.adapter?.gameplayStop?.()
   }

   gameLoadingFinished() {
     this.adapter?.gameLoadingFinished?.()
   }
   ```
2. **Delegação de frequência para a Poki**:
   Quando `this.adapter.id === 'poki'`, não bloquear comerciais com `this.interstitialCooldown` rígido, pois o sistema de inteligência de anúncios da Poki é quem calibra a taxa de exibição ideal por jogador.

---

### 3.4. Ativação de Anúncios no `ads.js`
No arquivo `src/config/ads.js`, ativar a exibição:

```javascript
export const ADS_ENABLED = true
```

---

### 3.5. Ciclo de Vida e Input no `Game.js`
No arquivo `src/core/Game.js`:

1. **Fim do carregamento visual**:
   ```javascript
   this.overlays.showStart(this.player.level, () => {
     AdManager.gameLoadingFinished()
   })
   ```
2. **Sinalização em Pausa e Retomada**:
   - `pause()`: chamar `AdManager.gameplayStop()`
   - `resume()`: chamar `AdManager.gameplayStart()`
3. **Tecla ESC e Prevenção de Scroll**:
   ```javascript
   window.addEventListener('keydown', (ev) => {
     if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) {
       ev.preventDefault()
     }
     if (ev.key === 'Escape') {
       if (this.state.is(STATE.PLAYING)) {
         this.pause()
         this.overlays.showMenu()
       } else if (this.state.is(STATE.PAUSED)) {
         this.resume()
       }
     }
   })
   window.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false })
   ```

---

### 3.6. Robustez com Modo Anônimo
Envolver todas as leituras e escritas de `localStorage` em `try / catch`:
- `src/audio/AudioManager.js`: chave `pab_muted`
- `src/ui/ZoomSlider.js`: chave `pab_fov`

---

## 4. Empacotamento e Entrega

1. **Compilar a versão de produção**:
   ```bash
   npm run build
   ```
2. **Gerar o arquivo `.zip` com `index.html` na raiz**:
   ```bash
   cd dist && zip -r ../animals-power-battle.zip . && cd ..
   ```
3. **Fazer upload**: Enviar o arquivo `animals-power-battle.zip` ou arrastar a pasta `dist` no painel de desenvolvedor da Poki.
