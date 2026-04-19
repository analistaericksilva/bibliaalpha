import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Suporta tanto GEMINI_API_KEY (Google AI Studio) quanto VITE_GEMINI_KEY (GitHub Secrets)
    'process.env.GEMINI_API_KEY': JSON.stringify(
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_KEY ||
      ''
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
