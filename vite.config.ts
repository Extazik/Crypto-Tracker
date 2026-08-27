import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Все запросы, начинающиеся с /api, Vite будет незаметно перенаправлять на бэкенд
      '/api': {
        target: 'http://localhost:5000', // <-- ВНИМАНИЕ: Укажите здесь порт вашего бэкенда (например, 3000, 3001, 5000 или 8080)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
