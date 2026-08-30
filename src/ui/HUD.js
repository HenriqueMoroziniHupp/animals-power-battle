/**
 * Liga o estado do jogo aos elementos do index.html.
 * Só escreve no DOM quando o valor realmente muda — o loop roda a 60fps e
 * escrita cega de DOM é uma das principais causas de jank.
 */
export class HUD {
  constructor() {
    this.el = {
      levelNum: document.getElementById('level-num'),
      levelSpecies: document.getElementById('level-species'),
      evoFill: document.getElementById('evo-fill'),
      evoText: document.getElementById('evo-text'),
      hpFill: document.getElementById('hp-fill'),
      hpText: document.getElementById('hp-text'),
      atkValue: document.getElementById('atk-value'),
      atkBox: document.getElementById('atk-box'),
      scoreEvo: document.getElementById('score-evo'),
      scoreKills: document.getElementById('score-kills'),
      weaponBtns: [...document.querySelectorAll('.weapon-btn')],
    }
    this._cache = {}
  }

  _set(key, value, apply) {
    if (this._cache[key] === value) return
    this._cache[key] = value
    apply(value)
  }

  /** @param {object} player @param {object} boosters */
  update(player, boosterStatus) {
    const e = this.el

    this._set('level', player.level, (v) => { e.levelNum.textContent = v })
    this._set('species', player.species.name, (v) => { e.levelSpecies.textContent = v })

    const evoPct = Math.min(100, (player.evo / player.evoNeeded) * 100)
    this._set('evoPct', Math.round(evoPct), (v) => { e.evoFill.style.width = v + '%' })
    this._set('evoText', `${Math.floor(player.evo)} / ${player.evoNeeded} EVO`,
      (v) => { e.evoText.textContent = v })

    const hpPct = Math.max(0, player.hpPercent * 100)
    this._set('hpPct', Math.round(hpPct), (v) => { e.hpFill.style.width = v + '%' })
    this._set('hpText', `${Math.ceil(player.hp)} / ${player.maxHp}`,
      (v) => { e.hpText.textContent = v })

    const boosted = boosterStatus?.attack?.active
    const atk = Math.round(player.atk * (boosterStatus?.attack?.multiplier ?? 1))
    this._set('atk', atk, (v) => { e.atkValue.textContent = v })
    this._set('atkBoost', !!boosted, (v) => { e.atkBox.classList.toggle('boosted', v) })

    this._set('scoreEvo', Math.floor(player.totalEvo), (v) => { e.scoreEvo.textContent = v })
    this._set('scoreKills', player.kills, (v) => { e.scoreKills.textContent = v })
  }

  /** @param {string} attackId */
  setActiveWeapon(attackId) {
    this._set('weapon', attackId, (v) => {
      for (const b of this.el.weaponBtns) {
        b.classList.toggle('active', b.dataset.attack === v)
      }
    })
  }

  show() { document.getElementById('hud').classList.remove('hidden') }
  hide() { document.getElementById('hud').classList.add('hidden') }
}
