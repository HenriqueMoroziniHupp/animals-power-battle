import { LaserAttack } from './LaserAttack.js'
import { FlameAttack } from './FlameAttack.js'
import { DoubleLaserAttack } from './DoubleLaserAttack.js'

export const ATTACK_CLASSES = {
  laser: LaserAttack,
  flame: FlameAttack,
  doubleLaser: DoubleLaserAttack,
}

/** Instancia os ataques com o contexto do jogo. */
export function createAttacks(ctx) {
  return {
    laser: new LaserAttack(ctx),
    flame: new FlameAttack(ctx),
    // Variante do laser para espécies com `dualLasers` (Super Calango);
    // o Game escolhe entre laser/doubleLaser conforme a espécie.
    doubleLaser: new DoubleLaserAttack(ctx),
  }
}
