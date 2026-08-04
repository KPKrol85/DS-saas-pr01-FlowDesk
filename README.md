# FlowDesk

## PL

### Przegląd projektu

FlowDesk jest frontendową aplikacją SPA typu Service Management Dashboard dla małych zespołów usługowych. Projekt demonstruje obsługę klientów, zleceń, wydarzeń i podstawowych wskaźników operacyjnych w statycznym interfejsie SaaS zbudowanym w HTML, CSS i Vanilla JavaScript ES Modules.

Aplikacja działa wyłącznie w przeglądarce. Uwierzytelnianie ma charakter demonstracyjny, a dane są przechowywane lokalnie przez `localStorage` za granicą repozytoriów. Repozytorium nie zawiera backendu, zewnętrznej bazy danych, produkcyjnego auth, live API, billingu ani synchronizacji w chmurze.

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

### Stack technologiczny

- **Runtime:** HTML5, CSS, Vanilla JavaScript ES Modules i routing oparty na hash fragmentach.
- **API przeglądarki:** `localStorage`, Service Worker, Cache API, Web App Manifest i `Blob`.
- **Style:** design tokens oraz źródłowe warstwy `base`, `layout`, `components` i `views`.
- **Build:** PostCSS, `postcss-import`, cssnano i Terser.
- **Testy:** Vitest z jsdom, Playwright oraz `@axe-core/playwright`.
- **Jakość kodu:** ESLint, Stylelint, Prettier i własne walidatory PWA oraz budżetu wydajności.
- **Development lokalny:** `serve`, uruchamiany przez skrypt npm.

### Architektura

`index.html` ładuje kanoniczne pliki źródłowe `css/style.css` i `js/main.js`. Bootstrap inicjalizuje motyw, observability readiness, shell aplikacji, routing, globalne wyszukiwanie, komponenty nawigacyjne oraz rejestrację service workera.

Router w `js/core/router.js` obsługuje statyczne i dynamiczne trasy hash oraz guard sesji demo. Widoki korzystają z fasady store'a, jawnych akcji i selektorów, a zapis przechodzi przez warstwę persistence, repozytoria i aktywny adapter `localStorage`:

```text
views
  -> store
  -> actions / selectors
  -> persistence
  -> repositories
  -> localStorage adapter
  -> migrations / domain validation
```

`js/components/` zawiera współdzielone elementy UI, a `js/domain/` modele, walidatory, migracje, kontekst identity, kontrakt RBAC i metadane przyszłej synchronizacji. `js/core/auth.js` pozostaje fasadą dla implementacji demo w `js/core/auth.demo.js`. Identity, RBAC i sync metadata są warstwami gotowości frontendowej, a nie backendowym mechanizmem bezpieczeństwa.

### Struktura projektu

```text
digital-studio-saas-pr01-flowdesk/
|-- assets/
|   |-- fonts/
|   |-- icons/
|   `-- logo/
|-- css/
|   |-- tokens.css
|   |-- base.css
|   |-- layout.css
|   |-- components.css
|   |-- views.css
|   |-- style.css
|   `-- style.min.css
|-- docs/
|   |-- adr/
|   |-- qa/
|   `-- *.md
|-- js/
|   |-- components/
|   |-- core/
|   |-- data/
|   |-- domain/
|   |-- repositories/
|   |-- utils/
|   `-- views/
|-- scripts/
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- e2e/
|   `-- a11y/
|-- index.html
|-- manifest.webmanifest
|-- service-worker.js
|-- service-worker-assets.js
|-- offline.html
|-- package.json
`-- README.md
```

### Instalacja i development lokalny

Repozytorium używa npm i zawiera `package-lock.json`. Nie deklaruje konkretnej wersji Node.js.

```bash
npm ci
npm run dev
```

Na Windows można uruchomić `start-dev.bat`; launcher przechodzi do rootu repozytorium i wywołuje `npm run dev` po weryfikacji lokalnej instalacji zależności.

Po uruchomieniu należy użyć adresu wypisanego przez `serve`. Projekt wymaga lokalnego serwera HTTP; uruchamianie `index.html` przez `file://` nie obsługuje poprawnie modułów, ścieżek absolutnych i service workera.

### Dostępne skrypty

| Komenda | Zakres |
| --- | --- |
| `npm run dev` | Uruchamia statyczny serwer przez `serve`. |
| `npm run lint` | Uruchamia ESLint, Stylelint i `prettier --check`. |
| `npm run format` | Formatuje obsługiwane pliki przez Prettier. |
| `npm run test` | Uruchamia testy jednostkowe i integracyjne Vitest. |
| `npm run test:unit` | Uruchamia katalog `tests/unit`. |
| `npm run test:integration` | Uruchamia katalog `tests/integration`. |
| `npm run test:e2e` | Uruchamia testy Playwright z katalogu `tests/e2e`. |
| `npm run test:a11y` | Uruchamia testy Playwright i axe z katalogu `tests/a11y`. |
| `npm run pwa:manifest` | Generuje `service-worker-assets.js`. |
| `npm run pwa:check` | Sprawdza aktualność wygenerowanego manifestu app-shell. |
| `npm run build` | Generuje manifest PWA oraz buduje minifikowane pliki CSS i JS. |
| `npm run perf:budget` | Sprawdza gzipowane limity zasobów app-shell. |
| `npm run lighthouse` | Deleguje do `npm run perf:budget`; nie uruchamia Lighthouse CLI. |
| `npm run check` | Uruchamia PWA check, lint, testy, build i budżet wydajności. |

### Build i pliki generowane

```bash
npm run build
```

Lifecycle `prebuild` najpierw generuje manifest app-shell. Następnie build tworzy trzy intencjonalnie śledzone pliki:

- `service-worker-assets.js` z `scripts/generate-service-worker-manifest.js`;
- `css/style.min.css` z `css/style.css` przez PostCSS i cssnano;
- `js/main.min.js` z `js/main.js` przez Terser.

Nie należy edytować tych plików ręcznie. Build nie używa bundlera, nie tworzy katalogu `dist/`, a `build:js` minifikuje tylko entrypoint `js/main.js`. Aktualny runtime nadal ładuje źródłowe `css/style.css` i `js/main.js`, natomiast generator app-shell pomija pliki minifikowane.

### Testy i walidacja

Vitest uruchamia testy jednostkowe domeny, store'a, akcji, repozytoriów, migracji, persystencji i komponentów oraz testy integracyjne widoków i przepływów. Playwright jest skonfigurowany dla Chromium i obejmuje krytyczne ścieżki, nawigację mobilną, scenariusze PWA/wydajnościowe oraz visual smoke. Osobny zestaw Playwright + axe sprawdza główne widoki i stany interaktywne.

Główną lokalną bramką jakości jest:

```bash
npm run check
```

Skrypt wykonuje również build, dlatego może zaktualizować śledzone pliki generowane.

### Wdrożenie

FlowDesk jest wdrażany jako statyczna zawartość katalogu repozytorium. Plik `_redirects` zapewnia fallback SPA zgodny z Netlify. Publiczny origin, `canonical`, Open Graph, `robots.txt` i `sitemap.xml` wskazują `https://saas-pr01-flowdesk.netlify.app/`.

Obsługa nieznanych adresów działa na dwóch poziomach. Nieznane ścieżki serwera trafiają przez regułę `/*    /index.html   200` do `index.html`, a nieznane trasy hash aplikacji renderuje `renderNotFoundView`. Reguła catch-all odpowiada statusem `200`, więc dla ścieżek serwera obowiązuje model soft-404, a nie prawdziwa odpowiedź HTTP `404`; renderowanie po stronie klienta nie zmienia statusu oryginalnej odpowiedzi. Repozytorium nie utrzymuje już osobnego statycznego pliku `404.html`.

Publikacja Netlify i synchronizacja deploymentu są utrzymywane przez właściciela poza tym repozytorium, w repozytorium `kp-code-portfolio`. FlowDesk nie zawiera skryptu wdrożeniowego ani workflow GitHub Actions. Procedury release i rollback opisuje [`docs/release-checklist.md`](docs/release-checklist.md).

### Dostępność

Interfejs zawiera skip link, semantyczne obszary `main`, etykiety formularzy, komunikaty błędów, widoczne focus states i obsługę ograniczenia animacji. Modale i mobilny drawer używają nazwanych dialogów, blokują fokus, reagują na `Escape` i przywracają fokus do elementu otwierającego. Globalne wyszukiwanie i menu użytkownika obsługują klawiaturę.

Repozytorium zawiera automatyczne testy axe dla głównych widoków i wybranych stanów interaktywnych. Te mechanizmy i testy nie stanowią deklaracji formalnej zgodności z WCAG.

### SEO

`index.html` zawiera tytuł, meta description, canonical URL, metadane Open Graph i Twitter oraz absolutne adresy publicznych assetów społecznościowych. `robots.txt` wskazuje publiczny `sitemap.xml`, a sitemap zawiera canonical origin.

Routing aplikacji używa hash fragmentów, dlatego wszystkie widoki korzystają z jednego dokumentu HTML, a sitemap opisuje wyłącznie publiczny origin. Repozytorium dokumentuje istniejącą implementację metadanych, bez deklarowania wyników pozycjonowania.

### PWA i obsługa offline

Warstwa PWA składa się z `manifest.webmanifest`, rejestracji service workera, `service-worker.js`, generowanego `service-worker-assets.js`, ikon oraz `offline.html`. Service worker używa network-first dla nawigacji, cache-first dla app-shell i zasobów statycznych oraz network-only z odpowiedzią `503` dla przyszłych żądań `/api/*` w trybie offline.

Nowy service worker czeka na decyzję użytkownika; aplikacja pokazuje trwały toast aktualizacji i wysyła `SKIP_WAITING` dopiero po wybraniu odświeżenia. Opisane mechanizmy nie są deklaracją kompletnej instalowalności we wszystkich przeglądarkach.

### Wydajność

Runtime nie używa frameworka ani bundlera i korzysta z lokalnych fontów. `scripts/check-performance-budget.js` oblicza rozmiary gzip dla JavaScriptu, CSS, całego app-shell i pojedynczych assetów. `lighthouserc.cjs` definiuje progi dla osobnego uruchomienia Lighthouse CI, ale bieżący skrypt `npm run lighthouse` wykonuje wyłącznie lokalny checker budżetu.

README nie publikuje wyników Lighthouse ani innych pomiarów wydajności.

### Dane i trwałość stanu

Dane startowe pochodzą z `js/data/seed.js`. Stan klientów, zleceń, wydarzeń i preferencji UI jest normalizowany przez migracje oraz walidatory domenowe i zapisywany pod kluczem `flowdesk_state_v1`. Sesja demo jest walidowana osobno i przechowywana pod `flowdesk_session_v1`.

Eksport tworzy lokalny plik JSON. Import wymaga pełnego schematu, sprawdza rekordy i zduplikowane identyfikatory, a zapis następuje dopiero po potwierdzeniu. Jeśli `localStorage` jest niedostępny, aplikacja działa bez trwałego zapisu i informuje o tym użytkownika. Nie ma zdalnego backupu ani synchronizacji.

### Utrzymanie projektu

- Kanoniczne style znajdują się w `css/*.css`, a entrypoint w `css/style.css`.
- Kanoniczny bootstrap JavaScript znajduje się w `js/main.js`; moduły pozostają w `js/components/`, `js/core/`, `js/domain/`, `js/repositories/`, `js/utils/` i `js/views/`.
- Po zmianach runtime, CSS, fontów, ikon lub manifestu należy uruchomić `npm run build` i `npm run pwa:check`.
- Wersjonowanie i historia zmian są opisane w [`docs/versioning.md`](docs/versioning.md) oraz [`CHANGELOG.md`](CHANGELOG.md).
- Architektura i decyzje znajdują się w [`docs/architecture.md`](docs/architecture.md) oraz [`docs/adr/`](docs/adr/).
- Konwencje UI opisuje [`docs/design-system.md`](docs/design-system.md).
- Granice przyszłego backendu opisują [`docs/backend-readiness.md`](docs/backend-readiness.md) i [`docs/api-contracts.md`](docs/api-contracts.md).
- Strategie PWA, wydajności i observability opisują [`docs/pwa-strategy.md`](docs/pwa-strategy.md), [`docs/performance-budget.md`](docs/performance-budget.md) i [`docs/observability.md`](docs/observability.md).
- Kryteria zmian i release opisują [`docs/definition-of-done.md`](docs/definition-of-done.md) oraz [`docs/release-checklist.md`](docs/release-checklist.md).

### Granice bieżącej wersji

- Logowanie sprawdza wyłącznie format emaila i minimalną długość hasła, a następnie tworzy lokalną sesję demo.
- `localStorage` nie jest przeznaczony do danych poufnych, tokenów ani produkcyjnych rekordów klientów.
- Identity, RBAC i sync metadata są kontraktami frontendowymi bez serwerowego egzekwowania uprawnień.
- Projekt nie ma backendu, bazy danych, live API, multi-tenant isolation, billingu ani cloud sync.
- Observability przechowuje sanitizowany bufor błędów w pamięci i nie wysyła danych do zewnętrznego providera.
- Build nie tworzy kompletnego, zbundlowanego artefaktu produkcyjnego.

## EN

### Project Overview

FlowDesk is a frontend SPA that demonstrates a Service Management Dashboard for small service teams. The project covers clients, projects, events, and basic operational metrics in a static SaaS-style interface built with HTML, CSS, and Vanilla JavaScript ES Modules. In FlowDesk, a project represents a service job or service order managed for a client.

The application runs entirely in the browser. Authentication is demo-only, and data is persisted locally through `localStorage` behind repository boundaries. The repository has no backend, external database, production authentication, live API, billing, or cloud synchronization.

### Live Version

[Open the public FlowDesk demo](https://saas-pr01-flowdesk.netlify.app/).

Unauthenticated users are redirected to `#/login`. Demo access accepts a fictional address such as `demo@flowdesk.test` and any password with at least 6 characters, such as `demo123`. Credentials are not sent to a server.

### Key Features

- Hash routes for login and demo-session-protected dashboard, client, client-detail, project, project-detail, calendar, and settings views.
- Dashboard with KPIs, active projects, upcoming events, and items requiring attention.
- Client management with search, filtering, sorting, editing, archiving, restoration, and linked detail data.
- Project kanban with status and priority filters plus detail views for checklists, SLA, estimates, comments, and history.
- Creation, editing, and deletion of calendar events linked to clients and projects.
- Global search across clients, projects, and events, plus quick-create actions.
- Light and dark themes, reduced-motion preference, JSON export, validated JSON import, and demo-data reset.
- Domain validation, state migrations, safe text rendering, and confirmation for destructive actions.
- Application manifest, service worker, app-shell cache, offline fallback, and a controlled update prompt.

### Tech Stack

- **Runtime:** HTML5, CSS, Vanilla JavaScript ES Modules, and hash-based routing.
- **Browser APIs:** `localStorage`, Service Worker, Cache API, Web App Manifest, and `Blob`.
- **Styling:** design tokens with source layers for `base`, `layout`, `components`, and `views`.
- **Build:** PostCSS, `postcss-import`, cssnano, and Terser.
- **Testing:** Vitest with jsdom, Playwright, and `@axe-core/playwright`.
- **Code quality:** ESLint, Stylelint, Prettier, and custom PWA and performance-budget validators.
- **Local development:** `serve`, started through an npm script.

### Architecture

`index.html` loads the canonical source files `css/style.css` and `js/main.js`. The bootstrap initializes the theme, observability readiness, application shell, routing, global search, navigation components, and service worker registration.

The router in `js/core/router.js` handles static and dynamic hash routes plus the demo-session guard. Views use the store facade, explicit actions, and selectors, while writes pass through persistence, repositories, and the active `localStorage` adapter:

```text
views
  -> store
  -> actions / selectors
  -> persistence
  -> repositories
  -> localStorage adapter
  -> migrations / domain validation
```

`js/components/` contains shared UI elements, while `js/domain/` contains models, validators, migrations, identity context, the RBAC contract, and future synchronization metadata. `js/core/auth.js` remains a facade for the demo implementation in `js/core/auth.demo.js`. Identity, RBAC, and sync metadata are frontend-readiness layers, not backend security mechanisms.

### Project Structure

```text
digital-studio-saas-pr01-flowdesk/
|-- assets/
|   |-- fonts/
|   |-- icons/
|   `-- logo/
|-- css/
|   |-- tokens.css
|   |-- base.css
|   |-- layout.css
|   |-- components.css
|   |-- views.css
|   |-- style.css
|   `-- style.min.css
|-- docs/
|   |-- adr/
|   |-- qa/
|   `-- *.md
|-- js/
|   |-- components/
|   |-- core/
|   |-- data/
|   |-- domain/
|   |-- repositories/
|   |-- utils/
|   `-- views/
|-- scripts/
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- e2e/
|   `-- a11y/
|-- index.html
|-- manifest.webmanifest
|-- service-worker.js
|-- service-worker-assets.js
|-- offline.html
|-- package.json
`-- README.md
```

### Installation and Local Development

The repository uses npm and includes `package-lock.json`. It does not declare a specific Node.js version.

```bash
npm ci
npm run dev
```

On Windows, run `start-dev.bat`; the launcher moves to the repository root and calls `npm run dev` after verifying the local dependency installation.

Use the address printed by `serve` after startup. The project requires a local HTTP server; opening `index.html` through `file://` does not correctly support modules, absolute paths, and the service worker.

### Available Scripts

| Command | Scope |
| --- | --- |
| `npm run dev` | Starts a static server through `serve`. |
| `npm run lint` | Runs ESLint, Stylelint, and `prettier --check`. |
| `npm run format` | Formats supported files through Prettier. |
| `npm run test` | Runs the Vitest unit and integration suites. |
| `npm run test:unit` | Runs the `tests/unit` directory. |
| `npm run test:integration` | Runs the `tests/integration` directory. |
| `npm run test:e2e` | Runs Playwright tests from `tests/e2e`. |
| `npm run test:a11y` | Runs Playwright and axe tests from `tests/a11y`. |
| `npm run pwa:manifest` | Generates `service-worker-assets.js`. |
| `npm run pwa:check` | Verifies that the generated app-shell manifest is current. |
| `npm run build` | Generates the PWA manifest and builds minified CSS and JS files. |
| `npm run perf:budget` | Checks gzipped app-shell asset limits. |
| `npm run lighthouse` | Delegates to `npm run perf:budget`; it does not run Lighthouse CLI. |
| `npm run check` | Runs the PWA check, linting, tests, build, and performance budget. |

### Build and Generated Files

```bash
npm run build
```

The `prebuild` lifecycle first generates the app-shell manifest. The build then creates three intentionally tracked files:

- `service-worker-assets.js` from `scripts/generate-service-worker-manifest.js`;
- `css/style.min.css` from `css/style.css` through PostCSS and cssnano;
- `js/main.min.js` from `js/main.js` through Terser.

Do not edit these files manually. The build does not use a bundler or create a `dist/` directory, and `build:js` minifies only the `js/main.js` entry point. The current runtime still loads the source `css/style.css` and `js/main.js`, while the app-shell generator excludes the minified files.

### Testing and Validation

Vitest covers unit tests for the domain layer, store, actions, repositories, migrations, persistence, and components, as well as integration tests for views and workflows. Playwright is configured for Chromium and covers critical flows, mobile navigation, PWA/performance scenarios, and visual smoke checks. A separate Playwright + axe suite checks the main views and selected interactive states.

The primary local quality gate is:

```bash
npm run check
```

The script also runs the build, so it may update tracked generated files.

### Deployment

FlowDesk is deployed as static repository-root content. `_redirects` provides a Netlify-compatible SPA fallback. The public origin, `canonical`, Open Graph, `robots.txt`, and `sitemap.xml` point to `https://saas-pr01-flowdesk.netlify.app/`.

Unknown addresses are handled at two levels. Unknown server paths are rewritten to `index.html` through the `/*    /index.html   200` rule, while unknown application hash routes are rendered by `renderNotFoundView`. The catch-all rule responds with `200`, so server paths follow a soft-404 model rather than returning a true HTTP `404`; client-side rendering does not change the status of the original response. The repository no longer maintains a separate static `404.html`.

Netlify publishing and deployment synchronization are owner-managed outside this repository through the `kp-code-portfolio` repository. FlowDesk contains no deployment script or GitHub Actions workflow. Release and rollback procedures are documented in [`docs/release-checklist.md`](docs/release-checklist.md).

### Accessibility

The interface includes a skip link, semantic `main` regions, form labels, error messages, visible focus states, and reduced-motion handling. Modals and the mobile drawer use named dialogs, trap focus, respond to `Escape`, and restore focus to the invoking control. Global search and the user menu support keyboard interaction.

The repository includes automated axe tests for the main views and selected interactive states. These mechanisms and tests are not a declaration of formal WCAG compliance.

### SEO

`index.html` contains a title, meta description, canonical URL, Open Graph and Twitter metadata, and absolute URLs for public social assets. `robots.txt` points to the public `sitemap.xml`, and the sitemap contains the canonical origin.

The application uses hash-based routing, so every view shares one HTML document and the sitemap describes only the public origin. The repository documents the implemented metadata without claiming search-ranking results.

### PWA and Offline Support

The PWA layer consists of `manifest.webmanifest`, service worker registration, `service-worker.js`, generated `service-worker-assets.js`, icons, and `offline.html`. The service worker uses network-first for navigation, cache-first for the app shell and static assets, and network-only with a `503` response for future `/api/*` requests while offline.

A new service worker waits for user confirmation; the application displays a persistent update toast and sends `SKIP_WAITING` only after refresh is selected. These mechanisms are not a claim of complete installability across all browsers.

### Performance

The runtime uses no framework or bundler and loads local fonts. `scripts/check-performance-budget.js` calculates gzipped sizes for JavaScript, CSS, the complete app shell, and individual assets. `lighthouserc.cjs` defines thresholds for a separate Lighthouse CI run, but the current `npm run lighthouse` script only executes the local budget checker.

The README does not publish Lighthouse scores or other performance measurements.

### Data and State Persistence

Seed data comes from `js/data/seed.js`. Client, project, event, and UI-preference state is normalized through migrations and domain validators and stored under `flowdesk_state_v1`. The demo session is validated separately and stored under `flowdesk_session_v1`.

Export creates a local JSON file. Import requires the complete schema, validates records and duplicate identifiers, and writes only after confirmation. If `localStorage` is unavailable, the application continues without durable persistence and informs the user. There is no remote backup or synchronization.

### Project Maintenance

- Canonical styles live in `css/*.css`, with `css/style.css` as the entry point.
- The canonical JavaScript bootstrap is `js/main.js`; modules remain in `js/components/`, `js/core/`, `js/domain/`, `js/repositories/`, `js/utils/`, and `js/views/`.
- After runtime, CSS, font, icon, or manifest changes, run `npm run build` and `npm run pwa:check`.
- Versioning and change history are documented in [`docs/versioning.md`](docs/versioning.md) and [`CHANGELOG.md`](CHANGELOG.md).
- Architecture and decisions are documented in [`docs/architecture.md`](docs/architecture.md) and [`docs/adr/`](docs/adr/).
- UI conventions are documented in [`docs/design-system.md`](docs/design-system.md).
- Future backend boundaries are documented in [`docs/backend-readiness.md`](docs/backend-readiness.md) and [`docs/api-contracts.md`](docs/api-contracts.md).
- PWA, performance, and observability strategies are documented in [`docs/pwa-strategy.md`](docs/pwa-strategy.md), [`docs/performance-budget.md`](docs/performance-budget.md), and [`docs/observability.md`](docs/observability.md).
- Change and release criteria are documented in [`docs/definition-of-done.md`](docs/definition-of-done.md) and [`docs/release-checklist.md`](docs/release-checklist.md).

### Current Limitations

- Login only validates the email format and minimum password length before creating a local demo session.
- `localStorage` is not suitable for confidential data, tokens, or production client records.
- Identity, RBAC, and sync metadata are frontend contracts without server-side authorization enforcement.
- The project has no backend, database, live API, multi-tenant isolation, billing, or cloud synchronization.
- Observability keeps a sanitized in-memory error buffer and sends no data to an external provider.
- The build does not create a complete bundled production artifact.
