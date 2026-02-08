import React from 'react';
import { Shuffle, Lightbulb, RotateCcw, Delete, Play, Film } from 'lucide-react';

const GameControls = ({ 
  category, wordType, wordCountDisplay,
  hintMessage, isCorrect, hintStage, hintButtonText,
  onHint, onShuffle, isAdVisible, isAdLoading, adClickCount, onRewardAd, isOnline,
  scrambledLetters, onLetterClick, onReset, onBackspace, onNextLevel,
  children 
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. 정보 표시 (카테고리 위) */}
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
          {wordCountDisplay}
        </span>
        <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
          {wordType}
        </span>
      </div>

      {/* 2. 카테고리 제목 */}
      <h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight uppercase text-center leading-none">
        {category}
      </h2>

      {/* 3. 힌트 메시지 */}
      <div className="h-5 mb-1 flex items-center justify-center w-full">
         {hintMessage && !isCorrect && (
           <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
             {hintMessage}
           </span>
         )}
      </div>

      {/* 4. 힌트 & 셔플 버튼 */}
      {!isCorrect && (
        <div className="flex gap-2 w-full mb-2">
           <button 
             onClick={onHint} 
             disabled={hintStage >= 4}
             className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 h-9 rounded-lg font-black text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
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

      {/* 5. 광고 버튼 */}
      {!isCorrect && isAdVisible && (
        <button 
          onClick={onRewardAd} disabled={!isOnline || isAdLoading}
          className="w-full bg-amber-400 hover:bg-amber-500 text-white py-1.5 mb-3 rounded-lg font-black text-[10px] shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {isAdLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Film size={14} fill="currentColor" />}
          WATCH AD (+200P) ({adClickCount}/10)
        </button>
      )}

      {/* 6. 알파벳 버튼 영역 (광고 버튼 바로 아래) */}
      {!isCorrect && (
        <div className="w-full mb-4">
          <div className="grid grid-cols-6 gap-1.5">
            {scrambledLetters.map((item) => (
              <button
                key={item.id}
                onClick={() => onLetterClick(item)}
                className="aspect-square bg-white border-b-2 border-gray-200 active:border-b-0 active:translate-y-0.5 text-gray-800 font-black text-base rounded-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. AnswerBoard (게임판 - 정답 칸) */}
      <div className="w-full mb-4">
        {children}
      </div>

      {/* 8. 하단 컨트롤 영역 (리셋/백 - 정답 칸 아래) */}
      <div className="w-full"> 
        {isCorrect ? (
          <button
            onClick={onNextLevel}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black rounded-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 animate-bounce-short transition-transform active:scale-95"
          >
            NEXT LEVEL <Play size={20} fill="currentColor" />
          </button>
        ) : (
          <div className="flex gap-2">
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
        )}
      </div>

    </div>
  );
};

export default GameControls;
