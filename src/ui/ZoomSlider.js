const KEY = 'pab_fov'

/** Slider vertical (mobile) que amplia/reduz o campo de visão da câmera. */
export class ZoomSlider {
  /** @param {HTMLInputElement} range @param {(fov: number) => void} onChange */
  constructor(range, onChange) {
    this.range = range

    const saved = Number(localStorage.getItem(KEY))
    const initial = saved >= Number(range.min) && saved <= Number(range.max)
      ? saved
      : Number(range.value)
    range.value = String(initial)
    onChange(initial)

    range.addEventListener('input', () => {
      const fov = Number(range.value)
      onChange(fov)
      localStorage.setItem(KEY, String(fov))
    })
  }
}
