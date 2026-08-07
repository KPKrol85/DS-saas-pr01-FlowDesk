import { qs } from '../core/dom.js';
import { getActionFieldError } from '../core/actions.js';
import { selectProjectDetail } from '../core/selectors.js';
import { store } from '../core/store.js';
import { projectPriorityBadgeClass, projectStatusBadgeClass } from '../components/badge.js';
import { button } from '../components/button.js';
import { openConfirmDialog } from '../components/confirmDialog.js';
import { emptyState } from '../components/emptyState.js';
import { textareaField, setFieldError } from '../components/formControls.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { showToast } from '../components/toast.js';
import { formatDate, formatNumber, formatProjectStatus } from '../utils/format.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

const getProjectClientLabel = (project, client) => {
  if (client) return client.name;
  return project.clientId ? 'Klient niedostępny' : 'Bez klienta';
};

// The same label/value pair the client detail route renders, so both records read alike.
const metaItem = (label, value, hint = '') => `
  <div class="meta-grid__item">
    <dt class="meta-grid__label">${escapeHTML(label)}</dt>
    <dd class="meta-grid__value">${value}${hint ? `<span class="meta-grid__hint">${escapeHTML(hint)}</span>` : ''}</dd>
  </div>
`;

const renderTasks = (project) =>
  project.tasks.length
    ? project.tasks
        .map(
          (task) => `
            <label class="list__item data-list__item data-list__item--check detail-item">
              <span class="data-list__main detail-item-title">${escapeHTML(task.title)}</span>
              <input class="project-detail__check" type="checkbox" data-task-id="${escapeAttribute(task.id)}" ${task.done ? 'checked' : ''} />
            </label>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak checklisty',
        description: 'To zlecenie nie ma jeszcze zadań operacyjnych.',
        iconName: 'projects'
      });

const renderComments = (comments = []) =>
  comments.length
    ? comments
        .map(
          (comment) => `
            <div class="timeline__item">
              <strong>${escapeHTML(comment.author)} · ${escapeHTML(formatDate(comment.date))}</strong>
              <p>${escapeHTML(comment.body)}</p>
            </div>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak komentarzy',
        description: 'Komentarze operacyjne dodane przez formularz pojawią się tutaj.',
        iconName: 'edit'
      });

const renderHistory = (history = []) =>
  history.length
    ? history
        .slice()
        .reverse()
        .map(
          (entry) => `
            <div class="timeline__item">
              <strong>${escapeHTML(formatDate(entry.date))}</strong>
              <p>${escapeHTML(entry.text)}</p>
            </div>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak historii zmian',
        description: 'Historia pojawi się po utworzeniu, aktualizacji albo archiwizacji zlecenia.',
        iconName: 'calendar'
      });

const renderEvents = (events = []) =>
  events.length
    ? events
        .map(
          (event) => `
            <div class="list__item data-list__item detail-item">
              <div class="data-list__main">
                <strong class="detail-item-title">${escapeHTML(event.title)}</strong>
                <div class="data-meta data-list__meta">${escapeHTML(formatDate(event.date))}</div>
              </div>
            </div>
          `
        )
        .join('')
    : emptyState({
        title: 'Brak powiązanych wydarzeń',
        description: 'Wydarzenia kalendarza powiązane z tym zleceniem pojawią się tutaj.',
        iconName: 'calendar'
      });

export const renderProjectDetailView = (container, { id } = {}) => {
  const detail = selectProjectDetail(store.getState(), id);

  if (!detail) {
    container.innerHTML = `
      <main id="main" class="container">
        ${pageHeader({
          title: 'Zlecenie nie znalezione',
          description: 'Rekord nie istnieje albo został usunięty z danych demo.',
          actions: `<a class="btn btn--secondary btn--compact detail-header-action" href="#/projects">${icon('arrowLeft')}<span>Wróć do zleceń</span></a>`
        })}
        ${emptyState({
          title: 'Brak rekordu zlecenia',
          description: 'Ten adres nie pasuje do żadnego zlecenia w lokalnych danych demo. Wróć do listy zleceń albo przywróć dane startowe w ustawieniach.',
          iconName: 'projects'
        })}
      </main>
    `;
    return;
  }

  const { project, client, events } = detail;
  const archived = Boolean(project.archivedAt);

  container.innerHTML = `
    <main id="main" class="container">
      ${pageHeader({
        eyebrow: 'Zlecenie',
        title: project.name,
        description: `${formatProjectStatus(project.status)} · ${project.priority} · ${getProjectClientLabel(project, client)}`,
        actions: `
          <a class="btn btn--secondary btn--compact detail-header-action" href="#/projects">${icon('arrowLeft')}<span>Wróć</span></a>
          ${
            archived
              ? button({ label: 'Przywróć', id: 'restoreProject', variant: 'secondary', iconName: 'reset', className: 'btn--compact detail-header-action' })
              : button({ label: 'Archiwizuj', id: 'archiveProject', variant: 'danger', iconName: 'delete', className: 'btn--compact detail-header-action' })
          }
        `
      })}

      <section class="detail-grid">
        <div class="card detail-main data-panel">
          <div class="project-detail__section-head">
            <h2 class="card__title">Podsumowanie zlecenia</h2>
            <div class="tag-row data-tags">
              <span class="badge ${projectStatusBadgeClass(project.status)}">${escapeHTML(formatProjectStatus(project.status))}</span>
              <span class="badge ${projectPriorityBadgeClass(project.priority)}">${escapeHTML(project.priority)}</span>
              ${archived ? '<span class="badge badge--danger">Archiwum</span>' : ''}
            </div>
          </div>
          <dl class="meta-grid">
            ${metaItem(
              'Klient',
              client ? `<a href="#/clients/${encodeURIComponent(client.id)}">${escapeHTML(client.name)}</a>` : escapeHTML(getProjectClientLabel(project, client)),
              !client && project.clientId ? 'Powiązany klient jest niedostępny w lokalnych danych demo.' : ''
            )}
            ${metaItem('Termin', escapeHTML(formatDate(project.dueDate)))}
            ${metaItem('SLA', escapeHTML(project.sla.serviceLevel))}
            ${metaItem('Reakcja do', escapeHTML(formatDate(project.sla.responseDueDate)))}
          </dl>
          <div class="detail-block">
            <h3 class="detail-subtitle">Notatki</h3>
            <p class="detail-notes">${escapeHTML(project.notes || 'Brak notatek.')}</p>
          </div>
          ${archived ? `<p class="input__helper data-archive-note">Archiwum od: ${escapeHTML(formatDate(project.archivedAt))}. Rekord pozostaje dostępny do przeglądu i można go przywrócić.</p>` : ''}
        </div>

        <div class="card data-panel">
          <h2 class="card__title">Wycena</h2>
          <dl class="meta-grid">
            ${metaItem('Godziny', `<span class="project-detail__figure">${formatNumber(project.estimate.hours)}</span>`)}
            ${metaItem('Wartość', `<span class="project-detail__figure">${formatNumber(project.estimate.value)}</span> ${escapeHTML(project.estimate.currency)}`)}
            ${metaItem('Ukończono', escapeHTML(formatDate(project.completedAt)))}
          </dl>
        </div>

        <div class="card data-panel">
          <h2 class="card__title">Checklist</h2>
          <div class="list data-list detail-list">${renderTasks(project)}</div>
        </div>

        <div class="card data-panel">
          <h2 class="card__title">Wydarzenia</h2>
          <div class="list data-list detail-list">${renderEvents(events)}</div>
        </div>

        <div class="card data-panel">
          <h2 class="card__title">Komentarze</h2>
          <div class="timeline">${renderComments(project.comments)}</div>
          <form id="commentForm" class="form-grid comment-form">
            ${textareaField({ id: 'comment', label: 'Nowy komentarz', rows: 3, placeholder: 'Dodaj notatkę operacyjną' })}
            ${button({ label: 'Dodaj komentarz', type: 'submit', variant: 'secondary', iconName: 'plus', className: 'btn--compact comment-form__submit' })}
          </form>
        </div>

        <div class="card data-panel">
          <h2 class="card__title">Historia zmian</h2>
          <div class="timeline">${renderHistory(project.history)}</div>
        </div>
      </section>
    </main>
  `;

  container.querySelectorAll('[data-task-id]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const result = store.actions.toggleProjectTask(project.id, checkbox.dataset.taskId);
      showToast(result.ok ? 'Zaktualizowano checklistę.' : 'Nie udało się zaktualizować checklisty.');
      renderProjectDetailView(container, { id: project.id });
    });
  });

  qs('#commentForm', container)?.addEventListener('submit', (event) => {
    event.preventDefault();
    setFieldError('comment', '', container);
    const data = new FormData(event.currentTarget);
    const result = store.actions.addProjectComment(project.id, { body: data.get('comment') });
    if (!result.ok) {
      setFieldError('comment', getActionFieldError(result, 'comment'), container);
      return;
    }
    showToast('Dodano komentarz.');
    renderProjectDetailView(container, { id: project.id });
  });

  document.getElementById('archiveProject')?.addEventListener('click', () => {
    openConfirmDialog({
      title: 'Archiwizuj zlecenie',
      message: `Czy zarchiwizować ${project.name}? Rekord pozostanie dostępny w filtrze archiwum.`,
      confirmLabel: 'Archiwizuj',
      destructive: true,
      onConfirm: () => {
        const result = store.actions.archiveProject(project.id);
        showToast(result.ok ? 'Zlecenie zostało zarchiwizowane.' : 'Nie udało się zarchiwizować zlecenia.');
        renderProjectDetailView(container, { id: project.id });
      }
    });
  });

  document.getElementById('restoreProject')?.addEventListener('click', () => {
    const result = store.actions.restoreArchivedProject(project.id);
    showToast(result.ok ? 'Zlecenie zostało przywrócone.' : 'Nie udało się przywrócić zlecenia.');
    renderProjectDetailView(container, { id: project.id });
  });
};
