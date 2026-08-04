import { icon } from './icon.js';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', iconName: 'dashboard' },
  { path: '/clients', label: 'Klienci', iconName: 'clients' },
  { path: '/projects', label: 'Zlecenia', iconName: 'projects' },
  { path: '/calendar', label: 'Kalendarz', iconName: 'calendar' },
  { path: '/settings', label: 'Ustawienia', iconName: 'settings' }
];

const renderSidebarBrand = () => `
  <a class="sidebar__brand" href="#/dashboard" aria-label="FlowDesk dashboard">
    <img class="sidebar__brand-logo" src="assets/logo/logo.svg" alt="" aria-hidden="true" />
    <span class="sidebar__brand-name">FlowDesk</span>
  </a>
`;

const renderNavigationLinks = (activePath) => `
  <nav class="sidebar__nav">
    ${navItems
      .map((item) => {
        const isActive = activePath === item.path;
        return `
        <a class="sidebar__link ${isActive ? 'sidebar__link--active' : ''}" href="#${item.path}"${isActive ? ' aria-current="page"' : ''}>
          ${icon(item.iconName)}
          <span>${item.label}</span>
        </a>
      `;
      })
      .join('')}
  </nav>
`;

export const renderSidebar = (activePath) => {
  return `
    <aside class="sidebar" aria-label="Nawigacja główna">
      ${renderSidebarBrand()}
      ${renderNavigationLinks(activePath)}
    </aside>
  `;
};

export const renderNavList = (activePath) => {
  return `
    ${renderSidebarBrand()}
    ${renderNavigationLinks(activePath)}
  `;
};
