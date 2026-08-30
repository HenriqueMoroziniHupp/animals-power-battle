import { BALANCE } from '../config/balance.js'

/**
 * Boosters ativados por anúncio recompensado.
 * Cada vídeo assistido adiciona um "stack" com duração própria.
 */
export class BoosterManager {
  constructor() {
    /** @type {{attack: number[], evo: number[]}} timestamps de expiração */
    this.stacks = { attack: [], evo: [] }
    this._now = 0
    this.listeners = []
  }

  on(fn) { this.listeners.push(fn) }
  _emit() { for (const fn of this.listeners) fn(this.status()) }

  /** @param {'attack'|'evo'} kind */
  activate(kind) {
    const cfg = BALANCE.boosters[kind]
    if (!cfg) return false
    const list = this.stacks[kind]
    if (list.length >= cfg.maxStacks) return false
    list.push(this._now + cfg.duration)
    this._emit()
    return true
  }

  update(dt) {
    this._now += dt
    let changed = false
    for (const kind of Object.keys(this.stacks)) {
      const list = this.stacks[kind]
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] <= this._now) { list.splice(i, 1); changed = true }
      }
    }
    if (changed) this._emit()
  }

  get attackMultiplier() {
    const cfg = BALANCE.boosters.attack
    return Math.pow(cfg.multiplier, this.stacks.attack.length)
  }

  get evoMultiplier() {
    const cfg = BALANCE.boosters.evo
    return Math.pow(cfg.multiplier, this.stacks.evo.length)
  }

  /** Segundos restantes do stack que expira por último. */
  remaining(kind) {
    const list = this.stacks[kind]
    if (!list.length) return 0
    return Math.max(0, Math.max(...list) - this._now)
  }

  status() {
    return {
      attack: {
        active: this.stacks.attack.length > 0,
        stacks: this.stacks.attack.length,
        remaining: this.remaining('attack'),
        duration: BALANCE.boosters.attack.duration,
        multiplier: this.attackMultiplier,
      },
      evo: {
        active: this.stacks.evo.length > 0,
        stacks: this.stacks.evo.length,
        remaining: this.remaining('evo'),
        duration: BALANCE.boosters.evo.duration,
        multiplier: this.evoMultiplier,
      },
    }
  }

  reset() {
    this.stacks.attack.length = 0
    this.stacks.evo.length = 0
    this._emit()
  }
}
