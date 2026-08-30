/**
 * CrazyGames SDK v3.
 * Para ativar: incluir <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js">
 * e descomentar as chamadas.
 */
export class CrazyGamesAdapter {
  constructor() { this.id = 'crazygames' }

  static isAvailable() {
    return typeof window.CrazyGames !== 'undefined'
  }

  async init() {
    // await window.CrazyGames.SDK.init()
  }

  showRewarded() {
    return new Promise((resolve) => {
      // window.CrazyGames.SDK.ad.requestAd('rewarded', {
      //   adFinished: () => resolve(true),
      //   adError: () => resolve(false),
      // })
      resolve(false)
    })
  }

  showInterstitial() {
    return new Promise((resolve) => {
      // window.CrazyGames.SDK.ad.requestAd('midgame', {
      //   adFinished: () => resolve(true),
      //   adError: () => resolve(true),
      // })
      resolve(true)
    })
  }

  gameplayStart() { /* window.CrazyGames.SDK.game.gameplayStart() */ }
  gameplayStop() { /* window.CrazyGames.SDK.game.gameplayStop() */ }
}
