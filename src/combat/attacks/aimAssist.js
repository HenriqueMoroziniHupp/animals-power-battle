import { ATTACKS } from '../../config/balance.js'

/**
 * Auxílio de mira compartilhado pelo laser e pelas chamas.
 *
 * Escolhe o alvo mais próximo dentro de um cone à frente e desvia a direção
 * do tiro na direção dele. A AGRESSIVIDADE DECAI COM A DISTÂNCIA: de perto o
 * cone é largo e a correção é total; de longe o cone fecha e a correção vira
 * um empurrãozinho.
 *
 * Por que decair: um cone de ângulo FIXO perdoa mais quanto mais longe está o
 * alvo (a tolerância lateral cresce com a distância), o que deixa o jogo fácil
 * demais em alvos distantes.
 *
 * O ângulo é medido SÓ NO PLANO HORIZONTAL — num terreno inclinado o desnível
 * sozinho consumia todo o cone. Ver spec/03-armadilhas.md #11.
 */

/** Interpola linearmente entre `a` e `b`. */
function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * @param {THREE.Vector3} origin ponto de saída do tiro
 * @param {THREE.Vector3} dir direção normalizada — ALTERADA no lugar
 * @param {object} player
 * @param {{getMobs?: () => object[], getProps?: () => object[]}} providers
 * @param {object} [cfg] override da config (default: ATTACKS.laser.aimAssist)
 * @returns {object|null} o alvo escolhido, ou null
 */
export function applyAimAssist(origin, dir, player, providers, cfg) {
  const c = cfg ?? ATTACKS.laser.aimAssist
  if (!c) return null

  // Direção da mira projetada no plano horizontal.
  const aimLen = Math.hypot(dir.x, dir.z)
  if (aimLen < 1e-6) return null
  const ax = dir.x / aimLen
  const az = dir.z / aimLen

  let melhor = null
  let melhorDist = Infinity
  let melhorT = 0

  const considerar = (e) => {
    if (!e || e.dead || e === player) return
    const tx = e.position.x - origin.x
    const tz = e.position.z - origin.z
    const distH = Math.hypot(tx, tz)
    if (distH > c.range || distH < 0.001) return

    // Quanto mais longe, mais fechado o cone.
    const t = Math.max(0, Math.min(1, (distH - c.nearDist) / (c.farDist - c.nearDist)))
    const cone = lerp(c.nearAngle, c.farAngle, t)
    const cosLimit = Math.cos((cone * Math.PI) / 180)

    const dot = (tx * ax + tz * az) / distH
    if (dot < cosLimit) return

    if (distH < melhorDist) {
      melhorDist = distH
      melhorT = t
      melhor = e
    }
  }

  const mobs = providers.getMobs?.()
  if (mobs) for (const m of mobs) considerar(m)
  const props = providers.getProps?.()
  if (props) for (const p of props) considerar(p)

  if (!melhor) return null

  // Mira no corpo do alvo (não no pé dele).
  const tx = melhor.position.x - origin.x
  const ty = (melhor.position.y + (melhor.hitHeight ?? 1)) - origin.y
  const tz = melhor.position.z - origin.z
  const len = Math.hypot(tx, ty, tz)
  if (len < 1e-6) return null

  // Correção também decai com a distância.
  const strength = lerp(c.nearStrength, c.farStrength, melhorT)
  dir.x += (tx / len - dir.x) * strength
  dir.y += (ty / len - dir.y) * strength
  dir.z += (tz / len - dir.z) * strength
  dir.normalize()
  return melhor
}
