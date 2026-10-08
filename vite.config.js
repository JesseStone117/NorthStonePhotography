import { defineConfig } from 'vite';

export default defineConfig({
  // Relative URLs support a domain root, a subdirectory, and GitHub Pages.
  base: './',
  build: {
    assetsInlineLimit: 0,
    manifest: true,
  },
});
