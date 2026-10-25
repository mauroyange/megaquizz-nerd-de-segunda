import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Build de ficheiro único para publicar como Artifact: React vem do cdnjs,
// imagens e CSS ficam embutidos.
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: [
      { find: /^react\/jsx-runtime$/, replacement: r('./scripts/jsx-runtime-global.js') },
      { find: /^react-dom\/client$/, replacement: r('./scripts/react-dom-global.js') },
      { find: /^react$/, replacement: r('./scripts/react-global.js') },
    ],
  },
  build: {
    outDir: 'dist-artifact',
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
