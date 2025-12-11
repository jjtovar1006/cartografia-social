import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Definición de __dirname para entornos ESM (type: module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    // Forzamos explícitamente el nombre 'dist'
    outDir: 'dist',
    assetsDir: 'assets',
    // Limpia la carpeta antes de compilar
    emptyOutDir: true,
    sourcemap: false
  },
});