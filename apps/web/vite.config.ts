import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    port: 3000,
    proxy: {
      // Encaminha /api/* para a API (auth, boards, notifications, socket.io, etc.)
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[vite proxy error]', err.message);
          });
        },
      },
    },
  },
});
