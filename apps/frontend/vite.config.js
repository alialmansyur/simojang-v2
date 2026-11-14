import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawTarget = env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
  const apiTarget = rawTarget.trim().replace(/\/+$/, '')

  return {
    base: env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/',
    plugins: [tailwindcss(), react()],
    server: {
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/fetch': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/store': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/kill': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/authprocess': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/activity-gallery/': {
          target: apiTarget,
          changeOrigin: true,
          bypass(req) {
            const accept = req.headers.accept || ''
            if (accept.includes('text/html')) {
              return '/index.html'
            }
          },
        },
        '/media': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/apps/assets': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/apps-manage-assets-detail': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/apps-pnbp': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/fetch-layanan-enrolled': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/store-enroll': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/apps-karier': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/apps-kompetensi': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/instansi-list': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/status-data': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/step-mt-list': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/step-integrasi-list': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/select2': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/download': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/export': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/pnbp-sign': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/pnbp-verify': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/pnbp-diagnose': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/audit': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/framer-motion')) {
              return 'vendor-ui'
            }
            if (id.includes('node_modules/apexcharts') || id.includes('node_modules/react-apexcharts')) {
              return 'vendor-charts'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  }
})
