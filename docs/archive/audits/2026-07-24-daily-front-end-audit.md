# Daily Front-End Audit — FlowDesk

**Audit date:** 2026-07-24
**Project type:** frontend-only static SPA service management dashboard demo
**Audit mode:** static repository review

## Overall assessment

FlowDesk has a clear Vanilla JavaScript module structure, deliberate browser-local persistence boundaries, and meaningful test and release tooling. No P0 blocker was detected. Normal development can continue after resolving the stale app-shell manifest: the current generated cache version no longer represents the runtime sources. The remaining findings are contained documentation and route-resilience issues.

## Verified strengths

- The runtime is separated into views, reusable components, core state, domain validation, repositories, and utilities.
- Browser-local state is normalized through migrations and validators before persistence, while demo authentication is explicitly isolated from production security claims.
- Dynamic text rendering is consistently guarded by escaping helpers or safe DOM APIs, with dedicated security-rendering tests.
- The UI includes skip-link, visible-focus, dialog, keyboard, focus-return, and reduced-motion mechanisms, with configured Playwright + axe coverage.
- The service worker has a defined cache strategy and a generator-backed app-shell contract; the read-only drift check correctly detects the current mismatch.
- `npm run perf:budget` passes all configured gzip limits, and source JavaScript, the service worker, and project scripts pass `node --check`.

## P0 — Critical risks

None detected.

## P1 — Important issues worth fixing next

### [P1-01] Generated app-shell manifest is stale

- **Classification:** Contract mismatch
- **Evidence:** `service-worker-assets.js:3`, `scripts/generate-service-worker-manifest.js:62`, read-only `npm run pwa:check`
- **Current behavior:** `npm run pwa:check` fails because the generated manifest cache version does not match the current runtime-source hash, even though its app-shell path list is complete.
- **Impact:** `service-worker.js` derives `CACHE_NAME` from this version. A release can therefore reuse an old cache name while serving cache-first runtime assets, leaving cached or offline users on stale application resources.
- **Recommended direction:** run `npm run pwa:manifest`, commit the regenerated `service-worker-assets.js` with the source change, and require `npm run pwa:check` before a release-mirror sync.

## P2 — Minor refinements

### [P2-01] Backend-readiness gate references a removed task file

- **Classification:** Contract mismatch
- **Evidence:** `docs/future-saas-readiness.md:137`
- **Current behavior:** the current implementation gate requires `TO-DO.md` to keep Priority 4 active, but `TO-DO.md` is not present in the repository.
- **Impact:** maintainers cannot verify the stated readiness condition and may follow a retired planning source.
- **Recommended direction:** replace the dependency with the current readiness source of truth, or remove the obsolete file requirement from the gate.

### [P2-02] Malformed dynamic route encoding can terminate route handling

- **Classification:** Source-visible risk
- **Evidence:** `js/core/router.js:36`
- **Current behavior:** dynamic route parameters are passed directly to `decodeURIComponent`. A malformed fragment such as `#/clients/%` causes `URIError` before the route can render a fallback view.
- **Impact:** an authenticated visitor opening a malformed client or project URL can be left without the expected not-found route handling.
- **Recommended direction:** decode route parameters defensively and route invalid encodings to the existing not-found view; add a focused router test.

## Extra quality improvements

None detected.

## Verification performed

- Inspected repository structure, Git state, package scripts, README, architecture, PWA, performance, release, accessibility, and backend-readiness documentation.
- Inspected canonical HTML, CSS architecture, routing, store/actions, persistence, repositories, sanitization, service worker, manifest generator, generated app-shell manifest, and configured test suites.
- Ran `git status --short` and `git diff --check`; the worktree was clean and no whitespace errors were reported.
- Ran `npm run pwa:check`; it failed and produced the P1 finding.
- Ran `npm run perf:budget`; all configured gzip budgets passed.
- Ran `node --check` for non-minified application modules, `service-worker.js`, and both project scripts; all passed.
- Performed focused static scans for unsafe DOM sinks, stale planning references, and high-confidence credential patterns; no credential exposure was detected.
- Did not run lint, Vitest, or Playwright suites because `node_modules` and the corresponding local test tooling are unavailable. No dependency installation, formatter, build, or deployment command was run.

## Senior rating

**Rating:** 8/10

The project is well structured for its frontend-only demo scope and has useful validation, accessibility, and persistence foundations. The stale committed service-worker manifest is a meaningful release and offline-cache contract issue, while the remaining findings are low-impact and contained. The intentionally absent backend, cloud synchronization, and production authentication are not defects within the documented scope.
