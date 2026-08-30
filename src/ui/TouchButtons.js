/** Botão de ataque flutuante (mobile) + troca de arma. */
export class TouchButtons {
  constructor(attackBtn, input, onSwitch) {
    this.btn = attackBtn
    this.input = input

    const down = (e) => {
      e.preventDefault()
      this.input.setTouchAttack(true)
      // setPointerCapture lanca se o ponteiro ja sumiu (toque cortado
      // por ligacao/notificacao/gesto do sistema). Nao pode derrubar o input.
      try { this.btn.setPointerCapture?.(e.pointerId) } catch {}
    }
    const up = (e) => {
      e.preventDefault()
      this.input.setTouchAttack(false)
    }
    this.btn.addEventListener('pointerdown', down)
    this.btn.addEventListener('pointerup', up)
    this.btn.addEventListener('pointercancel', up)
    this.btn.addEventListener('pointerleave', up)

    // Botões de arma funcionam em desktop e mobile.
    for (const b of document.querySelectorAll('.weapon-btn')) {
      b.addEventListener('click', () => onSwitch(b.dataset.attack))
    }
  }
}
