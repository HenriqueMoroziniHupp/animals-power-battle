import { LaserAttack } from './LaserAttack.js'
import { FlameAttack } from './FlameAttack.js'

export const ATTACK_CLASSES = {
  laser: LaserAttack,
  flame: FlameAttack,
}

/** Instancia os dois ataques com o contexto do jogo. */
export function createAttacks(ctx) {
  return {
    laser: new LaserAttack(ctx),
    flame: new FlameAttack(ctx),
  }
}
