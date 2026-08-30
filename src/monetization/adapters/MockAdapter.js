/**
 * Adapter de desenvolvimento: simula um anúncio com contagem regressiva.
 * Permite testar todo o fluxo de recompensa sem SDK nenhum.
 */
export class MockAdapter {
  constructor() {
    this.id = 'mock'
    this.overlay = document.getElementById('overlay-ad')
    this.countdownEl = document.getElementById('ad-countdown')
    this.skipBtn = document.getElementById('btn-skip-ad')
    this._timer = null
  }

  async init() { /* nada a carregar */ }

  /** @returns {Promise<boolean>} true se o usuário viu o anúncio até o fim */
  showRewarded() {
    return this._runAd(5, true)
  }

  showInterstitial() {
    return this._runAd(3, false)
  }

  _runAd(seconds, skippable) {
    return new Promise((resolve) => {
      let remaining = seconds
      this.overlay.classList.remove('hidden')
      this.countdownEl.textContent = String(remaining)
      this.skipBtn.hidden = true

      const finish = (completed) => {
        clearInterval(this._timer)
        this._timer = null
        this.overlay.classList.add('hidden')
        this.skipBtn.onclick = null
        resolve(completed)
      }

      if (skippable) {
        // Botão de pular aparece depois de 3s (recompensa NÃO é concedida).
        setTimeout(() => {
          if (this._timer) this.skipBtn.hidden = false
        }, 3000)
        this.skipBtn.onclick = () => finish(false)
      }

      this._timer = setInterval(() => {
        remaining -= 1
        this.countdownEl.textContent = String(Math.max(0, remaining))
        if (remaining <= 0) finish(true)
      }, 1000)
    })
  }
}
