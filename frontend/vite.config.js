import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true, // żeby działało w Dockerze
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api:8000', // ✅ było localhost
        changeOrigin: true,
        secure: false,
      },
      '/minio': {
        target: 'http://minio:9000', // ✅ było localhost
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/minio/, ''),
      },
    },
  },
})