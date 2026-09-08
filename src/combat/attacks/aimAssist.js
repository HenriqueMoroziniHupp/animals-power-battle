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
  let melhorFwd = 0

  const considerar = (e) => {
    if (!e || e.dead || e === player) return

    // Ângulo e distância são medidos em relação ao centro do jogador (o que o
    // usuário de fato controla), e não ao muzzle (que fica projetado à frente).
    const px = e.position.x - player.position.x
    const pz = e.position.z - player.position.z
    const distPlayer = Math.hypot(px, pz)
    if (distPlayer > c.range || distPlayer < 0.001) return

    const fwd = px * ax + pz * az
    const lat = Math.abs(px * az - pz * ax)

    // Alvos colados no player são aceitos no hemisfério frontal mesmo que
    // ligeiramente recuados lateralmente.
    const eRadius = e.radius ?? 0.8
    const isMeleeContact = distPlayer <= (player.radius ?? 0.9) + eRadius + 0.3
    if (fwd <= 0 && (!isMeleeContact || fwd < -0.2)) return

    const effectiveFwd = Math.max(0.1, fwd)
    // Considera a largura do corpo do alvo (não apenas o ponto central).
    const surfaceLat = Math.max(0, lat - eRadius * 0.75)
    const effAngle = Math.atan2(surfaceLat, effectiveFwd) * (180 / Math.PI)

    // Quanto mais longe, mais fechado o cone. A curta distância (< 5 un),
    // abre um bônus suave para facilitar combate corpo a corpo.
    const t = Math.max(0, Math.min(1, (distPlayer - c.nearDist) / (c.farDist - c.nearDist)))
    const closeBonus = distPlayer < 5 ? lerp(12, 0, distPlayer / 5) : 0
    const maxAngle = lerp(c.nearAngle, c.farAngle, t) + closeBonus

    if (effAngle > maxAngle) return

    if (distPlayer < melhorDist) {
      melhorDist = distPlayer
      melhorT = t
      melhorFwd = fwd
      melhor = e
    }
  }

  const mobs = providers.getMobs?.()
  if (mobs) for (const m of mobs) considerar(m)
  const props = providers.getProps?.()
  if (props) for (const p of props) considerar(p)

  if (!melhor) return null

  // Se o alvo estiver muito perto (antes ou colado no muzzle), puxa a
  // origem para trás para o feixe nascer entre o peito e o alvo e apontar para frente.
  const muzzleForward = (origin.x - player.position.x) * ax + (origin.z - player.position.z) * az
  if (melhorFwd < muzzleForward + 0.4 && muzzleForward > 0.01) {
    const safeFwd = Math.max(0.2, Math.min(muzzleForward, melhorFwd - (melhor.radius ?? 0.8) * 0.5))
    const frac = safeFwd / muzzleForward
    origin.x = player.position.x + (origin.x - player.position.x) * frac
    origin.z = player.position.z + (origin.z - player.position.z) * frac
  }

  // Mira no corpo do alvo (não no pé dele).
  const tx = melhor.position.x - origin.x
  const ty = (melhor.position.y + (melhor.hitHeight ?? melhor.radius ?? 1)) - origin.y
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
