/**
 * Painel de boosters: dispara o anúncio recompensado e mostra o tempo
 * restante de cada bônus ativo.
 */
export class BoosterPanel {
  constructor(boosters, adManager, audio) {
    this.boosters = boosters
    this.ads = adManager
    this.audio = audio

    this.btns = {
      attack: document.getElementById('booster-atk'),
      evo: document.getElementById('booster-evo'),
    }

    for (const [kind, btn] of Object.entries(this.btns)) {
      btn.addEventListener('click', () => this._request(kind))
    }
    this._cache = {}
  }

  _request(kind) {
    const btn = this.btns[kind]
    if (btn.classList.contains('pending')) return
    btn.classList.add('pending')

    this.ads.showRewardedAd(
      () => {
        btn.classList.remove('pending')
        const ok = this.boosters.activate(kind)
        if (ok) this.audio?.play('evo')
      },
      () => {
        // Anúncio pulado: nenhuma recompensa.
        btn.classList.remove('pending')
      },
    )
  }

  /** @param {object} status vindo de BoosterManager.status() */
  update(status) {
    for (const kind of ['attack', 'evo']) {
      const s = status[kind]
      const btn = this.btns[kind]
      const timerEl = btn.querySelector('.booster-timer')
      const fillEl = btn.querySelector('.booster-fill')

      if (this._cache[kind + 'Active'] !== s.active) {
        this._cache[kind + 'Active'] = s.active
        btn.classList.toggle('active', s.active)
        timerEl.hidden = !s.active
      }

      if (s.active) {
        const secs = Math.ceil(s.remaining)
        if (this._cache[kind + 'Secs'] !== secs) {
          this._cache[kind + 'Secs'] = secs
          const m = Math.floor(secs / 60)
          const ss = String(secs % 60).padStart(2, '0')
          timerEl.textContent = `${m}:${ss}`
          fillEl.style.width = `${(s.remaining / s.duration) * 100}%`
        }
      } else if (this._cache[kind + 'Secs'] !== 0) {
        this._cache[kind + 'Secs'] = 0
        fillEl.style.width = '0%'
      }
    }
  }
}
