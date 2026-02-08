import React from 'react';
import { Wifi, WifiOff, LogIn, LogOut, Download, Coins } from 'lucide-react';

const GameHeader = ({ level, score, user, isOnline, onLogin, onLogout, showInstallBtn, onInstall }) => {
  return (
    // 전체 레이아웃: 왼쪽(레벨,버튼) vs 오른쪽(상태,이메일,코인)
    <div className="w-full flex justify-between items-end mb-6">
      
      {/* [왼쪽] 레벨 표시 & 버튼 그룹 */}
      <div className="flex flex-col gap-2">
        {/* 레벨 폰트: 예전처럼 크게 (text-xl) */}
        <span className="text-xl font-black text-indigo-600 tracking-widest uppercase italic">
          LEVEL {level}
        </span>
        
        <div className="flex gap-2">
          {/* 앱 설치 버튼 (조건부 렌더링) */}
          {showInstallBtn && (
            <button 
              onClick={onInstall} 
              className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-black transition-colors animate-pulse border border-green-200"
            >
              <Download size={14} strokeWidth={3} /> APP
            </button>
          )}
          
          {/* 로그인 상태에 따라 버튼 변경 */}
          {user ? (
            <button 
              onClick={onLogout} 
              className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-black transition-colors"
            >
              <LogOut size={14} strokeWidth={3} /> OUT
            </button>
          ) : (
            <button 
              onClick={onLogin} 
              disabled={!isOnline}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <LogIn size={14} strokeWidth={3} /> LOGIN
            </button>
          )}
        </div>
      </div>

      {/* [오른쪽] 상태, 이메일, 코인 */}
      <div className="flex flex-col items-end">
        
        {/* ★ [요청사항] 로그인 시 이메일 주소 표시 (코인 위) */}
        {user && (
          <span className="text-[10px] font-bold text-gray-400 mb-1 tracking-wide">
            {user.email}
          </span>
        )}

        {/* 온라인/오프라인 상태 */}
        <div className="flex items-center gap-1 mb-1">
           {isOnline ? (
             <Wifi size={12} className="text-green-500"/>
           ) : (
             <WifiOff size={12} className="text-red-400 animate-pulse"/>
           )}
           <span className="text-[10px] font-bold text-gray-400">
             {isOnline ? 'ONLINE' : 'OFFLINE'}
           </span>
        </div>
        
        {/* 코인 (예전처럼 크고 화려하게) */}
        <div className="flex items-center gap-2 bg-yellow-400 px-4 py-2 rounded-2xl shadow-lg border-b-4 border-yellow-600">
          <Coins size={20} className="text-white" strokeWidth={2.5} />
          <span className="text-white font-black text-2xl tracking-tight drop-shadow-sm">
            {score}
          </span>
        </div>
      </div>

    </div>
  );
};

export default GameHeader;
