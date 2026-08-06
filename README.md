# FlowDesk

## PL

### Przegląd projektu

FlowDesk jest frontendową aplikacją SPA typu Service Management Dashboard dla małych zespołów usługowych. Projekt demonstruje obsługę klientów, zleceń, wydarzeń i podstawowych wskaźników operacyjnych w statycznym interfejsie SaaS zbudowanym w HTML, CSS i Vanilla JavaScript ES Modules.

Aplikacja działa wyłącznie w przeglądarce. Uwierzytelnianie ma charakter demonstracyjny — formularz sprawdza format adresu e-mail i minimalną długość hasła, a następnie tworzy lokalną sesję. Dane są przechowywane przez `localStorage` za granicą repozytoriów. Repozytorium nie zawiera backendu, zewnętrznej bazy danych, produkcyjnego auth, live API, billingu ani synchronizacji w chmurze.

### Wersja online

[Otwórz publiczne demo FlowDesk](https://saas-pr01-flowdesk.netlify.app/).

Niezalogowany użytkownik jest kierowany do `#/login`. Do demonstracyjnego logowania można użyć fikcyjnego adresu, np. `demo@flowdesk.test`, oraz dowolnego hasła o długości co najmniej 6 znaków, np. `demo123`. Dane logowania nie są wysyłane do serwera.

### Kluczowe funkcje

- Trasy hash dla logowania oraz chronionych sesją demo widoków dashboardu, klientów, szczegółów klienta, zleceń, szczegółów zlecenia, kalendarza i ustawień.
- Dashboard z KPI, aktywnymi zleceniami, nadchodzącymi wydarzeniami i elementami wymagającymi uwagi.
- Zarządzanie klientami z wyszukiwaniem, filtrowaniem, sortowaniem, edycją, archiwizacją, przywracaniem i powiązanymi szczegółami.
- Kanban zleceń z filtrami statusu i priorytetu oraz szczegółami obejmującymi checklisty, SLA, estymacje, komentarze i historię.
- Tworzenie, edycja i usuwanie wydarzeń kalendarza powiązanych z klientami i zleceniami.
- Globalne wyszukiwanie klientów, zleceń i wydarzeń oraz szybkie akcje dodawania.
- Motyw jasny i ciemny, preferencja ograniczenia animacji, eksport JSON, walidowany import JSON i reset danych demo.
- Walidacja domenowa, migracje stanu, bezpieczne renderowanie tekstu i potwierdzenia akcji destrukcyjnych.
- Manifest aplikacji, service worker, cache app-shell, fallback offline i kontrolowany komunikat o aktualizacji.
- Publiczne strony prawne: polityka prywatności, regulamin i polityka cookies, z własnym przełącznikiem motywu.

### Stack technologiczny

- **Runtime:** HTML5, CSS, Vanilla JavaScript ES Modules i routing oparty na hash fragmentach.
- **API przeglądarki:** `localStorage`, Service Worker, Cache API, Web App Manifest i `Blob`.
- **Style:** design tokens oraz źródłowe warstwy `base`, `layout`, `components` i `views`.
- **Build:** Vite 7 z PostCSS i `postcss-import`.
- **Testy:** Vitest z jsdom, Playwright oraz `@axe-core/playwright`.
- **Jakość kodu:** ESLint, Stylelint, Prettier i własne walidatory PWA oraz budżetu wydajności.
- **Hosting:** konfiguracja Netlify z publikacją katalogu `dist/`.

Projekt nie używa frameworka aplikacyjnego. HTML, CSS i JavaScript są pisane bezpośrednio; Vite pełni wyłącznie rolę narzędzia developmentu i builda.

### Architektura

Kanonicznymi punktami wejścia są `css/style.css` i `js/main.js`. Bootstrap inicjalizuje motyw, observability readiness, shell aplikacji, routing, globalne wyszukiwanie, komponenty nawigacyjne oraz rejestrację service workera.

Router w `js/core/router.js` obsługuje statyczne i dynamiczne trasy hash oraz guard sesji demo. Widoki korzystają z fasady store'a, jawnych akcji i selektorów, a zapis przechodzi przez warstwę persistence, repozytoria i adapter `localStorage`:

```text
views
  -> store
  -> actions / selectors
  -> persistence
  -> repositories
  -> localStorage adapter
  -> migrations / domain validation
```

`js/components/` zawiera współdzielone elementy UI, a `js/domain/` modele, walidatory, migracje, kontekst identity, kontrakt RBAC i metadane przyszłej synchronizacji. `js/core/auth.js` pozostaje fasadą dla implementacji demo w `js/core/auth.demo.js`.

Identity, RBAC i sync metadata są warstwami gotowości frontendowej, a nie mechanizmem bezpieczeństwa — nie istnieje serwerowe egzekwowanie uprawnień. Observability przechowuje sanitizowany bufor błędów w pamięci i nie wysyła danych do zewnętrznego providera.

Decyzje architektoniczne opisują dokumenty w [`docs/adr/`](docs/adr/).

### Struktura projektu

```text
DS-saas-pr01-FlowDesk/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── logo/
├── css/
│   ├── components/
│   ├── layout/
│   ├── views/
│   ├── base.css
│   ├── tokens.css
│   └── style.css          # kanoniczne wejście CSS
├── docs/
│   ├── adr/
│   ├── archive/           # zamknięte audyty i plany
│   └── qa/
├── js/
│   ├── components/
│   ├── core/
│   ├── data/
│   ├── domain/
│   ├── repositories/
│   ├── utils/
│   ├── views/
│   ├── legal-theme.js     # klasyczny skrypt stron prawnych
│   └── main.js            # kanoniczne wejście JavaScript
├── scripts/               # generator manifestu PWA, checker budżetu
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── a11y/
├── index.html
├── cookies.html
├── polityka-prywatnosci.html
├── regulamin.html
├── offline.html
├── manifest.webmanifest
├── service-worker.js
├── _headers
├── _redirects
├── netlify.toml
├── vite.config.js
└── package.json
```

`dist/` jest generowanym artefaktem produkcyjnym. Katalog jest ignorowany przez Git i nie należy go edytować ręcznie.

### Instalacja

Repozytorium używa npm i zawiera `package-lock.json`. Nie deklaruje wymaganej wersji Node.js w `package.json`; `netlify.toml` ustawia dla builda `NODE_VERSION = "22"`.

```bash
npm ci
```

Vite i Playwright korzystają z binariów zależnych od platformy, więc instalację należy wykonać na docelowym systemie.

### Development lokalny

```bash
npm run dev
```

Serwer deweloperski Vite startuje na `http://localhost:8181`. Projekt wymaga serwera HTTP; uruchamianie `index.html` przez `file://` nie obsługuje poprawnie modułów, ścieżek absolutnych i service workera.

Service worker rejestruje się wyłącznie w buildzie produkcyjnym, więc development nie jest zanieczyszczany cache'em app-shell.

### Dostępne skrypty

| Komenda | Zakres |
| --- | --- |
| `npm run dev` | Uruchamia serwer deweloperski Vite na porcie 8181. |
| `npm run build` | Buduje `dist/` przez Vite i generuje manifest app-shell. |
| `npm run preview` | Serwuje zbudowany katalog `dist/` na porcie 4173. |
| `npm run lint` | Uruchamia ESLint, Stylelint i `prettier --check`. |
| `npm run format` | Formatuje obsługiwane pliki przez Prettier. |
| `npm run test` | Uruchamia testy jednostkowe i integracyjne Vitest. |
| `npm run test:unit` | Uruchamia katalog `tests/unit`. |
| `npm run test:integration` | Uruchamia katalog `tests/integration`. |
| `npm run test:e2e` | Uruchamia testy Playwright z katalogu `tests/e2e`. |
| `npm run test:a11y` | Uruchamia testy Playwright i axe z katalogu `tests/a11y`. |
| `npm run pwa:manifest` | Generuje `dist/service-worker-assets.js`. |
| `npm run pwa:check` | Sprawdza aktualność wygenerowanego manifestu app-shell. |
| `npm run perf:budget` | Sprawdza gzipowane limity zasobów app-shell w `dist/`. |
| `npm run lighthouse` | Alias o historycznej nazwie; uruchamia ten sam checker co `perf:budget` i nie uruchamia Lighthouse. |
| `npm run check` | Lint, testy, build, PWA check, budżet wydajności, testy e2e i a11y. |

### Build produkcyjny

```bash
npm run build
```

Komenda uruchamia Vite, a następnie generuje `dist/service-worker-assets.js`. Produkcyjnym artefaktem jest wyłącznie katalog `dist/` i to jego publikuje Netlify.

Build jest wielostronicowy i obejmuje `index.html`, trzy strony prawne oraz `offline.html`. Vite bunduje moduły ES, konsoliduje i minifikuje CSS oraz emituje hashowane pliki do `dist/build/`. Produkcyjny HTML odwołuje się do wygenerowanych assetów, nie do plików źródłowych.

Pliki o stabilnych adresach — fonty, ikony, logo, `manifest.webmanifest`, `service-worker.js`, `robots.txt`, `sitemap.xml`, `_headers` i `_redirects` — kopiuje jawna lista w `vite.config.js`. Szczegóły opisuje [`docs/adr/009-vite-production-build.md`](docs/adr/009-vite-production-build.md).

### Testy i walidacja

Vitest pokrywa domenę, store, akcje, repozytoria, migracje, persystencję i komponenty w `tests/unit`, oraz widoki i przepływy w `tests/integration`. Playwright jest skonfigurowany dla Chromium i obejmuje krytyczne ścieżki, nawigację mobilną, scenariusze PWA oraz visual smoke. Osobny zestaw Playwright z axe sprawdza główne widoki i wybrane stany interaktywne.

Główną lokalną bramką jakości jest:

```bash
npm run check
```

Skrypt buduje `dist/` przed walidacjami, które go wymagają. Katalog `dist/` jest ignorowany przez Git, więc bramka nie modyfikuje śledzonych plików.

Repozytorium nie zawiera konfiguracji CI. `npm run check` jest bramką lokalną.

### Wdrożenie

`netlify.toml` ustawia komendę builda `npm run build` i publikuje katalog `dist`. Reguła w `_redirects` zapewnia fallback SPA, a `_headers` dostarcza nagłówki bezpieczeństwa dla wszystkich dokumentów. Publiczny origin, `canonical`, Open Graph, `robots.txt` i `sitemap.xml` wskazują `https://saas-pr01-flowdesk.netlify.app/`.

Obsługa nieznanych adresów działa na dwóch poziomach. Nieznane ścieżki serwera trafiają przez regułę `/*    /index.html   200` do `index.html`, a nieznane trasy hash aplikacji renderuje `renderNotFoundView`. Reguła catch-all odpowiada statusem `200`, więc dla ścieżek serwera obowiązuje model soft-404, a nie prawdziwa odpowiedź HTTP `404`.

Publikacja jest utrzymywana ręcznie przez Netlify CLI. Repozytorium nie zawiera skryptu wdrożeniowego ani integracji Git z Netlify. Procedury release i rollback opisuje [`docs/release-checklist.md`](docs/release-checklist.md).

### Dostępność

Interfejs korzysta z semantycznych landmarków, skip linku, natywnych kontrolek, etykiet `label`/`for`, obsługi klawiatury, widocznych stanów fokusu, pułapki fokusu i przywracania fokusu w modalu oraz drawerze, synchronizacji `aria-expanded`, `aria-current="page"` na aktywnej trasie, komunikatów błędów formularza w regionie `role="status"` oraz obsługi `prefers-reduced-motion`.

Zestaw axe w `tests/a11y` sprawdza główne widoki i wybrane stany interaktywne. Nie jest to deklaracja formalnej zgodności z WCAG. Zachowanie nie zostało zweryfikowane czytnikiem ekranu.

### SEO

Dokumenty publiczne mają tytuły, opisy meta, `canonical`, metadane Open Graph i Twitter oraz obraz podglądu społecznościowego. Repozytorium zawiera `robots.txt` i `sitemap.xml` z czterema publicznymi adresami.

README nie publikuje wyników pozycjonowania ani nie deklaruje efektów optymalizacji.

### PWA i obsługa offline

`manifest.webmanifest` deklaruje nazwę, tryb `standalone`, `start_url`, kolory motywu, dwie ikony aplikacji oraz trzy skróty do dashboardu, klientów i zleceń.

`service-worker.js` precache'uje app-shell na podstawie generowanego `dist/service-worker-assets.js`, obsługuje nawigację strategią network-first z cache'em per dokument, statyczne assety strategią cache-first, fallback `offline.html`, kontrolowaną aktualizację przez `SKIP_WAITING` oraz czyszczenie starych cache'y ograniczone do własnego prefiksu. Strony prawne pozostają network-first i są cache'owane runtime.

Szczegóły opisuje [`docs/pwa-strategy.md`](docs/pwa-strategy.md). README nie deklaruje kompletnej instalowalności ani pełnej pracy offline.

### Wydajność

Runtime nie używa frameworka i korzysta z lokalnych fontów `woff2` z `font-display: swap`. Build produkcyjny bunduje JavaScript, konsoliduje CSS i emituje hashowane assety.

`scripts/check-performance-budget.js` liczy gzipowane rozmiary JavaScriptu, CSS, całego app-shell i pojedynczych assetów w `dist/` i kończy się błędem po przekroczeniu limitu. Progi opisuje [`docs/performance-budget.md`](docs/performance-budget.md).

`lighthouserc.cjs` definiuje progi dla osobnego uruchomienia Lighthouse CI, które nie jest częścią tego repozytorium. README nie publikuje wyników Lighthouse ani innych pomiarów wydajności.

### Dane i trwałość stanu

Dane startowe pochodzą z `js/data/seed.js` i używają zarezerwowanych domen `.test` oraz nieroutowalnych numerów telefonów.

Stan aplikacji jest utrwalany w `localStorage` pod kluczem `flowdesk_state_v1`, a sesja demo pod `flowdesk_session_v1`. Zapisany stan jest traktowany jak dane niezaufane: przy każdym odczycie i zapisie przechodzi przez migracje schematu i walidację domenową. Nieudany zapis lokalny jest raportowany do interfejsu, a nie potwierdzany jako sukces.

Ustawienia udostępniają eksport lokalnego JSON, walidowany import oraz reset danych demo.

`localStorage` nie jest przeznaczony do danych poufnych, tokenów ani produkcyjnych rekordów klientów. Nie ma kont użytkowników, synchronizacji w chmurze ani zapisu po stronie serwera.

### Utrzymanie projektu

- Kanonicznymi źródłami są `css/style.css`, `js/main.js` oraz moduły w `css/` i `js/`.
- `dist/` i `dist/service-worker-assets.js` są generowane. Nie edytuj ich ręcznie — odśwież je przez `npm run build`.
- Po zmianie pliku należącego do app-shell uruchom `npm run build` i `npm run pwa:check`, aby wersja cache'a odpowiadała assetom produkcyjnym.
- Pliki o stabilnych adresach dodawaj do listy `staticAssets` w `vite.config.js`.
- Style trzymaj w warstwie odpowiedniego komponentu lub widoku i korzystaj z tokenów z `css/tokens.css`.
- Zamknięte audyty i plany znajdują się w [`docs/archive/`](docs/archive/).

### Licencja

Projekt jest objęty własnościową licencją KP_Code. Pełne warunki zawiera [`LICENSE.md`](LICENSE.md). `package.json` deklaruje `SEE LICENSE IN LICENSE.md`.

## EN

### Project Overview

FlowDesk is a frontend-only Service Management Dashboard SPA for small service teams. The project demonstrates handling of clients, service orders, events and basic operational metrics in a static SaaS interface built with HTML, CSS and Vanilla JavaScript ES Modules.

The application runs entirely in the browser. Authentication is demo-only — the form checks the e-mail format and a minimum password length, then creates a local session. Data is persisted through `localStorage` behind repository boundaries. The repository contains no backend, external database, production authentication, live API, billing or cloud synchronization.

### Live Version

[Open the public FlowDesk demo](https://saas-pr01-flowdesk.netlify.app/).

A signed-out user is routed to `#/login`. For the demo sign-in you can use a fictional address such as `demo@flowdesk.test` and any password of at least 6 characters, for example `demo123`. Credentials are not sent to a server.

### Key Features

- Hash routes for login and for the demo-session-protected dashboard, clients, client detail, service orders, order detail, calendar and settings views.
- Dashboard with KPIs, active service orders, upcoming events and items requiring attention.
- Client management with search, filtering, sorting, editing, archiving, restoring and related details.
- Service-order kanban with status and priority filters, plus details covering checklists, SLA, estimates, comments and history.
- Creating, editing and deleting calendar events linked to clients and service orders.
- Global search across clients, service orders and events, plus quick-add actions.
- Light and dark themes, reduced-motion preference, JSON export, validated JSON import and demo-data reset.
- Domain validation, state migrations, safe text rendering and confirmation of destructive actions.
- Web app manifest, service worker, app-shell cache, offline fallback and a controlled update prompt.
- Public legal pages: privacy policy, terms of service and cookie policy, with their own theme toggle.

### Tech Stack

- **Runtime:** HTML5, CSS, Vanilla JavaScript ES Modules and hash-fragment routing.
- **Browser APIs:** `localStorage`, Service Worker, Cache API, Web App Manifest and `Blob`.
- **Styling:** design tokens and the source `base`, `layout`, `components` and `views` layers.
- **Build:** Vite 7 with PostCSS and `postcss-import`.
- **Testing:** Vitest with jsdom, Playwright and `@axe-core/playwright`.
- **Code quality:** ESLint, Stylelint, Prettier and custom PWA and performance-budget validators.
- **Hosting:** Netlify configuration publishing the `dist/` directory.

The project uses no application framework. HTML, CSS and JavaScript are written directly; Vite serves only as development and build tooling.

### Architecture

The canonical entry points are `css/style.css` and `js/main.js`. The bootstrap initializes the theme, observability readiness, the application shell, routing, global search, navigation components and service worker registration.

The router in `js/core/router.js` handles static and dynamic hash routes and the demo-session guard. Views use the store facade, explicit actions and selectors, and writes pass through the persistence layer, repositories and the `localStorage` adapter:

```text
views
  -> store
  -> actions / selectors
  -> persistence
  -> repositories
  -> localStorage adapter
  -> migrations / domain validation
```

`js/components/` holds shared UI elements, and `js/domain/` holds models, validators, migrations, the identity context, the RBAC contract and future synchronization metadata. `js/core/auth.js` remains a facade over the demo implementation in `js/core/auth.demo.js`.

Identity, RBAC and sync metadata are frontend-readiness layers rather than a security mechanism — no server-side permission enforcement exists. Observability keeps a sanitized in-memory error buffer and sends nothing to an external provider.

Architecture decisions are documented in [`docs/adr/`](docs/adr/).

### Project Structure

```text
DS-saas-pr01-FlowDesk/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── logo/
├── css/
│   ├── components/
│   ├── layout/
│   ├── views/
│   ├── base.css
│   ├── tokens.css
│   └── style.css          # canonical CSS entry point
├── docs/
│   ├── adr/
│   ├── archive/           # closed audits and plans
│   └── qa/
├── js/
│   ├── components/
│   ├── core/
│   ├── data/
│   ├── domain/
│   ├── repositories/
│   ├── utils/
│   ├── views/
│   ├── legal-theme.js     # classic script for the legal pages
│   └── main.js            # canonical JavaScript entry point
├── scripts/               # PWA manifest generator, budget checker
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── a11y/
├── index.html
├── cookies.html
├── polityka-prywatnosci.html
├── regulamin.html
├── offline.html
├── manifest.webmanifest
├── service-worker.js
├── _headers
├── _redirects
├── netlify.toml
├── vite.config.js
└── package.json
```

`dist/` is the generated production artifact. It is Git-ignored and must not be edited by hand.

### Installation

The repository uses npm and includes `package-lock.json`. It does not declare a required Node.js version in `package.json`; `netlify.toml` sets `NODE_VERSION = "22"` for the build.

```bash
npm ci
```

Vite and Playwright rely on platform-specific binaries, so install on the target system.

### Local Development

```bash
npm run dev
```

The Vite development server starts on `http://localhost:8181`. The project requires an HTTP server; opening `index.html` through `file://` does not correctly support modules, absolute paths and the service worker.

The service worker registers only in a production build, so development is never polluted by an app-shell cache.

### Available Scripts

| Command | Scope |
| --- | --- |
| `npm run dev` | Starts the Vite development server on port 8181. |
| `npm run build` | Builds `dist/` through Vite and generates the app-shell manifest. |
| `npm run preview` | Serves the built `dist/` directory on port 4173. |
| `npm run lint` | Runs ESLint, Stylelint and `prettier --check`. |
| `npm run format` | Formats supported files with Prettier. |
| `npm run test` | Runs the Vitest unit and integration suites. |
| `npm run test:unit` | Runs the `tests/unit` directory. |
| `npm run test:integration` | Runs the `tests/integration` directory. |
| `npm run test:e2e` | Runs the Playwright tests in `tests/e2e`. |
| `npm run test:a11y` | Runs the Playwright and axe tests in `tests/a11y`. |
| `npm run pwa:manifest` | Generates `dist/service-worker-assets.js`. |
| `npm run pwa:check` | Verifies that the generated app-shell manifest is current. |
| `npm run perf:budget` | Checks the gzipped app-shell limits in `dist/`. |
| `npm run lighthouse` | Alias kept under a historical name; runs the same checker as `perf:budget` and does not run Lighthouse. |
| `npm run check` | Lint, tests, build, PWA check, performance budget, e2e and a11y suites. |

### Production Build

```bash
npm run build
```

The command runs Vite and then generates `dist/service-worker-assets.js`. The only production artifact is the `dist/` directory, and that is what Netlify publishes.

The build is multi-page and covers `index.html`, the three legal pages and `offline.html`. Vite bundles the ES modules, consolidates and minifies CSS, and emits hashed files into `dist/build/`. Production HTML references the generated assets rather than the source files.

Files with contractual URLs — fonts, icons, logo, `manifest.webmanifest`, `service-worker.js`, `robots.txt`, `sitemap.xml`, `_headers` and `_redirects` — are copied through an explicit allowlist in `vite.config.js`. See [`docs/adr/009-vite-production-build.md`](docs/adr/009-vite-production-build.md).

### Testing and Validation

Vitest covers the domain, store, actions, repositories, migrations, persistence and components in `tests/unit`, and views and flows in `tests/integration`. Playwright is configured for Chromium and covers critical flows, mobile navigation, PWA scenarios and visual smoke checks. A separate Playwright and axe suite checks the main views and selected interactive states.

The main local quality gate is:

```bash
npm run check
```

The script builds `dist/` before the validations that depend on it. `dist/` is Git-ignored, so the gate does not modify tracked files.

The repository contains no CI configuration. `npm run check` is a local gate.

### Deployment

`netlify.toml` sets the build command to `npm run build` and publishes the `dist` directory. The rule in `_redirects` provides the SPA fallback, and `_headers` delivers security headers for every document. The public origin, `canonical`, Open Graph, `robots.txt` and `sitemap.xml` point to `https://saas-pr01-flowdesk.netlify.app/`.

Unknown addresses are handled at two levels. Unknown server paths are rewritten to `index.html` through the `/*    /index.html   200` rule, while unknown application hash routes are rendered by `renderNotFoundView`. The catch-all rule responds with `200`, so server paths follow a soft-404 model rather than returning a true HTTP `404`.

Publishing is performed manually through the Netlify CLI. The repository contains no deployment script and no Netlify Git integration. Release and rollback procedures are documented in [`docs/release-checklist.md`](docs/release-checklist.md).

### Accessibility

The interface uses semantic landmarks, a skip link, native controls, `label`/`for` pairing, keyboard operability, visible focus states, focus trapping and focus restoration in the modal and drawer, `aria-expanded` synchronization, `aria-current="page"` on the active route, form error messages in a `role="status"` region, and `prefers-reduced-motion` handling.

The axe suite in `tests/a11y` checks the main views and selected interactive states. This is not a declaration of formal WCAG conformance. The behaviour has not been verified with a screen reader.

### SEO

The public documents carry titles, meta descriptions, `canonical`, Open Graph and Twitter metadata, and a social preview image. The repository includes `robots.txt` and a `sitemap.xml` with four public addresses.

This README publishes no ranking results and claims no optimization outcomes.

### PWA and Offline Support

`manifest.webmanifest` declares the name, `standalone` display mode, `start_url`, theme colours, two application icons and three shortcuts to the dashboard, clients and service orders.

`service-worker.js` precaches the app shell from the generated `dist/service-worker-assets.js`, handles navigation network-first with a per-document cache, serves static assets cache-first, falls back to `offline.html`, applies a controlled update through `SKIP_WAITING`, and scopes old-cache cleanup to its own prefix. The legal pages remain network-first and are runtime-cached.

See [`docs/pwa-strategy.md`](docs/pwa-strategy.md). This README claims neither complete installability nor full offline operation.

### Performance

The runtime uses no framework and loads local `woff2` fonts with `font-display: swap`. The production build bundles JavaScript, consolidates CSS and emits hashed assets.

`scripts/check-performance-budget.js` calculates gzipped sizes for JavaScript, CSS, the complete app shell and individual assets in `dist/`, and exits with an error when a limit is exceeded. The thresholds are documented in [`docs/performance-budget.md`](docs/performance-budget.md).

`lighthouserc.cjs` defines thresholds for a separate Lighthouse CI run that is not part of this repository. This README publishes no Lighthouse scores or other performance measurements.

### Data and State Persistence

Seed data comes from `js/data/seed.js` and uses reserved `.test` domains and non-routable phone numbers.

Application state is persisted in `localStorage` under the `flowdesk_state_v1` key, and the demo session under `flowdesk_session_v1`. Stored state is treated as untrusted input: on every read and write it passes through schema migrations and domain validation. A failed local write is reported to the interface rather than confirmed as a success.

Settings expose a local JSON export, a validated import and a demo-data reset.

`localStorage` is not intended for confidential data, tokens or production client records. There are no user accounts, no cloud synchronization and no server-side storage.

### Project Maintenance

- The canonical sources are `css/style.css`, `js/main.js` and the modules under `css/` and `js/`.
- `dist/` and `dist/service-worker-assets.js` are generated. Do not edit them by hand — refresh them through `npm run build`.
- After changing a file that belongs to the app shell, run `npm run build` and `npm run pwa:check` so the cache version matches the production assets.
- Add files that need contractual URLs to the `staticAssets` list in `vite.config.js`.
- Keep styles owned by the relevant component or view layer and use the tokens from `css/tokens.css`.
- Closed audits and plans are stored in [`docs/archive/`](docs/archive/).

### License

The project is covered by a proprietary KP_Code license. The full terms are in [`LICENSE.md`](LICENSE.md). `package.json` declares `SEE LICENSE IN LICENSE.md`.
