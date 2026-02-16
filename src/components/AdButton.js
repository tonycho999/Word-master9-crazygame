import React, { useState, useEffect } from 'react';

// 광고 주소
const AD_URL = "https://www.effectivegatecpm.com/byj6z396t?key=6e5b2c54d6a2a4f81f657dfb4060fdb4";

// 설정값 상수 (하루 10회, 10분 쿨타임)
const MAX_DAILY_CLICKS = 10;
const COOLDOWN_MS = 10 * 60 * 1000;

const AdButtonComponent = ({ onReward }) => {
  const [clickCount, setClickCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
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
      } else {
        setRemainingTime(0);
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) return 0;
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [remainingTime]);

  const handleAdClick = () => {
    if (clickCount >= MAX_DAILY_CLICKS) {
      alert("Daily ad limit reached. Please come back tomorrow!");
      return;
    }

    window.open(AD_URL, '_blank');

    if (onReward) {
      onReward();
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);
    const now = Date.now();

    localStorage.setItem('ad_click_count', newCount.toString());
    localStorage.setItem('ad_last_click_time', now.toString());
    setRemainingTime(COOLDOWN_MS);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (clickCount >= MAX_DAILY_CLICKS) {
    return (
      <div className="flex justify-center my-4">
         <div className="text-xs text-white/50 bg-gray-800/50 px-4 py-2 rounded-full italic">
            ⛔ Daily Limit Reached (10/10)
        </div>
      </div>
    );
  }

  if (remainingTime > 0) {
    return (
        <div className="flex justify-center my-4">
            <button 
                disabled 
                className="bg-gray-500 text-white font-bold py-3 px-6 rounded-full shadow-inner cursor-not-allowed opacity-80 flex items-center gap-2"
            >
                <span>⏳</span>
                <span>Wait {formatTime(remainingTime)}</span>
            </button>
        </div>
    );
  }

  return (
    <div className="flex justify-center my-4">
      <button 
        onClick={handleAdClick}
        className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-black py-3 px-6 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2 animate-pulse"
      >
        <span>📺</span>
        {/* ★ 여기를 수정했습니다 (GET HINT -> GET 200 COINS) */}
        <span>GET 200 COINS ({MAX_DAILY_CLICKS - clickCount} left)</span>
      </button>
    </div>
  );
};

export default AdButtonComponent;
