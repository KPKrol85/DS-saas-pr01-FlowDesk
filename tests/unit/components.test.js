import { describe, expect, it, vi } from 'vitest';
import { button } from '../../js/components/button.js';
import { emptyState } from '../../js/components/emptyState.js';
import { inputField, selectField, setFieldError, textareaField } from '../../js/components/formControls.js';
import { icon } from '../../js/components/icon.js';
import { openConfirmDialog } from '../../js/components/confirmDialog.js';
import { pageHeader } from '../../js/components/pageHeader.js';
import { renderNavList, renderSidebar } from '../../js/components/sidebar.js';
import { renderTable } from '../../js/components/table.js';

const render = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};

describe('ui components', () => {
  it('renders decorative and labelled icons from a fixed dictionary', () => {
    expect(icon('dashboard')).toContain('aria-hidden="true"');
    expect(icon('dashboard', { label: 'Dashboard' })).toContain('aria-label="Dashboard"');
    expect(icon('missing')).toBe('');
  });

  it('renders safe buttons with icons and filtered attributes', () => {
    const element = render(
      button({
        label: '<Add>',
        variant: 'primary',
        iconName: 'plus',
        attributes: { 'data-action': 'create', onclick: 'blocked' }
      })
    );

    expect(element.className).toContain('btn--primary');
    expect(element.dataset.action).toBe('create');
    expect(element.textContent).toBe('<Add>');
    expect(element.querySelector('svg')).not.toBeNull();
    expect(element.getAttribute('onclick')).toBeNull();
  });

  it('renders accessible input, select, and textarea fields', () => {
    const input = render(inputField({ id: 'name', label: 'Name', value: '"quoted"', required: true, helper: 'Helper', error: 'Required' }));
    const select = render(selectField({ id: 'status', label: 'Status', options: [{ value: '<x>', label: '<X>' }], value: '<x>' }));
    const textarea = render(textareaField({ id: 'notes', label: 'Notes', value: '<script>alert(1)</script>' }));

    expect(input.querySelector('label').htmlFor).toBe('name');
    expect(input.querySelector('input').getAttribute('aria-invalid')).toBe('true');
    expect(input.querySelector('input').getAttribute('aria-describedby')).toContain('nameHelper');
    expect(select.querySelector('option').textContent).toBe('<X>');
    expect(textarea.querySelector('textarea').value).toBe('<script>alert(1)</script>');
    expect(textarea.querySelector('script')).toBeNull();
  });

  it('updates field error state accessibly', () => {
    const wrapper = render(inputField({ id: 'email', label: 'Email' }));
    document.body.appendChild(wrapper);

    setFieldError('email', 'Required');

    const input = document.getElementById('email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.classList.contains('input__field--error')).toBe(true);
    expect(document.getElementById('emailError').textContent).toBe('Required');

    setFieldError('email');

    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.classList.contains('input__field--error')).toBe(false);
    wrapper.remove();
  });

  it('renders safe page headers, empty states, and tables', () => {
    const header = render(pageHeader({ title: '<Title>', description: '<Description>' }));
    const empty = render(emptyState({ title: '<Empty>', description: '<Details>', iconName: 'projects' }));
    const table = render(renderTable({ headers: ['<H>'], rows: [['<Cell>']] }));

    expect(header.textContent).toContain('<Title>');
    expect(header.querySelector('script')).toBeNull();
    expect(empty.textContent).toContain('<Details>');
    expect(empty.querySelector('svg')).not.toBeNull();
    expect(table.querySelector('th').textContent).toBe('<H>');
    expect(table.querySelector('td').textContent).toBe('<Cell>');
  });

  it('confirms destructive actions through the modal component', async () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();

    try {
      openConfirmDialog({
        title: 'Delete record',
        message: '<script>alert(1)</script>',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm
      });

      expect(document.querySelector('.modal__title').textContent).toBe('Delete record');
      expect(document.querySelector('.confirm-dialog').textContent).toContain('<script>alert(1)</script>');
      expect(document.querySelector('.confirm-dialog script')).toBeNull();

      document.getElementById('confirmDialogConfirm').click();

      expect(onConfirm).toHaveBeenCalledTimes(1);
      await vi.runAllTimersAsync();
      expect(document.querySelector('.modal-backdrop')).toBeNull();
    } finally {
      document.querySelector('.modal-backdrop')?.remove();
      vi.useRealTimers();
    }
  });

  it('marks only the active navigation link with aria-current in the sidebar and the drawer', () => {
    const links = (html) => Array.from(render(`<div>${html}</div>`).querySelectorAll('.sidebar__link'));

    for (const markup of [renderSidebar('/clients'), renderNavList('/clients')]) {
      const current = links(markup).filter((link) => link.getAttribute('aria-current') === 'page');

      expect(current).toHaveLength(1);
      expect(current[0].getAttribute('href')).toBe('#/clients');
      expect(current[0].className).toContain('sidebar__link--active');
      expect(links(markup).filter((link) => link.hasAttribute('aria-current'))).toHaveLength(1);
    }

    const moved = links(renderSidebar('/calendar')).filter((link) => link.hasAttribute('aria-current'));

    expect(moved).toHaveLength(1);
    expect(moved[0].getAttribute('href')).toBe('#/calendar');
    expect(links(renderSidebar('/unknown')).some((link) => link.hasAttribute('aria-current'))).toBe(false);
  });
});
