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

  measure(category, name, value) {
    if (typeof window.PokiSDK !== 'undefined' && typeof window.PokiSDK.measure === 'function') {
      try {
        window.PokiSDK.measure(category, name, value)
      } catch (err) {
        console.warn('[PokiSDK] measure falhou:', err)
      }
    }
  }
}

