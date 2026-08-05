# FlowDesk performance budget

## Cel

Budżet wydajności ma chronić FlowDesk przed cichym puchnięciem app-shell. Projekt jest statyczną SPA bez bundlera, więc największe ryzyko to niekontrolowane dokładanie modułów runtime, CSS i assetów do cache.

## Komendy

Szybki lokalny gate:

```bash
npm run perf:budget
```

Zachowany alias o historycznej nazwie. Uruchamia dokładnie ten sam checker gzip, **nie** uruchamia Lighthouse:

```bash
npm run lighthouse
```

Pełna konfiguracja Lighthouse CI znajduje się w `lighthouserc.cjs`. Wymaga osobnego uruchomienia narzędzia Lighthouse CI, jeżeli zespół zdecyduje się dodać `@lhci/cli` jako dependency lub uruchamiać je przez osobny environment.

## Statyczne budżety app-shell

`scripts/check-performance-budget.js` liczy gzipowane rozmiary na podstawie `service-worker-assets.js`.

| Budżet                    |  Limit |
| ------------------------- | -----: |
| JavaScript app-shell gzip |  85 KB |
| CSS app-shell gzip        |  28 KB |
| Cały app-shell gzip       | 180 KB |
| Pojedynczy asset gzip     |  35 KB |

Te limity są celowo konserwatywne dla aktualnego demo, ale nie są ekstremalnie ciasne. Mają ostrzegać przed dodawaniem ciężkich bibliotek, przypadkowym cache'owaniem wygenerowanych plików lub powielaniem CSS.

### Rekalibracja limitu app-shell

Limit całego app-shell wynosił wcześniej 170 KB. Po zamknięciu `PH1-02` realny rozmiar powłoki wynosił około 169,7 KB, czyli poniżej 0,3 KB zapasu, a kolejne poprawki dostępności i odporności stanu wyczerpały go całkowicie. Próg 170 KB przestał więc mierzyć rzeczywistą wagę powłoki i zaczął blokować zmiany rzędu kilkudziesięciu bajtów.

Limit został świadomie ustawiony na 180 KB, aby przywrócić ograniczony margines deweloperski bez usuwania z prekesza fontów, `offline.html`, modułów aplikacji ani innych zasobów wymaganych do działania offline. Pozostałe limity — JavaScript, CSS i pojedynczy asset — nie zostały zmienione.

Budżet pozostaje twardą bramką jakości: `node scripts/check-performance-budget.js` kończy się kodem wyjścia `1` po przekroczeniu któregokolwiek limitu i nie został zamieniony na ostrzeżenie.

## Core Web Vitals i Lighthouse

Docelowe progi dla okresowego Lighthouse CI:

| Metryka              |        Próg |
| -------------------- | ----------: |
| Performance score    |   min. 0.85 |
| Accessibility score  |   min. 0.95 |
| Best Practices score |   min. 0.90 |
| PWA score            |   min. 0.80 |
| LCP                  | max 2500 ms |
| CLS                  |    max 0.10 |
| TBT                  |  max 200 ms |

Lighthouse powinien działać przeciwko lokalnemu serwerowi:

```bash
npx lhci autorun --config=lighthouserc.cjs
```

Upload jest ustawiony na filesystem, więc gate nie wymaga zewnętrznej usługi raportowej.

## Startup responsiveness

Praktyczny cel dla FlowDesk:

- login view powinien renderować się stabilnie przy wolniejszych assetach statycznych,
- dashboard mobile nie powinien generować poziomego overflow,
- service worker nie powinien wymuszać reloadu bez decyzji użytkownika,
- brak `localStorage` nie może blokować startu aplikacji.

Te zachowania są pokryte testami Playwright w `tests/e2e/pwa-performance.spec.js`.

## Kiedy podnieść budżet

Budżet można zmienić tylko wtedy, gdy:

- nowy feature realnie wymaga większego runtime,
- alternatywy bez powiększania app-shell zostały sprawdzone,
- dokumentacja w tym pliku zostanie zaktualizowana,
- `npm run perf:budget` i e2e smoke pozostają zielone.
