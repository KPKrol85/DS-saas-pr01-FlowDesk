import { selectClientDetail } from '../core/selectors.js';
import { store } from '../core/store.js';
import { button } from '../components/button.js';
import { openConfirmDialog } from '../components/confirmDialog.js';
import { emptyState } from '../components/emptyState.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/format.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

// CLIENT_STATUSES are the stored values, mapped onto the existing badge variants rather than a
// Clients-only colour set. Unknown values fall back to the neutral tone.
const statusBadgeClass = (status) => {
  if (status === 'Aktywny') return 'badge--success';
  if (status === 'Zawieszony') return 'badge--warning';
  return 'badge--info';
};

// EVENT_TYPES are stored as stable English identifiers; only the visible label is localized.
const eventTypeLabels = {
  General: 'Ogólne',
  Meeting: 'Spotkanie',
  Deadline: 'Termin'
};

const getEventTypeLabel = (event) => eventTypeLabels[event.type] || event.type;

// selectClientActivityTimeline tags every entry with the collection it came from. The label only
// names that existing `source` value — no actor, type or timestamp is invented here.
const activitySourceLabels = {
  client: 'Rekord klienta',
  project: 'Zlecenie',
  event: 'Kalendarz'
};

const renderTags = (tags = []) =>
  tags.length ? tags.map((tag) => `<span class="badge badge--info">${escapeHTML(tag)}</span>`).join('') : '<span class="input__helper">Brak tagów.</span>';

const renderContactMeta = (contact) => [contact.email || 'brak emaila', contact.phone || 'brak telefonu'].filter(Boolean).join(' · ');

const renderContactList = (contacts = []) =>
  contacts.length
    ? contacts
        .map(
          (contact) => `
            <div class="list__item data-list__item client-detail__item">
              <div class="data-list__main">
                <strong class="client-detail__item-title">${escapeHTML(contact.name || 'Kontakt')}</strong>
                <div class="input__helper data-list__meta">${escapeHTML(renderContactMeta(contact))}</div>
              </div>
              ${contact.role ? `<div class="data-list__side"><span class="badge badge--info">${escapeHTML(contact.role)}</span></div>` : ''}
            </div>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak kontaktów',
        description: 'Kontakty osoby lub zespołu klienta pojawią się tutaj po uzupełnieniu rekordu.',
        iconName: 'clients'
      });

const renderTimeline = (timeline = []) =>
  timeline.length
    ? `<ol class="client-activity">
        ${timeline
          .map(
            (entry) => `
              <li class="client-activity__item">
                <div class="client-activity__meta">
                  <time class="client-activity__date" datetime="${escapeAttribute(entry.date)}">${escapeHTML(formatDate(entry.date))}</time>
                  ${activitySourceLabels[entry.source] ? `<span class="client-activity__source">${escapeHTML(activitySourceLabels[entry.source])}</span>` : ''}
                </div>
                <p class="client-activity__text">${escapeHTML(entry.text)}</p>
              </li>
            `
          )
          .join('')}
      </ol>`
    : emptyState({
        title: 'Brak aktywności',
        description: 'Aktywność klienta pojawi się po zmianach w rekordzie, zleceniach lub wydarzeniach.',
        iconName: 'calendar'
      });

const renderProjectLinks = (projects = []) =>
  projects.length
    ? projects
        .map(
          (project) => `
            <a class="list__item data-list__item data-list__item--link client-detail__item ${project.archivedAt ? 'data-list__item--archived' : ''}" href="#/projects/${encodeURIComponent(project.id)}">
              <div class="data-list__main">
                <strong class="client-detail__item-title">${escapeHTML(project.name)}</strong>
                <div class="input__helper data-list__meta">${escapeHTML(project.status)} · termin: ${escapeHTML(formatDate(project.dueDate))}</div>
              </div>
              <div class="data-list__side">
                <span class="badge ${project.archivedAt ? 'badge--danger' : 'badge--info'}">${project.archivedAt ? 'Archiwum' : escapeHTML(project.priority)}</span>
              </div>
            </a>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak powiązanych zleceń',
        description: 'Zlecenia przypisane do tego klienta pojawią się tutaj.',
        iconName: 'projects'
      });

const renderEvents = (events = []) =>
  events.length
    ? events
        .map(
          (event) => `
            <div class="list__item data-list__item client-detail__item">
              <div class="data-list__main">
                <strong class="client-detail__item-title">${escapeHTML(event.title)}</strong>
                <div class="input__helper data-list__meta">${escapeHTML(formatDate(event.date))} · ${escapeHTML(event.project?.name || 'Bez projektu')}</div>
              </div>
              <div class="data-list__side"><span class="badge badge--info">${escapeHTML(getEventTypeLabel(event))}</span></div>
            </div>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak powiązanych wydarzeń',
        description: 'Wydarzenia kalendarza przypisane do klienta pojawią się tutaj.',
        iconName: 'calendar'
      });

export const renderClientDetailView = (container, { id } = {}) => {
  const detail = selectClientDetail(store.getState(), id);

  if (!detail) {
    container.innerHTML = `
      <main id="main" class="container">
        ${pageHeader({
          title: 'Klient nie znaleziony',
          description: 'Rekord nie istnieje albo został usunięty z danych demo.',
          actions: `<a class="btn btn--secondary btn--compact client-detail__header-action" href="#/clients">${icon('arrowLeft')}<span>Wróć do klientów</span></a>`
        })}
        ${emptyState({
          title: 'Brak rekordu klienta',
          description: 'Ten adres nie pasuje do żadnego klienta w lokalnych danych demo. Wróć do listy klientów albo przywróć dane startowe w ustawieniach.',
          iconName: 'clients'
        })}
      </main>
    `;
    return;
  }

  const { client, projects, events, timeline } = detail;
  const archived = Boolean(client.archivedAt);

  container.innerHTML = `
    <main id="main" class="container">
      ${pageHeader({
        eyebrow: 'Klient',
        title: client.name,
        description: `${client.segment} · owner: ${client.owner || 'nieprzypisany'}`,
        actions: `
          <a class="btn btn--secondary btn--compact client-detail__header-action" href="#/clients">${icon('arrowLeft')}<span>Wróć</span></a>
          ${
            archived
              ? button({ label: 'Przywróć', id: 'restoreClient', variant: 'secondary', iconName: 'reset', className: 'btn--compact client-detail__header-action' })
              : button({ label: 'Archiwizuj', id: 'archiveClient', variant: 'danger', iconName: 'delete', className: 'btn--compact client-detail__header-action' })
          }
        `
      })}

      <section class="detail-grid">
        <div class="card detail-main data-panel client-detail__profile">
          <div class="client-detail__section-head">
            <h2 class="card__title">Profil klienta</h2>
            ${archived ? '<span class="badge badge--danger">Archiwum</span>' : ''}
          </div>
          <dl class="client-detail__meta">
            <div class="client-detail__meta-item">
              <dt class="client-detail__meta-label">Email</dt>
              <dd class="client-detail__meta-value">${escapeHTML(client.email || 'Brak emaila')}</dd>
            </div>
            <div class="client-detail__meta-item">
              <dt class="client-detail__meta-label">Telefon</dt>
              <dd class="client-detail__meta-value">${escapeHTML(client.phone || 'Brak telefonu')}</dd>
            </div>
            <div class="client-detail__meta-item">
              <dt class="client-detail__meta-label">Status</dt>
              <dd class="client-detail__meta-value"><span class="badge ${statusBadgeClass(client.status)}">${escapeHTML(client.status)}</span></dd>
            </div>
            <div class="client-detail__meta-item">
              <dt class="client-detail__meta-label">Segment</dt>
              <dd class="client-detail__meta-value">${escapeHTML(client.segment)}</dd>
            </div>
          </dl>
          <div class="client-detail__block">
            <h3 class="client-detail__subtitle">Notatki</h3>
            <p class="client-detail__notes">${escapeHTML(client.notes || 'Brak notatek.')}</p>
          </div>
          <div class="client-detail__block">
            <h3 class="client-detail__subtitle">Tagi</h3>
            <div class="tag-row data-tags">${renderTags(client.tags)}</div>
          </div>
          ${archived ? `<p class="input__helper data-archive-note">Archiwum od: ${escapeHTML(formatDate(client.archivedAt))}. Rekord pozostaje dostępny do przeglądu i można go przywrócić.</p>` : ''}
        </div>

        <div class="card data-panel client-detail__panel">
          <h2 class="card__title client-detail__panel-title">Kontakty</h2>
          <div class="list data-list client-detail__list">${renderContactList(client.contacts)}</div>
        </div>

        <div class="card data-panel client-detail__panel">
          <h2 class="card__title client-detail__panel-title">Powiązane zlecenia</h2>
          <div class="list data-list client-detail__list">${renderProjectLinks(projects)}</div>
        </div>

        <div class="card data-panel client-detail__panel">
          <h2 class="card__title client-detail__panel-title">Wydarzenia</h2>
          <div class="list data-list client-detail__list">${renderEvents(events)}</div>
        </div>

        <div class="card detail-wide data-panel client-detail__panel">
          <h2 class="card__title client-detail__panel-title">Historia aktywności</h2>
          ${renderTimeline(timeline)}
        </div>
      </section>
    </main>
  `;

  document.getElementById('archiveClient')?.addEventListener('click', () => {
    openConfirmDialog({
      title: 'Archiwizuj klienta',
      message: `Czy zarchiwizować ${client.name}? Rekord pozostanie dostępny w filtrze archiwum.`,
      confirmLabel: 'Archiwizuj',
      destructive: true,
      onConfirm: () => {
        const result = store.actions.archiveClient(client.id);
        showToast(result.ok ? 'Klient został zarchiwizowany.' : 'Nie udało się zarchiwizować klienta.');
        renderClientDetailView(container, { id: client.id });
      }
    });
  });

  document.getElementById('restoreClient')?.addEventListener('click', () => {
    const result = store.actions.restoreArchivedClient(client.id);
    showToast(result.ok ? 'Klient został przywrócony.' : 'Nie udało się przywrócić klienta.');
    renderClientDetailView(container, { id: client.id });
  });
};
