// ★ [중요] 배포할 때마다 이 버전을 바꿔주세요! (예: v1 -> v2 -> v3 ...)
const CACHE_NAME = 'word-master-v1.4.2'; 

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// 1. 설치 (Install): 새 버전이 발견되면 즉시 설치 시작
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', CACHE_NAME);
  // 대기하지 않고 즉시 설치 (Skip Waiting)
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// 2. 활성화 (Activate): 옛날 캐시 삭제 (청소)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new version...');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // 즉시 페이지 제어권 가져오기 (새로고침 없이도 바로 적용되게 시도)
  return self.clients.claim();
});

// 3. 요청 (Fetch): 네트워크 우선, 실패 시 캐시 사용 (Network First)
// -> 항상 최신 버전을 먼저 찾으므로 업데이트가 즉시 반영됨
self.addEventListener('fetch', (event) => {
  // 로그인이나 API 요청 등은 캐시하지 않음
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 네트워크에서 성공적으로 가져오면 캐시도 업데이트
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 오프라인이면 캐시된 파일 제공
        return caches.match(event.request);
      })
  );
});
