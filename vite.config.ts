import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  base: '/Othello-AI-wasm/',
  server: {
    port: 3000
  },
  build: {
    target: 'esnext'
  },
});
