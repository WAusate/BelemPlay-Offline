const CACHE_VERSION = 'belem-play-v1';
const APP_CACHE = `app-shell-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-files-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;
const FIREBASE_CACHE = `firebase-${CACHE_VERSION}`;

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/logo.png',
  '/logo.svg',
  '/detalhe-header.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return !cacheName.includes(CACHE_VERSION);
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.destination === 'audio' || url.pathname.endsWith('.mp3')) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  if (url.hostname.includes('firebase')) {
    event.respondWith(handleFirebaseRequest(request));
    return;
  }

  if (url.pathname.startsWith('/data/hymns/')) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    if (request.headers.has('range')) {
      return createRangeResponse(cachedResponse, request);
    }
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Audio fetch failed, returning from cache if available');
    return cachedResponse || new Response('Audio not available offline', { status: 503 });
  }
}

async function createRangeResponse(response, request) {
  const rangeHeader = request.headers.get('range');
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  
  if (!match) {
    return response;
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : undefined;

  const blob = await response.blob();
  const sliced = end !== undefined ? blob.slice(start, end + 1) : blob.slice(start);
  const slicedLength = sliced.size;

  return new Response(sliced, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Length': slicedLength.toString(),
      'Content-Range': `bytes ${start}-${start + slicedLength - 1}/${blob.size}`,
      'Accept-Ranges': 'bytes'
    }
  });
}

async function handleFirebaseRequest(request) {
  const cache = await caches.open(FIREBASE_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Firebase request failed, returning from cache');
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {});
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('[]', {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Resource not available', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(APP_CACHE);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(APP_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-hymns') {
    event.waitUntil(syncHymns());
  }
});

async function syncHymns() {
  console.log('[SW] Background sync: checking for hymn updates');
  
}
