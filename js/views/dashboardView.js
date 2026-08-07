import { store } from '../core/store.js';
import { isProjectOverdue, selectDashboardMetrics, selectHighPriorityOpenProjects, selectNextActions, selectUpcomingEvents } from '../core/selectors.js';
import { projectStatusBadgeClass } from '../components/badge.js';
import { emptyState } from '../components/emptyState.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { formatDate, formatEventType, formatNumber, formatProjectStatus } from '../utils/format.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

const overdueBadge = (isOverdue) => (isOverdue ? '<span class="badge badge--danger">Po terminie</span>' : '');

const nextActionModifierClass = (isOverdue, isHighPriority) => {
  if (isOverdue) return ' dashboard-list__item--overdue';
  if (isHighPriority) return ' dashboard-list__item--attention';
  return '';
};

// Both order lists show the same record with the same hierarchy — title, due date, state — and the
// same quiet navigation action, so they render from one template. Only the left accent differs:
// inside "Zlecenia wysokiego priorytetu" every row is high priority, so the amber bar would mark
// nothing and is suppressed there. Neither the href nor the click behaviour changes.
const projectListItem = (item, referenceDate, { highlightPriority = false } = {}) => {
  const overdue = isProjectOverdue(item, referenceDate);
  const highPriority = highlightPriority && !overdue && item.priority === 'High';
  const href = `#/projects/${encodeURIComponent(item.id)}`;

  return `
    <div class="list__item dashboard-list__item dashboard-list__item--with-action${nextActionModifierClass(overdue, highPriority)}">
      <div class="dashboard-list__main">
        <a class="dashboard-list__link" href="${href}"><span class="dashboard-list__title">${escapeHTML(item.name)}</span></a>
        <div class="dashboard-list__footer">
          <span class="data-meta dashboard-list__meta">Termin: ${escapeHTML(formatDate(item.dueDate))}</span>
          <div class="dashboard-list__badge-group">
            ${overdueBadge(overdue)}
            <span class="badge ${projectStatusBadgeClass(item.status)}">${escapeHTML(formatProjectStatus(item.status))}</span>
          </div>
        </div>
      </div>
      <a class="btn btn--ghost btn--micro dashboard-list__action" href="${href}" aria-label="Szczegóły zlecenia: ${escapeAttribute(item.name)}">
        ${icon('arrowRight')}<span>Szczegóły</span>
      </a>
    </div>
  `;
};

export const renderDashboardView = (container) => {
  const state = store.getState();
  const metrics = selectDashboardMetrics(state);
  const nextActions = selectNextActions(state);
  const highPriorityProjects = selectHighPriorityOpenProjects(state);
  const upcomingEvents = selectUpcomingEvents(state);
  const referenceDate = new Date();

  container.innerHTML = `
    <main id="main" class="container">
      ${pageHeader({ title: 'Dashboard', description: 'Przegląd klientów, zleceń, terminów i działań wymagających uwagi.' })}

      <section class="dashboard-grid">
        <div class="dashboard-kpi">
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--attention">
            <span class="kpi__value">${formatNumber(metrics.overdueProjectsCount)}</span>
            <span class="kpi__label">Zlecenia po terminie</span>
            <span class="dashboard-kpi__hint">Otwarte, przekroczony termin</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--success">
            <span class="kpi__value">${formatNumber(metrics.completedProjectsCount)}</span>
            <span class="kpi__label">Ukończone zlecenia</span>
            <span class="dashboard-kpi__hint">Łącznie, bez archiwum</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--info">
            <span class="kpi__value">${formatNumber(metrics.throughputProjectsCount)}</span>
            <span class="kpi__label">Zamknięte w 30 dni</span>
            <span class="dashboard-kpi__hint">Bieżąca przepustowość</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--attention">
            <span class="kpi__value">${formatNumber(metrics.highPriorityOpenProjectsCount)}</span>
            <span class="kpi__label">Wysoki priorytet</span>
            <span class="dashboard-kpi__hint">Otwarte zlecenia</span>
          </div>
        </div>

        <div class="dashboard-columns">
          <section class="card dashboard-card dashboard-card--quick-actions" aria-labelledby="dashboard-next-actions-title">
            <h2 class="card__title" id="dashboard-next-actions-title">Najbliższe działania</h2>
            <div class="list dashboard-list">
              ${
                nextActions.length
                  ? nextActions.map((item) => projectListItem(item, referenceDate, { highlightPriority: true })).join('')
                  : emptyState({
                      title: 'Brak zaplanowanych działań',
                      description: 'Nie ma aktywnych zleceń z terminem do pokazania. Dodaj zlecenie albo przywróć rekord z archiwum.',
                      iconName: 'projects'
                    })
              }
            </div>
          </section>

          <section class="card dashboard-card dashboard-card--priority" aria-labelledby="dashboard-priority-title">
            <h2 class="card__title" id="dashboard-priority-title">Zlecenia wysokiego priorytetu</h2>
            <div class="list dashboard-list">
              ${
                highPriorityProjects.length
                  ? highPriorityProjects.map((item) => projectListItem(item, referenceDate)).join('')
                  : emptyState({
                      title: 'Brak pilnych zleceń',
                      description: 'Nie ma otwartych zleceń wysokiego priorytetu. To poprawny stan, gdy pilna praca została zamknięta albo zarchiwizowana.',
                      iconName: 'projects'
                    })
              }
            </div>
          </section>
        </div>

        <section class="card dashboard-card dashboard-card--events" aria-labelledby="dashboard-events-title">
          <h2 class="card__title" id="dashboard-events-title">Nadchodzące wydarzenia</h2>
          <div class="list dashboard-list">
            ${
              upcomingEvents.length
                ? upcomingEvents
                    .map(
                      (event) => `
                    <div class="list__item dashboard-list__item">
                      <div class="dashboard-list__main">
                        <span class="dashboard-list__title">${escapeHTML(event.title)}</span>
                        <span class="data-meta dashboard-list__meta">${escapeHTML(formatDate(event.date))}</span>
                      </div>
                      <div class="dashboard-list__badges">
                        <span class="badge badge--info">${escapeHTML(formatEventType(event.type))}</span>
                      </div>
                    </div>
                  `
                    )
                    .join('')
                : emptyState({
                    title: 'Brak wydarzeń',
                    description: 'Nie ma wydarzeń w najbliższych dniach. Nowe spotkania i deadline’y pojawią się tutaj po dodaniu do kalendarza.',
                    iconName: 'calendar'
                  })
            }
          </div>
        </section>
      </section>
    </main>
  `;
};
