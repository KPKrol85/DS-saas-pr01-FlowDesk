import { escapeAttribute, escapeHTML } from '../utils/sanitize.js';
import { icon } from './icon.js';

const allowedAttribute = /^[a-zA-Z_:][\w:.-]*$/;
const inlineEventAttribute = /^on/i;

const renderAttributes = (attributes = {}) =>
  Object.entries(attributes)
    .filter(([name, value]) => allowedAttribute.test(name) && !inlineEventAttribute.test(name) && value !== false && value !== null && value !== undefined)
    .map(([name, value]) => (value === true ? escapeAttribute(name) : `${escapeAttribute(name)}="${escapeAttribute(value)}"`))
    .join(' ');

export const button = ({ label, id = '', type = 'button', variant = 'secondary', iconName = '', iconOnly = false, className = '', attributes = {} }) => {
  const idAttribute = id ? ` id="${escapeAttribute(id)}"` : '';
  const titleAttribute = iconOnly && label ? ` title="${escapeAttribute(label)}"` : '';
  const extraAttributes = renderAttributes(attributes);
  const classes = `btn btn--${escapeAttribute(variant)} ${iconOnly ? 'btn--icon' : ''} ${escapeAttribute(className)}`.trim();
  const iconMarkup = iconName ? icon(iconName) : '';
  // An icon-only button keeps its label as real text, clipped by the shared .visually-hidden
  // utility, rather than as aria-label. The accessible name then comes from content, and the
  // title attribute still exposes it to sighted users on hover.
  const labelMarkup = iconOnly ? `<span class="visually-hidden">${escapeHTML(label)}</span>` : `<span>${escapeHTML(label)}</span>`;

  return `<button class="${classes}" type="${escapeAttribute(type)}"${idAttribute}${titleAttribute}${extraAttributes ? ` ${extraAttributes}` : ''}>${iconMarkup}${labelMarkup}</button>`;
};
