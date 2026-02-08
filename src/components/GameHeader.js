import React from 'react';
import { Wifi, WifiOff, LogIn, LogOut, Download, Coins, Share2 } from 'lucide-react';

const GameHeader = ({ level, score, user, isOnline, onLogin, onLogout, showInstallBtn, onInstall }) => {
  
  // --- 소셜 공유 기능 ---
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

      {/* [오른쪽] 전체 그룹 (위: 정보 / 아래: 버튼들) */}
      <div className="flex flex-col items-end gap-1">
        
        {/* 1. 윗줄: 이메일 + 와이파이 아이콘 */}
        <div className="flex items-center gap-2 h-4"> {/* 높이 고정으로 레이아웃 흔들림 방지 */}
          {user && (
            <span className="text-[10px] font-bold text-gray-400 tracking-wide">
              {user.email}
            </span>
          )}

          {/* 와이파이 아이콘 (항상 여기 위치) */}
          {isOnline ? (
            <Wifi size={16} className="text-green-500" strokeWidth={3} />
          ) : (
            <WifiOff size={16} className="text-red-400 animate-pulse" />
          )}
        </div>

        {/* 2. 아랫줄: 버튼들 + 코인 */}
        <div className="flex items-center gap-2">
          
          {/* 공유 버튼 */}
          <button 
            onClick={handleShare} 
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-black shadow-md transition-all active:scale-95"
          >
            <Share2 size={14} strokeWidth={3} /> SHARE
          </button>

          {/* 앱 설치 버튼 */}
          {showInstallBtn && (
            <button 
              onClick={onInstall} 
              className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-black transition-colors animate-pulse border border-green-200"
            >
              <Download size={14} strokeWidth={3} /> APP
            </button>
          )}

          {/* 로그인/로그아웃 버튼 */}
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

          {/* 코인 */}
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
