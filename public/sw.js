/**
 * LifeOS Service Worker
 * Handles offline caching, background sync, and push notifications for PWA
 */

const CACHE_NAME = "lifeos-v1";
const ASSETS_CACHE = "lifeos-assets-v1";
const API_CACHE = "lifeos-api-v1";

// Assets to pre-cache (offline essentials)
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/main.jsx",
  "/src/App.jsx",
  "/src/index.css",
  "/src/app.css"
];

// Install: Pre-cache essential assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log("[SW] Pre-caching assets...");
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Some assets failed to pre-cache:", err);
      });
    })
  );

  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE && cacheName !== API_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch: Network-first for API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // API calls: Network-first with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache-first with network fallback
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image" ||
    url.pathname.match(/\.(js|css|woff2|png|jpg|jpeg|gif|svg)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages: Network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy: Try network, fall back to cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed, using cache:", request.url);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>LifeOS - Offline</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f3f4f6;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 { color: #1f2937; }
              p { color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📡 No Internet Connection</h1>
              <p>LifeOS is offline. Some features are limited.</p>
              <p>Your data will sync once you're back online.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({
            "Content-Type": "text/html"
          })
        }
      );
    }

    throw error;
  }
}

// Cache-first strategy: Use cache, fall back to network
async function cacheFirstStrategy(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed and no cache for:", request.url);
    throw error;
  }
}

// Background Sync: Queue API calls when offline
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tracking") {
    event.waitUntil(syncTrackingLogs());
  }
  if (event.tag === "sync-quiz-attempt") {
    event.waitUntil(syncQuizAttempts());
  }
});

async function syncTrackingLogs() {
  try {
    // Get pending logs from IndexedDB
    const db = await openIndexedDB();
    const pendingLogs = await getPendingLogs(db);

    if (pendingLogs.length === 0) return;

    // Send to server
    const response = await fetch("/api/tracking/sync-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: pendingLogs })
    });

    if (response.ok) {
      // Clear sent logs from IndexedDB
      await clearSyncedLogs(db, pendingLogs);
      console.log("[SW] Synced", pendingLogs.length, "tracking logs");
    }
  } catch (error) {
    console.error("[SW] Sync tracking logs failed:", error);
    throw error;
  }
}

async function syncQuizAttempts() {
  try {
    const db = await openIndexedDB();
    const pendingAttempts = await getPendingQuizAttempts(db);

    if (pendingAttempts.length === 0) return;

    const response = await fetch("/api/ai/submit-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempts: pendingAttempts })
    });

    if (response.ok) {
      await clearSyncedAttempts(db, pendingAttempts);
      console.log("[SW] Synced", pendingAttempts.length, "quiz attempts");
    }
  } catch (error) {
    console.error("[SW] Sync quiz attempts failed:", error);
    throw error;
  }
}

// IndexedDB helpers (store offline data)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("LifeOS", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("tracking_logs")) {
        db.createObjectStore("tracking_logs", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("quiz_attempts")) {
        db.createObjectStore("quiz_attempts", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

async function getPendingLogs(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction("tracking_logs").objectStore("tracking_logs").getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingQuizAttempts(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction("quiz_attempts").objectStore("quiz_attempts").getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function clearSyncedLogs(db, logs) {
  const tx = db.transaction("tracking_logs", "readwrite");
  logs.forEach((log) => {
    tx.objectStore("tracking_logs").delete(log.id);
  });
  return tx.oncomplete;
}

async function clearSyncedAttempts(db, attempts) {
  const tx = db.transaction("quiz_attempts", "readwrite");
  attempts.forEach((attempt) => {
    tx.objectStore("quiz_attempts").delete(attempt.id);
  });
  return tx.oncomplete;
}

// Push Notifications (for quiz reminders, deadline alerts)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "You have a notification from LifeOS",
    icon: "/images/icon-192.png",
    badge: "/images/badge-72.png",
    tag: data.tag || "lifeos-notification",
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: "open",
        title: "Open LifeOS"
      },
      {
        action: "close",
        title: "Dismiss"
      }
    ],
    data: {
      url: data.url || "/",
      ...data
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "LifeOS", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if LifeOS is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log("[SW] Service Worker initialized");
