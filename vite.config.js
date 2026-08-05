import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = resolve(import.meta.dirname);

// Files that must keep a stable, unhashed production URL because they are referenced by the
// web manifest, the service worker, page metadata, the sitemap or the hosting platform.
// Everything else reaches dist/ through the HTML entry documents that Vite processes.
const staticAssets = [
  // Fonts are intentionally absent here: they are referenced from CSS, so Vite emits them as
  // hashed files under /build/ and owns them exclusively. Copying them too would duplicate them.
  'assets/icons/og.png',
  'assets/icons/favicon/apple-touch-icon.png',
  'assets/icons/favicon/favicon-96x96.png',
  'assets/icons/favicon/favicon.ico',
  'assets/icons/favicon/favicon.svg',
  'assets/icons/favicon/web-app-manifest-192x192.png',
  'assets/icons/favicon/web-app-manifest-512x512.png',
  'assets/icons/shortcuts/clients-192x192.png',
  'assets/icons/shortcuts/dashboard-192x192.png',
  'assets/icons/shortcuts/projects-192x192.png',
  'assets/logo/logo.svg',
  // Classic early script loaded by the legal pages from a fixed URL, so it is copied rather
  // than bundled. Vite leaves the absolute src untouched because it is not a module.
  'js/legal-theme.js',
  'manifest.webmanifest',
  'robots.txt',
  'service-worker.js',
  'sitemap.xml',
  '_redirects'
];

const copyStaticAssets = () => ({
  name: 'flowdesk-static-assets',
  apply: 'build',
  closeBundle() {
    const outDir = resolve(projectRoot, 'dist');
    for (const relativePath of staticAssets) {
      const source = resolve(projectRoot, relativePath);
      if (!existsSync(source)) throw new Error(`Missing static asset: ${relativePath}`);
      const target = resolve(outDir, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      cpSync(source, target);
    }
  }
});

export default defineConfig({
  root: projectRoot,
  base: '/',
  // The static contract above is explicit, so Vite's implicit public directory stays off.
  publicDir: false,
  server: { port: 8181, strictPort: true },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Generated bundles live under /build/ so they cannot collide with the stable /assets/ URLs.
    assetsDir: 'build',
    rollupOptions: {
      input: {
        index: resolve(projectRoot, 'index.html'),
        cookies: resolve(projectRoot, 'cookies.html'),
        regulamin: resolve(projectRoot, 'regulamin.html'),
        polityka: resolve(projectRoot, 'polityka-prywatnosci.html'),
        // The offline fallback is not a public route, but it is served by the service worker
        // and links the stylesheet, so it must be processed rather than copied verbatim.
        offline: resolve(projectRoot, 'offline.html')
      }
    }
  },
  plugins: [copyStaticAssets()]
});
