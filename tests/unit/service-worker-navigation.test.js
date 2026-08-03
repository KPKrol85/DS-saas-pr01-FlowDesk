import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://flowdesk.test';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readProjectFile = (relativePath) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

// `npx serve` enables cleanUrls, so every '*.html' request answers 301 to the extensionless
// path. Precaching therefore stores redirected responses, which a navigation cannot reuse.
const precachedResponse = (key) => ({
  body: `precached:${key}`,
  status: 200,
  statusText: 'OK',
  headers: {},
  redirected: key.endsWith('.html'),
  blob: async () => `precached:${key}`
});

const createCaches = () => {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      put: async (key, response) => entries.set(String(key), response),
      match: async (key) => entries.get(String(key)),
      addAll: async (keys) => keys.forEach((key) => entries.set(String(key), precachedResponse(key)))
    };
  };

  return {
    stores,
    api: {
      open,
      keys: async () => [...stores.keys()],
      delete: async (name) => stores.delete(name),
      match: async (key) => [...stores.values()].map((entries) => entries.get(String(key))).find(Boolean)
    }
  };
};

// Executes the canonical service worker source in a worker-like sandbox, with the
// generated manifest inlined instead of loaded through importScripts.
const loadServiceWorker = ({ online }) => {
  const listeners = new Map();
  const caches = createCaches();
  const source = `${readProjectFile('service-worker-assets.js')}\n${readProjectFile('service-worker.js').replace("importScripts('/service-worker-assets.js');", '')}`;

  const sandbox = {
    URL,
    console,
    Response: class {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status ?? 200;
        this.statusText = init.statusText ?? 'OK';
        this.headers = init.headers ?? {};
        this.redirected = false;
      }

      static error() {
        return { body: null, status: 0, redirected: false };
      }
    },
    fetch: async (request) => {
      if (!online) throw new Error('offline');
      const body = `network:${request.url}`;
      return { ok: true, redirected: false, type: 'basic', body, clone: () => ({ body }) };
    },
    caches: caches.api,
    location: new URL(`${ORIGIN}/`),
    clients: { claim: async () => undefined },
    addEventListener: (type, handler) => listeners.set(type, handler)
  };
  sandbox.self = sandbox;

  vm.runInNewContext(source, sandbox);

  return {
    caches,
    install: async () => {
      let pending;
      listeners.get('install')({ waitUntil: (value) => (pending = value) });
      await pending;
    },
    // Mirrors the browser rule that respondWith rejects a redirected response for a navigation.
    navigate: async (path) => {
      let responded;
      listeners.get('fetch')({
        request: { url: `${ORIGIN}${path}`, mode: 'navigate' },
        respondWith: (value) => (responded = value)
      });
      const response = await responded;
      if (response?.redirected) {
        throw new TypeError('Cannot construct a Response with a redirected response used for a navigation');
      }
      return response;
    }
  };
};

describe('service worker navigation caching', () => {
  it('does not let a legal page overwrite the cached application entry', async () => {
    const sw = loadServiceWorker({ online: true });
    await sw.install();

    await sw.navigate('/');
    await sw.navigate('/regulamin.html');

    expect((await sw.caches.api.match('/index.html')).body).toBe(`network:${ORIGIN}/`);
    expect((await sw.caches.api.match('/regulamin.html')).body).toBe(`network:${ORIGIN}/regulamin.html`);
  });

  it('returns the cached application entry for offline navigation to the root', async () => {
    const sw = loadServiceWorker({ online: true });
    await sw.install();
    await sw.navigate('/regulamin.html');

    const response = await sw.navigate('/');
    expect(response.body).toBe(`network:${ORIGIN}/`);
  });

  it('falls back to a navigable offline.html for an uncached non-application document', async () => {
    const sw = loadServiceWorker({ online: false });
    await sw.install();

    // Fails before the fix: the precached offline.html is a redirected response and
    // respondWith rejects it for a navigation, which surfaced as ERR_FAILED in Chrome.
    const response = await sw.navigate('/offline-check.html');
    expect(response.body).toBe('precached:/offline.html');
    expect(response.redirected).toBe(false);
  });
});
