/**
 * Atalhos de teste manual, ativados só com `?debug` na URL.
 * Não reimplementa nada: reaproveita `addEvo`/`_levelUp`, que já disparam
 * o evento 'levelup' e todo o fluxo normal (save, câmera, troca de bioma).
 */
export class DebugTools {
  constructor(game) {
    this.game = game
    window.addEventListener('keydown', (e) => this._onKeyDown(e))
    console.info(
      '[debug] modo debug ativo — L: sobe 1 nível · V: força evolução · '
      + 'K: mata o player',
    )
  }

  _onKeyDown(e) {
    const k = e.key.toLowerCase()
    const { player } = this.game

    if (k === 'l') {
      player.addEvo(player.evoNeeded)
    } else if (k === 'v') {
      const currentSpecies = player.species.id
      let guard = 0
      while (player.species.id === currentSpecies && guard < 1000) {
        player.addEvo(player.evoNeeded)
        guard += 1
      }
    } else if (k === 'k') {
      player.takeDamage(player.hp)
    }
  }
}
