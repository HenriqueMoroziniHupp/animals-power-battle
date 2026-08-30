/**
 * Normaliza teclado, mouse e toque num único objeto de estado lido pelo Player.
 *
 * Estado exposto:
 *   move: {x, z}   vetor normalizado no espaço da câmera (-1..1)
 *   aimYaw         rotação da câmera em radianos
 *   attackHeld     botão de ataque segurado (chamas são contínuas)
 *   attackPressed  borda de subida, consumida por consumeAttackPress()
 *   switchTo       'laser' | 'flame' | null, consumido por consumeSwitch()
 */
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas

    this.move = { x: 0, z: 0 }
    this.aimYaw = 0
    this.attackHeld = false
    this.attackPressed = false
    this.switchTo = null
    this.enabled = false

    this.isTouch = window.matchMedia('(pointer: coarse)').matches
    if (this.isTouch) document.body.classList.add('is-touch')

    this.keys = new Set()
    /** Sensibilidade do giro por arrasto/mouse. */
    this.lookSpeed = 0.0032

    /** @type {number|null} pointerId que está girando a câmera */
    this.lookPointer = null
    this.lastLookX = 0
    /**
     * Segundos desde o último input manual de câmera. O CameraController usa
     * isso para só auto-alinhar quando o jogador NÃO está olhando em volta.
     */
    this.timeSinceLook = 99

    this._bindKeyboard()
    this._bindPointer()
  }

  setEnabled(on) {
    this.enabled = on
    if (!on) {
      this.keys.clear()
      this.move.x = 0
      this.move.z = 0
      this.attackHeld = false
      this.attackPressed = false
      this.lookPointer = null
    }
  }

  // ---------------- teclado ----------------

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return
      const k = e.key.toLowerCase()

      if (k === ' ' || e.code === 'Space') {
        e.preventDefault()
        if (!this.attackHeld) this.attackPressed = true
        this.attackHeld = true
        return
      }
      if (k === '1' || k === 'q') { this.switchTo = 'laser'; return }
      if (k === '2' || k === 'e') { this.switchTo = 'flame'; return }

      this.keys.add(k)
      this._updateMoveFromKeys()
    })

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase()
      if (k === ' ' || e.code === 'Space') {
        this.attackHeld = false
        return
      }
      this.keys.delete(k)
      this._updateMoveFromKeys()
    })

    // Solta tudo ao perder o foco — evita "tecla presa".
    window.addEventListener('blur', () => {
      this.keys.clear()
      this._updateMoveFromKeys()
      this.attackHeld = false
    })
  }

  _updateMoveFromKeys() {
    const k = this.keys
    let x = 0
    let z = 0
    if (k.has('w') || k.has('arrowup')) z -= 1
    if (k.has('s') || k.has('arrowdown')) z += 1
    if (k.has('a') || k.has('arrowleft')) x -= 1
    if (k.has('d') || k.has('arrowright')) x += 1

    const len = Math.hypot(x, z)
    if (len > 0) { x /= len; z /= len }
    this.move.x = x
    this.move.z = z
  }

  // ---------------- ponteiro (mouse + toque) ----------------

  _bindPointer() {
    const c = this.canvas

    c.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return
      // setPointerCapture lanca se o ponteiro ja sumiu (toque cortado
      // por ligacao/notificacao/gesto do sistema). Nao pode derrubar o input.
      try { c.setPointerCapture?.(e.pointerId) } catch {}

      if (e.pointerType === 'mouse') {
        if (e.button === 0) {
          if (!this.attackHeld) this.attackPressed = true
          this.attackHeld = true
        }
        // Botão direito (ou qualquer arrasto) gira a câmera.
        this.lookPointer = e.pointerId
        this.lastLookX = e.clientX
      } else {
        // No toque, só o lado direito da tela gira a câmera —
        // o lado esquerdo pertence ao joystick.
        if (e.clientX > window.innerWidth * 0.45 && this.lookPointer === null) {
          this.lookPointer = e.pointerId
          this.lastLookX = e.clientX
        }
      }
    })

    c.addEventListener('pointermove', (e) => {
      if (!this.enabled) return

      if (e.pointerType === 'mouse' && this.lookPointer === null) {
        // Sem clique: o movimento do mouse ainda gira (mira livre).
        if (e.movementX) {
          this.aimYaw -= e.movementX * this.lookSpeed
          this.timeSinceLook = 0
        }
        return
      }
      if (e.pointerId !== this.lookPointer) return

      const dx = e.clientX - this.lastLookX
      this.lastLookX = e.clientX
      if (dx !== 0) {
        this.aimYaw -= dx * this.lookSpeed
        this.timeSinceLook = 0
      }
    })

    const endPointer = (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) this.attackHeld = false
      if (e.pointerId === this.lookPointer) this.lookPointer = null
    }
    c.addEventListener('pointerup', endPointer)
    c.addEventListener('pointercancel', endPointer)

    // Impede o menu de contexto ao girar com o botão direito.
    c.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  // ---------------- API para os controles de tela ----------------

  /** Chamado pelo Joystick (mobile). */
  setTouchMove(x, z) {
    this.move.x = x
    this.move.z = z
  }

  /** Chamado pelo botão de ataque (mobile). */
  setTouchAttack(down) {
    if (down && !this.attackHeld) this.attackPressed = true
    this.attackHeld = down
  }

  /** Avança o relógio de "tempo desde o último olhar". Chamado pelo Game. */
  tick(dt) {
    this.timeSinceLook += dt
  }

  /** Consome a borda de subida do ataque (para o laser, que é por disparo). */
  consumeAttackPress() {
    const v = this.attackPressed
    this.attackPressed = false
    return v
  }

  /** Consome um pedido de troca de arma. */
  consumeSwitch() {
    const v = this.switchTo
    this.switchTo = null
    return v
  }

  /** Solicita a troca de arma (usado pelos botões do HUD). */
  requestSwitch(id) {
    this.switchTo = id
  }
}
