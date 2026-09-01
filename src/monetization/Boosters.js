import { BALANCE } from '../config/balance.js'

/**
 * Boosters ativados por anúncio recompensado.
 * Cada vídeo assistido adiciona um "stack" com duração própria.
 *
 * O booster de ataque pode ficar PERMANENTEMENTE no máximo via provider
 * (`isAttackMaxed`): é o caso do Super Calango, cuja explosão máxima é
 * parte da fantasia da forma final — sem anúncio, sem timer.
 */
export class BoosterManager {
  /** @param {{isAttackMaxed?: () => boolean}} [opts] */
  constructor(opts = {}) {
    /** @type {{attack: number[], evo: number[]}} timestamps de expiração */
    this.stacks = { attack: [], evo: [] }
    this._now = 0
    this.listeners = []
    this._isAttackMaxed = opts.isAttackMaxed ?? (() => false)
  }

  /** true se o booster está travado no máximo (independe de stacks). */
  isPermanent(kind) {
    return kind === 'attack' && this._isAttackMaxed()
  }

  on(fn) { this.listeners.push(fn) }
  _emit() { for (const fn of this.listeners) fn(this.status()) }

  /** @param {'attack'|'evo'} kind */
  activate(kind) {
    const cfg = BALANCE.boosters[kind]
    if (!cfg) return false
    // Já está no máximo permanente: nenhum stack faria diferença.
    if (this.isPermanent(kind)) return false
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
    // Permanente: teto de stacks fixo (stacks restantes expiram sozinhos).
    if (this.isPermanent('attack')) return Math.pow(cfg.multiplier, cfg.maxStacks)
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
    const attackPerm = this.isPermanent('attack')
    return {
      attack: {
        active: attackPerm || this.stacks.attack.length > 0,
        permanent: attackPerm,
        stacks: attackPerm
          ? BALANCE.boosters.attack.maxStacks
          : this.stacks.attack.length,
        remaining: attackPerm ? 0 : this.remaining('attack'),
        duration: BALANCE.boosters.attack.duration,
        multiplier: this.attackMultiplier,
      },
      evo: {
        permanent: false,
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
