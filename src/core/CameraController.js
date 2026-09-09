import * as THREE from 'three'

const TMP = new THREE.Vector3()

/**
 * Câmera orbital em 3ª pessoa com damping independente de framerate.
 * O yaw vem do InputManager (mouse no desktop, arrasto no lado direito no
 * mobile); a distância cresce conforme o player evolui de espécie.
 */
export class CameraController {
  constructor(camera, terrain) {
    this.camera = camera
    this.terrain = terrain

    this.target = new THREE.Vector3()
    this.smoothTarget = new THREE.Vector3()

    this.distance = 15
    this.targetDistance = 15
    this.height = 8
    this.pitch = 0

    /** Força do damping: maior = mais responsivo. */
    this.followK = 7.5
    this.first = true

    /**
     * Auto-alinhamento: a câmera gira devagar para ficar ATRÁS do personagem,
     * para que andando de ré dê para ver o que está à frente dele.
     *
     * CUIDADO com realimentação: o movimento do player é calculado a partir do
     * yaw da câmera (Player.update), e o facing do player vem do movimento.
     * Se a câmera perseguisse o facing rápido, os dois se realimentariam e o
     * personagem giraria sozinho. Por isso o alinhamento é LENTO (bem abaixo
     * da taxa de giro do player, que é 14/s) e só acontece quando o player
     * está de fato andando e o jogador não está olhando em volta.
     */
    /**
     * Velocidade do acompanhamento lateral, em rad/s por unidade de strafe.
     * Baixo de proposito: a tela "vira junto levemente", sem enjoar.
     */
    this.alignRate = 3
    /** Só auto-alinha depois de N segundos sem input manual de câmera. */
    this.alignDelay = 0.35
    /** Yaw acumulado da câmera (o que de fato posiciona a câmera). */
    this.yaw = 0
  }

  /** Ajusta o enquadramento ao tamanho da espécie atual. */
  setSpeciesScale(scale) {
    this.targetDistance = 12 + scale * 5.5
    this.height = 6 + scale * 3.2
  }

  /**
   * @param {number} dt
   * @param {THREE.Vector3} playerPos
   * @param {number} inputYaw radianos, vindo do input (mouse/arrasto)
   * @param {{strafe?: number, moving?: boolean, timeSinceLook?: number}} [opts]
   * @returns {number} o yaw efetivo da câmera (usado pelo movimento do player)
   */
  update(dt, playerPos, inputYaw, opts = {}) {
    const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 1 / 60
    // Damping exponencial: estável em qualquer framerate.
    const a = 1 - Math.exp(-this.followK * safeDt)

    const safeInputYaw = Number.isFinite(inputYaw) ? inputYaw : 0
    const prev = Number.isFinite(this._lastInputYaw) ? this._lastInputYaw : safeInputYaw
    const inputDelta = safeInputYaw - prev
    this._lastInputYaw = safeInputYaw
    if (Number.isFinite(inputDelta)) this.yaw += inputDelta
    if (!Number.isFinite(this.yaw)) this.yaw = safeInputYaw

    // Auto-alinhamento: giro por VELOCIDADE ANGULAR, não perseguindo um
    // ângulo alvo. Isso elimina por construção a singularidade da meia-volta
    // (correção de 180° com sinal alternando = tremor na tela).
    //
    // A câmera acompanha levemente o movimento lateral: andando para os lados
    // ela gira junto, devagar; andando reto (frente ou ré) não gira nada.
    const strafe = Number.isFinite(opts.strafe) ? opts.strafe : 0
    const canAlign =
      opts.moving === true &&
      (opts.timeSinceLook ?? 99) > this.alignDelay &&
      Math.abs(strafe) > 0.05
    if (canAlign) {
      // Velocidade proporcional ao quanto o jogador pede de lateral.
      this.yaw -= strafe * this.alignRate * safeDt
    }
    if (!Number.isFinite(this.yaw)) this.yaw = 0
    const yaw = this.yaw

    if (playerPos && Number.isFinite(playerPos.x) && Number.isFinite(playerPos.y) && Number.isFinite(playerPos.z)) {
      this.target.copy(playerPos)
    }
    this.target.y += 1.4

    if (!Number.isFinite(this.distance)) this.distance = this.targetDistance

    if (this.first || !Number.isFinite(this.smoothTarget.x)) {
      this.smoothTarget.copy(this.target)
      this.distance = this.targetDistance
      this.first = false
    } else {
      this.smoothTarget.lerp(this.target, a)
      this.distance += (this.targetDistance - this.distance) * a
    }

    const horiz = Math.cos(this.pitch) * this.distance
    TMP.set(
      this.smoothTarget.x + Math.sin(yaw) * horiz,
      this.smoothTarget.y + this.height,
      this.smoothTarget.z + Math.cos(yaw) * horiz,
    )

    // Nunca deixa a câmera afundar no terreno NEM na água.
    // O plano d'água cobre o mapa inteiro; sem este limite, ao chegar na
    // beira de um lago a câmera descia abaixo dele e a tela ficava metade
    // azul (visto em teste).
    if (this.terrain && Number.isFinite(TMP.x) && Number.isFinite(TMP.z)) {
      const ground = this.terrain.getHeightAt(TMP.x, TMP.z) + 1.6
      const waterTop = (this.terrain.biome?.water?.level ?? -Infinity) + 1.2
      const floor = Math.max(ground, waterTop)
      if (Number.isFinite(floor) && TMP.y < floor) TMP.y = floor
    }

    if (Number.isFinite(TMP.x) && Number.isFinite(TMP.y) && Number.isFinite(TMP.z)) {
      this.camera.position.copy(TMP)
    }
    if (Number.isFinite(this.smoothTarget.x) && Number.isFinite(this.smoothTarget.y) && Number.isFinite(this.smoothTarget.z)) {
      this.camera.lookAt(this.smoothTarget)
    }
    return yaw
  }

  /** Reposiciona instantaneamente (usado ao reiniciar / trocar bioma). */
  snap() {
    this.first = true
    this._lastInputYaw = undefined
  }
}
