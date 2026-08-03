import { auth } from '../core/auth.js';
import { escapeHTML } from '../utils/sanitize.js';
import { icon } from './icon.js';

const themeToggleStates = Object.freeze({
  light: { iconName: 'moon', label: 'Włącz ciemny motyw' },
  dark: { iconName: 'sun', label: 'Włącz jasny motyw' }
});

const getThemeToggleState = (theme) => themeToggleStates[theme] || themeToggleStates.light;

const renderThemeToggleIcon = (iconName) => icon(iconName, { className: 'topbar__theme-icon', size: 20, strokeWidth: 1.5 });

export const syncThemeToggle = (button, theme) => {
  if (!button) return;

  const { iconName, label } = getThemeToggleState(theme);
  button.setAttribute('aria-label', label);
  button.innerHTML = renderThemeToggleIcon(iconName);
};

const renderThemeToggle = (theme) => {
  const { iconName, label } = getThemeToggleState(theme);
  return `<button class="btn btn--icon" id="themeToggle" aria-label="${label}">${renderThemeToggleIcon(iconName)}</button>`;
};

export const renderTopbar = (theme = 'light') => {
  const session = auth.getSession();
  return `
    <header class="topbar">
      <div class="topbar__inner">
        <div class="topbar__left">
          <button class="btn btn--icon topbar__drawer-toggle" id="drawerToggle" aria-label="Otwórz menu" aria-controls="mobileNavigationDrawer" aria-haspopup="dialog" aria-expanded="false">${icon('menu')}</button>
        </div>
        <div class="search" role="search">
          <label class="visually-hidden" for="searchInput">Szukaj</label>
          <span class="visually-hidden" id="searchHint">Wpisz co najmniej dwa znaki. Użyj strzałek, aby przejść po wynikach.</span>
          <input class="search__input" id="searchInput" type="search" placeholder="Szukaj klientów, zleceń, wydarzeń..." autocomplete="off" aria-controls="searchResults" aria-describedby="searchHint" />
          <div class="search__results" id="searchResults" role="region" aria-label="Wyniki wyszukiwania" hidden></div>
        </div>
        <div class="topbar__actions">
          <button class="btn btn--secondary topbar__quick-add" id="quickAdd" aria-label="Nowy">${icon('plus')}</button>
          ${renderThemeToggle(theme)}
          <div class="user-menu">
            <button class="btn btn--icon user-menu__trigger" id="userMenuBtn" aria-label="Otwórz menu użytkownika" aria-haspopup="true" aria-expanded="false">
              <span class="avatar" aria-hidden="true">${icon('user', { size: 18 })}</span>
            </button>
            <div class="user-menu__panel" id="userMenuPanel" role="menu">
              <p role="none">${escapeHTML(session?.name || 'Użytkownik')} · ${escapeHTML(session?.role || 'Demo')}</p>
              <button class="btn btn--ghost" id="logoutBtn" role="menuitem">Wyloguj</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
};
