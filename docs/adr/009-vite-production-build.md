# ADR 009: Vite production build and the dist/ deployment contract

## Status

Accepted. Supersedes [ADR 005](005-build-without-bundler.md).

## Context

FlowDesk had no production artefact. `index.html` loaded `/css/style.css` and `/js/main.js` directly, Netlify published the repository root, Playwright served the repository root, and the app-shell manifest and performance budget measured source files. The build produced `css/style.min.css` and `js/main.min.js`, but nothing served them, and the JavaScript artefact was not a bundle because Terser does not resolve imports.

The consequences were concrete: the browser resolved a 26-file `@import` chain on first paint, the module graph was fetched file by file, and every validator measured something other than what users would receive.

## Decision

Adopt Vite as build and development infrastructure. FlowDesk remains a Vanilla HTML, CSS and JavaScript application; no framework is introduced.

- The project root stays the Vite root. Source layout is unchanged.
- `dist/` is the only production artefact. It is generated, ignored by Git and never edited by hand.
- The build is multi-page. Five HTML documents are inputs: `index.html`, the three public legal pages, and `offline.html`.
- Generated bundles are emitted to `dist/build/` so they cannot collide with the stable `/assets/` URLs that the web manifest, service worker and page metadata depend on.
- Static files with contractual URLs are copied through an explicit allowlist in `vite.config.js` rather than Vite's implicit public directory, because they are spread across the repository root and `assets/`.
- `css/style.css` and `js/main.js` remain the canonical source entry points; the HTML documents reference them and Vite rewrites those references to hashed output.

## Public asset contract

Copied verbatim to `dist/`, keeping their exact URLs: the four Inter `woff2` weights, the PWA and favicon icons, the shortcut icons, the Open Graph image, `assets/logo/logo.svg`, `manifest.webmanifest`, `service-worker.js`, `robots.txt`, `sitemap.xml` and `_redirects`.

Deliberately excluded: tests, documentation, ADRs, `scripts/`, repository configuration, agent files, `assets/logo/logo.png` and `assets/icons/favicon/favicon.svg`. The last two are not referenced by the shell and were already outside the precache.

`offline.html` is a build input rather than a copied file, because it links the stylesheet and would otherwise point at a source path that does not exist in `dist/`.

## PWA integration

The custom service worker is preserved. Its caching strategy, per-document navigation caching, offline fallback, update prompt and `SKIP_WAITING` flow are unchanged, and no PWA plugin is introduced.

Two things changed around it. `scripts/generate-service-worker-manifest.js` now inventories `dist/` and writes `dist/service-worker-assets.js` after Vite has produced its final output, so the precache lists real hashed bundles. Registration is gated behind `import.meta.env.PROD`, so the development server is never controlled by a worker precaching build output. The update-prompt event listener stays registered in every environment, because the browser suite dispatches `flowdesk:sw-update-available` directly.

## Deployment

`netlify.toml` sets the build command and publishes `dist`. Deployment stays manual through the Netlify CLI; no Git integration is enabled. Playwright runs against `vite preview` on port 4173, so browser tests exercise the same files Netlify publishes.

## Consequences

- Production validation can no longer silently pass against source files. A missing or stale `dist/` fails the manifest check and the performance budget explicitly.
- The service-worker cache version derives from hashed production assets, so it changes whenever any precached asset changes.
- `npm run check` must build before the validations that depend on `dist/`, and builds once for all of them.
- The first-paint request waterfall is replaced by bundled and hashed output.
- Development gains a dependency on Vite and its platform-specific native binaries. A checkout on a new platform requires a matching `npm ci`.
- `serve`, `terser` and `postcss-cli` are no longer used by any script. They remain installed until a dependency cleanup can be performed with a correct lockfile update.
