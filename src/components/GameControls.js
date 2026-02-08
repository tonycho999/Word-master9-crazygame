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
      
      {/* 1. 정보 표시 (카테고리 등) */}
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">
          {wordCountDisplay}
        </span>
        <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">
          {wordType}
        </span>
      </div>

      <h2 className="text-2xl font-black text-gray-800 mb-1 tracking-tight uppercase text-center">
        {category}
      </h2>

      {/* 2. 힌트 메시지 */}
      <div className="h-6 mb-2 flex items-center justify-center w-full">
         {hintMessage && !isCorrect && (
           <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full animate-pulse">
             {hintMessage}
           </span>
         )}
      </div>

      {/* 3. 상단 기능 버튼들 (힌트, 셔플, 광고) - 정답 맞추면 숨김 */}
      {!isCorrect && (
        <div className="flex gap-2 w-full mb-4">
           {/* 힌트 버튼 */}
           <button 
             onClick={onHint} 
             disabled={hintStage >= 4}
             className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-black text-[10px] flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
           >
             <Lightbulb size={16} className={hintStage >= 3 ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
             {hintButtonText}
           </button>

           {/* 셔플 버튼 */}
           <button 
             onClick={onShuffle} 
             className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-black text-[10px] flex flex-col items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
           >
             <Shuffle size={16} /> SHUFFLE
           </button>
        </div>
      )}

      {/* 광고 버튼 (별도 로직 유지) */}
      {!isCorrect && isAdVisible && (
        <button 
          onClick={onRewardAd} disabled={!isOnline || isAdLoading}
          className="w-full bg-amber-400 hover:bg-amber-500 text-white py-2 mb-4 rounded-xl font-black text-xs shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {isAdLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Film size={16} fill="currentColor" />}
          WATCH AD (+200P) ({adClickCount}/10)
        </button>
      )}

      {/* 4. 게임 보드 (AnswerBoard) 삽입 위치 */}
      {children}

      {/* 5. 하단 컨트롤 영역 */}
      <div className="w-full mt-auto pt-4">
        
        {/* ★ 정답을 맞췄을 때: NEXT LEVEL 버튼만 표시 */}
        {isCorrect ? (
          <button
            onClick={onNextLevel}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 animate-bounce-short transition-transform active:scale-95"
          >
            NEXT LEVEL <Play size={24} fill="currentColor" />
          </button>
        ) : (
          /* 정답 아닐 때: 키보드 컨트롤 표시 */
          <>
            {/* 글자 버튼들 */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {scrambledLetters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onLetterClick(item)}
                  className="aspect-square bg-white border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 text-gray-800 font-black text-lg rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  {item.char}
                </button>
              ))}
            </div>

            {/* 조작 버튼 (Reset, Back) */}
            <div className="flex gap-2">
              <button 
                onClick={onReset} 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <RotateCcw size={18} strokeWidth={2.5} /> RESET
              </button>
              <button 
                onClick={onBackspace} 
                className="flex-[2] bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Delete size={20} fill="currentColor" /> BACK
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default GameControls;
