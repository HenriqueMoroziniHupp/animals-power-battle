const KEY = 'pab_fov'

/**
 * Determina se a visualização atual é mobile na orientação vertical (retrato).
 * Nesses dispositivos, a proporção estreita exige um campo de visão (FOV)
 * mais aberto (80°) para não cortar a visão periférica da arena.
 */
export function isMobileVertical() {
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
  const isPortrait = window.innerHeight > window.innerWidth
  return isPortrait && (isTouch || window.innerWidth <= 768)
}

/**
 * FOV padrão de acordo com o formato da tela:
 * - Mobile vertical: 80° (campo bem aberto para compensar tela estreita)
 * - Desktop ou mobile horizontal: 60° (menos zoom out, proporção de tela ampla)
 */
export function getDefaultFov() {
  return isMobileVertical() ? 80 : 60
}

/** Slider de zoom que amplia/reduz o campo de visão da câmera. */
export class ZoomSlider {
  /** @param {HTMLInputElement} range @param {(fov: number) => void} onChange */
  constructor(range, onChange) {
    this.range = range
    this.onChange = onChange

    let saved = NaN
    try {
      saved = Number(localStorage.getItem(KEY))
    } catch {}

    // Migra valores antigos padrão:
    // - 55 era o padrão antigo pré-commit 71324ed
    // - 80 era o padrão geral do commit 71324ed (agora exclusivo para mobile vertical)
    if (saved === 55 || (saved === 80 && !isMobileVertical())) {
      saved = NaN
    }

    const defaultFov = getDefaultFov()
    const hasCustomSaved = Number.isFinite(saved) && saved >= Number(range.min) && saved <= Number(range.max)
    const initial = hasCustomSaved ? saved : defaultFov

    this.userInteracted = hasCustomSaved
    range.value = String(initial)
    onChange(initial)

    range.addEventListener('input', () => {
      this.userInteracted = true
      const fov = Number(range.value)
      onChange(fov)
      try {
        localStorage.setItem(KEY, String(fov))
      } catch {}
    })

    const onResize = () => {
      // Se o usuário não alterou manualmente o slider, adapta automaticamente entre 80 (vertical) e 60 (horizontal/desktop)
      if (this.userInteracted) return
      const targetFov = getDefaultFov()
      if (Number(this.range.value) !== targetFov) {
        this.range.value = String(targetFov)
        this.onChange(targetFov)
      }
    }

    this._onResize = onResize
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
  }
}
