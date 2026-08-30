/** Estados possíveis do jogo. */
export const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  AD: 'ad',
  BIOME_TRANSITION: 'biome_transition',
  GAMEOVER: 'gameover',
}

/**
 * Máquina de estados mínima com callbacks de transição.
 * O loop principal consulta `isRunning()` para decidir se atualiza a simulação.
 */
export class GameState {
  constructor(initial = STATE.MENU) {
    this.current = initial
    this.previous = null
    /** @type {Array<(next: string, prev: string) => void>} */
    this.listeners = []
  }

  set(next) {
    if (next === this.current) return
    this.previous = this.current
    this.current = next
    for (const fn of this.listeners) fn(next, this.previous)
  }

  is(...states) {
    return states.includes(this.current)
  }

  /** A simulação só avança em PLAYING. */
  isRunning() {
    return this.current === STATE.PLAYING
  }

  onChange(fn) {
    this.listeners.push(fn)
    return () => {
      const i = this.listeners.indexOf(fn)
      if (i >= 0) this.listeners.splice(i, 1)
    }
  }
}
