# FlowDesk PWA and cache strategy

## Cel

FlowDesk ma działać przewidywalnie jako statyczna PWA: szybki start, cache app-shell, czytelny fallback offline i kontrolowana aktualizacja service workera bez wymuszania przeładowania podczas pracy użytkownika.

## App-shell manifest

Lista plików cache jest generowana przez:

```bash
npm run pwa:manifest
```

Skrypt `scripts/generate-service-worker-manifest.js` tworzy `dist/service-worker-assets.js` po zakończeniu builda Vite i inwentaryzuje wyłącznie zawartość `dist/`. Manifest obejmuje tylko runtime app-shell:

- `/`, `index.html`, `offline.html`
- wygenerowane, hashowane pakiety CSS, JavaScript i fonty `woff2` z `dist/build/`
- `/manifest.webmanifest` — stabilny adres, do którego odwołuje się produkcyjny HTML
- `assets/logo/logo.svg` — logo powłoki renderowane dynamicznie przez sidebar i drawer, więc Vite nie widzi tej referencji; precache'owane celowo, aby było dostępne przy zimnym starcie offline

Manifest celowo pomija:

- `node_modules`
- `tests`
- `docs`
- screenshoty i wyniki testów
- pliki źródłowe z repozytorium — generator skanuje wyłącznie `dist/build/`
- `service-worker.js` i `service-worker-assets.js` — manifest nie hashuje sam siebie
- favikony, `assets/icons/og.png` i ikony skrótów — serwowane pod stabilnymi adresami, ale niewymagane do startu powłoki offline
- `js/legal-theme.js` i strony prawne — network-first, cache'owane runtime po wizycie online

Walidacja:

```bash
npm run pwa:check
```

`npm run build` uruchamia Vite, a następnie generuje manifest. `npm run check` buduje `dist/` przed walidacjami i sprawdza aktualność manifestu; brak lub nieaktualność `dist/` kończy walidację błędem.

## Cache strategies

| Zasób              | Strategia                                                     | Uzasadnienie                                                                                             |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Nawigacja HTML     | network-first, cache per dokument, fallback do `offline.html` | każdy dokument ma własny klucz cache, więc jedna strona nie nadpisuje innej                              |
| Strony prawne      | network-first, runtime cache pod własnym URL                  | nie są częścią app-shell; offline dostępne dopiero po wcześniejszej wizycie                              |
| App shell          | cache-first                                                   | moduły SPA muszą być dostępne offline po pierwszej wizycie                                               |
| JavaScript modules | cache-first przez app-shell/static matcher                    | obecna aplikacja używa ES Modules bez bundlera                                                           |
| CSS                | cache-first                                                   | style są statyczne i wersjonowane nazwą cache                                                            |
| Fonty              | cache-first                                                   | lokalne fonty nie wymagają requestów zewnętrznych                                                        |
| Ikony PWA          | cache-first                                                   | wymagane dla instalowalności i offline                                                                   |
| `offline.html`     | precache                                                      | zawsze dostępny jako ostatni fallback                                                                    |
| Przyszłe `/api/*`  | network-only z offline `503`                                  | API nie jest jeszcze zaimplementowane, a przyszłe dane biznesowe nie powinny być cache'owane przypadkowo |
| Nieznane requesty  | pass-through do sieci                                         | service worker nie przejmuje zasobów spoza ustalonego zakresu                                            |

## Update lifecycle

Service worker nie wywołuje `skipWaiting()` w trakcie instalacji. Nowy worker pozostaje w stanie waiting, a aplikacja pokazuje toast:

```text
Nowa wersja FlowDesk jest dostępna. Odśwież
```

Po kliknięciu użytkownika aplikacja wysyła do workera:

```js
{
  type: 'SKIP_WAITING';
}
```

Dopiero wtedy worker aktywuje się, stare cache są usuwane, `clients.claim()` przejmuje stronę, a aplikacja przeładowuje się po `controllerchange`.

To chroni aktywną pracę użytkownika przed wymuszonym przeładowaniem.

## Offline behavior

Po pierwszej udanej wizycie service worker precache'uje app-shell. Przy braku sieci:

- każda udana nawigacja jest cache'owana pod własnym adresem dokumentu; `/` i `/index.html` dzielą jeden klucz `/index.html`, pozostałe dokumenty używają własnej ścieżki,
- nawigacja do wejścia aplikacji (`/` lub `/index.html`) zwraca cached SPA shell,
- aplikacja pokazuje routing i widoki dostępne z lokalnego stanu,
- nawigacja do dokumentu spoza aplikacji (np. `/regulamin.html`) zwraca ten dokument tylko jeśli był wcześniej odwiedzony online,
- jeśli żądany dokument nie jest w cache, użytkownik dostaje `offline.html`,
- odpowiedź z cache, która powstała po przekierowaniu (`response.redirected`), jest odbudowywana jako zwykła odpowiedź; przeglądarka odrzuca przekierowaną odpowiedź w `respondWith` dla nawigacji. Dotyczyło to lokalnego `npx serve`, który przekierowywał `*.html` na adres bez rozszerzenia; zachowanie pozostaje zabezpieczone także dla hostingu przekierowującego adresy dokumentów,
- przyszłe requesty `/api/*` powinny zwracać kontrolowany błąd offline i przejść przez kolejkę sync dopiero w etapie backend/offline-first.

## Storage unavailable

FlowDesk pozostaje demo oparte o `localStorage`. Helper `js/utils/storage.js` łapie błędy dostępu, zapisu, odczytu i usuwania. Jeżeli storage jest niedostępny, aplikacja nie crashuje i pokazuje komunikat:

```text
Tryb bez trwałego zapisu. Dane demo mogą zniknąć po odświeżeniu.
```

To nie jest trwały fallback storage. Produkcyjna wersja wymaga backendu lub innej bezpiecznej persystencji.

## Test coverage

PWA i performance są pokrywane przez:

- `npm run pwa:check` - aktualność manifestu app-shell
- `npm run perf:budget` - gzipowane rozmiary app-shell, JS i CSS
- Playwright e2e - update prompt, mobile viewport, slow static assets, unavailable `localStorage`, offline cached app shell
- `npm run test:a11y` - podstawowe axe checks dla głównych widoków

## Operacyjna zasada

Po dodaniu pliku runtime uruchom:

```bash
npm run pwa:manifest
npm run pwa:check
```

Jeżeli plik nie jest potrzebny do startu aplikacji offline, nie powinien trafić do app-shell.
