import { t, getLanguage, setLanguage, onLanguageChange } from '../i18n/index.js'

/**
 * Controla as telas sobrepostas: início, menu, game over e transição de bioma.
 */
export class Overlays {
  constructor({ onPlay, onResume, onRestart, onToggleSound, onToggleQuality, onResetProgress }) {
    this.el = {
      start: document.getElementById('overlay-start'),
      menu: document.getElementById('overlay-menu'),
      gameover: document.getElementById('overlay-gameover'),
      biome: document.getElementById('overlay-biome'),
      soundState: document.getElementById('sound-state'),
      qualityState: document.getElementById('quality-state'),
      langState: document.getElementById('lang-state'),
      biomeName: document.getElementById('biome-name'),
      biomeDesc: document.getElementById('biome-desc'),
      goLevel: document.getElementById('go-level'),
      goEvo: document.getElementById('go-evo'),
      goKills: document.getElementById('go-kills'),
      btnBiomeContinue: document.getElementById('btn-biome-continue'),
      startLoading: document.getElementById('start-loading'),
      loadingFill: document.getElementById('loading-fill'),
      loadingLabel: document.getElementById('loading-label'),
      loadingPercent: document.getElementById('loading-percent'),
      btnPlay: document.getElementById('btn-play'),
      btnReset: document.getElementById('btn-reset-progress'),
      startProgress: document.getElementById('start-progress'),
    }

    this._lastQuality = 'high'
    this._lastLevel = 1

    document.getElementById('btn-play').addEventListener('click', onPlay)
    document.getElementById('btn-resume').addEventListener('click', onResume)
    document.getElementById('btn-restart').addEventListener('click', onRestart)
    document.getElementById('btn-retry').addEventListener('click', onRestart)
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu())
    document.getElementById('btn-sound').addEventListener('click', onToggleSound)
    document.getElementById('btn-quality').addEventListener('click', onToggleQuality)

    const btnLang = document.getElementById('btn-lang')
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        const nextLang = getLanguage() === 'pt' ? 'en' : 'pt'
        setLanguage(nextLang)
      })
    }

    // Atualiza estados locais ao trocar o idioma
    onLanguageChange((lang) => {
      if (this.el.langState) this.el.langState.textContent = lang.toUpperCase()
      this.setQualityState(this._lastQuality)
      if (this.el.startProgress && !this.el.startProgress.hidden) {
        this.el.startProgress.textContent = t('start.progressHint', { level: this._lastLevel })
      }
      if (this.el.btnReset && this.el.btnReset.dataset.confirming !== '1') {
        this.el.btnReset.textContent = t('menu.resetProgress')
      }
    })

    if (this.el.langState) {
      this.el.langState.textContent = getLanguage().toUpperCase()
    }

    // Reiniciar progresso pede confirmação: é destrutivo e irreversível.
    const btnReset = this.el.btnReset
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (btnReset.dataset.confirming === '1') {
          btnReset.dataset.confirming = '0'
          btnReset.textContent = t('menu.resetProgress')
          onResetProgress?.()
          return
        }
        btnReset.dataset.confirming = '1'
        btnReset.textContent = t('menu.resetConfirm')
        setTimeout(() => {
          if (btnReset.dataset.confirming === '1') {
            btnReset.dataset.confirming = '0'
            btnReset.textContent = t('menu.resetProgress')
          }
        }, 4000)
      })
    }
  }

  _hide(el) { el.classList.add('hidden') }
  _show(el) { el.classList.remove('hidden') }

  hideAll() {
    for (const k of ['start', 'menu', 'gameover', 'biome']) this._hide(this.el[k])
  }

  /**
   * Executa a animação da barra de carregamento inicial e libera o botão JOGAR.
   * @param {() => void} [onReady]
   */
  startLoading(onReady) {
    if (!this.el.startLoading || !this.el.btnPlay) {
      onReady?.()
      return
    }

    this.el.btnPlay.classList.add('hidden')
    this.el.startLoading.classList.remove('hidden')
    if (this.el.loadingFill) this.el.loadingFill.style.width = '0%'
    if (this.el.loadingPercent) this.el.loadingPercent.textContent = '0%'
    if (this.el.loadingLabel) this.el.loadingLabel.textContent = t('loading.step1')

    const steps = [
      { p: 25, label: t('loading.step1'), duration: 260 },
      { p: 58, label: t('loading.step2'), duration: 320 },
      { p: 88, label: t('loading.step3'), duration: 280 },
      { p: 100, label: t('loading.step4'), duration: 220 },
    ]

    let stepIdx = 0
    const runNext = () => {
      if (stepIdx >= steps.length) {
        setTimeout(() => {
          this.el.startLoading.classList.add('hidden')
          this.el.btnPlay.classList.remove('hidden')
          onReady?.()
        }, 300)
        return
      }

      const s = steps[stepIdx++]
      if (this.el.loadingFill) this.el.loadingFill.style.width = `${s.p}%`
      if (this.el.loadingPercent) this.el.loadingPercent.textContent = `${s.p}%`
      if (this.el.loadingLabel) this.el.loadingLabel.textContent = s.label

      setTimeout(runNext, s.duration)
    }

    // Inicia no próximo quadro para garantir renderização limpa
    requestAnimationFrame(runNext)
  }

  /** @param {number} [level] nivel salvo, mostrado na tela inicial */
  showStart(level = 1, onReady) {
    this._lastLevel = level
    const hint = this.el.startProgress || document.getElementById('start-progress')
    if (hint) {
      hint.hidden = level <= 1
      hint.textContent = t('start.progressHint', { level })
    }
    this._show(this.el.start)
    this.startLoading(onReady)
  }
  hideStart() { this._hide(this.el.start) }
  showMenu() { this._show(this.el.menu) }
  hideMenu() { this._hide(this.el.menu) }

  showGameOver(player) {
    this.el.goLevel.textContent = player.level
    this.el.goEvo.textContent = Math.floor(player.totalEvo)
    this.el.goKills.textContent = player.kills
    this._show(this.el.gameover)
  }
  hideGameOver() { this._hide(this.el.gameover) }

  /** Card de transição de bioma; resolve no CONTINUAR ou após `ms`. */
  showBiome(biome, ms = 5000) {
    const nameKey = `biomes.${biome.id}.name`
    const descKey = `biomes.${biome.id}.desc`
    const name = t(nameKey)
    const desc = t(descKey)
    this.el.biomeName.textContent = name !== nameKey ? name : biome.name
    this.el.biomeDesc.textContent = desc !== descKey ? desc : biome.desc
    this._show(this.el.biome)
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer)
        this.el.btnBiomeContinue.removeEventListener('click', done)
        this._hide(this.el.biome)
        resolve()
      }
      const timer = setTimeout(done, ms)
      this.el.btnBiomeContinue.addEventListener('click', done)
    })
  }

  setSoundState(on) { this.el.soundState.textContent = on ? 'ON' : 'OFF' }
  setQualityState(q) {
    this._lastQuality = q
    this.el.qualityState.textContent = q === 'high' ? t('menu.qualityHigh') : t('menu.qualityLow')
  }
}
