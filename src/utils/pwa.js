/**
 * PWA Utilities - Service Worker Registration & PWA Setup
 */

// Register Service Worker
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("[PWA] Service Workers are not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    console.log("[PWA] Service Worker registered successfully");

    // Listen for updates
    if (registration.installing) {
      registration.installing.addEventListener("statechange", onStateChange);
    } else if (registration.waiting) {
      onUpdateFound(registration.waiting);
    }

    registration.addEventListener("updatefound", () => {
      onUpdateFound(registration.installing);
    });

    return registration;
  } catch (error) {
    console.error("[PWA] Service Worker registration failed:", error);
    return null;
  }
}

function onStateChange(event) {
  const worker = event.target;

  if (worker.state === "installed" && navigator.serviceWorker.controller) {
    onUpdateFound(worker);
  }
}

function onUpdateFound(worker) {
  console.log("[PWA] New Service Worker version available");

  // Optionally notify user about update
  window.dispatchEvent(
    new CustomEvent("pwa-update-available", {
      detail: { worker }
    })
  );
}

// Detect if app is running as PWA
export function isPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// Request install prompt
export function getInstallPrompt() {
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install button/banner
    window.dispatchEvent(
      new CustomEvent("pwa-install-prompt-ready", {
        detail: { deferredPrompt }
      })
    );
  });

  return {
    isPromptReady: () => deferredPrompt !== null,
    prompt: async () => {
      if (!deferredPrompt) return null;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      deferredPrompt = null;
      return outcome;
    }
  };
}

// Handle app installed event
export function onAppInstalled() {
  window.addEventListener("appinstalled", () => {
    console.log("[PWA] App installed successfully");

    window.dispatchEvent(
      new CustomEvent("pwa-app-installed", {
        detail: { timestamp: Date.now() }
      })
    );
  });
}

// Queue data for offline sync
export function queueForOfflineSync(type, data) {
  const key = `offline_${type}_${Date.now()}`;

  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log("[PWA] Queued for offline sync:", key);

    // Register background sync
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register(`sync-${type}`);
      });
    }
  } catch (error) {
    console.error("[PWA] Failed to queue data:", error);
  }
}

// Retrieve queued data
export function getQueuedData(type) {
  const queued = [];
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (key.startsWith(`offline_${type}_`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        queued.push({ key, data });
      } catch (error) {
        console.error("[PWA] Failed to parse queued data:", error);
      }
    }
  }

  return queued;
}

// Clear queued data after sync
export function clearQueuedData(key) {
  try {
    localStorage.removeItem(key);
    console.log("[PWA] Cleared queued data:", key);
  } catch (error) {
    console.error("[PWA] Failed to clear queued data:", error);
  }
}

// Request persistent storage (for offline data)
export async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    console.log("[PWA] Persistent storage not supported");
    return false;
  }

  try {
    const persistent = await navigator.storage.persist();
    console.log("[PWA] Persistent storage granted:", persistent);
    return persistent;
  } catch (error) {
    console.error("[PWA] Failed to request persistent storage:", error);
    return false;
  }
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}

// Listen for online/offline events
export function listenToOnlineStatus(callback) {
  window.addEventListener("online", () => {
    console.log("[PWA] Back online");
    callback(true);
  });

  window.addEventListener("offline", () => {
    console.log("[PWA] Gone offline");
    callback(false);
  });
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("[PWA] Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;

    const permission = await requestNotificationPermission();
    if (!permission) {
      console.log("[PWA] Notification permission denied");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    console.log("[PWA] Subscribed to push notifications");
    return subscription;
  } catch (error) {
    console.error("[PWA] Failed to subscribe to push notifications:", error);
    return null;
  }
}

// Send local notification
export function sendLocalNotification(title, options = {}) {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      icon: "/images/icon-192.png",
      badge: "/images/badge-72.png",
      ...options
    });
  });
}

// Initialize PWA features
export async function initPWA() {
  console.log("[PWA] Initializing PWA features...");

  // Register Service Worker
  const swRegistration = await registerServiceWorker();

  // Handle app installed
  onAppInstalled();

  // Request persistent storage
  await requestPersistentStorage();

  // Listen to online/offline status
  listenToOnlineStatus((isOnline) => {
    window.dispatchEvent(
      new CustomEvent("online-status-changed", {
        detail: { isOnline }
      })
    );
  });

  // Log PWA info
  const isPWAMode = isPWA();
  console.log("[PWA] Running as app:", isPWAMode);
  console.log("[PWA] Online status:", isOnline());

  return {
    swRegistration,
    isPWAMode,
    isOnline: isOnline()
  };
}

// Export everything
export default {
  registerServiceWorker,
  isPWA,
  getInstallPrompt,
  onAppInstalled,
  queueForOfflineSync,
  getQueuedData,
  clearQueuedData,
  requestPersistentStorage,
  isOnline,
  listenToOnlineStatus,
  requestNotificationPermission,
  subscribeToPushNotifications,
  sendLocalNotification,
  initPWA
};
