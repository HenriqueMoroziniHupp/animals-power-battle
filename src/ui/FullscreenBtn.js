/** Botão de fullscreen para mobile (oculta barra de pesquisa do navegador). */
export class FullscreenBtn {
  constructor() {
    const btn = document.getElementById('fullscreen-btn')
    if (!btn) return

    btn.addEventListener('click', () => this.toggle())
  }

  toggle() {
    const elem = document.documentElement
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {
        // iOS Safari não suporta Fullscreen API; tenta alternativa.
        elem.webkitRequestFullscreen?.()
      })
    } else {
      document.exitFullscreen().catch(() => {
        document.webkitExitFullscreen?.()
      })
    }
  }
}
