import { showActionToast } from '../components/toast.js';

let reloadPending = false;
let reloadAfterUpdate = false;
let updatePromptVisible = false;

export const promptForServiceWorkerUpdate = (registration) => {
  if (updatePromptVisible) return;
  updatePromptVisible = true;

  showActionToast({
    message: 'Nowa wersja FlowDesk jest dostępna.',
    actionLabel: 'Odśwież',
    timeout: 0,
    onAction: () => {
      updatePromptVisible = false;
      if (registration?.waiting) {
        reloadAfterUpdate = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
      window.location.reload();
    }
  });
};

const trackInstallingWorker = (registration) => {
  const installingWorker = registration.installing;
  if (!installingWorker) return;

  installingWorker.addEventListener('statechange', () => {
    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
      promptForServiceWorkerUpdate(registration);
    }
  });
};

export const registerServiceWorker = () => {
  window.addEventListener('flowdesk:sw-update-available', (event) => {
    promptForServiceWorkerUpdate(event.detail?.registration);
  });

  if (!('serviceWorker' in navigator)) return;
  // The production service worker precaches hashed build output, so it is registered only for a
  // built artifact. Registering it against the dev server would serve stale modules.
  if (!import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadAfterUpdate) return;
    if (reloadPending) return;
    reloadPending = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      if (registration.waiting && navigator.serviceWorker.controller) {
        promptForServiceWorkerUpdate(registration);
      }
      registration.addEventListener('updatefound', () => trackInstallingWorker(registration));
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  });
};
