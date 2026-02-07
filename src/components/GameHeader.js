import React from 'react';
import { Trophy, LogIn, LogOut, Wifi, WifiOff } from 'lucide-react';

const GameHeader = ({ level, score, user, isOnline, onLogin, onLogout }) => {
  return (
    <>
      <div className="w-full flex justify-between items-center mb-2 font-black text-indigo-600">
        <span className="text-lg">LEVEL {level}</span>
        <div className="flex items-center gap-3">
          {/* 온라인/오프라인 상태 */}
          {isOnline ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500 animate-pulse" />
          )}
          
          {/* 로그인 버튼 */}
          {user ? (
            <button onClick={onLogout} className="text-[10px] bg-red-100 text-red-500 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-200">
              <LogOut size={12}/> OUT
            </button>
          ) : (
            <button onClick={onLogin} disabled={!isOnline} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-200 animate-pulse disabled:opacity-50">
              <LogIn size={12}/> SAVE
            </button>
          )}
          
          {/* 점수 */}
          <span className="flex items-center gap-1">
            <Trophy size={18} className="text-yellow-500"/> {score}
          </span>
        </div>
      </div>

      {/* 오프라인 경고 메시지 */}
      {!isOnline && (
        <div className="w-full bg-red-50 text-red-500 text-[10px] font-bold text-center py-1 mb-2 rounded">
          OFFLINE MODE (Data saved locally)
        </div>
      )}
    </>
  );
};

export default GameHeader;
