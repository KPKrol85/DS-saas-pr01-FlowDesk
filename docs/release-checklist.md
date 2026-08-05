# FlowDesk release and rollback checklist

## Release scope

- Confirm release scope and target version.
- Confirm no unrelated files are included.
- Confirm `git status --short` is easy to review before committing.
- Confirm demo-only boundaries remain explicit.
- Confirm generated files were produced by scripts.
- Confirm local artifacts such as `node_modules/`, `test-results/`, `playwright-report/`, `coverage/`, `.lighthouseci/`, logs and cache folders are not tracked.

## Pre-release checks

Run:

```bash
npm ci
npm run format
npm run pwa:check
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:a11y
npm run build
npm run check
npm run lighthouse
git diff --check
```

## Manual smoke test

- Login with demo credentials.
- Open dashboard.
- Add a client.
- Add a project.
- Open client detail route.
- Open project detail route.
- Toggle one checklist item.
- Search globally and open a result.
- Export JSON.
- Import valid JSON.
- Reject malformed JSON.
- Switch theme.
- Open app on mobile viewport.

## PWA checks

- Run `npm run pwa:manifest` after runtime changes.
- Confirm `npm run pwa:check` passes.
- Confirm `service-worker-assets.js` includes new runtime modules.
- Confirm app works after first visit with offline mode.
- Confirm service worker update prompt appears without forced reload.
- Confirm `offline.html` is still cached.

## Generated files policy

- `dist/` is the only generated production artifact. It is Git-ignored, produced by `npm run build`, and never edited by hand.
- Update `dist/service-worker-assets.js` only through `npm run build` or `npm run pwa:manifest`.
- Netlify publishes `dist` through `netlify.toml`; the repository root is never published.
- Do not manually edit generated or minified files.
- Do not commit local QA reports, Playwright run state, logs, caches or dependency folders.

## Version and changelog

- Update `package.json` version if this is a named release.
- Update `CHANGELOG.md`.
- Confirm versioning convention in `docs/versioning.md`.
- Add or update ADR if the release includes an architecture decision.

## Static hosting deployment

- Build the project.
- Deploy the static directory contents.
- Ensure `_redirects` or hosting equivalent supports SPA fallback.
- Security headers ship from the source-root `_headers` file, copied into `dist/` by the Vite allowlist. Netlify reads them from the published artifact. The current policy was confirmed on a draft deploy through HTTP responses for `/`, `/offline.html` and `/regulamin.html`; re-check the response headers on a draft whenever `_headers` changes, before promoting a release.
- Ensure `index.html`, `sitemap.xml`, `robots.txt`, canonical and Open Graph URLs are production values.
- Replace pending deployment URL metadata only after the final public URL is known.
- Confirm README public demo notes still describe frontend-only scope, demo auth and local demo data accurately.
- Capture portfolio screenshots from the current running UI only: desktop dashboard, clients, projects, calendar, settings and mobile shell.
- Confirm screenshots do not show mocked, outdated or production-only functionality.
- Ensure old service worker cache can be replaced by the new cache version.

## Post-release validation

- Open the production URL in a clean browser profile.
- Validate login route and protected route redirect.
- Validate main app views.
- Validate PWA manifest and service worker registration.
- Validate update prompt on a follow-up deploy if possible.
- Validate browser console has no unexpected runtime errors.
- Validate observability provider integration if production adapter exists.

## Rollback checklist

- Identify last known good deployment.
- Restore previous static deploy from hosting provider.
- Confirm previous `service-worker-assets.js` and `service-worker.js` are served.
- Hard refresh one browser profile and verify app shell loads.
- Validate login, dashboard, clients, projects, calendar and settings.
- Communicate rollback reason and next corrective action.
- Add changelog note if rollback affects a named release.

## Rollback risks

Service worker caches can keep an older or newer app shell alive briefly. If rollback happens after a bad service worker release, validate:

- cache cleanup on activation,
- app shell asset availability,
- update prompt behavior,
- offline fallback,
- generated manifest version.
