importScripts('/service-worker-assets.js');

const OFFLINE_URL = '/offline.html';
const API_OFFLINE_ERROR = JSON.stringify({
  error: {
    code: 'offline',
    message: 'FlowDesk API request cannot be completed while offline.'
  }
});

const APP_ENTRY_URL = '/index.html';

const manifest = self.FLOWDESK_SW_MANIFEST || {
  version: 'dev',
  appShell: [OFFLINE_URL, APP_ENTRY_URL]
};
const CACHE_PREFIX = 'flowdesk-app-shell';
const CACHE_NAME = `${CACHE_PREFIX}-${manifest.version}`;
const APP_SHELL = manifest.appShell;
const APP_SHELL_SET = new Set(APP_SHELL);
const STATIC_ASSET_PATTERN = /\.(?:css|js|woff2|svg|webmanifest)$/;

const normalizePathname = (url) => (url.pathname === '/' ? '/' : url.pathname);

// The SPA entry is reachable as '/' and '/index.html'; both share one cache key.
// Every other document is cached under its own pathname so one page cannot overwrite another.
const isAppEntryRequest = (url) => url.pathname === '/' || url.pathname === APP_ENTRY_URL;
const navigationCacheKey = (url) => (isAppEntryRequest(url) ? APP_ENTRY_URL : normalizePathname(url));

const isSameOrigin = (url) => url.origin === self.location.origin;
const isAppShellRequest = (url) => isSameOrigin(url) && APP_SHELL_SET.has(normalizePathname(url));
const isStaticAssetRequest = (url) => isSameOrigin(url) && STATIC_ASSET_PATTERN.test(url.pathname);
const isApiRequest = (url) => isSameOrigin(url) && url.pathname.startsWith('/api/');

const putInCache = async (request, response) => {
  if (!response || response.status !== 200 || response.type === 'opaque') return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return putInCache(request, response);
};

// A cached response that followed a redirect cannot be handed to respondWith for a
// navigation, so it is rebuilt as a plain response before being returned.
const asNavigationResponse = async (response) => {
  if (!response) return Response.error();
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};

const navigationNetworkFirst = async (request) => {
  const cacheKey = navigationCacheKey(new URL(request.url));
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected && response.type !== 'opaque') {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    return asNavigationResponse((await cache.match(cacheKey)) || (await cache.match(OFFLINE_URL)));
  }
};

const apiNetworkOnly = async (request) => {
  try {
    return await fetch(request);
  } catch {
    return new Response(API_OFFLINE_ERROR, {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(event.request));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(apiNetworkOnly(event.request));
    return;
  }

  if (isAppShellRequest(url) || isStaticAssetRequest(url)) {
    event.respondWith(cacheFirst(event.request));
  }
});
