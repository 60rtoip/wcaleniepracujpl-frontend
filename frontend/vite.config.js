import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
      },
      '/minio': {
        target: 'http://minio:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/minio/, ''),
      },
    },
  },
})
