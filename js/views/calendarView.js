import { qs } from '../core/dom.js';
import { getActionFieldError } from '../core/actions.js';
import { selectActiveClients, selectActiveProjectRecords, selectEventsWithRelations } from '../core/selectors.js';
import { store } from '../core/store.js';
import { button } from '../components/button.js';
import { openConfirmDialog } from '../components/confirmDialog.js';
import { emptyState } from '../components/emptyState.js';
import { inputField, selectField, setFieldError } from '../components/formControls.js';
import { openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/format.js';
import { escapeHTML } from '../utils/sanitize.js';

const getEventClientLabel = (event) => {
  if (event.client) return event.client.name;
  return event.clientId ? 'Klient niedostępny' : 'Bez klienta';
};

const getEventProjectLabel = (event) => {
  if (event.project) return event.project.name;
  return event.projectId ? 'Zlecenie niedostępne' : 'Bez zlecenia';
};

// EVENT_TYPES are stored as stable English identifiers. normalizeEvent always resolves one of
// them, so every event has a type and the badge never renders empty.
const eventTypeLabels = {
  General: 'Ogólne',
  Meeting: 'Spotkanie',
  Deadline: 'Termin'
};

const getEventTypeLabel = (event) => eventTypeLabels[event.type] || event.type;

const eventModalContent = (event = {}, clients = [], projects = []) => `
  <form id="eventForm" class="form-grid">
    ${inputField({ id: 'title', label: 'Tytuł', value: event.title || '', required: true })}
    <div class="form-grid form-grid--two">
      ${inputField({ id: 'date', label: 'Data', type: 'date', value: event.date ? event.date.split('T')[0] : '', required: true })}
      ${selectField({
        id: 'client',
        label: 'Klient',
        value: event.clientId,
        helper: clients.length ? '' : 'Brak aktywnych klientów. Wydarzenie można zapisać bez relacji.',
        options: clients.length ? clients.map((client) => ({ value: client.id, label: client.name })) : [{ value: '', label: 'Bez klienta' }]
      })}
    </div>
    ${selectField({
      id: 'project',
      label: 'Powiązane zlecenie',
      value: event.projectId,
      helper: projects.length ? '' : 'Brak aktywnych zleceń. Wydarzenie można zapisać bez relacji.',
      options: projects.length ? projects.map((project) => ({ value: project.id, label: project.name })) : [{ value: '', label: 'Bez zlecenia' }]
    })}
  </form>
`;

const showEventErrors = (result) => {
  setFieldError('title', getActionFieldError(result, 'title'));
  setFieldError('date', getActionFieldError(result, 'date'));
};

export const renderCalendarView = (container) => {
  const render = () => {
    const state = store.getState();
    const events = selectEventsWithRelations(state);

    container.innerHTML = `
      <main id="main" class="container">
        ${pageHeader({ title: 'Kalendarz', description: 'Prosty widok nadchodzących wydarzeń powiązanych ze zleceniami.' })}

        <section class="card data-toolbar data-toolbar--single calendar-toolbar">
          ${button({ label: 'Dodaj wydarzenie', id: 'addEvent', variant: 'primary', iconName: 'plus', className: 'data-toolbar__action' })}
        </section>

        <section class="card data-panel calendar-panel">
          <h2 class="card__title">Nadchodzące wydarzenia</h2>
          <div class="calendar-list data-list">
            ${
              events.length
                ? events
                    .map((event) => {
                      return `
                      <div class="list__item data-list__item calendar-list__item">
                        <div class="calendar-list__content">
                          <div class="calendar-list__header">
                            <strong class="calendar-list__title">${escapeHTML(event.title)}</strong>
                            <span class="badge badge--info calendar-list__badge">${escapeHTML(getEventTypeLabel(event))}</span>
                          </div>
                          <div class="input__helper data-list__meta calendar-list__meta">
                            ${escapeHTML(formatDate(event.date))} · ${escapeHTML(getEventClientLabel(event))} · ${escapeHTML(getEventProjectLabel(event))}
                          </div>
                        </div>
                        <div class="calendar-list__footer">
                          ${button({
                            label: 'Usuń',
                            variant: 'ghost',
                            iconName: 'delete',
                            className: 'btn--destructive calendar-list__delete',
                            attributes: { 'data-action': 'delete', 'data-id': event.id, 'aria-label': `Usuń wydarzenie: ${event.title}` }
                          })}
                        </div>
                      </div>
                    `;
                    })
                    .join('')
                : emptyState({
                    title: 'Brak wydarzeń w kalendarzu',
                    description: 'Dodaj spotkanie, deadline albo wizytę serwisową, aby zbudować prostą oś pracy.',
                    iconName: 'calendar'
                  })
            }
          </div>
        </section>
      </main>
    `;
  };

  render();

  const refresh = () => {
    render();
    bindEvents();
  };

  const bindEvents = () => {
    qs('#addEvent', container)?.addEventListener('click', () => {
      const state = store.getState();
      const close = openModal({
        title: 'Nowe wydarzenie',
        content: eventModalContent({}, selectActiveClients(state), selectActiveProjectRecords(state)),
        footer: '<button class="btn btn--secondary" data-modal-close>Anuluj</button><button class="btn btn--primary" id="saveEvent">Zapisz</button>'
      });

      qs('#saveEvent', document)?.addEventListener('click', () => {
        const form = qs('#eventForm', document);
        const data = new FormData(form);
        const result = store.actions.createEvent({
          title: data.get('title'),
          date: data.get('date'),
          clientId: data.get('client'),
          projectId: data.get('project')
        });
        if (!result.ok) {
          showEventErrors(result);
          return;
        }
        showToast('Dodano wydarzenie.');
        close();
        refresh();
      });
    });

    container.querySelectorAll('[data-action="delete"]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const event = selectEventsWithRelations(store.getState()).find((item) => item.id === trigger.dataset.id);

        openConfirmDialog({
          title: 'Usuń wydarzenie',
          message: `Czy na pewno usunąć wydarzenie "${event?.title || 'bez tytułu'}"?`,
          confirmLabel: 'Usuń',
          destructive: true,
          onConfirm: () => {
            const result = store.actions.deleteEvent(trigger.dataset.id);
            if (!result.ok) {
              showToast('Nie udało się usunąć wydarzenia.');
              return;
            }
            showToast('Usunięto wydarzenie.');
            refresh();
          }
        });
      });
    });
  };

  bindEvents();
};
