import { qs } from '../core/dom.js';
import { getActionFieldError } from '../core/actions.js';
import { auth } from '../core/auth.js';
import { selectUiPreferences } from '../core/selectors.js';
import { store } from '../core/store.js';
import { button } from '../components/button.js';
import { setFieldError, textareaField } from '../components/formControls.js';
import { openConfirmDialog } from '../components/confirmDialog.js';
import { pageHeader } from '../components/pageHeader.js';
import { showToast } from '../components/toast.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

// One row of the settings surface: the option name is what is scanned, the explanation stays a tier
// quieter underneath it and the control or value always lands on the same trailing edge.
const settingsSwitch = ({ id, name, description, checked }) => `
  <div class="settings-option settings-option--switch">
    <div class="settings-option__text">
      <label class="settings-option__name" for="${escapeAttribute(id)}">${escapeHTML(name)}</label>
      <p class="input__helper settings-option__desc" id="${escapeAttribute(`${id}Desc`)}">${escapeHTML(description)}</p>
    </div>
    <input class="settings-option__control" type="checkbox" id="${escapeAttribute(id)}" aria-describedby="${escapeAttribute(`${id}Desc`)}" ${checked ? 'checked' : ''} />
  </div>
`;

const settingsFact = (label, value) => `
  <div class="settings-option">
    <dt class="settings-option__name">${escapeHTML(label)}</dt>
    <dd class="settings-option__value">${escapeHTML(value)}</dd>
  </div>
`;

export const renderSettingsView = (container) => {
  const ui = selectUiPreferences(store.getState());
  const session = auth.getSession();

  container.innerHTML = `
    <main id="main" class="container">
      ${pageHeader({ title: 'Ustawienia', description: 'Zarządzaj profilem demo, preferencjami i lokalnymi danymi demonstracyjnymi.' })}

      <section class="settings-grid">
        <section class="card data-panel settings-section" aria-labelledby="settings-preferences-title">
          <div class="settings-section__head">
            <h2 class="card__title" id="settings-preferences-title">Wygląd i preferencje</h2>
            <p class="input__helper">Ustawienia interfejsu zapisane lokalnie w tej przeglądarce.</p>
          </div>
          <div class="settings-options">
            ${settingsSwitch({
              id: 'themeSwitch',
              name: 'Motyw ciemny',
              description: 'Przełącza ciemną paletę w całej aplikacji.',
              checked: ui.theme === 'dark'
            })}
            ${settingsSwitch({
              id: 'motionSwitch',
              name: 'Ogranicz animacje',
              description: 'Skraca przejścia i animacje interfejsu.',
              checked: ui.reducedMotion
            })}
          </div>
        </section>

        <section class="card data-panel settings-section" aria-labelledby="settings-account-title">
          <div class="settings-section__head">
            <h2 class="card__title" id="settings-account-title">Konto demo</h2>
            <p class="input__helper">Dane profilu są przykładowe i pokazują przyszły kontekst zespołu.</p>
          </div>
          <dl class="settings-options">
            ${settingsFact('Imię i nazwisko', session?.user?.name || 'Alicja Maj')}
            ${settingsFact('Organizacja', session?.organization?.name || 'FlowDesk Demo Workspace')}
            ${settingsFact('Rola', session?.membership?.role || session?.role || 'Owner')}
            ${settingsFact('Email', session?.user?.email || session?.email || 'alicja@flowdesk.pl')}
          </dl>
        </section>
      </section>

      <section class="card data-panel settings-section" aria-labelledby="settings-data-title">
        <div class="settings-section__head">
          <h2 class="card__title" id="settings-data-title">Lokalne dane demo</h2>
          <p class="input__helper">Eksport, import i przywracanie zestawu demo zapisanego w tej przeglądarce.</p>
        </div>

        <div class="settings-options">
          <div class="settings-option">
            <div class="settings-option__text">
              <span class="settings-option__name">Eksport lokalnego stanu</span>
              <p class="input__helper settings-option__desc">Pobiera aktualny lokalny stan demo jako plik JSON.</p>
            </div>
            ${button({ label: 'Eksportuj lokalny JSON', id: 'exportData', variant: 'secondary', iconName: 'export', className: 'btn--compact settings-option__action' })}
          </div>
        </div>

        <div class="settings-subsection">
          <h3 class="settings-subsection__title">Import lokalnego JSON</h3>
          <form id="importForm" class="form-grid settings-import-form">
            ${textareaField({
              id: 'jsonImport',
              label: 'Dane JSON',
              rows: 8,
              placeholder: '{ "clients": [], "projects": [], "events": [] }',
              helper: 'Wklej pełny eksport FlowDesk JSON. Import zostanie sprawdzony przed zastąpieniem lokalnych danych demo.'
            })}
            ${button({ label: 'Sprawdź i importuj JSON', type: 'submit', variant: 'secondary', iconName: 'import', className: 'btn--compact settings-import-form__submit' })}
          </form>
          <p class="input__helper">Nie importuj danych poufnych. Niepoprawny JSON zostanie odrzucony, a odzyskiwalne brakujące powiązania zostaną bezpiecznie odłączone.</p>
        </div>

        <div class="settings-options settings-options--danger">
          <div class="settings-option">
            <div class="settings-option__text">
              <span class="settings-option__name">Reset danych demo</span>
              <p class="input__helper settings-option__desc">Usuwa zmiany zapisane w tej przeglądarce i przywraca dane startowe. Operacja jest potwierdzana i nie można jej cofnąć.</p>
            </div>
            ${button({ label: 'Resetuj dane demo', id: 'resetData', variant: 'secondary', iconName: 'reset', className: 'btn--destructive btn--compact settings-option__action' })}
          </div>
        </div>
      </section>
    </main>
  `;

  qs('#themeSwitch', container)?.addEventListener('change', (event) => {
    const result = store.actions.updateUiPreferences({ theme: event.target.checked ? 'dark' : 'light' });
    if (!result.ok) {
      showToast('Nie udało się zaktualizować motywu.');
      return;
    }
    showToast('Zaktualizowano motyw.');
  });

  qs('#motionSwitch', container)?.addEventListener('change', (event) => {
    const result = store.actions.updateUiPreferences({ reducedMotion: event.target.checked });
    if (!result.ok) {
      showToast('Nie udało się zaktualizować preferencji animacji.');
      return;
    }
    showToast('Zaktualizowano preferencje animacji.');
  });

  qs('#exportData', container)?.addEventListener('click', () => {
    const result = store.actions.exportState();
    if (!result.ok) {
      showToast('Nie udało się wyeksportować danych.');
      return;
    }
    const blob = new Blob([result.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flowdesk-data.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Pobrano lokalny eksport JSON demo.');
  });

  qs('#resetData', container)?.addEventListener('click', () => {
    openConfirmDialog({
      title: 'Reset demo danych',
      message: 'Reset przywróci startowy zestaw demo i usunie lokalne zmiany zapisane w tej przeglądarce.',
      confirmLabel: 'Resetuj',
      destructive: true,
      onConfirm: () => {
        const result = store.actions.resetDemoData();
        if (!result.ok) {
          showToast('Nie udało się przywrócić danych demo.');
          return;
        }
        showToast('Przywrócono startowe dane demo.');
        renderSettingsView(container);
      }
    });
  });

  qs('#importForm', container)?.addEventListener('submit', (event) => {
    event.preventDefault();
    setFieldError('jsonImport', '', container);
    const form = new FormData(event.currentTarget);
    const importResult = store.actions.validateStateFromJson(form.get('jsonImport'));
    if (!importResult.ok) {
      setFieldError('jsonImport', getActionFieldError(importResult, 'json') || 'Nie udało się sprawdzić importu JSON.', container);
      showToast('Import JSON odrzucony. Obecne dane demo pozostały bez zmian.');
      return;
    }
    openConfirmDialog({
      title: 'Zastąp lokalne dane demo?',
      message: 'Import zastąpi obecny lokalny zestaw demo danymi z poprawnego pliku JSON. Tej operacji nie można cofnąć w aplikacji.',
      confirmLabel: 'Importuj i zastąp',
      destructive: true,
      onConfirm: () => {
        const result = store.actions.restoreState(importResult.data);
        if (!result.ok) {
          setFieldError('jsonImport', getActionFieldError(result, 'json') || 'Nie udało się zaimportować danych.', container);
          showToast('Import JSON nie został zapisany.');
          return;
        }
        showToast('Import JSON zakończony. Lokalne dane demo zostały zastąpione po walidacji.');
        renderSettingsView(container);
      }
    });
  });
};
