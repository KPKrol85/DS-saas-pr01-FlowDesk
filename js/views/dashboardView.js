import { store } from '../core/store.js';
import { isProjectOverdue, selectDashboardMetrics, selectHighPriorityOpenProjects, selectNextActions, selectUpcomingEvents } from '../core/selectors.js';
import { emptyState } from '../components/emptyState.js';
import { icon } from '../components/icon.js';
import { pageHeader } from '../components/pageHeader.js';
import { formatDate, formatNumber } from '../utils/format.js';
import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

const priorityLabels = {
  High: 'Wysoki priorytet',
  Medium: 'Średni priorytet',
  Low: 'Niski priorytet'
};

const formatPriorityLabel = (priority) => priorityLabels[priority] || priority;

const overdueBadge = (isOverdue) => (isOverdue ? `<span class="badge badge--danger">${icon('alert', { size: 12 })}Po terminie</span>` : '');

const nextActionModifierClass = (isOverdue, isHighPriority) => {
  if (isOverdue) return ' dashboard-list__item--overdue';
  if (isHighPriority) return ' dashboard-list__item--attention';
  return '';
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
            <span class="kpi__label">Zaległe zlecenia</span>
            <span class="dashboard-kpi__hint">Po terminie</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--success">
            <span class="kpi__value">${formatNumber(metrics.completedProjectsCount)}</span>
            <span class="kpi__label">Ukończone zlecenia</span>
            <span class="dashboard-kpi__hint">Łącznie</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--info">
            <span class="kpi__value">${formatNumber(metrics.throughputProjectsCount)}</span>
            <span class="kpi__label">Zamknięte w 30 dni</span>
            <span class="dashboard-kpi__hint">Ostatni okres</span>
          </div>
          <div class="card kpi dashboard-kpi__card dashboard-kpi__card--attention">
            <span class="kpi__value">${formatNumber(metrics.highPriorityOpenProjectsCount)}</span>
            <span class="kpi__label">Wysoki priorytet</span>
            <span class="dashboard-kpi__hint">Otwarte</span>
          </div>
        </div>

        <div class="dashboard-columns">
          <section class="card dashboard-card dashboard-card--quick-actions" aria-labelledby="dashboard-next-actions-title">
            <h2 class="card__title" id="dashboard-next-actions-title">Najbliższe działania</h2>
            <div class="list dashboard-list">
              ${
                nextActions.length
                  ? nextActions
                      .map((item) => {
                        const overdue = isProjectOverdue(item, referenceDate);
                        const highPriority = !overdue && item.priority === 'High';
                        const href = `#/projects/${encodeURIComponent(item.id)}`;

                        return `
                    <div class="list__item dashboard-list__item dashboard-list__item--with-action${nextActionModifierClass(overdue, highPriority)}">
                      <div class="dashboard-list__main">
                        <a class="dashboard-list__link" href="${href}"><strong>${escapeHTML(item.name)}</strong></a>
                        <div class="dashboard-list__footer">
                          <span class="input__helper dashboard-list__meta">Termin: ${escapeHTML(formatDate(item.dueDate))}</span>
                          <div class="dashboard-list__badge-group">
                            ${overdueBadge(overdue)}
                            <span class="badge badge--info">${escapeHTML(item.status)}</span>
                          </div>
                        </div>
                      </div>
                      <a class="btn btn--ghost dashboard-list__action" href="${href}" aria-label="Szczegóły zlecenia: ${escapeAttribute(item.name)}">Szczegóły</a>
                    </div>
                  `;
                      })
                      .join('')
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
                  ? highPriorityProjects
                      .map(
                        (item) => `
                    <div class="list__item dashboard-list__item">
                      <div class="dashboard-list__main">
                        <a class="dashboard-list__link" href="#/projects/${encodeURIComponent(item.id)}"><strong>${escapeHTML(item.name)}</strong></a>
                        <div class="input__helper dashboard-list__meta">Termin: ${escapeHTML(formatDate(item.dueDate))}</div>
                      </div>
                      <div class="dashboard-list__badges">
                        ${overdueBadge(isProjectOverdue(item, referenceDate))}
                        <span class="badge badge--warning">${escapeHTML(formatPriorityLabel(item.priority))}</span>
                      </div>
                    </div>
                  `
                      )
                      .join('')
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
                        <strong>${escapeHTML(event.title)}</strong>
                        <div class="input__helper dashboard-list__meta">${escapeHTML(formatDate(event.date))}</div>
                      </div>
                      <div class="dashboard-list__badges">
                        <span class="badge badge--info">Nadchodzące</span>
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
