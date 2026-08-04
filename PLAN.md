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

1. `PH1-01` — Confirm the Prettier and lint checks on a fresh Windows checkout.
2. `PH3-02` — Communicate form validation failures at the moment they occur.
3. `PH4-01` — Surface failed local persistence instead of reporting success.

## Phase 1 — Restore the documented quality gate

**Goal:** Make `npm run check` executable end to end, so every later phase can be verified against a gate that actually passes.

- [ ] **PH1-01 — Eliminate the Prettier failures blocking `npm run lint`** — Priority: High
  - [x] add a repository line-ending policy in `.gitattributes` (`* text=auto eol=lf`, CRLF preserved for `*.bat` and `*.cmd`)
  - [x] remove the stray consecutive blank line in `js/components/topbar.js` and in `regulamin.html`
  - [x] determine why `package.json`, `icons.md` and `LICENSE.md` fail `prettier --check`; `package.json` and `LICENSE.md` differed from expected output only by carriage returns, while `icons.md` additionally required one blank line between an HTML comment and the following block
  - [x] normalize those three files to LF at byte level and apply the single `icons.md` whitespace correction, without reformatting unrelated content
  - [ ] re-run the checks on a fresh Windows checkout to confirm the `.gitattributes` policy holds there
  - **Completion condition:** `npx prettier . --check` reports no files and `npm run lint` exits zero on both a Windows and a Linux checkout
  - **Verified so far:** on Linux, `npx prettier . --check`, `npx eslint .` and `npx stylelint "css/**/*.css"` were executed and passed. `npm run lint` as one chained command exceeded the available execution window, so its three steps were run individually instead.
  - **Source:** `AUDIT.md` — P1-04

- [x] **PH1-02 — Bring the precached app shell within its gzip budget** — Priority: High
  - [x] reduce `assets/icons/favicon/favicon.svg` by stripping content with no rendering purpose; removed the RDF generator block and the embedded EXIF and XMP chunks, and losslessly recompressed the embedded image, taking the file from 37.9 KB to 32.1 KB raw and from 27.1 KB to 23.8 KB gzip with pixel-identical output
  - [x] re-measure the app-shell total; the favicon optimization alone brought it from 196.8 KB to 193.5 KB against the 170 KB limit defined in `scripts/check-performance-budget.js`
  - [x] keep all four Inter `woff2` weights — each is referenced by the design tokens and none is redundant
  - [x] exclude `favicon.svg` from the precached shell through the generator's `ignoredFiles` set, keeping the file served and every document reference intact; the executed check now reports 169.7 KB and exits zero
  - **Completion condition:** `node scripts/check-performance-budget.js` exits zero without weakening a limit that the repository can actually meet
  - **Note:** the app shell now sits 0.3 KB under the limit, so any further app-shell addition will breach it again. Treat the budget as a live constraint when adding runtime modules, styles or fonts.
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

- [ ] **PH3-02 — Communicate form validation failures at the moment they occur** — Priority: Medium
  - [ ] choose one mechanism: make the error element in `js/components/formControls.js:16` a status region, or move focus to the first invalid control on failed submit
  - [ ] apply it so every form built from `inputField`, `selectField` and `textareaField` benefits, starting with the login submit handler (`js/views/loginView.js:75-94`)
  - [ ] preserve the existing `aria-invalid` and `aria-describedby` wiring, which is already correct
  - [ ] regenerate `service-worker-assets.js` after the change
  - **Verification:** one focused test covering a failed submit and the resulting announcement or focus placement
  - **Source:** `AUDIT.md` — P2-02

## Phase 4 — State resilience and asset consistency

**Goal:** Stop reporting outcomes the implementation cannot guarantee, and remove the remaining asset-path inconsistency.

- [ ] **PH4-01 — Surface failed local persistence instead of reporting success** — Priority: Medium
  - [ ] propagate the boolean returned by `storage.set()` through `saveState` in `js/repositories/localStorageRepositoryAdapter.js:13-17`
  - [ ] let `commitActionResult` in `js/core/store.js:41-46` distinguish a validated action from a durably persisted one
  - [ ] surface the difference through the existing toast feedback rather than adding a new notification mechanism
  - [ ] preserve the startup warning in `js/main.js:285-287`, which already covers fully unavailable storage
  - [ ] regenerate `service-worker-assets.js` after the change
  - **Verification:** one focused test where writes are forced to fail and the action reports failure
  - **Source:** `AUDIT.md` — P2-05

- [ ] **PH4-02 — Normalize the sidebar logo path and settle its precache status** — Priority: Low
  - [ ] change `js/components/sidebar.js:13` to the root-relative `/assets/logo/logo.svg` used by `js/views/loginView.js` and all three legal pages
  - [ ] decide whether `assets/logo/` should be added to `runtimeDirectories` in `scripts/generate-service-worker-manifest.js`, so the shell logo is available on a cold offline start
  - [ ] if the directory is added, confirm the resulting app-shell size still satisfies `PH1-02`
  - [ ] regenerate `service-worker-assets.js` after the change
  - **Completion condition:** no runtime module references a project asset with a relative path, and the logo's precache status is a deliberate, recorded choice
  - **Depends on:** `PH1-02`
  - **Source:** `AUDIT.md` — P2-03

## Phase 5 — Project contract documentation

**Goal:** Remove the two places where repository documents contradict the repository itself.

- [ ] **PH5-01 — Resolve the duplicate not-found mechanism** — Priority: Low
  - [ ] confirm that `_redirects` (`/*    /index.html   200`) makes the committed `404.html` unreachable on the current hosting model
  - [ ] keep one mechanism: either document `404.html` as an intentional fallback for hosting without the rewrite, or remove it and rely on `renderNotFoundView`
  - [ ] record the resulting routing behavior, including the soft-404 trade-off, in the deployment section of `README.md`
  - **Completion condition:** the repository contains exactly one documented not-found mechanism consistent with `_redirects`
  - **Source:** `AUDIT.md` — P2-04

- [ ] **PH5-02 — Align the changelog claim about CI** — Priority: Low
  - [ ] correct the 1.0.0 entry in `CHANGELOG.md:11`, which lists CI among the delivered toolchain while no workflow configuration exists
  - [ ] keep the entry consistent with `README.md:162,374`, which states directly that the project contains no deployment script or GitHub Actions workflow
  - [ ] describe the actual mechanism, the local `npm run check` gate, rather than removing the line without replacement
  - **Completion condition:** no repository document claims automation that is not present
  - **Source:** `AUDIT.md` — P2-06

## Phase 6 — Final verification

**Goal:** Confirm the full gate passes on a clean checkout, on evidence rather than assumption.

- [ ] **PH6-01 — Execute and record the complete quality gate** — Priority: High
  - [ ] run `npm run check` on a clean checkout with a platform-correct dependency installation
  - [ ] record the outcome of the two suites that could not be executed during the 2026-08-03 audit: 21 Vitest files and 5 Playwright specs
  - [ ] regenerate `service-worker-assets.js` last, after all app-shell changes from Phases 2 to 4 are in place
  - [ ] update the readiness statement in `AUDIT.md` once the P1 findings are resolved and the gate passes
  - **Completion condition:** `npm run check` completes successfully end to end and the result is reflected in the audit readiness status
  - **Depends on:** `PH1-01`, `PH1-02`, `PH1-03`, `PH2-01`, `PH3-01`, `PH3-02`, `PH4-01`, `PH4-02`, `PH5-01`, `PH5-02`

## Optional future improvements

- [ ] **O-01 — Clarify the role of the unserved minified artifacts**
  - **Value:** `css/style.min.css` and `js/main.min.js` are tracked and rebuilt by `npm run check` but never served, since `index.html` loads the sources directly. Terser does not bundle, so `js/main.min.js` still imports unminified siblings. Documenting them as reference output, or deriving the served assets from them, would remove a standing ambiguity about which files represent the production contract.
  - **Scope boundary:** Non-blocking. The exclusion is explicit in the generator's `ignoredFiles` set and nothing breaks at runtime.

- [ ] **O-02 — Move security headers into hosting configuration**
  - **Value:** The Content Security Policy exists only as a `<meta http-equiv>` tag in `index.html`; the four static pages carry none. A new `_headers` file alongside `_redirects` would apply one policy across every document and allow directives a meta tag cannot express, notably `frame-ancestors`. The runtime already emits no inline styles or handlers, so a strict policy carries little risk.
  - **Scope boundary:** Non-blocking and outside the current demo scope. `README.md` already lists hosting security headers as production work rather than a present capability.

- [ ] **O-03 — Measure the CSS entry-point request pattern**
  - **Value:** `css/style.css` is a 1 KB file of 26 `@import` statements, which the browser resolves as a request chain on first visit. The service worker removes the cost for repeat visits but not for first paint. A measurement would replace assumption with evidence before any structural change is considered.
  - **Scope boundary:** Non-blocking. No measurement was taken and no regression is claimed. The layered CSS structure is a deliberate architecture decision.
