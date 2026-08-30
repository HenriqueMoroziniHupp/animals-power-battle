import { Game } from './core/Game.js'

const canvas = document.getElementById('game-canvas')
const game = new Game(canvas)
game.start()

// Exposto para depuração e para os testes de browser.
window.__game = game
