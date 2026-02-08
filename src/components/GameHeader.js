import React from 'react';
import { Wifi, WifiOff, LogIn, LogOut, Download, Coins, Share2 } from 'lucide-react'; // Share2 추가

const GameHeader = ({ level, score, user, isOnline, onLogin, onLogout, showInstallBtn, onInstall }) => {
  
  // --- 소셜 공유 기능 함수 ---
  const handleShare = async () => {
    const shareData = {
      title: 'Word Master',
      text: `Word Master에서 레벨 ${level} 도전 중! 🧠 너도 맞춰봐!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('공유 취소됨');
      }
    } else {
      // PC 등 공유 기능 미지원 시 클립보드 복사
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다! 친구에게 전달해보세요. 📋");
      } catch (err) {
        alert("브라우저가 공유 기능을 지원하지 않습니다.");
      }
    }
  };

  return (
    <div className="w-full flex justify-between items-center mb-6">
      
      {/* [왼쪽] 레벨 표시 */}
      <div className="text-xl font-black text-indigo-600 tracking-widest uppercase italic">
        LEVEL {level}
      </div>

      {/* [오른쪽] 상태, 버튼, 코인 그룹 */}
      <div className="flex flex-col items-end gap-1">
        
        {/* 1. 이메일 주소 */}
        {user && (
          <span className="text-[10px] font-bold text-gray-400 tracking-wide">
            {user.email}
          </span>
        )}

        {/* 2. 아이콘 및 버튼 그룹 */}
        <div className="flex items-center gap-2"> {/* gap을 3에서 2로 살짝 줄임 (버튼이 많아져서) */}
          
          {/* (1) 와이파이 아이콘 */}
          {isOnline ? (
            <Wifi size={18} className="text-green-500" strokeWidth={3} />
          ) : (
            <WifiOff size={18} className="text-red-400 animate-pulse" />
          )}

          {/* (추가) 공유 버튼 */}
          <button 
            onClick={handleShare} 
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
            aria-label="공유하기"
          >
            <Share2 size={14} strokeWidth={3} /> SHARE
          </button>

          {/* (2) 앱 설치 버튼 */}
          {showInstallBtn && (
            <button 
              onClick={onInstall} 
              className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-black transition-colors animate-pulse border border-green-200"
            >
              <Download size={14} strokeWidth={3} /> APP
            </button>
          )}

          {/* (3) 로그인/로그아웃 버튼 */}
          {user ? (
            <button 
              onClick={onLogout} 
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-500 px-2 py-1 rounded-lg text-xs font-black transition-colors"
            >
              <LogOut size={14} strokeWidth={3} /> OUT
            </button>
          ) : (
            <button 
              onClick={onLogin} 
              disabled={!isOnline}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <LogIn size={14} strokeWidth={3} /> LOGIN
            </button>
          )}

          {/* (4) 코인 */}
          <div className="flex items-center gap-1 ml-1">
            <Coins size={20} className="text-yellow-500 fill-yellow-400" strokeWidth={2.5} />
            <span className="text-gray-800 font-black text-xl tracking-tight">
              {score}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default GameHeader;
