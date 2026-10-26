import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    // A pasta skill/ guarda modelos para outros projectos; não são testes deste jogo.
    exclude: ['**/node_modules/**', 'skill/**'],
  },
});
