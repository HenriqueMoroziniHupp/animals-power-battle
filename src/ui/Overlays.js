/**
 * Controla as telas sobrepostas: início, menu, game over e transição de bioma.
 */
export class Overlays {
  constructor({ onPlay, onResume, onRestart, onToggleSound, onToggleQuality }) {
    this.el = {
      start: document.getElementById('overlay-start'),
      menu: document.getElementById('overlay-menu'),
      gameover: document.getElementById('overlay-gameover'),
      biome: document.getElementById('overlay-biome'),
      soundState: document.getElementById('sound-state'),
      qualityState: document.getElementById('quality-state'),
      biomeName: document.getElementById('biome-name'),
      biomeDesc: document.getElementById('biome-desc'),
      goLevel: document.getElementById('go-level'),
      goEvo: document.getElementById('go-evo'),
      goKills: document.getElementById('go-kills'),
    }

    document.getElementById('btn-play').addEventListener('click', onPlay)
    document.getElementById('btn-resume').addEventListener('click', onResume)
    document.getElementById('btn-restart').addEventListener('click', onRestart)
    document.getElementById('btn-retry').addEventListener('click', onRestart)
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu())
    document.getElementById('btn-sound').addEventListener('click', onToggleSound)
    document.getElementById('btn-quality').addEventListener('click', onToggleQuality)
  }

  _hide(el) { el.classList.add('hidden') }
  _show(el) { el.classList.remove('hidden') }

  hideAll() {
    for (const k of ['start', 'menu', 'gameover', 'biome']) this._hide(this.el[k])
  }

  showStart() { this._show(this.el.start) }
  hideStart() { this._hide(this.el.start) }
  showMenu() { this._show(this.el.menu) }
  hideMenu() { this._hide(this.el.menu) }

  showGameOver(player) {
    this.el.goLevel.textContent = player.level
    this.el.goEvo.textContent = Math.floor(player.totalEvo)
    this.el.goKills.textContent = player.kills
    this._show(this.el.gameover)
  }
  hideGameOver() { this._hide(this.el.gameover) }

  /** Card de transição de bioma; resolve quando termina. */
  showBiome(biome, ms = 2200) {
    this.el.biomeName.textContent = biome.name
    this.el.biomeDesc.textContent = biome.desc
    this._show(this.el.biome)
    return new Promise((resolve) => {
      setTimeout(() => { this._hide(this.el.biome); resolve() }, ms)
    })
  }

  setSoundState(on) { this.el.soundState.textContent = on ? 'ON' : 'OFF' }
  setQualityState(q) { this.el.qualityState.textContent = q === 'high' ? 'ALTA' : 'BAIXA' }
}
