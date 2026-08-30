import { BALANCE } from '../config/balance.js'

/**
 * Persistência de progresso em `localStorage`.
 *
 * O jogador mantém o nível ao morrer (perdendo 1 como penalidade) e ao
 * recarregar a página — importante nas plataformas de jogos casuais, que
 * recarregam o iframe com frequência.
 *
 * Tudo aqui é defensivo: `localStorage` pode lançar (modo privado, cookies
 * bloqueados, cota estourada) e o save pode estar corrompido ou vir de uma
 * versão antiga. Em qualquer falha o jogo começa do zero em vez de quebrar.
 */

const KEY = 'pab_save_v1'

/** Formato do save. Campos novos precisam de default em `_sanitize`. */
const DEFAULTS = {
  level: 1,
  totalEvo: 0,
  kills: 0,
  /** EVO acumulado rumo ao próximo nível. */
  evo: 0,
}

export class SaveGame {
  constructor() {
    this.available = this._probe()
  }

  /** localStorage existe e aceita escrita? */
  _probe() {
    try {
      const k = '__pab_probe__'
      localStorage.setItem(k, '1')
      localStorage.removeItem(k)
      return true
    } catch {
      return false
    }
  }

  /** Garante tipos válidos e limites — save corrompido não pode quebrar o jogo. */
  _sanitize(raw) {
    const out = { ...DEFAULTS }
    if (!raw || typeof raw !== 'object') return out

    const num = (v, def, min, max) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return def
      return Math.min(max, Math.max(min, n))
    }

    out.level = Math.floor(num(raw.level, 1, 1, 999))
    out.totalEvo = num(raw.totalEvo, 0, 0, Number.MAX_SAFE_INTEGER)
    out.kills = Math.floor(num(raw.kills, 0, 0, Number.MAX_SAFE_INTEGER))
    // O EVO parcial nunca pode passar do necessário para o nível atual.
    out.evo = num(raw.evo, 0, 0, BALANCE.evoForLevel(out.level))
    return out
  }

  /** @returns {{level:number,totalEvo:number,kills:number,evo:number}} */
  load() {
    if (!this.available) return { ...DEFAULTS }
    try {
      const txt = localStorage.getItem(KEY)
      if (!txt) return { ...DEFAULTS }
      return this._sanitize(JSON.parse(txt))
    } catch {
      // JSON inválido: descarta o save em vez de travar o boot.
      try { localStorage.removeItem(KEY) } catch {}
      return { ...DEFAULTS }
    }
  }

  /** @param {object} player */
  save(player) {
    if (!this.available) return false
    try {
      localStorage.setItem(KEY, JSON.stringify({
        level: player.level,
        totalEvo: player.totalEvo,
        kills: player.kills,
        evo: player.evo,
      }))
      return true
    } catch {
      return false
    }
  }

  /** Apaga o progresso (botão "reiniciar progresso" do menu). */
  clear() {
    if (!this.available) return
    try { localStorage.removeItem(KEY) } catch {}
  }
}
