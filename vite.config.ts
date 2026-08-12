import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    }
  },
  preview: { // Como você está rodando na porta 4173 (preview), isso é essencial!
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    }
  }
})