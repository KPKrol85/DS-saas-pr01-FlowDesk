import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';

const describedBy = ({ id, helper, error }) => {
  const ids = [];
  if (helper) ids.push(`${id}Helper`);
  if (error !== undefined) ids.push(`${id}Error`);
  return ids.length ? ` aria-describedby="${escapeAttribute(ids.join(' '))}"` : '';
};

const requiredAttribute = (required) => (required ? ' required' : '');

const errorAttributes = (id, error, helper = '') => `${error ? ' aria-invalid="true"' : ' aria-invalid="false"'}${describedBy({ id, helper, error })}`;

const helperMarkup = (id, helper) => (helper ? `<span class="input__helper" id="${escapeAttribute(`${id}Helper`)}">${escapeHTML(helper)}</span>` : '');

// The error element is a status region so a validation message written by setFieldError is
// announced when it appears. It stays in the DOM while empty, which is what makes the
// later text change announceable, and unchanged text is not re-announced.
const errorMarkup = (id, error = '') => `<span class="input__error" id="${escapeAttribute(`${id}Error`)}" role="status">${escapeHTML(error)}</span>`;

const errorClassNames = ['input__field--error', 'input__select--error', 'input__textarea--error'];

export const setFieldError = (id, message = '', root = document) => {
  const control = root.querySelector(`#${id}`);
  const error = root.querySelector(`#${id}Error`);
  const hasError = Boolean(message);

  if (error) error.textContent = message;
  if (!control) return;

  control.setAttribute('aria-invalid', String(hasError));
  errorClassNames.forEach((className) => control.classList.toggle(className, hasError));
};

export const inputField = ({ id, name = id, label, type = 'text', value = '', placeholder = '', required = false, helper = '', error = '', autocomplete = '', minLength = '' }) => {
  return `
    <div class="input">
      <label class="input__label" for="${escapeAttribute(id)}">${escapeHTML(label)}</label>
      <input class="input__field ${error ? 'input__field--error' : ''}" id="${escapeAttribute(id)}" name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}"${requiredAttribute(required)}${autocomplete ? ` autocomplete="${escapeAttribute(autocomplete)}"` : ''}${minLength ? ` minlength="${escapeAttribute(minLength)}"` : ''}${errorAttributes(id, error, helper)} />
      ${helperMarkup(id, helper)}
      ${errorMarkup(id, error)}
    </div>
  `;
};

export const selectField = ({ id, name = id, label, options = [], value = '', required = false, helper = '', error = '' }) => {
  return `
    <div class="input">
      <label class="input__label" for="${escapeAttribute(id)}">${escapeHTML(label)}</label>
      <select class="input__select ${error ? 'input__select--error' : ''}" id="${escapeAttribute(id)}" name="${escapeAttribute(name)}"${requiredAttribute(required)}${errorAttributes(id, error, helper)}>
        ${options.map((option) => `<option value="${escapeAttribute(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHTML(option.label)}</option>`).join('')}
      </select>
      ${helperMarkup(id, helper)}
      ${errorMarkup(id, error)}
    </div>
  `;
};

export const textareaField = ({ id, name = id, label, value = '', rows = 3, placeholder = '', required = false, helper = '', error = '' }) => {
  return `
    <div class="input">
      <label class="input__label" for="${escapeAttribute(id)}">${escapeHTML(label)}</label>
      <textarea class="input__textarea ${error ? 'input__textarea--error' : ''}" id="${escapeAttribute(id)}" name="${escapeAttribute(name)}" rows="${escapeAttribute(rows)}" placeholder="${escapeAttribute(placeholder)}"${requiredAttribute(required)}${errorAttributes(id, error, helper)}>${escapeHTML(value)}</textarea>
      ${helperMarkup(id, helper)}
      ${errorMarkup(id, error)}
    </div>
  `;
};
