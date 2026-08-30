/**
 * YouTube Playables.
 * A API é exposta em window.ytgame quando o jogo roda dentro do player.
 */
export class YouTubePlayablesAdapter {
  constructor() { this.id = 'youtube' }

  static isAvailable() {
    return typeof window.ytgame !== 'undefined'
  }

  async init() {
    // window.ytgame.game.loadingFinished()
  }

  async showRewarded() {
    // O YouTube Playables trabalha com "ad breaks" em vez de rewarded clássico.
    // return await window.ytgame.ads.requestRewardedAd()
    return false
  }

  async showInterstitial() {
    // await window.ytgame.ads.requestInterstitialAd()
    return true
  }

  gameplayStart() {}
  gameplayStop() {}
}
