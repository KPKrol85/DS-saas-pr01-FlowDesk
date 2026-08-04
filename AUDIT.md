# FlowDesk — Final Technical Front-End Audit

**Audit date:** 2026-08-03
**Project type:** Frontend-only static SPA — Service Management Dashboard demo (vanilla HTML/CSS/JS ES modules, no framework, no bundler, no backend)
**Audit mode:** Final repository and implementation review
**Current readiness:** Needs important fixes

## 1. Executive assessment

FlowDesk is a coherently engineered frontend-only demo. The architecture is consistent with its documentation: views never reach storage directly, mutations flow through explicit actions into a persistence and repository boundary, and `localStorage` content is treated as untrusted and normalized through domain validators and migrations on every load. Dynamic rendering is escaped consistently, no secrets are present, seed content uses reserved `.test` domains and non-routable phone numbers, and the README and CHANGELOG avoid unsupported production, security, or WCAG claims. Accessibility mechanisms are implemented rather than declared: focus trapping, focus return, `Escape` handling, labelled controls with `aria-invalid` and `aria-describedby`, and reduced-motion support.

The blocking issue is not architectural. Three of the project's own quality gates currently fail when executed: the generated service-worker app-shell manifest no longer matches the committed sources, the gzip performance budget is exceeded, and `prettier --check` fails. Because `npm run check` chains these, the documented local release gate cannot currently pass. Separately, the service worker's navigation handler writes every navigation response to a single fixed cache key, which makes its offline fallback return the wrong document.

No P0 risk was detected. The remaining risk category is contract drift between generated output, quality gates, and committed sources rather than runtime correctness of the application itself. The project is suitable for continued development now, and suitable for release or portfolio presentation once the four P1 findings are resolved.

## 2. Audit scope and verification

### Areas inspected

- Application entry point (`index.html`), bootstrap (`js/main.js`), hash router and demo-session guard
- Core state layer: store facade, actions, selectors, persistence, repository boundary and `localStorage` adapter
- Domain layer: constants, models, validators, migrations, identity, RBAC, sync metadata
- Component system: button, modal, drawer, confirm dialog, table, empty state, page header, toast, icon, form controls, sidebar, topbar
- All route views, including login, dashboard, clients, projects, detail views, calendar, settings and not-found
- CSS architecture: `css/style.css` entry, tokens, base, layout, components and view layers
- Static public pages: `polityka-prywatnosci.html`, `regulamin.html`, `cookies.html`, `404.html`, `offline.html`
- PWA contract: `service-worker.js`, generated `service-worker-assets.js`, `manifest.webmanifest`, registration and update flow
- Build and validation tooling: `package.json` scripts, `postcss.config.js`, both files in `scripts/`, ESLint, Stylelint, Prettier, Vitest and Playwright configuration
- Deployment and SEO surface: `_redirects`, `robots.txt`, `sitemap.xml`, canonical and Open Graph metadata, asset and icon paths
- Repository documentation: `README.md`, `FLOWDESK-CONTEXT.md`, `CHANGELOG.md`, `docs/` and `docs/adr/`
- Security-visible review: committed credentials scan, `innerHTML` sites, escaping helpers, CSP compatibility of rendered markup

### Verification performed

- `node scripts/generate-service-worker-manifest.js --check` (`npm run pwa:check`) — executed and failed
- `node scripts/check-performance-budget.js` (`npm run perf:budget`) — executed and failed
- `npx eslint .` (`npm run lint:js`) — executed and passed
- `npx stylelint "css/**/*.css"` (`npm run lint:css`) — executed and passed
- `npx prettier . --check` (`npm run format:check`) — executed and failed
- `node --check` across every non-minified file in `js/` and `scripts/`, plus `service-worker.js` — executed and passed
- Independent read-only recomputation of the app-shell manifest to isolate list drift from content drift — executed
- Asset-existence verification for every icon, font, logo and favicon path referenced by `index.html`, `manifest.webmanifest` and the app shell — executed and passed
- Repository secrets scan across `js/`, `scripts/`, root HTML and JSON — executed, nothing detected
- Static inspection of all areas listed above

### Verification limitations

- `npm run test:unit` and `npm run test:integration` — not executed. `node_modules` in the audited environment was installed for a different platform and the required native `rolldown` binding is unavailable. Installing or repairing dependencies was outside the permitted scope, so no claim is made about whether the 21 Vitest files pass.
- `npm run test:e2e` and `npm run test:a11y` — not executed. No Playwright browser binaries are present and installing them was outside the permitted scope. The 5 Playwright specs were inspected statically only.
- `npm run build` — intentionally not run. It writes tracked files (`css/style.min.css`, `js/main.min.js`) and its `prebuild` step rewrites tracked `service-worker-assets.js`. Its configuration was inspected statically instead.
- No browser or runtime verification was performed. Findings describing rendered behavior are classified accordingly and are not presented as observed runtime results.
- Contrast compliance was not fully verified because reliable computed-style analysis was not available.
- No live deployment was inspected. No live URL was supplied for this audit, and no deployment status is claimed here.

## 3. Verified strengths

- Unidirectional data flow is enforced in practice, not only documented. No view or component reads or writes `localStorage`; every mutation passes through `js/core/actions.js` and `js/core/store.js` into `js/core/persistence.js` and `js/repositories/localStorageRepositoryAdapter.js`.
- Persisted state is treated as untrusted. `localStorageRepositoryAdapter.js:9-17` normalizes through `migrateState` on both load and save, so malformed or outdated stored data is repaired before it reaches the store.
- Escaping discipline is consistent across dynamic rendering. `js/utils/sanitize.js` is applied at every interpolation of user or stored data, including the global search results in `js/main.js:62-79`; `js/components/toast.js:27-53` uses `textContent` rather than markup.
- The rendered application is compatible with its own Content Security Policy. `index.html` declares `script-src 'self'` and `style-src 'self'` without `'unsafe-inline'`, and no runtime module emits `style` attributes, inline event handlers or inline `<style>` blocks.
- Dialog and drawer accessibility is implemented end to end: focus trap, `Escape` handling, `aria-modal`, invoker restoration and `aria-expanded` synchronization (`js/components/modal.js:10-91`, `js/components/drawer.js:22-82`). Both are removed from the tab order when closed via `visibility: hidden` and `display: none` rather than opacity alone.
- Form controls carry programmatic semantics by construction: `label`/`for` pairing, `aria-invalid`, and `aria-describedby` wired to persistent helper and error elements (`js/components/formControls.js:3-30`).
- Public and demo content is honest. The login screen states the demo character and that credentials are not sent to a server (`js/views/loginView.js:31,54`), and `js/data/seed.js` uses reserved `.test` domains and non-routable placeholder phone numbers, so no fabricated real-world contact data is published.
- The app-shell manifest is generated, not hand-maintained, and ships with a read-only drift check (`scripts/generate-service-worker-manifest.js`). The check correctly detected the drift reported in P1-01.
- Service worker cache cleanup is scoped: `service-worker.js:67-74` deletes only keys carrying the `flowdesk-app-shell` prefix, so unrelated caches on the same origin are not removed.
- Documentation is accurate about limitations. `README.md:168,380` explicitly declines to claim WCAG compliance, `docs/versioning.md:29` forbids calling the project production-ready, and both `README.md` and `CHANGELOG.md` restate the absence of a backend, real authentication and cloud sync.
- No secrets, credentials, tokens, `.env` files, `TODO`/`FIXME` markers or `debugger` statements are present. The only `console` calls are `console.warn` inside error-handling branches.

## 4. P0 — Critical risks

None detected.

## 5. P1 — Important issues worth fixing next

### [P1-01] Generated service-worker app-shell manifest no longer matches committed sources

- **Classification:** Contract mismatch
- **Affected area:** PWA, service worker caching, release gate
- **Evidence:** `service-worker-assets.js` — `version: 'e774cd33d7db'`; `scripts/generate-service-worker-manifest.js` — `--check` branch
- **Current behavior:** `npm run pwa:check` fails. Read-only recomputation shows the asset list is unchanged at 90 entries, but the content hash resolves to `2c9fa3eb0d3f` rather than the committed `e774cd33d7db`. Three app-shell sources changed after the manifest was generated — `css/components/badge.css`, `css/components/data-display.css` and `css/views/dashboard.css` — introduced by commits `2b344c4` and `164820f`.
- **Impact:** `CACHE_NAME` in `service-worker.js:13` derives from `manifest.version`. Because the version is unchanged, an already-installed service worker does not create a new cache or evict the old one, and `service-worker.js:95-97` serves CSS cache-first. Returning users continue to receive the superseded stylesheets. The failure is also the first step of `npm run check`, so the documented gate stops here.
- **Recommended direction:** Regenerate the manifest with `npm run pwa:manifest` and commit the result together with the app-shell changes that caused the drift, so the cache version always advances with runtime sources.
- **Verification criteria:** `npm run pwa:check` exits zero against a clean working tree, and the committed `version` value matches the recomputed hash.

### [P1-02] Service worker stores every navigation response under a single fixed cache key

- **Classification:** Defect
- **Affected area:** PWA, offline behavior, public legal routes
- **Evidence:** `service-worker.js:39-50`
- **Current behavior:** `navigationNetworkFirst` writes each successful navigation response to the literal key `'/index.html'` regardless of which document was requested, and its offline branch returns that same key for every navigation. The site serves four indexed documents (`/`, `/polityka-prywatnosci.html`, `/regulamin.html`, `/cookies.html`, per `sitemap.xml`), and none of the legal pages is part of the precached app shell.
- **Impact:** An online visit to any legal page overwrites the cached application shell entry with that page's HTML. A subsequent offline visit to `/` then returns the legal document instead of the application. Conversely, an offline visit to a legal route returns the application shell rather than that page or `offline.html`, so `OFFLINE_URL` is effectively unreachable for navigations. This contradicts the documented offline contract: `docs/pwa-strategy.md:45` specifies network-first navigation falling back to the cached `index.html` and then to `offline.html`, and `docs/pwa-strategy.md:51` describes `offline.html` as the always-available last fallback.
- **Recommended direction:** Key the navigation cache write to the requested URL rather than a constant, and scope the offline fallback so the application shell is returned only for application navigations, with `offline.html` returned otherwise.
- **Verification criteria:** After visiting a legal page online, an offline navigation to `/` renders the application, and an offline navigation to an uncached document renders `offline.html`.

### [P1-03] App-shell gzip budget is exceeded and `npm run perf:budget` fails

- **Classification:** Contract mismatch
- **Affected area:** Performance budget, PWA install payload, release gate
- **Evidence:** `scripts/check-performance-budget.js:9-15` — `appShellGzipBytes: 170 * 1024`
- **Current behavior:** Executed output reports `FAIL App-shell gzip size: 196.8 KB / 170.0 KB`, exit code 1. The JavaScript (57.2 KB), CSS (15.3 KB) and single-asset checks pass. The two largest contributors are the four Inter `woff2` weights at roughly 94.4 KB gzip combined, and `assets/icons/favicon/favicon.svg` at 27.1 KB gzip from 37.9 KB raw. All four font weights are genuinely referenced by the design tokens, so they are not redundant; the favicon is a generator export that still carries embedded RDF metadata.
- **Impact:** The service worker precaches the full app shell on install, so the install payload exceeds the project's own stated budget by roughly 16 percent. The check is also the final step of `npm run check`, so the documented gate fails at both ends. The archived audit still records this budget as passing — `docs/archive/audits/2026-07-24-daily-front-end-audit.md:18,62` — which is no longer accurate for the current repository state.
- **Recommended direction:** Reduce the app-shell payload before adjusting the threshold — the favicon is the largest single reducible item and is disproportionate for its role. Raise the budget only as a deliberate, documented decision if the measured size is accepted.
- **Verification criteria:** `node scripts/check-performance-budget.js` exits zero, and the recorded budget matches what the repository actually ships.

### [P1-04] `npm run lint` fails because `prettier --check` rejects five tracked files

- **Classification:** Contract mismatch
- **Affected area:** Code quality gate, cross-platform line-ending handling
- **Evidence:** `js/components/topbar.js:27`; `regulamin.html:48`; `package.json`, `icons.md`, `LICENSE.md`
- **Current behavior:** `npx prettier . --check` reports five files. Two are genuine formatting defects: a stray consecutive blank line at `js/components/topbar.js:27` and at `regulamin.html:48`. The other three differ from Prettier's expected output only by carriage returns; `.prettierrc.json` sets no `endOfLine`, so the default `lf` applies while these files carry CRLF in the working tree.
- **Impact:** `npm run lint` cannot pass, which stops `npm run check` at its second step. The line-ending component is environment-sensitive rather than intrinsic, which makes the failure hard to interpret and easy to dismiss — a reviewer running the documented gate sees a red result with two unrelated causes mixed together.
- **Recommended direction:** Remove the two stray blank lines. For the line-ending component, confirm that the newly added `.gitattributes` normalization actually resolves the three remaining files in a fresh checkout, and only then treat the gate as green.
- **Verification criteria:** `npx prettier . --check` reports no files, and `npm run lint` exits zero on both a Windows and a Linux checkout.

## 6. P2 — Minor refinements

### [P2-01] Application navigation does not expose the active route programmatically

- **Classification:** Defect
- **Affected area:** Accessibility, navigation
- **Evidence:** `js/components/sidebar.js:18-31` — `renderNavigationLinks()`
- **Current behavior:** The active route is conveyed only by the `sidebar__link--active` class, which drives background, weight and an inset border. No `aria-current` attribute is set. The same markup is reused for the mobile drawer via `renderNavList()`. The project already applies the correct pattern on its static pages — `polityka-prywatnosci.html:308`, `regulamin.html:374` and `cookies.html:257` all use `aria-current="page"`, and `css/views/legal.css:212` styles it.
- **Impact:** Screen reader users navigating the application shell receive no indication of which of the five views is currently open, in the one navigation region they use on every route. The inconsistency with the legal pages also makes the intended convention ambiguous for future maintenance.
- **Recommended direction:** Emit `aria-current="page"` on the active navigation link alongside the existing active class, matching the pattern already used on the static pages.
- **Verification criteria:** The active link in both the sidebar and the drawer carries `aria-current="page"`, and it moves correctly on route change.

### [P2-02] Form validation errors are not announced and focus is not moved to the first invalid control

- **Classification:** Source-visible risk
- **Affected area:** Accessibility, forms
- **Evidence:** `js/components/formControls.js:16,20-30` — `errorMarkup()` and `setFieldError()`; `js/views/loginView.js:75-94`
- **Current behavior:** Error text is written into a persistent `<span class="input__error">` that is correctly referenced by `aria-describedby` and paired with `aria-invalid`. The span carries no `role="alert"` or `aria-live`, and on failed submit the handler sets the messages without moving focus, so focus remains on the submit control.
- **Impact:** A screen reader user submitting the login form — the entry point to the entire application — receives no notification that submission failed. The message is discoverable only by navigating back to the field, since the association is already correct. The same pattern applies to every other form built from these helpers.
- **Recommended direction:** Make the error element a status region, or move focus to the first invalid control on failed submit, so the failure is communicated at the moment it occurs. One mechanism is sufficient.
- **Verification criteria:** A failed submit either announces the error through assistive technology or places focus on the first invalid control.
- **Resolution status:** Addressed after this audit date under `PLAN.md` item `PH3-02`. `errorMarkup()` now renders the shared error element as a `role="status"` region, which covers `inputField`, `selectField` and `textareaField` without per-view code. Announcement behavior has not been confirmed with a screen reader, so this finding should be re-verified during the final verification phase rather than treated as closed.

### [P2-03] Sidebar logo uses a relative path and sits outside the precached app shell

- **Classification:** Maintenance risk
- **Affected area:** Asset paths, offline app shell
- **Evidence:** `js/components/sidebar.js:13`; `scripts/generate-service-worker-manifest.js` — `runtimeDirectories`
- **Current behavior:** The sidebar brand renders `src="assets/logo/logo.svg"` without a leading slash. Every other reference to the same asset is root-relative — `js/views/loginView.js:18,47` and all three legal pages use `/assets/logo/logo.svg`. Separately, the manifest generator walks only `css`, `js`, `assets/fonts` and `assets/icons`, so `assets/logo/` is never precached; the file is picked up only by the runtime `STATIC_ASSET_PATTERN` in `service-worker.js:16` after a successful network fetch.
- **Impact:** Because `_redirects` rewrites every unmatched path to `index.html` with status 200, a request to a path ending in a slash resolves the relative reference against that path and returns HTML instead of the SVG, producing a broken image in the shell. The precache gap means the shell logo is unavailable on a cold offline start. Neither consequence is reachable on the canonical `/` entry point, which is why this is scoped as a source-visible risk rather than a confirmed failure.
- **Recommended direction:** Use the root-relative path already used everywhere else, and decide explicitly whether `assets/logo/` belongs in the precached app shell.
- **Verification criteria:** No runtime module references project assets with a relative path, and the shell logo's precache status is a deliberate, documented choice.
- **Resolution status:** Resolved after this audit date under `PLAN.md` item `PH4-02`. The sidebar now uses `/assets/logo/logo.svg`, and a sweep of runtime JavaScript confirmed no other relative project-asset reference remains. `assets/logo` was added to the generator's `runtimeDirectories`, so the shell logo is precached deliberately; the extension filter keeps the unused `logo.png` out. The contract is recorded in `docs/pwa-strategy.md` and the app shell measures 172.3 KB against the 180 KB limit.

### [P2-04] `404.html` can never be served by the current deployment configuration

- **Classification:** Contract mismatch
- **Affected area:** Deployment, routing
- **Evidence:** `_redirects` — `/*    /index.html   200`; `404.html`
- **Current behavior:** The catch-all rewrite returns the application shell with status 200 for every path that does not match a static file, so the committed `404.html` is unreachable in that hosting model. Unknown paths are handled instead by the SPA's own `renderNotFoundView`, which is reached through the hash router.
- **Impact:** The repository carries two mutually exclusive not-found mechanisms with no indication of which is authoritative, and a maintainer may edit the file that cannot run. All unknown URLs also resolve as soft 404s for crawlers, which is a normal SPA trade-off but is not stated anywhere.
- **Recommended direction:** Keep one not-found path. Either document `404.html` as an intentional fallback for hosting without the rewrite, or remove it and rely on the in-application view.
- **Resolution status:** Resolved after this audit date under `PLAN.md` item `PH5-01`. `404.html` was removed, `_redirects` remains the server-side fallback and `renderNotFoundView` remains the application-level mechanism. Both README language sections now state that unknown server paths receive the SPA shell with status `200`, which is a soft-404 trade-off rather than a true HTTP `404`. The file was never part of the generated app-shell manifest, so no regeneration was required.
- **Verification criteria:** The repository contains exactly one documented not-found mechanism consistent with `_redirects`.

### [P2-05] Failed local persistence is reported to views as a successful write

- **Classification:** Source-visible risk
- **Affected area:** State persistence, user feedback
- **Evidence:** `js/repositories/localStorageRepositoryAdapter.js:13-17`; `js/core/store.js:41-46`
- **Current behavior:** `storage.set()` in `js/utils/storage.js:36-46` returns a boolean and swallows write exceptions. `saveState` discards that return value, and `commitActionResult` returns `{ ok: true }` whenever the action itself validated. A quota or permission failure therefore updates in-memory state and shows a success toast while nothing is persisted. `js/main.js:285-287` covers the separate case where storage is unavailable at startup, by showing an explicit warning.
- **Impact:** If a write fails mid-session, the interface confirms an action that will not survive a reload. Likelihood is low for demo-scale data, and the startup warning already covers fully blocked storage, so the exposure is bounded.
- **Recommended direction:** Propagate the adapter's write result through the persistence layer so the store can distinguish a validated action from a durably persisted one, and surface the difference in the existing toast feedback.
- **Verification criteria:** With `localStorage` writes forced to fail, a mutating action reports failure rather than success.
- **Resolution status:** Resolved after this audit date under `PLAN.md` item `PH4-01`. The adapter now exposes `persistState()`, and `commitActionResult()` returns `{ ok: false, error: 'storage-write-failed' }` when the write does not succeed, which routes into the existing per-view failure toasts. The startup warning for fully unavailable storage is unchanged. Focused assertions against the real store and persistence modules pass; Vitest itself was not executed because its native binding was unavailable in the implementation environment.

### [P2-06] `CHANGELOG.md` credits a CI setup the repository does not contain

- **Classification:** Documentation mismatch
- **Affected area:** Project documentation
- **Evidence:** `CHANGELOG.md:11`; `README.md:162,374`
- **Current behavior:** The 1.0.0 entry lists "repeatable quality toolchain with linting, formatting, test scripts and CI". No `.github/`, workflow file or other CI configuration exists, and the README states directly that FlowDesk contains no deployment script or GitHub Actions workflow.
- **Impact:** Two documents in the same repository make opposing claims about automation. For a portfolio-facing project this is the kind of statement a reviewer checks, and the repository does not support it.
- **Recommended direction:** Align the changelog entry with the actual tooling — the local `npm run check` gate — or leave the entry as historical record and note explicitly that CI was never added.
- **Verification criteria:** No repository document claims a CI pipeline that is not present.
- **Resolution status:** Resolved after this audit date under `PLAN.md` item `PH5-02`. The 1.0.0 entry no longer credits CI and instead names the mechanism that exists, the local `npm run check` gate, described from the current `package.json` chain. `README.md` was inspected and needed no change, since both language sections already state that the repository contains no deployment script or GitHub Actions workflow. Remaining CI mentions in `docs/` are conditional or refer to Lighthouse CI as a separate tool that is not run here. No CI configuration was added.

## 7. Extra quality improvements

### Clarify the role of the unserved minified build artifacts

- **Relevant area:** Build pipeline, generated files.
- **Current evidence:** `index.html` loads `/css/style.css` and `/js/main.js` directly. `css/style.min.css` is a fully inlined 39 KB bundle produced by `postcss-import` and cssnano, while `js/main.min.js` is Terser output of the entry module alone — Terser does not bundle, so it retains `import` statements pointing at the unminified siblings. `scripts/generate-service-worker-manifest.js` explicitly excludes both from the app shell, and both were regenerated more recently than the manifest they are excluded from.
- **Potential value:** The two artifacts are tracked and rebuilt by `npm run check` but never served, so they add review noise and can be mistaken for the production contract. Documenting them as reference output, or deriving the served assets from them, would remove the ambiguity.
- **Scope boundary:** Optional. The exclusion is explicit in the generator's `ignoredFiles` set and breaks nothing at runtime; this is a clarity improvement, not a defect.

### Move security headers from the document meta tag to hosting configuration

- **Relevant area:** Security-visible configuration.
- **Current evidence:** The Content Security Policy exists only as a `<meta http-equiv>` tag in `index.html`. The static pages — `polityka-prywatnosci.html`, `regulamin.html` and `cookies.html` — carry no policy at all. The repository contains `_redirects` but no `_headers` file.
- **Potential value:** A `_headers` file would apply one policy across every document and would allow directives that a meta tag cannot express, notably `frame-ancestors`. The current runtime is already compatible with a strict policy, since no module emits inline styles or handlers, so the change carries little risk.
- **Scope boundary:** Optional and outside the current demo scope. `README.md` already lists hosting security headers as production work rather than a present capability.

### Measure the CSS entry-point request pattern before assuming it is acceptable

- **Relevant area:** Runtime loading strategy.
- **Current evidence:** `css/style.css` is a 1 KB file consisting of 26 `@import` statements. In the browser this is a nested request chain, whereas `css/style.min.css` — the flattened equivalent — is not served. All 26 files are precached by the service worker, which removes the cost for repeat visits but not for the first paint.
- **Potential value:** A measurement would establish whether the layered source architecture has a first-visit cost worth addressing, and would replace assumption with evidence.
- **Scope boundary:** Optional. No measurement was taken during this audit, and no performance regression is claimed. The layered CSS structure is a deliberate, documented architecture decision.

## 8. Current readiness conclusion

**Status:** Needs important fixes

No P0 blocker exists, and the application architecture, data boundaries, escaping discipline and accessibility mechanisms are sound within the project's frontend-only scope. What is not currently sound is the contract between the repository and its own tooling: three executed gates fail, and the service worker's navigation handler contains a provable defect in its offline path.

For this specific project that means development can continue safely, but the repository should not be presented as release-ready or portfolio-final until P1-01 through P1-04 are resolved — a reviewer running the documented `npm run check` command will currently see it fail. The four P1 items are contained and independently fixable; none requires architectural change. The unavailability of the Vitest and Playwright suites in this environment means the readiness assessment rests on static inspection plus the checks that did execute, and should be reconfirmed once those suites are run on a working installation.

## 9. Senior rating

**Rating:** 7/10

Judged as a frontend-only portfolio demo built deliberately without a framework, bundler or backend. The upper half of the score is earned: the layering is real and enforced rather than aspirational, stored data is validated as untrusted input, rendering is escaped consistently and is compatible with a strict CSP that most projects of this type would have to relax, accessibility is implemented in the components rather than asserted in documentation, demo content avoids fabricated real-world data, and the documentation is unusually disciplined about what the project is not.

The deduction is for current contract drift rather than for design. Three of the project's own quality gates fail when run, the generated service-worker manifest no longer represents the sources it caches, and the navigation caching defect undermines the offline story the project documents. These are the checks a senior reviewer runs first, and they are the difference between a project that claims rigor and one that demonstrates it. A score of 8 or above becomes defensible once the gates pass on a clean checkout and the service worker navigation path is corrected; the accessibility and persistence refinements in P2 would consolidate it further.
