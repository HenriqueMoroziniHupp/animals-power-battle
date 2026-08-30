/**
 * Joystick virtual (mobile). Ocupa a metade esquerda inferior da tela:
 * o toque pode começar em qualquer ponto dessa área e o joystick se
 * reposiciona ali — bem mais confortável que um joystick fixo.
 */
export class Joystick {
  constructor(rootEl, knobEl, input) {
    this.root = rootEl
    this.knob = knobEl
    this.base = rootEl.querySelector('.joystick-base')
    this.input = input
    this.radius = 52

    this.pointerId = null
    this.originX = 0
    this.originY = 0

    this._bind()
  }

  _bind() {
    // IMPORTANTE: `#touch-layer` herda `pointer-events: none` de `.hud-layer`,
    // então listeners nele NUNCA disparam. A zona sensível precisa ser um
    // elemento com `pointer-events: auto` — usamos o próprio `.joystick`,
    // esticado pela classe `.joystick-zone` para cobrir a metade esquerda.
    const zone = this.root
    zone.classList.add('joystick-zone')

    zone.addEventListener('pointerdown', (e) => {
      if (this.pointerId !== null) return
      if (e.clientX > window.innerWidth * 0.45) return
      // Não sequestra toques nos botões.
      if (e.target.closest('button')) return

      this.pointerId = e.pointerId
      this.originX = e.clientX
      this.originY = e.clientY

      // A base do joystick nasce onde o dedo tocou.
      const r = zone.getBoundingClientRect()
      const lx = e.clientX - r.left
      const ly = e.clientY - r.top
      this.base.style.left = `${lx - 65}px`
      this.base.style.top = `${ly - 65}px`
      this.knob.style.left = `${lx}px`
      this.knob.style.top = `${ly}px`
      // Visibilidade imediata: sem depender da transicao CSS.
      this.base.style.transition = 'none'
      this.knob.style.transition = 'none'
      this.base.style.opacity = '1'
      this.knob.style.opacity = '1'
      // Reabilita a transicao para o fade-out ao soltar.
      requestAnimationFrame(() => {
        this.base.style.transition = ''
        this.knob.style.transition = ''
      })
      // setPointerCapture lanca se o ponteiro ja sumiu (toque cortado
      // por ligacao/notificacao/gesto do sistema). Nao pode derrubar o input.
      try { zone.setPointerCapture?.(e.pointerId) } catch {}
      e.preventDefault()
    })

    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.pointerId) return
      let dx = e.clientX - this.originX
      let dy = e.clientY - this.originY
      const d = Math.hypot(dx, dy)
      if (d > this.radius) {
        dx = (dx / d) * this.radius
        dy = (dy / d) * this.radius
      }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`
      this.knob.style.opacity = '1'
      // z negativo = para frente (mesma convenção do teclado).
      this.input.setTouchMove(dx / this.radius, dy / this.radius)
      e.preventDefault()
    })

    const end = (e) => {
      if (e.pointerId !== this.pointerId) return
      this.pointerId = null
      this.knob.style.transform = 'translate(0px, 0px)'
      this.input.setTouchMove(0, 0)
      this._resetPosition()
    }
    zone.addEventListener('pointerup', end)
    zone.addEventListener('pointercancel', end)
  }

  _resetPosition() {
    this.base.style.opacity = '0'
    this.knob.style.opacity = '0'
  }
}
