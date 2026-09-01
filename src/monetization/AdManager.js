import { ADS_ENABLED } from '../config/ads.js'
import { MockAdapter } from './adapters/MockAdapter.js'
import { PokiAdapter } from './adapters/PokiAdapter.js'
import { CrazyGamesAdapter } from './adapters/CrazyGamesAdapter.js'
import { YouTubePlayablesAdapter } from './adapters/YouTubePlayablesAdapter.js'

/**
 * Fachada agnóstica de SDK.
 *
 * Detecta a plataforma em runtime e delega para o adapter certo. Em
 * desenvolvimento cai no MockAdapter, que simula o anúncio com contagem
 * regressiva. Trocar de plataforma não exige mexer no código do jogo.
 *
 * Uso:
 *   AdManager.showRewardedAd(onSuccess, onFail)
 *   AdManager.showInterstitialAd(onComplete)
 */
class AdManagerImpl {
  constructor() {
    this.adapter = null
    /** Pausa/retoma o jogo durante o anúncio (exigência das plataformas). */
    this.onPause = null
    this.onResume = null
    /** Cooldown mínimo entre interstitials, em segundos. */
    this.interstitialCooldown = 45
    this._lastInterstitial = -Infinity
    this._showing = false
  }

  async init({ onPause, onResume } = {}) {
    this.onPause = onPause
    this.onResume = onResume

    // Permite forçar um adapter para teste: ?sdk=poki
    const forced = new URLSearchParams(location.search).get('sdk')

    if (forced === 'poki' || PokiAdapter.isAvailable()) this.adapter = new PokiAdapter()
    else if (forced === 'crazygames' || CrazyGamesAdapter.isAvailable()) this.adapter = new CrazyGamesAdapter()
    else if (forced === 'youtube' || YouTubePlayablesAdapter.isAvailable()) this.adapter = new YouTubePlayablesAdapter()
    else this.adapter = new MockAdapter()

    await this.adapter.init()
    return this.adapter.id
  }

  get platform() { return this.adapter?.id ?? 'none' }

  /**
   * Anúncio recompensado (botões de booster).
   * @param {() => void} onRewardSuccess
   * @param {() => void} [onRewardFail]
   */
  async showRewardedAd(onRewardSuccess, onRewardFail) {
    // Anúncios desligados: concede a recompensa sem exibir o modal.
    if (!ADS_ENABLED) {
      onRewardSuccess?.()
      return
    }
    if (this._showing) return
    this._showing = true
    this.onPause?.()
    try {
      const ok = await this.adapter.showRewarded()
      if (ok) onRewardSuccess?.()
      else onRewardFail?.()
    } catch (err) {
      console.warn('[AdManager] rewarded falhou:', err)
      onRewardFail?.()
    } finally {
      this._showing = false
      this.onResume?.()
    }
  }

  /**
   * Interstitial (game over, transição de bioma).
   * Respeita um cooldown para não irritar o jogador.
   * @param {() => void} [onComplete]
   */
  async showInterstitialAd(onComplete) {
    if (!ADS_ENABLED) {
      onComplete?.()
      return
    }
    const now = performance.now() / 1000
    if (this._showing || now - this._lastInterstitial < this.interstitialCooldown) {
      onComplete?.()
      return
    }
    this._showing = true
    this._lastInterstitial = now
    this.onPause?.()
    try {
      await this.adapter.showInterstitial()
    } catch (err) {
      console.warn('[AdManager] interstitial falhou:', err)
    } finally {
      this._showing = false
      this.onResume?.()
      onComplete?.()
    }
  }

  gameplayStart() { this.adapter?.gameplayStart?.() }
  gameplayStop() { this.adapter?.gameplayStop?.() }
}

export const AdManager = new AdManagerImpl()
