/**
 * Poki SDK.
 * Para ativar: incluir <script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js">
 * no index.html e descomentar as chamadas.
 */
export class PokiAdapter {
  constructor() { this.id = 'poki' }

  static isAvailable() {
    return typeof window.PokiSDK !== 'undefined'
  }

  async init() {
    // await window.PokiSDK.init()
    // window.PokiSDK.gameLoadingFinished()
  }

  async showRewarded() {
    // return await window.PokiSDK.rewardedBreak()
    return false
  }

  async showInterstitial() {
    // await window.PokiSDK.commercialBreak()
    return true
  }

  /** Poki pede para sinalizar início/fim de gameplay ativo. */
  gameplayStart() { /* window.PokiSDK.gameplayStart() */ }
  gameplayStop() { /* window.PokiSDK.gameplayStop() */ }
}
