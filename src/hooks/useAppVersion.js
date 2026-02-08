import { useState, useEffect } from 'react';

export const useAppVersion = (currentVersion) => {
  const [isUpdating, setIsUpdating] = useState(true); // 처음엔 체크하느라 로딩 중

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const savedVersion = localStorage.getItem('game-version');
        
        // 1. 버전이 다르거나 없을 때 (업데이트 진행)
        if (savedVersion !== currentVersion) {
          console.log(`🚀 업데이트 감지: v${savedVersion || '없음'} -> v${currentVersion}`);
          
          setIsUpdating(true); // 화면 멈춤 (업데이트 중)

          // (1) 브라우저 캐시 삭제
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map(key => caches.delete(key)));
            } catch (e) {
              console.warn("캐시 삭제 실패 (무시됨)", e);
            }
          }

          // (2) 서비스 워커 해제 (PWA 갱신)
          if ('serviceWorker' in navigator) {
            try {
              const regs = await navigator.serviceWorker.getRegistrations();
              for (const reg of regs) await reg.unregister();
            } catch (e) {
              console.warn("SW 해제 실패 (무시됨)", e);
            }
          }

          // (3) 새 버전 저장 후 강력 새로고침
          localStorage.setItem('game-version', currentVersion);
          
          // 약간의 지연 후 리로드 (브라우저가 처리할 시간 줌)
          setTimeout(() => {
            window.location.reload(true);
          }, 100);
          return;
        }
        
        // 2. 버전이 같으면 통과
        setIsUpdating(false);

      } catch (error) {
        // 만약 로직 에러가 나도 게임은 켜지게 함
        console.error("버전 체크 중 에러:", error);
        setIsUpdating(false);
      }
    };

    checkVersion();
  }, [currentVersion]);

  return isUpdating; // true면 로딩 화면을 보여줌
};
