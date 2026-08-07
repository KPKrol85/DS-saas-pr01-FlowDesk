export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('pl-PL').format(value || 0);
};

export const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : '');

// PROJECT_STATUSES and EVENT_TYPES are stable English identifiers used by the store, the filters
// and persistence. The maps below localize the visible label only — every value handed to a
// selector, a filter or a badge helper stays raw. They live here rather than in a view so the
// Dashboard, the Projects board and both detail routes print one label for one stored value.
const projectStatusLabels = Object.freeze({
  Draft: 'Szkic',
  'In progress': 'W toku',
  Review: 'Weryfikacja',
  Done: 'Zakończone'
});

const eventTypeLabels = Object.freeze({
  General: 'Ogólne',
  Meeting: 'Spotkanie',
  Deadline: 'Termin'
});

export const formatProjectStatus = (status) => projectStatusLabels[status] || status || '—';

export const formatEventType = (type) => eventTypeLabels[type] || type || '—';
