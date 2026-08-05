import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://flowdesk.test';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readProjectFile = (relativePath) => readFileSync(resolve(projectRoot, relativePath), 'utf8');

// Deterministic stand-in for the generated dist/service-worker-assets.js. It matches the public
// runtime shape without duplicating the generator, so these tests run before any build exists.
const TEST_MANIFEST = {
  version: 'test-manifest',
  appShell: ['/', '/index.html', '/offline.html']
};

// A host that redirects document URLs — for example an extensionless-URL rewrite — makes the
// precache store redirected responses, which a navigation cannot reuse. That condition is what
// asNavigationResponse exists to handle, so the precache fixture reproduces it.
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

// Executes the canonical service worker source in a worker-like sandbox. The production
// importScripts call is stripped and the fixture manifest is supplied in its place; the worker
// logic itself is never reimplemented here.
const loadServiceWorker = ({ online = true } = {}) => {
  const listeners = new Map();
  const caches = createCaches();
  const network = { online, responses: 0 };
  const source = readProjectFile('service-worker.js').replace("importScripts('/service-worker-assets.js');", '');

  const sandbox = {
    URL,
    console,
    FLOWDESK_SW_MANIFEST: TEST_MANIFEST,
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
    // Every network response carries a fresh sequence number, so a cached body can never be
    // mistaken for a newly fetched one.
    fetch: async (request) => {
      if (!network.online) throw new Error('offline');
      network.responses += 1;
      const body = `network:${request.url}#${network.responses}`;
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
    setOnline: (value) => {
      network.online = value;
    },
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
    const sw = loadServiceWorker();
    await sw.install();

    const appEntry = await sw.navigate('/');
    const legalPage = await sw.navigate('/regulamin.html');

    expect((await sw.caches.api.match('/index.html')).body).toBe(appEntry.body);
    expect((await sw.caches.api.match('/regulamin.html')).body).toBe(legalPage.body);
    expect(appEntry.body).not.toBe(legalPage.body);
  });

  it('returns the cached application entry for offline navigation to the root', async () => {
    const sw = loadServiceWorker();
    await sw.install();

    // Online first, so the real network response replaces the precached entry under /index.html.
    const cached = await sw.navigate('/');
    await sw.navigate('/regulamin.html');

    sw.setOnline(false);
    const response = await sw.navigate('/');

    // Asserting the exact earlier response makes this offline-only: the mocked network numbers
    // every reply, so a fresh fetch would return a different body, and the precached fixture
    // body differs again. Only the cache can satisfy all three.
    expect(response.body).toBe(cached.body);
    expect(response.body).not.toBe('precached:/index.html');
  });

  it('falls back to a navigable offline.html for an uncached non-application document', async () => {
    const sw = loadServiceWorker({ online: false });
    await sw.install();

    // Fails without asNavigationResponse: the precached offline.html is a redirected response
    // and respondWith rejects it for a navigation, which surfaced as ERR_FAILED in Chrome.
    const response = await sw.navigate('/offline-check.html');
    expect(response.body).toBe('precached:/offline.html');
    expect(response.redirected).toBe(false);
  });
});
