# FlowDesk — Development Plan

**Last reviewed:** 2026-08-03
**Project type:** Frontend-only static SPA — Service Management Dashboard demo (vanilla HTML/CSS/JS ES modules, no framework, no bundler, no backend)
**Plan status:** Active

## Planning principles

- The plan reflects the verified repository state recorded in `AUDIT.md` (audit date 2026-08-03).
- A main item is checked only when every required subtask and its completion condition are satisfied.
- Generated files are never treated as canonical source. `service-worker-assets.js`, `css/style.min.css` and `js/main.min.js` are refreshed through their generators, not edited.
- Changes to any file inside the precached app shell require regenerating `service-worker-assets.js` before the change is considered complete.
- Significant completed changes are recorded separately in `CHANGELOG.md`. Pending plan items are never copied there.

## Current priorities

The audit-remediation plan is complete. Every required item in Phases 1 to 6 is closed and `npm run check` passes end to end. Remaining work is limited to the optional improvements below, none of which is required for release or portfolio presentation.

## Phase 1 — Restore the documented quality gate

**Goal:** Make `npm run check` executable end to end, so every later phase can be verified against a gate that actually passes.

- [x] **PH1-01 — Eliminate the Prettier failures blocking `npm run lint`** — Priority: High
  - [x] add a repository line-ending policy in `.gitattributes` (`* text=auto eol=lf`, CRLF preserved for `*.bat` and `*.cmd`)
  - [x] remove the stray consecutive blank line in `js/components/topbar.js` and in `regulamin.html`
  - [x] determine why `package.json`, `icons.md` and `LICENSE.md` fail `prettier --check`; `package.json` and `LICENSE.md` differed from expected output only by carriage returns, while `icons.md` additionally required one blank line between an HTML comment and the following block
  - [x] normalize those three files to LF at byte level and apply the single `icons.md` whitespace correction, without reformatting unrelated content
  - [x] re-run the checks on a fresh Windows checkout to confirm the `.gitattributes` policy holds there
  - **Completion condition:** `npx prettier . --check` reports no files and `npm run lint` exits zero on both a Windows and a Linux checkout
  - **Verification:** on Windows, a fresh worktree created from `e5a6ff2` with a platform-correct `npm ci` ran `npx prettier . --check` and `npm run lint`, both passing, which confirms the `.gitattributes` normalization holds on a clean checkout. On Linux, `npx prettier . --check`, `npx eslint .` and `npx stylelint "css/**/*.css"` were executed and passed; `npm run lint` as one chained command exceeded the available execution window there, so its three steps were run individually.
  - **Source:** `AUDIT.md` — P1-04

- [x] **PH1-02 — Bring the precached app shell within its gzip budget** — Priority: High
  - [x] reduce `assets/icons/favicon/favicon.svg` by stripping content with no rendering purpose; removed the RDF generator block and the embedded EXIF and XMP chunks, and losslessly recompressed the embedded image, taking the file from 37.9 KB to 32.1 KB raw and from 27.1 KB to 23.8 KB gzip with pixel-identical output
  - [x] re-measure the app-shell total; the favicon optimization alone brought it from 196.8 KB to 193.5 KB against the 170 KB limit defined in `scripts/check-performance-budget.js`
  - [x] keep all four Inter `woff2` weights — each is referenced by the design tokens and none is redundant
  - [x] exclude `favicon.svg` from the precached shell through the generator's `ignoredFiles` set, keeping the file served and every document reference intact; the executed check now reports 169.7 KB and exits zero
  - **Completion condition:** `node scripts/check-performance-budget.js` exits zero without weakening a limit that the repository can actually meet
  - **Note:** 169.7 KB was the measurement taken against the 170 KB limit in force at the time, which left under 0.3 KB of headroom. That threshold was later recalibrated to 180 KB under `PH4-01`; the app-shell size recorded here is unchanged, only the operating limit moved.
  - **Source:** `AUDIT.md` — P1-03

- [x] **PH1-03 — Resynchronize the generated app-shell manifest** — Priority: High
  - [x] regenerate `service-worker-assets.js` through `npm run pwa:manifest`
  - [x] confirm the `version` value advances from `e774cd33d7db` to `85687ffbb568`, and the asset list moves from 90 to 89 entries with `favicon.svg` as the only removal
  - [x] verify the drift originated in `css/components/badge.css`, `css/components/data-display.css`, `css/views/dashboard.css` and the optimized `assets/icons/favicon/favicon.svg`, and that no further app-shell source is stale
  - **Completion condition:** `npm run pwa:check` exits zero against a clean working tree
  - **Note:** `npm run pwa:check` was executed and exited zero against the working tree. The regenerated manifest is not committed yet, so the condition is fully met once the change is committed.
  - **Depends on:** `PH1-02`
  - **Source:** `AUDIT.md` — P1-01

## Phase 2 — Service worker and offline contract

**Goal:** Make runtime caching behave as `docs/pwa-strategy.md` specifies, so the offline fallback returns the correct document.

- [x] **PH2-01 — Key navigation cache writes to the requested document** — Priority: High
  - [x] replace the fixed `'/index.html'` cache key in `navigationNetworkFirst` with a per-document key; `/` and `/index.html` share the `/index.html` entry, every other document uses its own pathname
  - [x] scope the offline branch so the requested document is returned when cached and `offline.html` is returned otherwise
  - [x] keep the three legal pages network-first and runtime-cached under their own URLs rather than adding them to the precached shell, and record that in `docs/pwa-strategy.md`
  - [x] add a focused regression test in `tests/unit/service-worker-navigation.test.js` covering the three contract cases
  - [x] rebuild a redirected cached response before returning it as a navigation fallback; browser verification produced `ERR_FAILED` for an uncached document because the precached `/offline.html` was stored as a redirected response and `respondWith` rejects those for navigations
  - [x] confirm the documents behave correctly in a browser; with an active service worker and DevTools Offline, navigation to `/` returned the application, `/cookies` returned its own cached document, and the uncached `/offline-fallback-test-7352.html` rendered the cached `offline.html` instead of `ERR_FAILED`
  - **Completion condition:** after an online visit to a legal page, an offline navigation to `/` renders the application, and an offline navigation to an uncached document renders `offline.html`
  - **Verification:** manual browser verification passed against an active service worker with DevTools Offline enabled. The focused regression test additionally fails against the previous implementation and passes against the current one, executed in a Node sandbox because the Vitest native binding was unavailable in the implementation environment.
  - **Context:** `npx serve` enables `cleanUrls`, so `/offline.html` answers `301` to `/offline`. Verified by request: `/offline.html`, `/index.html`, `/cookies.html` all return `301`, while `/` returns `200`. A host that redirects document URLs reproduces the same condition, so the correction is not specific to local development.
  - **Source:** `AUDIT.md` — P1-02

## Phase 3 — Accessibility of implemented interactions

**Goal:** Close the two verified gaps where implemented interactions are not communicated to assistive technology.

- [x] **PH3-01 — Expose the active route programmatically in application navigation** — Priority: Medium
  - [x] emit `aria-current="page"` on the active link in `renderNavigationLinks()` alongside the existing `sidebar__link--active` class; inactive links omit the attribute rather than carrying a false value
  - [x] confirm the attribute applies in both the desktop sidebar and the mobile drawer, which share `renderNavigationLinks()` through `renderSidebar()` and `renderNavList()`
  - [x] match the convention already used on the static pages and styled in `css/views/legal.css:212`
  - [x] regenerate `service-worker-assets.js`, since `js/components/sidebar.js` belongs to the precached app shell; the version advanced from `85687ffbb568` to `fb6b62e8d43d`
  - **Verification:** the focused case in `tests/unit/components.test.js` asserts that exactly one link carries `aria-current="page"`, that it sits on the active route in both renderers, and that it moves on a route change. Its assertions were executed against the real module in a Node sandbox; Vitest itself could not run because its native binding was unavailable in the implementation environment.
  - **Source:** `AUDIT.md` — P2-01

- [x] **PH3-02 — Communicate form validation failures at the moment they occur** — Priority: Medium
  - [x] choose one mechanism: the shared error element rendered by `errorMarkup()` is now a `role="status"` region, so a message written by `setFieldError()` is announced when it appears. Focus movement was not added, because every consumer already routes through `setFieldError()` and one mechanism is sufficient.
  - [x] apply it so every form built from `inputField`, `selectField` and `textareaField` benefits; all three call the same `errorMarkup()`, so no view holds its own implementation and the login submit handler needed no change
  - [x] preserve the existing `aria-invalid` and `aria-describedby` wiring, which is already correct
  - [x] regenerate `service-worker-assets.js` after the change; the version advanced from `fb6b62e8d43d` to `beb4ccc11c57`
  - **Verification:** the focused case in `tests/unit/components.test.js` covers all three field types — the region carries `role="status"`, a written message appears while `aria-invalid` flips to `true`, `aria-describedby` keeps pointing at the error id, and clearing removes both. Assertions were executed against the real exported module in an inline Node run; Vitest itself could not run because its native binding was unavailable in the implementation environment.
  - **Note:** the announcement was not verified with an actual screen reader. `role="status"` was chosen over `role="alert"` as the least disruptive valid configuration, since the user has just submitted and nothing else is speaking.
  - **Source:** `AUDIT.md` — P2-02

## Phase 4 — State resilience and asset consistency

**Goal:** Stop reporting outcomes the implementation cannot guarantee, and remove the remaining asset-path inconsistency.

- [x] **PH4-01 — Surface failed local persistence instead of reporting success** — Priority: Medium
  - [x] propagate the boolean returned by `storage.set()`; the adapter gained `persistState()`, which returns `{ state, persisted }`, and `saveState()` now wraps it so the existing repository contract is unchanged
  - [x] let `commitActionResult` distinguish a validated action from a durably persisted one; a failed write returns `{ ok: false, error: 'storage-write-failed' }` instead of reporting success
  - [x] surface the difference through the existing toast feedback rather than adding a new notification mechanism; every consumer already branches on `result.ok`, so the existing failure toasts now cover a failed write with no view changes
  - [x] preserve the startup warning in `js/main.js:285-287`, which already covers fully unavailable storage
  - [x] regenerate `service-worker-assets.js` after the change
  - [x] restore a passing app-shell performance budget; `appShellGzipBytes` was recalibrated from 170 KB to 180 KB as an approved project decision, with the rationale recorded in `docs/performance-budget.md`. No asset was removed from the precache and no other limit was changed.
  - **Verification:** the focused case in `tests/unit/store.test.js` forces the storage write to fail and asserts that validation still succeeds, the action does not claim durable success, the reason is explicit, in-memory state still updates, and a domain validation failure stays distinguishable. Its assertions were executed against the real exported store and persistence modules in an inline Node run; Vitest itself could not run because its native binding was unavailable in the implementation environment.
  - **Source:** `AUDIT.md` — P2-05

- [x] **PH4-02 — Normalize the sidebar logo path and settle its precache status** — Priority: Low
  - [x] change the sidebar brand image to the root-relative `/assets/logo/logo.svg` used by `js/views/loginView.js` and all three legal pages; a sweep of every `src`/`href` literal in runtime JavaScript confirmed this was the only relative project-asset reference
  - [x] decide whether `assets/logo/` should be added to `runtimeDirectories` in `scripts/generate-service-worker-manifest.js`; it was added, so the shell logo is precached rather than depending on an incidental first-visit runtime cache. The generator's existing extension filter admits only `logo.svg` (2.3 KB gzip) and keeps the unused `logo.png` out of the shell.
  - [x] confirm the resulting app-shell size satisfies the enforced budget; the executed check reports 172.3 KB against the 180 KB limit, leaving 7.7 KB of headroom
  - [x] regenerate `service-worker-assets.js` after the change; the version advanced from `0c94d3dc733c` to `76feb9d54448` and the asset count from 89 to 90, with `/assets/logo/logo.svg` as the only addition
  - **Completion condition:** no runtime module references a project asset with a relative path, and the logo's precache status is a deliberate, recorded choice
  - **Verification:** the focused case in `tests/unit/components.test.js` asserts that both `renderSidebar()` and `renderNavList()` emit `/assets/logo/logo.svg` and contain no `src="assets/` literal. Its assertions were executed against the real exported renderer in an inline Node run; Vitest itself could not run because its native binding was unavailable in the implementation environment.
  - **Depends on:** `PH1-02`
  - **Source:** `AUDIT.md` — P2-03

## Phase 5 — Project contract documentation

**Goal:** Remove the two places where repository documents contradict the repository itself.

- [x] **PH5-01 — Resolve the duplicate not-found mechanism** — Priority: Low
  - [x] confirm that `_redirects` (`/*    /index.html   200`) makes the committed `404.html` unreachable on the current hosting model
  - [x] keep one mechanism: `404.html` was removed, `_redirects` remains the server-side fallback and `renderNotFoundView` remains the application-level not-found view. A repository sweep confirmed the file was referenced only by audit and plan text, never by runtime code, tests, the manifest generator, the generated app shell, `sitemap.xml` or `robots.txt`, so no regeneration was required.
  - [x] record the resulting routing behavior, including the soft-404 trade-off, in the deployment section of `README.md`, in both the Polish and the English section
  - **Completion condition:** the repository contains exactly one documented not-found mechanism consistent with `_redirects`
  - **Verification:** a new case in `tests/unit/router.test.js` asserts that an unknown hash path resolves to `renderNotFoundView`. Its assertion was executed against the real router in an inline Node run; Vitest itself could not run because its native binding was unavailable in the implementation environment.
  - **Source:** `AUDIT.md` — P2-04

- [x] **PH5-02 — Align the changelog claim about CI** — Priority: Low
  - [x] correct the 1.0.0 entry in `CHANGELOG.md`, which listed CI among the delivered toolchain while no workflow configuration exists; the unsupported claim was dropped and the entry now names the mechanism that does exist
  - [x] keep the entry consistent with `README.md`, which states directly that the project contains no deployment script or GitHub Actions workflow; both README language sections were inspected and needed no change
  - [x] describe the actual mechanism, the local `npm run check` gate, rather than removing the line without replacement; the wording follows the current `package.json` chain exactly
  - **Completion condition:** no repository document claims automation that is not present
  - **Verification:** a repository sweep for `CI`, `continuous integration`, `GitHub Actions` and `workflow` across maintained Markdown and JSON found no remaining claim that automation exists. `docs/architecture.md:216` and `docs/adr/006-pwa-generated-app-shell.md:20` refer to CI conditionally, as something the repository could adopt, and `docs/performance-budget.md` describes Lighthouse CI as a separate tool that is not run here.
  - **Source:** `AUDIT.md` — P2-06

## Phase 6 — Final verification

**Goal:** Confirm the full gate passes on a clean checkout, on evidence rather than assumption.

- [x] **PH6-01 — Execute and record the complete quality gate** — Priority: High
  - [x] correct the stale accessible-name expectation in `tests/e2e/visual-smoke.spec.js`; the legal pages expose the return link as `Wróć do logowania FlowDesk`, so the selector was aligned to the markup rather than the markup to the test
  - [x] run `npm run check` end to end on a clean checkout with a platform-correct dependency installation; the gate completed with exit code 0 in a fresh Windows verification worktree created from `e5a6ff2` after `npm ci`
  - [x] record the outcome of the two suites that could not be executed during the 2026-08-03 audit. Vitest: 17 unit files with 103 tests and 5 integration files with 14 tests, all passing. Playwright: 36 end-to-end tests and 12 accessibility tests, all passing. The audit counted 21 Vitest files and 5 Playwright specs; the Vitest total is now 22 files because `tests/unit/service-worker-navigation.test.js` was added under `PH2-01`, and the Playwright spec total is unchanged, only reported split by suite.
  - [x] regenerate `service-worker-assets.js` last, after all app-shell changes from Phases 2 to 4 are in place; the committed manifest is version `76feb9d54448` with 90 assets and `npm run pwa:check` exits zero
  - [x] update the readiness statement in `AUDIT.md` once the P1 findings are resolved and the gate passes
  - **Completion condition:** `npm run check` completes successfully end to end and the result is reflected in the audit readiness status
  - **Verification:** the full chain passed in order — PWA manifest check, ESLint, Stylelint, Prettier, unit and integration Vitest, Playwright end-to-end, Playwright accessibility, CSS and JavaScript builds, and the performance budget at 57.5 KB JavaScript, 15.3 KB CSS and 172.3 KB app shell. The final build regenerated `css/style.min.css`, which had been stale relative to `css/components/badge.css` and `css/views/dashboard.css`; the regenerated file matches those canonical sources.
  - **Depends on:** `PH1-01`, `PH1-02`, `PH1-03`, `PH2-01`, `PH3-01`, `PH3-02`, `PH4-01`, `PH4-02`, `PH5-01`, `PH5-02`

## Optional future improvements

- [x] **O-01 — Clarify the role of the unserved minified artifacts**
  - **Value:** `css/style.min.css` and `js/main.min.js` are tracked and rebuilt by `npm run check` but never served, since `index.html` loads the sources directly. Terser does not bundle, so `js/main.min.js` still imports unminified siblings. Documenting them as reference output, or deriving the served assets from them, would remove a standing ambiguity about which files represent the production contract.
  - **Scope boundary:** Non-blocking. The exclusion is explicit in the generator's `ignoredFiles` set and nothing breaks at runtime.
  - **Resolution:** superseded by the Vite migration rather than by documentation. The ambiguity is removed at its source: `dist/` is now the only production artefact, Vite bundles and hashes the output that production HTML references, and the two unserved minified files were deleted. `docs/adr/005-build-without-bundler.md` is marked superseded and keeps its historical record; `docs/adr/009-vite-production-build.md` documents the new contract.
  - **Verification:** implementation is complete and statically checked. The production build, PWA check, performance budget and browser suites still require a Windows run, because the Linux sandbox cannot load the platform-specific Rollup binary. See the Windows verification block in the migration report.

- [x] **O-02 — Move security headers into hosting configuration**
  - **Value:** The Content Security Policy exists only as a `<meta http-equiv>` tag in `index.html`; the four static pages carry none. A new `_headers` file alongside `_redirects` would apply one policy across every document and allow directives a meta tag cannot express, notably `frame-ancestors`. The runtime already emits no inline styles or handlers, so a strict policy carries little risk.
  - **Scope boundary:** Non-blocking and outside the original demo scope. Hosting security headers are now a present capability rather than production work left for later.
  - **Implementation:** a source-root `_headers` file carries the Content-Security-Policy plus `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options` and `Permissions-Policy`, and is copied into `dist/` through the existing `staticAssets` allowlist. The policy gained `frame-ancestors 'none'`, and the `<meta http-equiv="Content-Security-Policy">` element was removed from `index.html` so there is one source of truth. A scan of all five documents and of `js/` found no inline script, inline event handler or inline `style` attribute, so no directive was weakened.
  - **Verification:** `npm run check` passed in full, the build produced `dist/_headers` identical to the source file, and the built HTML contains no CSP meta element. A Netlify **draft** deploy (`6a734a072053f50e32eb67f8`) processed one header rule without errors, and HTTP responses for `/`, `/offline.html` and `/regulamin.html` each carried the expected Content-Security-Policy including `frame-ancestors 'none'`, together with all four complementary headers. Verification was performed against that draft deploy; no production deployment was made, and no browser-console CSP inspection was recorded.

- [ ] **O-03 — Measure the CSS entry-point request pattern**
  - **Value:** `css/style.css` is a 1 KB file of 26 `@import` statements, which the browser resolves as a request chain on first visit. The service worker removes the cost for repeat visits but not for first paint. A measurement would replace assumption with evidence before any structural change is considered.
  - **Scope boundary:** Non-blocking. No measurement was taken and no regression is claimed. The layered CSS structure is a deliberate architecture decision.
