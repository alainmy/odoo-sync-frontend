import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 3007,
    proxy: {
      '/api': {
        target: 'http://fastapi:5010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://fastapi:5010',
        changeOrigin: true,
      },
      '/odoo': {
        target: 'http://fastapi:5010',
        changeOrigin: true,
      },
      '/woocommerce': {
        target: 'http://fastapi:5010',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['spicebox-alinea.cumbre.ar'],
  },
})
