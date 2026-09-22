import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const devProxy = {
  '/api':          { target: 'http://fastapi:5010', changeOrigin: true },
  '/auth/':        { target: 'http://fastapi:5010', changeOrigin: true },
  '/odoo/':        { target: 'http://fastapi:5010', changeOrigin: true },
  '/woocommerce/': { target: 'http://fastapi:5010', changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 3007,
    proxy: devProxy,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['spicebox-alinea.cumbre.ar'],
  },
})