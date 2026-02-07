/* eslint-disable no-restricted-globals */

// 캐시 이름 (버전 업데이트 시 숫자를 올려주세요)
const CACHE_NAME = 'word-master-v2';

// 오프라인에서 실행하기 위해 반드시 필요한 파일들
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// 1. 설치 (Install): 파일들을 캐시에 저장
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all: app shell and content');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // 즉시 활성화
});

// 2. 요청 가로채기 (Fetch): 오프라인이면 캐시에서 꺼내줌
self.addEventListener('fetch', (event) => {
  // 구글 애드센스 등 외부 요청은 캐시하지 않고 네트워크로만 보냄 (오류 방지)
  if (event.request.url.includes('google') || event.request.url.includes('supabase')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 반환
      if (response) {
        return response;
      }
      // 없으면 네트워크 요청 (그리고 성공하면 캐시에 추가)
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // 네트워크도 안되고 캐시도 없으면 (오프라인 상태) - 보통 index.html 반환
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }
      });
    })
  );
});

// 3. 활성화 (Activate): 구버전 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
