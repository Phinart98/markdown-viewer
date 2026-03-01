import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TAURI_DEV_HOST is set by Tauri when targeting mobile; on desktop it's unset
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react()],

  // Point Vite at the renderer directory so index.html is found there
  root: 'src/renderer',

  build: {
    outDir: '../../out/renderer',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
  },

  // Prevent Vite from obscuring Rust compile errors
  clearScreen: false,
})
