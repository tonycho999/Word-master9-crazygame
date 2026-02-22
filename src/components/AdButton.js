import React, { useState, useEffect } from 'react';

const AD_URL = "https://www.effectivegatecpm.com/byj6z396t?key=6e5b2c54d6a2a4f81f657dfb4060fdb4";
const MAX_DAILY_CLICKS = 10;
const COOLDOWN_MS = 10 * 60 * 1000;

const AdButtonComponent = ({ onReward }) => {
  const [clickCount, setClickCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false); // 설치 여부 상태

  useEffect(() => {
    // [추가] 현재 앱이 설치된 Standalone 모드인지 확인
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true; // iOS Safari 대응
    
    setIsStandalone(checkStandalone);

    const today = new Date().toLocaleDateString();
    const savedDate = localStorage.getItem('ad_click_date');
    const savedCount = localStorage.getItem('ad_click_count');
    const lastClickTime = localStorage.getItem('ad_last_click_time');

    if (savedDate !== today) {
      localStorage.setItem('ad_click_date', today);
      localStorage.setItem('ad_click_count', '0');
      setClickCount(0);
    } else {
      setClickCount(parseInt(savedCount || '0'));
    }

    if (lastClickTime) {
      const timePassed = Date.now() - parseInt(lastClickTime);
      if (timePassed < COOLDOWN_MS) {
        setRemainingTime(COOLDOWN_MS - timePassed);
      }
    }
  }, []);

  // 타이머 로직 (기존 유지)
  useEffect(() => {
    let timer;
    if (remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => (prev <= 1000 ? 0 : prev - 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [remainingTime]);

  const handleAdClick = () => {
    if (clickCount >= MAX_DAILY_CLICKS) return;

    // [수정] 설치된 앱 환경일 경우 유저에게 안내 후 열기
    if (isStandalone) {
      const confirmOpen = window.confirm(
        "광고를 보기 위해 브라우저로 이동합니다. 보상을 받으려면 광고 확인 후 다시 앱으로 돌아와주세요!"
      );
      if (!confirmOpen) return;
    }

    // 새 창으로 광고 열기
    window.open(AD_URL, '_blank');

    if (onReward) onReward();

    const newCount = clickCount + 1;
    setClickCount(newCount);
    const now = Date.now();

    localStorage.setItem('ad_click_count', newCount.toString());
    localStorage.setItem('ad_last_click_time', now.toString());
    setRemainingTime(COOLDOWN_MS);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
  };

  // 1. 일일 한도 초과 뷰
  if (clickCount >= MAX_DAILY_CLICKS) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-white/50 bg-gray-800/50 px-4 py-2 rounded-full italic">
          ⛔ Daily Limit Reached (10/10)
        </div>
      </div>
    );
  }

  // 2. 쿨타임 대기 뷰
  if (remainingTime > 0) {
    return (
      <div className="flex justify-center my-4">
        <button disabled className="bg-gray-500 text-white font-bold py-3 px-6 rounded-full opacity-80 flex items-center gap-2">
          <span>⏳</span>
          <span>Wait {formatTime(remainingTime)}</span>
        </button>
      </div>
    );
  }

  // 3. 기본 버튼 뷰 (설치 여부에 따른 디자인/문구 대응)
  return (
    <div className="flex flex-col items-center my-4 gap-2">
      <button 
        onClick={handleAdClick}
        className={`${
          isStandalone ? 'bg-orange-500' : 'bg-yellow-400'
        } hover:brightness-110 text-indigo-900 font-black py-3 px-6 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 animate-pulse`}
      >
        <span>{isStandalone ? '🌐' : '📺'}</span>
        <span>GET 200 COINS ({MAX_DAILY_CLICKS - clickCount} left)</span>
      </button>
      
      {/* [추가] 설치된 상태일 때만 보여주는 작은 안내 문구 */}
      {isStandalone && (
        <span className="text-[10px] text-white/40 italic">
          * Opens in external browser
        </span>
      )}
    </div>
  );
};

export default AdButtonComponent;
