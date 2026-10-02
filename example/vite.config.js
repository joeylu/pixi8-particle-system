import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  resolve: { dedupe: ['pixi.js'] },
});
