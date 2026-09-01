import { Game } from './core/Game.js'
import { DebugTools } from './core/DebugTools.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)
game.start()

// Exposto para depuração e para os testes de browser.
window.__game = game

// ?debug na URL ativa atalhos de teclado para testar level up e evolução.
if (new URLSearchParams(location.search).has('debug')) {
  window.__debug = new DebugTools(game)
}
