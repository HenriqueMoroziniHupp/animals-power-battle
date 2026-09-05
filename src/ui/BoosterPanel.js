import { t, onLanguageChange } from '../i18n/index.js'

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

    onLanguageChange(() => {
      this._cache = {}
    })
  }

  _request(kind) {
    // Permanentemente no máximo: clique inerte — jamais mostrar o anúncio,
    // senão o jogador assiste o vídeo sem ganhar nada.
    if (this.boosters.isPermanent?.(kind)) return
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

      // Estado permanente "MAX" (Super Calango): sem timer, sem anúncio.
      const perm = s.permanent === true
      if (this._cache[kind + 'Perm'] !== perm) {
        this._cache[kind + 'Perm'] = perm
        btn.classList.toggle('maxed', perm)
        const subEl = btn.querySelector('.booster-sub')
        const shortEl = btn.querySelector('.booster-title-short')
        if (perm) {
          btn.classList.add('active')
          this._cache[kind + 'Active'] = true
          timerEl.hidden = false
          timerEl.textContent = 'MAX'
          fillEl.style.width = '100%'
          subEl.textContent = t('boosters.maxDmg')
          shortEl.textContent = t('boosters.maxShort')
        } else {
          subEl.textContent = kind === 'attack' ? t('boosters.atkSub') : t('boosters.evoSub')
          shortEl.textContent = kind === 'attack' ? t('boosters.atkShort') : t('boosters.evoShort')
        }
        // Invalida o cache de segundos para o próximo estado re-renderizar.
        this._cache[kind + 'Secs'] = -1
      }
      if (perm) continue

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
