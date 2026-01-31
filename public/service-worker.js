// This service worker file is used for development/preview environments to enable PWA installation.
// In production builds using Create React App, this file will be replaced by the Workbox-generated service worker.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests
});
