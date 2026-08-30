import { defineConfig } from 'vite'

// base: './' é obrigatório para YouTube Playables / Poki / CrazyGames,
// que servem o bundle a partir de um caminho arbitrário.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: true,
  },
})
