import { useState, useEffect } from 'react';

export const useAppVersion = (currentVersion) => {
  // 초기값을 false로 두면 "업데이트 중" 화면 없이 바로 게임이 뜹니다.
  // 하지만 깜빡임 방지를 위해 true로 두되, 안전장치를 겁니다.
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    // ★ [안전장치] 어떤 에러가 나도 1.5초 뒤에는 무조건 게임을 켭니다.
    // 이 코드가 있으면 흰 화면에서 영원히 멈추는 일은 없습니다.
    const safetyTimer = setTimeout(() => {
      setIsUpdating(false);
    }, 1500);

    const checkVersion = async () => {
      try {
        const savedVersion = localStorage.getItem('game-version');
        
        // 버전이 다르면?
        if (savedVersion !== currentVersion) {
          console.log(`🚀 Update found: v${savedVersion} -> v${currentVersion}`);

          // 캐시 삭제 시도 (에러나도 무시)
          if ('caches' in window) {
             try { await caches.delete('game-cache'); } catch(e) {}
             try { (await caches.keys()).map(k => caches.delete(k)); } catch(e) {}
          }
          
          // 서비스워커 해제 시도
          if ('serviceWorker' in navigator) {
             try { (await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()); } catch(e) {}
          }

          localStorage.setItem('game-version', currentVersion);
          
          // 새로고침 (딱 한 번만)
          window.location.reload();
        } else {
          // 버전 같으면 바로 로딩 해제
          setIsUpdating(false);
        }
      } catch (err) {
        console.error("Version check failed", err);
        setIsUpdating(false); // 에러나면 바로 게임 진입
      }
    };

    checkVersion();

    // 컴포넌트 사라질 때 타이머 해제
    return () => clearTimeout(safetyTimer);
  }, [currentVersion]);

  return isUpdating;
};
