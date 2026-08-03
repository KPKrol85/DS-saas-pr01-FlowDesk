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

1. `PH1-01` — Restore a passing Prettier check so `npm run lint` can complete.
2. `PH1-02` — Bring the precached app shell back within its gzip budget.
3. `PH1-03` — Resynchronize the generated app-shell manifest with committed sources.
4. `PH2-01` — Correct service worker navigation caching and the offline fallback.

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

- [ ] **PH1-02 — Bring the precached app shell within its gzip budget** — Priority: High
  - [ ] reduce `assets/icons/favicon/favicon.svg`, currently 37.9 KB raw and 27.1 KB gzip, by stripping generator metadata that serves no runtime purpose
  - [ ] re-measure the app-shell total; the executed check reports 196.8 KB against the 170 KB limit defined in `scripts/check-performance-budget.js`
  - [ ] keep all four Inter `woff2` weights — each is referenced by the design tokens and none is redundant
  - [ ] adjust the `appShellGzipBytes` budget only if the remaining measured size is deliberately accepted, and record that decision in `README.md`
  - **Completion condition:** `node scripts/check-performance-budget.js` exits zero without weakening a limit that the repository can actually meet
  - **Source:** `AUDIT.md` — P1-03

- [ ] **PH1-03 — Resynchronize the generated app-shell manifest** — Priority: High
  - [ ] run `npm run pwa:manifest` and commit the regenerated `service-worker-assets.js`
  - [ ] confirm the committed `version` value advances from `e774cd33d7db`; the asset list is already correct at 90 entries and only the content hash has drifted
  - [ ] verify the drift originated in `css/components/badge.css`, `css/components/data-display.css` and `css/views/dashboard.css`, and that no further app-shell source is stale
  - **Completion condition:** `npm run pwa:check` exits zero against a clean working tree
  - **Depends on:** `PH1-02`
  - **Source:** `AUDIT.md` — P1-01

## Phase 2 — Service worker and offline contract

**Goal:** Make runtime caching behave as `docs/pwa-strategy.md` specifies, so the offline fallback returns the correct document.

- [ ] **PH2-01 — Key navigation cache writes to the requested document** — Priority: High
  - [ ] replace the fixed `'/index.html'` cache key in `navigationNetworkFirst` (`service-worker.js:39-50`) so each navigation response is stored against its own URL
  - [ ] scope the offline branch so the application shell is returned for application navigations and `offline.html` is returned otherwise
  - [ ] confirm the four indexed documents behave correctly: `/`, `/polityka-prywatnosci.html`, `/regulamin.html` and `/cookies.html`
  - [ ] decide whether the three legal pages should join the precached app shell or remain network-only with an `offline.html` fallback, and reflect that decision in `docs/pwa-strategy.md`
  - **Completion condition:** after an online visit to a legal page, an offline navigation to `/` renders the application, and an offline navigation to an uncached document renders `offline.html`
  - **Source:** `AUDIT.md` — P1-02

## Phase 3 — Accessibility of implemented interactions

**Goal:** Close the two verified gaps where implemented interactions are not communicated to assistive technology.

- [ ] **PH3-01 — Expose the active route programmatically in application navigation** — Priority: Medium
  - [ ] emit `aria-current="page"` on the active link in `renderNavigationLinks()` (`js/components/sidebar.js:18-31`) alongside the existing `sidebar__link--active` class
  - [ ] confirm the attribute applies in both the desktop sidebar and the mobile drawer, which share `renderNavList()`
  - [ ] match the convention already used on the static pages and styled in `css/views/legal.css:212`
  - [ ] regenerate `service-worker-assets.js`, since `js/components/sidebar.js` belongs to the precached app shell
  - **Verification:** one focused test asserting that the active link carries `aria-current="page"` and that it moves on route change
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
