import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/cpcc/',

  plugins: [react()],

  server: {
    https: false,
    port: 3000,
  },
})