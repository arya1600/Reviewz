import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,  // expose on local network
    port: 3030,  // avoid conflict with other projects
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React runtime — tiny but cached forever
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          // Icon library is large — cache separately
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        },
      },
    },
  },
})
