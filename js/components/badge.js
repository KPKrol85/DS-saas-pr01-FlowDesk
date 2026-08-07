/**
 * Maps the stored project vocabularies onto the badge variants that already exist in
 * css/components/badge.css. No new colour is introduced here: every value resolves to one of the
 * four modifiers the system ships. The mapping lived separately in the Projects board and the
 * order detail view, which is why a finished order could read green on one screen and neutral on
 * another; the Dashboard now shares the same resolution.
 */

export const projectStatusBadgeClass = (status) => {
  if (status === 'Done') return 'badge--success';
  if (status === 'Review') return 'badge--warning';
  return 'badge--info';
};

export const projectPriorityBadgeClass = (priority) => (priority === 'High' ? 'badge--warning' : 'badge--info');
