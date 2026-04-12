import { defineConfig } from 'vite'
import { resolve } from 'path'

// Separate build config for the embeddable boost widget.
// Run: npm run build:widget
// Output: public/boost.js (IIFE, self-contained, no external deps)
// Deploy via Cloudflare Pages alongside the main app — the script is then
// available at https://nostrmd.xyz/boost.js

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/index.js'),
      name: 'NostrMDBoost',
      fileName: () => 'boost.js',
      formats: ['iife'],
    },
    outDir: 'public',
    emptyOutDir: false,   // don't nuke the rest of public/
    copyPublicDir: false,
    rollupOptions: {
      output: {
        // Single file, no code splitting
        inlineDynamicImports: true,
      },
    },
    // Minify for production
    minify: 'esbuild',
  },
})
