import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import fs from 'fs'

const versionPlugin = () => ({
  name: 'auto-version-generator',
  buildStart() {
    const versionData = {
      version: Date.now(),
      builtAt: new Date().toISOString()
    };
    try {
      if (!fs.existsSync('./public')) fs.mkdirSync('./public', { recursive: true });
      fs.writeFileSync('./public/version.json', JSON.stringify(versionData, null, 2));
    } catch (e) {
      console.warn('Could not write version.json:', e.message);
    }
  }
});

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  plugins: [
    versionPlugin(),
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: [
        '**/public/certs/**',
        '**/api/**',
        '**/*.db*',
        '**/*.sqlite*',
        '**/Desktop/**'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        banner: '/* © 2026 Microlabs Químicos S.A. Cédula Jurídica: 3-101-144450. Software Propietario LIMS-PRO. Prohibida su copia o ingeniería inversa bajo Ley N° 6683. */',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('html2pdf.js')) return 'vendor-pdf';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          }
        }
      }
    }
  }
})
