import React from 'react';
import { Lightbulb, RotateCcw, PlayCircle, RefreshCcw, Delete, ArrowRight } from 'lucide-react';

const GameControls = ({
  category,
  wordType,
  wordCountDisplay,
  hintMessage,
  isCorrect,
  // 힌트 관련
  hintStage,
  hintButtonText,
  onHint,
  // 셔플 관련
  onShuffle,
  // 광고 관련
  isAdVisible,
  isAdLoading,
  adClickCount,
  onRewardAd,
  isOnline,
  // 키보드 관련
  scrambledLetters,
  onLetterClick,
  // 하단 컨트롤
  onReset,
  onBackspace,
  onNextLevel
}) => {
  return (
    <>
      {/* 카테고리 정보 */}
      <div className="text-center mb-3 w-full">
        <div className="flex justify-center gap-2 mb-1">
          <span className="py-1 px-3 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest">{wordCountDisplay}</span>
          <span className={`py-1 px-3 text-[10px] font-black rounded-full uppercase tracking-widest ${wordType === 'PHRASE' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>{wordType}</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{category}</h2>
        {hintMessage && (
          <div className="mt-1 py-1 px-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg animate-pulse inline-block border border-indigo-100">
            {hintMessage}
          </div>
        )}
      </div>

      {/* 힌트 & 셔플 버튼 */}
      <div className="flex gap-2 w-full mb-3">
        <button onClick={onHint} disabled={isCorrect} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black flex items-center justify-center gap-1 uppercase hover:bg-gray-200 active:scale-95 transition-all">
          <Lightbulb size={14}/> {hintButtonText}
        </button>
        <button onClick={onShuffle} disabled={isCorrect} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black flex items-center justify-center gap-1 uppercase hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all">
          <RotateCcw size={14}/> SHUFFLE
        </button>
      </div>

      {/* 광고 버튼 */}
      <div className="w-full mb-4">
        {isAdVisible && adClickCount < 10 ? (
          <button onClick={onRewardAd} className="w-full py-3 bg-amber-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 active:scale-95 shadow-md hover:bg-amber-500 transition-all">
            <PlayCircle size={16}/> {isAdLoading ? 'LOADING...' : `WATCH AD (+200P) (${adClickCount}/10)`}
          </button>
        ) : (
          <div className="w-full py-2 text-center text-[10px] text-gray-400 font-bold italic bg-gray-50 rounded-lg">
            {!isOnline ? "Internet required for Ads" : (adClickCount >= 10 ? "Daily limit reached (10/10)" : "Next reward in 10 mins")}
          </div>
        )}
      </div>

      {/* 알파벳 키보드 */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 min-h-[80px] content-start">
        {scrambledLetters.map(l => (
          <button key={l.id} onClick={() => onLetterClick(l)} className="w-11 h-11 bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-100 rounded-lg font-black text-xl text-indigo-600 active:translate-y-1 active:shadow-none transition-all hover:border-indigo-300">
            {l.char.toUpperCase()}
          </button>
        ))}
        {scrambledLetters.length === 0 && !isCorrect && (
          <div className="text-gray-300 text-xs font-bold italic py-4">All letters placed</div>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-full h-px bg-gray-100 mb-4 relative">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-300 text-[10px] font-bold">ANSWER</span>
      </div>

      {/* (AnswerBoard가 여기에 들어가지만, Controls 파일에서는 하단 버튼만 렌더링) */}

      {/* 하단 버튼 (Reset/Back/Next) */}
      <div className="w-full mt-auto pt-2 border-t border-gray-50">
        {isCorrect ? (
          <button onClick={onNextLevel} className="w-full py-3 bg-green-500 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 active:scale-95 transition-all">
            NEXT LEVEL <ArrowRight size={24}/>
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onReset} className="flex-1 py-3 bg-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-300 active:scale-95 transition-all">
              <RefreshCcw size={16}/> RESET
            </button>
            <button onClick={onBackspace} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <Delete size={20}/> BACK
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default GameControls;
