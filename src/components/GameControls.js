import React from 'react';
import { Shuffle, Lightbulb, RotateCcw, Delete, Play, Share2 } from 'lucide-react';
import AdButtonComponent from './AdButtonComponent';

const GameControls = ({ 
  category, wordType, wordCountDisplay,
  hintMessage, isCorrect, hintStage, hintButtonText,
  onHint, onShuffle, 
  onRewardAd, 
  onRewardShare, // ★ 공유 보상 함수 (WordGuessGame.js에서 연결 필요)
  scrambledLetters, onLetterClick, onReset, onBackspace, onNextLevel,
  children 
}) => {
  
  // 공유하기 기능
  const handleShare = async () => {
    const shareData = {
      title: 'Word Master',
      text: 'Play Word Master - Free Online English Word Puzzle Game!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // [모바일] 네이티브 공유 창 열기
        // ★ 중요: 사용자가 앱을 선택하고 공유를 완료할 때까지 기다립니다.
        // 사용자가 취소(X) 누르면 여기서 에러가 발생해서 catch로 넘어갑니다.
        await navigator.share(shareData);
        
        // 여기까지 코드가 도달했다는 건 공유 성공!
        if (onRewardShare) onRewardShare(); 
      } else {
        // [PC] 클립보드 복사
        await navigator.clipboard.writeText(window.location.href);
        
        // 복사 성공 시 알림 및 보상
        alert('Link Copied! +100 Coins added.'); 
        if (onRewardShare) onRewardShare();
      }
    } catch (err) {
      // [취소 감지] 사용자가 공유 창을 닫거나 취소하면 여기로 옵니다.
      console.log('Share cancelled or failed:', err);
      // ★ 여기서는 보상 함수를 호출하지 않으므로 코인이 지급되지 않습니다.
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. 상단 정보 (유지) */}
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
          {wordCountDisplay}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${
          wordType === 'NORMAL' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
        }`}>
          {wordType}
        </span>
      </div>

      {/* 2. 카테고리 (유지) */}
      <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight uppercase text-center leading-none">
        {category}
      </h2>

      {/* 3. 힌트 메시지 (유지) */}
      <div className="h-5 mb-1 flex items-center justify-center w-full">
         {hintMessage && !isCorrect && (
           <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
             {hintMessage}
           </span>
         )}
      </div>

      {/* 4. 힌트 & 셔플 (유지) */}
      {!isCorrect && (
        <div className="flex gap-2 w-full mb-1 px-2">
           <button 
             onClick={onHint} 
             disabled={hintStage >= 4}
             className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 h-9 rounded-lg font-black text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 disabled:opacity-30"
           >
             <Lightbulb size={14} className={hintStage >= 3 ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
             {hintButtonText}
           </button>

           <button 
             onClick={onShuffle} 
             className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 h-9 rounded-lg font-black text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
           >
             <Shuffle size={14} /> SHUFFLE
           </button>
        </div>
      )}

      {/* 5. 광고 버튼 (유지) */}
      {!isCorrect && (
        <AdButtonComponent onReward={onRewardAd} />
      )}

      {/* 6. 알파벳 버튼 (유지) */}
      {!isCorrect && (
        <div className="w-full mb-2 px-1 mt-1">
          <div className="flex flex-wrap justify-center gap-1.5">
            {scrambledLetters.map((item) => (
              <button
                key={item.id}
                onClick={() => onLetterClick(item)}
                className="w-10 h-10 bg-white border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 text-gray-800 font-black text-lg rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. 게임판 (유지) */}
      <div className="w-full mb-2">
        {children}
      </div>

      {/* 8. 하단 컨트롤 영역 */}
      <div className="w-full px-2"> 
        {isCorrect ? (
          <button
            onClick={onNextLevel}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black rounded-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 animate-bounce-short transition-transform active:scale-95"
          >
            NEXT LEVEL <Play size={20} fill="currentColor" />
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            
            {/* Reset & Back */}
            <div className="flex gap-2 w-full">
                <button 
                  onClick={onReset} 
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                >
                  <RotateCcw size={14} strokeWidth={2.5} /> RESET
                </button>
                <button 
                  onClick={onBackspace} 
                  className="flex-[2] bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-black text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Delete size={16} fill="currentColor" /> BACK
                </button>
            </div>

            {/* ★ Share Game 버튼 (무제한 보상 버전) */}
            <button 
                onClick={handleShare}
                className="w-full py-2 rounded-lg font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 bg-teal-500 hover:bg-teal-600 text-white shadow-teal-200 animate-pulse"
            >
                <Share2 size={16} fill="none" /> 
                SHARE & GET +100P
            </button>

          </div>
        )}
      </div>

    </div>
  );
};

export default GameControls;
