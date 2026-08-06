import { router } from './core/router.js';
import { renderSidebar, renderNavList } from './components/sidebar.js';
import { renderTopbar, syncThemeToggle } from './components/topbar.js';
import { bindDrawerToggle, createDrawer } from './components/drawer.js';
import { auth } from './core/auth.js';
import { selectGlobalSearchResults, selectUiPreferences } from './core/selectors.js';
import { store } from './core/store.js';
import { button } from './components/button.js';
import { openModal } from './components/modal.js';
import { qs } from './core/dom.js';
import { initObservability } from './core/observability.js';
import { registerServiceWorker } from './core/serviceWorkerRegistration.js';
import { showToast } from './components/toast.js';
import { escapeAttribute, escapeHTML } from './utils/sanitize.js';
import { storage } from './utils/storage.js';

const app = document.getElementById('app');

initObservability();

const applyTheme = () => {
  const ui = selectUiPreferences(store.getState());
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${ui.theme}`);
  document.documentElement.classList.toggle('motion-reduced', ui.reducedMotion);
  syncThemeToggle(qs('#themeToggle', app), ui.theme);
};

let userMenuHandler = null;
let searchCloseHandler = null;
let pendingQuickAction = '';

const quickActionTargets = Object.freeze({
  client: {
    hash: '#/clients',
    trigger: '#addClient',
    fallback: 'Przejdź do klientów i użyj przycisku dodawania.'
  },
  project: {
    hash: '#/projects',
    trigger: '#addProject',
    fallback: 'Przejdź do zleceń i użyj przycisku dodawania.'
  }
});

const runPendingQuickAction = () => {
  const action = pendingQuickAction;
  const target = quickActionTargets[action];
  if (!target) return;
  pendingQuickAction = '';

  window.setTimeout(() => {
    const trigger = qs(target.trigger, app);
    if (!trigger) {
      showToast(target.fallback);
      return;
    }
    trigger.click();
  }, 160);
};

const renderSearchResults = (results) => {
  if (!results.length) {
    return '<div class="search__empty" role="status">Brak wyników dla tej frazy.</div>';
  }

  return results
    .map((result) => {
      const accessibleLabel = `${result.label}: ${result.title}. ${result.description}`;
      return `
        <a class="search__result" href="${escapeAttribute(result.href)}" data-search-result aria-label="${escapeAttribute(accessibleLabel)}">
          <span class="search__type">${escapeHTML(result.label)}</span>
          <strong>${escapeHTML(result.title)}</strong>
          <span>${escapeHTML(result.description)}</span>
        </a>
      `;
    })
    .join('');
};

const bindGlobalSearch = () => {
  const input = qs('#searchInput', app);
  const panel = qs('#searchResults', app);
  if (!input || !panel) return;

  const searchResults = () => [...panel.querySelectorAll('[data-search-result]')];

  const close = ({ clear = false, restoreFocus = false } = {}) => {
    panel.hidden = true;
    panel.innerHTML = '';
    if (clear) input.value = '';
    if (restoreFocus) input.focus();
  };

  const open = () => {
    panel.hidden = false;
  };

  const focusResult = (index) => {
    const results = searchResults();
    if (!results.length) return;
    const nextIndex = (index + results.length) % results.length;
    results[nextIndex].focus();
  };

  const update = () => {
    const term = input.value.trim();
    if (term.length < 2) {
      close();
      return;
    }

    panel.innerHTML = renderSearchResults(selectGlobalSearchResults(store.getState(), term));
    open();
    panel.querySelectorAll('[data-search-result]').forEach((result) => {
      result.addEventListener('click', close);
    });
  };

  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close({ clear: true });
    }
    if (event.key === 'ArrowDown') {
      if (searchResults().length) {
        event.preventDefault();
        focusResult(0);
      }
    }
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close({ clear: true, restoreFocus: true });
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const results = searchResults();
    if (!results.length) return;

    event.preventDefault();
    const currentIndex = results.indexOf(document.activeElement);
    if (event.key === 'Home') {
      focusResult(0);
      return;
    }
    if (event.key === 'End') {
      focusResult(results.length - 1);
      return;
    }
    focusResult(event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1);
  });

  if (searchCloseHandler) document.removeEventListener('click', searchCloseHandler);
  searchCloseHandler = (event) => {
    if (!panel.contains(event.target) && event.target !== input) close();
  };
  document.addEventListener('click', searchCloseHandler);
};

const renderShell = (activePath, view, params = {}) => {
  app.innerHTML = `
    <div class="app__shell">
      ${renderSidebar(activePath)}
      <div class="app__content">
        ${renderTopbar(selectUiPreferences(store.getState()).theme)}
        <section id="view"></section>
      </div>
    </div>
  `;

  const drawer = createDrawer({ content: renderNavList(activePath) });
  const toggleBtn = qs('#drawerToggle', app);
  if (toggleBtn) bindDrawerToggle({ button: toggleBtn, drawer });

  const viewContainer = qs('#view', app);
  view(viewContainer, params);
  bindGlobalSearch();
  runPendingQuickAction();

  const userMenuBtn = qs('#userMenuBtn', app);
  const userMenuPanel = qs('#userMenuPanel', app);

  const closeUserMenu = ({ restoreFocus = false } = {}) => {
    userMenuPanel.classList.remove('user-menu__panel--open');
    userMenuBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) userMenuBtn.focus();
  };

  const handleUserMenuEscape = (event) => {
    if (event.key !== 'Escape' || !userMenuPanel.classList.contains('user-menu__panel--open')) return;
    event.preventDefault();
    closeUserMenu({ restoreFocus: true });
  };

  userMenuBtn?.addEventListener('click', () => {
    const isOpen = !userMenuPanel.classList.contains('user-menu__panel--open');
    if (isOpen) {
      userMenuPanel.classList.add('user-menu__panel--open');
      userMenuBtn.setAttribute('aria-expanded', 'true');
      return;
    }
    closeUserMenu({ restoreFocus: true });
  });
  userMenuBtn?.addEventListener('keydown', handleUserMenuEscape);
  userMenuPanel?.addEventListener('keydown', handleUserMenuEscape);
  if (userMenuHandler) document.removeEventListener('click', userMenuHandler);
  userMenuHandler = (event) => {
    if (!userMenuPanel.contains(event.target) && !userMenuBtn.contains(event.target)) {
      closeUserMenu();
    }
  };
  document.addEventListener('click', userMenuHandler);

  qs('#logoutBtn', app)?.addEventListener('click', () => {
    auth.logout();
    showToast('Wylogowano.');
    window.location.hash = '#/login';
  });

  qs('#themeToggle', app)?.addEventListener('click', () => {
    const current = selectUiPreferences(store.getState()).theme;
    const nextTheme = current === 'light' ? 'dark' : 'light';
    const result = store.actions.updateUiPreferences({ theme: nextTheme });
    showToast(result.ok ? `Włączono motyw ${nextTheme === 'dark' ? 'ciemny' : 'jasny'}.` : 'Nie udało się zaktualizować motywu.');
  });

  qs('#quickAdd', app)?.addEventListener('click', () => {
    const close = openModal({
      title: 'Szybkie dodanie',
      content: `
        <div class="list">
          <p>Wybierz formularz, który chcesz otworzyć w lokalnej przestrzeni demo.</p>
          ${button({ label: 'Nowy klient', variant: 'secondary', iconName: 'clientAdd', attributes: { 'data-quick': 'client' } })}
          ${button({ label: 'Nowe zlecenie', variant: 'secondary', iconName: 'projects', attributes: { 'data-quick': 'project' } })}
        </div>
      `,
      footer: '<button class="btn btn--secondary" data-modal-close>Zamknij</button>'
    });

    document.querySelectorAll('[data-quick]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = quickActionTargets[button.dataset.quick];
        if (!target) return;
        pendingQuickAction = button.dataset.quick;
        close();
        if (window.location.hash === target.hash) {
          runPendingQuickAction();
          return;
        }
        window.location.hash = target.hash;
      });
    });
  });
};

const renderLogin = (view) => {
  app.innerHTML = '';
  view(app);
};

store.subscribe(() => {
  applyTheme();
});

applyTheme();

router.init({
  onRoute: ({ path, view, activePath, params }) => {
    if (path === '/login') {
      renderLogin(view);
      return;
    }
    renderShell(activePath || path, view, params);
  }
});

registerServiceWorker();

if (!storage.isAvailable()) {
  showToast('Tryb bez trwałego zapisu. Przeglądarka blokuje zapis lokalny, więc dane demo mogą zniknąć po odświeżeniu.');
}
