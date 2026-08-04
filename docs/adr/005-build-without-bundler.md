# ADR 005: Build and minification without a bundler

## Status

Superseded by [ADR 009](009-vite-production-build.md).

The decision below is preserved as the record of how FlowDesk was built before the Vite migration. It described the state accurately at the time and is not rewritten here.

## Context

FlowDesk currently uses native ES Modules and static files. Introducing a bundler would add migration work and more tooling decisions.

## Decision

Keep the current build strategy:

- PostCSS and cssnano for CSS output,
- Terser for `js/main.js` minification,
- no bundler for the full module graph yet.

## Artefact contract under this decision

While this decision was in force, canonical source and served runtime were the same files. `index.html` referenced `/css/style.css` and `/js/main.js` directly, and the generated app-shell manifest precached those sources together with the CSS layers and ES modules they pulled in.

`css/style.min.css` and `js/main.min.js` were tracked build-validation output, not part of the served contract. Their limitations were asymmetric: `css/style.min.css` was flattened and self-contained through `postcss-import`, while `js/main.min.js` was Terser output of the entry module alone and retained its `import` statements to unminified siblings, so it was never a production bundle.

That ambiguity — a build producing artefacts nothing served — is what ADR 009 resolves. Both files were removed when the Vite contract replaced them.

## Consequences

- The development model remained transparent.
- The service worker had to cache runtime ES modules explicitly through the generated manifest.
- `js/main.min.js` was not a full production bundle.
- The minified artefacts added review noise on every build without contributing to the deployed application.
- A future bundler migration was expected once module count, deployment needs or TypeScript justified it. That migration is ADR 009.
