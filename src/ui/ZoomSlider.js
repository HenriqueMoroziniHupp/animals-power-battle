const KEY = 'pab_fov'

/** Slider vertical (mobile) que amplia/reduz o campo de visão da câmera. */
export class ZoomSlider {
  /** @param {HTMLInputElement} range @param {(fov: number) => void} onChange */
  constructor(range, onChange) {
    this.range = range

    let saved = NaN
    try {
      saved = Number(localStorage.getItem(KEY))
    } catch {}
    // Se o valor salvo for 55 (antigo padrão fechado), migra para o novo padrão mais amplo
    if (saved === 55) saved = NaN
    const initial = Number.isFinite(saved) && saved >= Number(range.min) && saved <= Number(range.max)
      ? saved
      : Number(range.value)
    range.value = String(initial)
    onChange(initial)

    range.addEventListener('input', () => {
      const fov = Number(range.value)
      onChange(fov)
      try {
        localStorage.setItem(KEY, String(fov))
      } catch {}
    })
  }
}
