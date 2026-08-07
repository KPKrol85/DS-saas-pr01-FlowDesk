import { qs } from '../core/dom.js';
import { getActionFieldError } from '../core/actions.js';
import { selectClientById, selectFilteredClients } from '../core/selectors.js';
import { store } from '../core/store.js';
import { CLIENT_SEGMENTS, CLIENT_STATUSES } from '../domain/constants.js';
import { button } from '../components/button.js';
import { openConfirmDialog } from '../components/confirmDialog.js';
import { emptyState } from '../components/emptyState.js';
import { icon } from '../components/icon.js';
import { inputField, selectField, setFieldError, textareaField } from '../components/formControls.js';
import { openModal } from '../components/modal.js';
import { pageHeader } from '../components/pageHeader.js';
import { showToast } from '../components/toast.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

const isArchived = (record) => Boolean(record?.archivedAt);

// CLIENT_STATUSES are the stored values, so the badge maps them onto the existing badge variants
// instead of introducing a Clients-only colour set. Unknown values fall back to the neutral tone.
const statusBadgeClass = (status) => {
  if (status === 'Aktywny') return 'badge--success';
  if (status === 'Zawieszony') return 'badge--warning';
  return 'badge--info';
};

const getClientsEmptyState = (state, filters) => {
  const activeCount = state.clients.filter((client) => !isArchived(client)).length;
  const archivedCount = state.clients.filter(isArchived).length;
  const hasTextFilter = Boolean(filters.term.trim());

  if (!state.clients.length) {
    return {
      title: 'Brak klientów w lokalnym demo',
      description: 'Dodaj pierwszego klienta, aby rozpocząć pracę z bazą klientów.',
      iconName: 'clients'
    };
  }

  if (hasTextFilter) {
    return {
      title: 'Filtry ukrywają klientów',
      description: 'Nie znaleziono klientów dla wpisanej frazy. Wyczyść filtr tekstowy albo zmień zakres.',
      iconName: 'search'
    };
  }

  if (filters.archive === 'archived' && !archivedCount) {
    return {
      title: 'Archiwum klientów jest puste',
      description: 'Zarchiwizowani klienci pojawią się tutaj po użyciu akcji Archiwizuj.',
      iconName: 'clients'
    };
  }

  if (filters.archive === 'active' && !activeCount) {
    return {
      title: 'Brak aktywnych klientów',
      description: 'Wszystkie rekordy są w archiwum. Zmień zakres na Archiwum albo Wszyscy, aby je zobaczyć.',
      iconName: 'clients'
    };
  }

  return {
    title: 'Brak klientów dla wybranych filtrów',
    description: 'Zmień zakres lub sortowanie, aby wrócić do dostępnych rekordów.',
    iconName: 'clients'
  };
};

const previewMetaItem = (label, value) => `
  <div class="clients-preview__meta-item">
    <dt class="clients-preview__meta-label">${escapeHTML(label)}</dt>
    <dd class="clients-preview__meta-value">${escapeHTML(value)}</dd>
  </div>
`;

const renderDetails = (client) => {
  if (!client) {
    return `
      <div class="side-panel data-panel clients-preview">
        <h2 class="clients-preview__name">Podgląd klienta</h2>
        ${emptyState({
          title: 'Brak klienta w podglądzie',
          description: 'Wybierz rekord z listy. Gdy filtry nic nie zwracają, podgląd pozostaje pusty.',
          iconName: 'clients'
        })}
      </div>
    `;
  }

  return `
    <div class="side-panel data-panel clients-preview">
      <div class="clients-preview__header">
        <p class="clients-preview__eyebrow">Podgląd klienta</p>
        <h2 class="clients-preview__name">${escapeHTML(client.name)}</h2>
        <div class="data-badges clients-preview__badges">
          <span class="badge ${statusBadgeClass(client.status)}">${escapeHTML(client.status)}</span>
          <span class="badge badge--info">${escapeHTML(client.segment)}</span>
          ${client.archivedAt ? '<span class="badge badge--danger">Archiwum</span>' : ''}
        </div>
      </div>
      <dl class="clients-preview__meta">
        ${previewMetaItem('Email', client.email || 'Brak emaila')}
        ${previewMetaItem('Telefon', client.phone || 'Brak telefonu')}
        ${previewMetaItem('Owner', client.owner || 'Nieprzypisany')}
      </dl>
      <div class="clients-preview__notes">
        <h3 class="clients-preview__section-title">Notatki</h3>
        <p class="clients-preview__notes-text">${escapeHTML(client.notes || 'Brak notatek')}</p>
      </div>
      <div class="clients-preview__footer">
        <a class="btn btn--ghost btn--compact clients-preview__action" href="#/clients/${encodeURIComponent(client.id)}">
          ${icon('arrowRight')}<span>Otwórz szczegóły</span>
        </a>
      </div>
    </div>
  `;
};

const clientModalContent = (client = {}) => `
  <form id="clientForm" class="form-grid">
    <div class="form-grid form-grid--two">
      ${inputField({ id: 'name', label: 'Nazwa', value: client.name || '', required: true })}
      ${selectField({
        id: 'status',
        label: 'Status',
        value: client.status,
        options: CLIENT_STATUSES.map((status) => ({ value: status, label: status }))
      })}
    </div>
    <div class="form-grid form-grid--two">
      ${selectField({
        id: 'segment',
        label: 'Segment',
        value: client.segment,
        options: CLIENT_SEGMENTS.map((segment) => ({ value: segment, label: segment }))
      })}
      ${inputField({ id: 'owner', label: 'Owner', value: client.owner || '', placeholder: 'Alicja Maj' })}
    </div>
    <div class="form-grid form-grid--two">
      ${inputField({ id: 'email', label: 'Email', type: 'email', value: client.email || '', required: true, autocomplete: 'email' })}
      ${inputField({ id: 'phone', label: 'Telefon', value: client.phone || '', required: true, autocomplete: 'tel' })}
    </div>
    ${inputField({ id: 'tags', label: 'Tagi', value: (client.tags || []).join(', '), placeholder: 'sla, retainer, lead', helper: 'Oddziel tagi przecinkami.' })}
    ${textareaField({ id: 'notes', label: 'Notatki', value: client.notes || '', rows: 3, helper: 'Krótki kontekst dla zespołu.' })}
  </form>
`;

const showClientErrors = (result) => {
  setFieldError('name', getActionFieldError(result, 'name'));
  setFieldError('email', getActionFieldError(result, 'email'));
};

export const renderClientsView = (container) => {
  const state = store.getState();
  let selectedId = state.clients.find((client) => !client.archivedAt)?.id || state.clients[0]?.id || null;
  let filterState = { term: '', sort: 'name', archive: 'active' };

  const render = () => {
    const currentState = store.getState();
    const filtered = selectFilteredClients(currentState, filterState);
    if (selectedId && !filtered.some((client) => client.id === selectedId)) {
      selectedId = filtered[0]?.id || null;
    }
    const rows = filtered
      .map(
        (client) => `
        <tr class="data-row clients-table__row ${client.id === selectedId ? 'data-row--selected' : ''} ${client.archivedAt ? 'data-row--archived' : ''}" data-id="${escapeAttribute(client.id)}">
          <td data-label="Klient"><span class="data-cell__title clients-table__name">${escapeHTML(client.name)}</span></td>
          <td data-label="Email"><span class="data-cell__meta clients-table__meta">${escapeHTML(client.email)}</span></td>
          <td data-label="Status"><span class="badge ${statusBadgeClass(client.status)}">${escapeHTML(client.status)}</span></td>
          <td data-label="Segment"><span class="data-cell__meta clients-table__meta">${escapeHTML(client.segment)}</span></td>
          <td data-label="Owner/Archiwum" class="data-cell--badges">
            <div class="clients-table__owner">
              <span class="data-cell__meta clients-table__meta">${escapeHTML(client.owner || 'Nieprzypisany')}</span>
              ${client.archivedAt ? '<span class="badge badge--danger">Archiwum</span>' : ''}
            </div>
          </td>
          <td data-label="Akcje" class="data-table__actions-cell">
            <div class="table__actions data-actions clients-table__actions">
              <a class="btn btn--ghost btn--icon clients-table__action" href="#/clients/${encodeURIComponent(client.id)}" title="Szczegóły">${icon('arrowRight')}<span class="visually-hidden">Szczegóły</span></a>
              ${button({ label: 'Edytuj', variant: 'ghost', iconName: 'edit', iconOnly: true, className: 'clients-table__action', attributes: { 'data-action': 'edit', 'data-id': client.id } })}
              ${
                client.archivedAt
                  ? button({
                      label: 'Przywróć',
                      variant: 'ghost',
                      iconName: 'reset',
                      iconOnly: true,
                      className: 'clients-table__action',
                      attributes: { 'data-action': 'restore', 'data-id': client.id }
                    })
                  : button({
                      label: 'Archiwizuj',
                      variant: 'ghost',
                      iconName: 'delete',
                      iconOnly: true,
                      className: 'btn--destructive clients-table__action',
                      attributes: { 'data-action': 'archive', 'data-id': client.id }
                    })
              }
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    container.innerHTML = `
      <main id="main" class="container">
        ${pageHeader({ title: 'Klienci', description: 'Baza klientów, statusy współpracy i szybkie akcje.' })}
        <section class="clients-layout">
          <div class="card data-panel clients-panel">
            <div class="list data-toolbar">
              <div class="form-grid form-grid--two data-toolbar__filters clients-toolbar__filters">
                <div class="input">
                  <label class="input__label" for="filterInput">Filtruj</label>
                  <input class="input__field toolbar-filter__field" id="filterInput" placeholder="Wpisz nazwę lub email" value="${escapeAttribute(filterState.term)}" />
                </div>
                <div class="input">
                  <label class="input__label" for="sortSelect">Sortuj</label>
                  <div class="toolbar-filter__control">
                    <select class="input__select toolbar-filter__select" id="sortSelect">
                      <option value="name" ${filterState.sort === 'name' ? 'selected' : ''}>Nazwa</option>
                      <option value="status" ${filterState.sort === 'status' ? 'selected' : ''}>Status</option>
                      <option value="owner" ${filterState.sort === 'owner' ? 'selected' : ''}>Owner</option>
                    </select>
                    ${icon('chevronDown', { className: 'toolbar-filter__chevron', size: 16 })}
                  </div>
                </div>
                <div class="input">
                  <label class="input__label" for="archiveSelect">Zakres</label>
                  <div class="toolbar-filter__control">
                    <select class="input__select toolbar-filter__select" id="archiveSelect">
                      <option value="active" ${filterState.archive === 'active' ? 'selected' : ''}>Aktywni</option>
                      <option value="archived" ${filterState.archive === 'archived' ? 'selected' : ''}>Archiwum</option>
                      <option value="all" ${filterState.archive === 'all' ? 'selected' : ''}>Wszyscy</option>
                    </select>
                    ${icon('chevronDown', { className: 'toolbar-filter__chevron', size: 16 })}
                  </div>
                </div>
              </div>
              ${button({ label: 'Dodaj klienta', id: 'addClient', variant: 'primary', iconName: 'plus', className: 'data-toolbar__action btn--compact' })}
            </div>
            <div class="table-wrapper data-table-wrapper">
              ${
                rows.length
                  ? `
                <table class="table data-table clients-table">
                  <thead>
                    <tr>
                      <th scope="col">Klient</th>
                      <th scope="col">Email</th>
                      <th scope="col">Status</th>
                      <th scope="col">Segment</th>
                      <th scope="col">Owner/Archiwum</th>
                      <th scope="col" class="clients-table__actions-head">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
              `
                  : emptyState(getClientsEmptyState(currentState, filterState))
              }
            </div>
          </div>
          ${renderDetails(selectClientById(currentState, selectedId))}
        </section>
      </main>
    `;
  };

  render();

  function refresh() {
    render();
    updateHandlers();
  }

  const updateHandlers = () => {
    const filterInput = qs('#filterInput', container);
    const sortSelect = qs('#sortSelect', container);
    const archiveSelect = qs('#archiveSelect', container);

    const filterAndRender = () => {
      filterState = { term: filterInput.value, sort: sortSelect.value, archive: archiveSelect.value };
      refresh();
    };

    filterInput?.addEventListener('input', filterAndRender);
    sortSelect?.addEventListener('change', filterAndRender);
    archiveSelect?.addEventListener('change', filterAndRender);

    qs('#addClient', container)?.addEventListener('click', () => {
      const close = openModal({
        title: 'Nowy klient',
        content: clientModalContent(),
        footer: '<button class="btn btn--secondary" data-modal-close>Anuluj</button><button class="btn btn--primary" id="saveClient">Zapisz</button>'
      });

      const saveBtn = qs('#saveClient', document);
      saveBtn?.addEventListener('click', () => {
        const form = qs('#clientForm', document);
        const data = new FormData(form);
        const result = store.actions.createClient({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          status: data.get('status'),
          segment: data.get('segment'),
          owner: data.get('owner'),
          tags: data.get('tags'),
          notes: data.get('notes')
        });
        if (!result.ok) {
          showClientErrors(result);
          return;
        }
        selectedId = result.data.id;
        filterState = { term: '', sort: 'name', archive: 'active' };
        showToast('Dodano klienta i zaznaczono go w podglądzie.');
        close();
        refresh();
      });
    });

    container.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const client = selectClientById(store.getState(), button.dataset.id);
        if (!client) {
          showToast('Nie znaleziono klienta.');
          return;
        }
        const close = openModal({
          title: 'Edytuj klienta',
          content: clientModalContent(client),
          footer: '<button class="btn btn--secondary" data-modal-close>Anuluj</button><button class="btn btn--primary" id="updateClient">Zapisz</button>'
        });
        qs('#updateClient', document)?.addEventListener('click', () => {
          const form = qs('#clientForm', document);
          const data = new FormData(form);
          const result = store.actions.updateClient(client.id, {
            name: data.get('name'),
            email: data.get('email'),
            phone: data.get('phone'),
            status: data.get('status'),
            segment: data.get('segment'),
            owner: data.get('owner'),
            tags: data.get('tags'),
            notes: data.get('notes')
          });
          if (!result.ok) {
            showClientErrors(result);
            return;
          }
          showToast('Zaktualizowano klienta.');
          close();
          refresh();
        });
      });
    });

    container.querySelectorAll('[data-action="archive"]').forEach((button) => {
      button.addEventListener('click', () => {
        const client = selectClientById(store.getState(), button.dataset.id);
        if (!client) {
          showToast('Nie znaleziono klienta.');
          return;
        }
        openConfirmDialog({
          title: 'Archiwizuj klienta',
          message: `Czy zarchiwizować ${client.name}? Rekord pozostanie dostępny w filtrze archiwum.`,
          confirmLabel: 'Archiwizuj',
          destructive: true,
          onConfirm: () => {
            const result = store.actions.archiveClient(client.id);
            if (!result.ok) {
              showToast('Nie udało się zarchiwizować klienta.');
              return;
            }
            showToast('Zarchiwizowano klienta.');
            refresh();
          }
        });
      });
    });

    container.querySelectorAll('[data-action="restore"]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = store.actions.restoreArchivedClient(button.dataset.id);
        showToast(result.ok ? 'Przywrócono klienta.' : 'Nie udało się przywrócić klienta.');
        refresh();
      });
    });

    container.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('click', (event) => {
        if (event.target.closest('button, a')) return;
        selectedId = row.dataset.id || null;
        refresh();
      });
    });
  };

  updateHandlers();
};
