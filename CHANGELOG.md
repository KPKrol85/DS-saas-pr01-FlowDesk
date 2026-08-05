# Changelog

All notable FlowDesk changes should be documented here.

The project uses semantic versioning language for named milestones. See `docs/versioning.md`.

## [Unreleased]

### Added

- Added public legal pages for the privacy policy, terms of service and cookie policy, linked from the login view and listed in `sitemap.xml`.
- Added a theme toggle to the public legal pages through `js/legal-theme.js`, so they follow the same light and dark contract as the application.
- Added verified PWA install icons, application shortcuts for the dashboard, client and service-order routes, and social preview metadata backed by real image assets.

### Changed

- Changed the login screen to a split-screen layout separating the product introduction from the authentication card.
- Changed the layered CSS architecture by splitting the monolithic component and view stylesheets into dedicated `base`, `layout`, `components` and `views` modules behind the existing `css/style.css` entry point, and consolidated reusable badge styling into one canonical component source.
- Changed the dashboard to a two-column KPI grid on small viewports, with distinct quick-action cards and explicit overdue and attention states in the activity lists.
- Changed the demo seed data to use reserved `.test` domains and non-routable placeholder phone numbers, so no fabricated real-world contact details are published.
- Changed the published favicon to remove generator metadata, embedded EXIF and XMP blocks, reducing the precached app-shell payload while keeping the rendered icon pixel-identical.
- Changed the generated app-shell precache to exclude `favicon.svg`, which is not required for offline operation and remains served and referenced normally, bringing the app shell back within its configured gzip budget.
- Changed the sidebar brand image to the root-relative `/assets/logo/logo.svg` used everywhere else, and added the shell logo to the app-shell precache so it stays available on a cold offline start.

### Fixed

- Fixed the theme toggle icon and accessible label so they stay synchronized with the persisted theme preference.
- Fixed application navigation to expose the active route with `aria-current="page"` in both the sidebar and the mobile drawer, so the current view is no longer conveyed by styling alone.
- Fixed a stale accessible-name expectation in the legal-page browser test, which looked for a return link named `Otwórz demo` while the pages expose `Wróć do logowania FlowDesk`; the test was aligned to the markup and no page content changed.
- Fixed shared form controls to render their error element as a status region, so a validation message is announced when it appears instead of only being reachable by returning to the field.
- Fixed state-changing actions to report a failed local write instead of confirming success, by propagating the storage result through the persistence adapter into the existing action result and failure toasts.
- Fixed service worker navigation caching so each document is cached under its own URL instead of one fixed key, preventing a legal page from overwriting the application shell, and rebuilt redirected cached responses so an uncached document falls back to `offline.html` instead of failing the navigation.

### Security

- Added a source-root `_headers` file that delivers the security policy as HTTP response headers from the published `dist/` artifact, so it now covers every document rather than only the SPA entry. The Content-Security-Policy moved out of the `index.html` meta element and gained `frame-ancestors 'none'`, which a meta element cannot express, alongside `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` and `Permissions-Policy`. Confirmed on a Netlify draft deploy through the HTTP responses for `/`, `/offline.html` and `/regulamin.html`.

### Removed

- Removed internal planning and context documents from the tracked repository, including the earlier to-do, implementation-plan and product-readiness files.
- Removed the unused static `404.html`, leaving the Netlify catch-all rewrite as the server-side fallback and `renderNotFoundView` as the application-level not-found view, with the resulting soft-404 trade-off documented in the README.

### Documentation

- Added `AUDIT.md` as the canonical current-state technical audit and `PLAN.md` as the canonical development plan, with historical audits archived under `docs/archive/audits/` by their original audit date.
- Replaced the README with bilingual Polish and English documentation covering architecture, scripts, deployment and project boundaries.
- Added `LICENSE.md` with the proprietary KP_Code project license and referenced it from `package.json`.
- Standardized project terminology so a project is documented as a service job or service order.
- Corrected the 1.0.0 changelog entry, which credited a CI setup the repository does not contain, to describe the local `npm run check` gate that it actually ships.
- Recorded the completed local quality-gate verification in `AUDIT.md`: `npm run check` passes end to end on a clean Windows checkout, covering 103 unit tests, 14 integration tests, 36 end-to-end tests, 12 accessibility tests, both builds and the performance budget.
- Added `docs/future-saas-readiness.md` and visual QA evidence for the main desktop and mobile views under `docs/qa/`.
- Archived the completed remediation plan to `docs/archive/plans/`, following the convention already used for historical audits.
- Simplified the final technical audit into a table-free document, closed it within the documented frontend-demo scope, and archived it to `docs/archive/audits/`. The repository root no longer carries an active audit.

### Build and Tooling

- **Breaking:** Added a Vite production build. `npm run build` now creates a complete `dist/` with bundled, minified and hashed assets, and Netlify publishes `dist` through a new `netlify.toml` instead of the repository root. The development server, the production preview, the app-shell manifest generator, the performance budget and the Playwright suites all operate on that artifact. A checkout now requires `npm ci` on the target platform before the build can run.
- Removed the tracked `css/style.min.css`, `js/main.min.js` and source-root `service-worker-assets.js`, which the `dist/` contract replaces. The `build:css`, `build:js` and `prebuild` scripts were retired with them.
- Changed the total app-shell gzip budget from 170 KB to 180 KB, restoring a bounded development margin after the previous limit was exhausted, with the individual JavaScript, CSS and single-asset limits and the precache contents left unchanged.
- Added a repository line-ending policy in `.gitattributes` that normalizes tracked text to LF and preserves CRLF for `*.bat` and `*.cmd` files.
- Set the development server to port 8181 and added a Windows launcher, `start-dev.bat`, that verifies the local dependency installation before starting it.

## 1.0.0 - 2026-07-05

### Added

- repeatable quality toolchain with linting, formatting and test scripts, gathered into the local `npm run check` gate that runs the app-shell manifest check, linting, unit and integration tests, browser and accessibility tests, the build and the performance budget
- Vitest unit and integration tests
- Playwright e2e, visual smoke and axe accessibility checks
- formal domain models, validation, schema migrations and recovery rules
- store actions, selectors, persistence adapter and repository boundaries
- safe rendering helpers and frontend hardening
- reusable UI component system and design system documentation
- expanded Service Management workflows for clients, projects, details, search, archive, import and metrics
- backend-readiness docs, identity models, RBAC contract and sync metadata hooks
- generated service worker app-shell manifest, controlled update prompt and performance budget tooling
- architecture docs, ADRs, Definition of Done, release checklist and observability readiness

### Notes

- FlowDesk remains a frontend-only demo with fake auth and `localStorage` persistence
- production use requires real backend auth, server-side validation, RBAC, storage, monitoring and hosting security headers
