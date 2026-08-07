import { escapeAttribute } from '../utils/sanitize.js';

const icons = Object.freeze({
  dashboard:
    '<!-- Font Awesome Free v7.3.1 Copyright 2026 Fonticons, Inc. --> <path d="M32 192C32 156.7 60.7 128 96 128L544 128C579.3 128 608 156.7 608 192L608 448C608 483.3 579.3 512 544 512L96 512C60.7 512 32 483.3 32 448L32 192zM96 224L96 256C96 273.7 110.3 288 128 288L288 288C305.7 288 320 273.7 320 256L320 224C320 206.3 305.7 192 288 192L128 192C110.3 192 96 206.3 96 224zM120 416C106.7 416 96 426.7 96 440C96 453.3 106.7 464 120 464L256 464C269.3 464 280 453.3 280 440C280 426.7 269.3 416 256 416L120 416zM376 416C362.7 416 352 426.7 352 440C352 453.3 362.7 464 376 464L520 464C533.3 464 544 453.3 544 440C544 426.7 533.3 416 520 416L376 416zM528 256C528 220.7 499.3 192 464 192C428.7 192 400 220.7 400 256C400 291.3 428.7 320 464 320C499.3 320 528 291.3 528 256zM120 376C133.3 376 144 365.3 144 352C144 338.7 133.3 328 120 328C106.7 328 96 338.7 96 352C96 365.3 106.7 376 120 376zM224 352C224 338.7 213.3 328 200 328C186.7 328 176 338.7 176 352C176 365.3 186.7 376 200 376C213.3 376 224 365.3 224 352zM280 376C293.3 376 304 365.3 304 352C304 338.7 293.3 328 280 328C266.7 328 256 338.7 256 352C256 365.3 266.7 376 280 376z" />',
  clients:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />',

  clientAdd:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />',
  projects:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />',
  calendar:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />',
  settings:
    '<path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" /> <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />',
  plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  arrowLeft: '<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />',
  arrowRight: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />',
  edit: '<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />',
  delete:
    '<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />',
  close: '<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>',
  chevronDown: '<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />',
  search: '<circle cx="11" cy="11" r="7"></circle><path d="m16 16 4 4"></path>',
  export: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
  reset: '<path d="M4 12a8 8 0 1 0 3-6.2"></path><path d="M4 4v6h6"></path>',
  theme: '<path d="M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8Z"></path>',
  moon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />',
  sun: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />',
  menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
  user: '<path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"></path>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>'
});

// Approved sources that deviate from the default outline contract.
const iconContracts = Object.freeze({
  dashboard: { viewBox: '0 0 640 640', filled: true },
  arrowLeft: { strokeWidth: 1.5 },
  arrowRight: { strokeWidth: 1.5 },
  calendar: { strokeWidth: 1.5 },
  chevronDown: { strokeWidth: 1.5 },
  clientAdd: { strokeWidth: 1.5 },
  clients: { strokeWidth: 1.5 },
  delete: { strokeWidth: 1.5 },
  edit: { strokeWidth: 1.5 },
  projects: { strokeWidth: 1.5 },
  settings: { strokeWidth: 1.5 }
});

export const iconNames = Object.freeze(Object.keys(icons));

export const icon = (name, { className = '', label = '', size = 20, strokeWidth } = {}) => {
  const body = icons[name];
  if (!body) return '';
  const { viewBox = '0 0 24 24', filled = false, strokeWidth: contractStrokeWidth = 1.8 } = iconContracts[name] ?? {};
  const accessibility = label ? `role="img" aria-label="${escapeAttribute(label)}"` : 'aria-hidden="true" focusable="false"';
  const paint = filled
    ? 'fill="currentColor"'
    : `fill="none" stroke="currentColor" stroke-width="${escapeAttribute(strokeWidth ?? contractStrokeWidth)}" stroke-linecap="round" stroke-linejoin="round"`;

  return `<svg class="icon ${escapeAttribute(className)}" width="${escapeAttribute(size)}" height="${escapeAttribute(size)}" viewBox="${escapeAttribute(viewBox)}" ${paint} ${accessibility}>${body}</svg>`;
};
