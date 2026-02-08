import React from 'react';
import { Wifi, WifiOff, LogIn, Download, Coins } from 'lucide-react';

const GameHeader = ({ level, score, user, isOnline, onLogin, onLogout, showInstallBtn, onInstall }) => {

  // [1] 로그인 상태: 심플 모드 (화면 공간 확보)
  if (user) {
    return (
      <div className="w-full flex flex-col gap-1 mb-4">
        {/* 1. 최상단 오른쪽: 이메일 주소 (작게 표시) */}
        <div className="flex justify-end px-2">
          <span className="text-[10px] font-bold text-gray-400 tracking-wide">
            {user.email}
          </span>
        </div>

        {/* 2. 메인 바: Level | Status | Out | Coins */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2 px-3 border-2 border-gray-200 shadow-sm h-12">
          
          {/* Level */}
          <div className="text-lg font-black text-indigo-600 italic flex-shrink-0 mr-2">
            LV.{level}
          </div>

          {/* Center Group: Wifi + Out Button */}
          <div className="flex items-center gap-3 flex-1 justify-center border-l-2 border-r-2 border-gray-100 px-2 mx-1">
            {/* Wifi Icon */}
            {isOnline ? (
              <Wifi size={16} className="text-green-500" strokeWidth={3} />
            ) : (
              <WifiOff size={16} className="text-red-400 animate-pulse" />
            )}

            {/* Out Button (작고 빨간색) */}
            <button 
              onClick={onLogout}
              className="bg-red-100 hover:bg-red-200 text-red-500 text-[10px] font-black px-2 py-1 rounded transition-colors"
            >
              OUT
            </button>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-1 flex-shrink-0">
             <div className="bg-yellow-100 p-1 rounded-full">
                <Coins size={14} className="text-yellow-600 fill-yellow-500" />
             </div>
             <span className="text-gray-800 font-black text-lg leading-none pt-0.5 min-w-[30px] text-right">
               {score}
             </span>
          </div>

        </div>
      </div>
    );
  }

  // [2] 비로그인 상태: 기본 모드 (설치/로그인 유도)
  return (
    <div className="w-full flex justify-between items-end mb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-black text-indigo-400 tracking-widest">LEVEL {level}</span>
        
        <div className="flex gap-2">
          {/* 앱 설치 버튼 (설치 가능한 경우만 보임) */}
          {showInstallBtn && (
            <button 
              onClick={onInstall} 
              className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors animate-pulse border border-green-200"
            >
              <Download size={14} strokeWidth={3} /> APP
            </button>
          )}
          
          {/* 로그인 버튼 */}
          <button 
            onClick={onLogin} 
            disabled={!isOnline}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            <LogIn size={14} strokeWidth={3} /> LOGIN
          </button>
        </div>
      </div>

      {/* 오른쪽: 상태 및 코인 */}
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1 mb-1">
           {isOnline ? <Wifi size={12} className="text-green-500"/> : <WifiOff size={12} className="text-red-400 animate-pulse"/>}
           <span className="text-[10px] font-bold text-gray-400">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-yellow-400 px-3 py-2 rounded-2xl shadow-lg border-b-4 border-yellow-600">
          <Coins size={20} className="text-white" strokeWidth={2.5} />
          <span className="text-white font-black text-2xl tracking-tight drop-shadow-sm">{score}</span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
