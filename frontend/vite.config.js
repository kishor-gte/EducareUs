import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    allowedHosts: [
      'unshed-noelia-seethingly.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'vendor-data';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('@remix-run') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
