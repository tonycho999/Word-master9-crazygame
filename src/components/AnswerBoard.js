import React from 'react';

const AnswerBoard = ({ 
  currentWord, 
  solvedWordsData, 
  selectedLetters, 
  isCorrect, 
  isFlashing, 
  hintStage, 
  message 
}) => {
  
  // 1. 힌트 플래시 효과 (정답 잠깐 보여주기)
  if (isFlashing) {
    return (
      <div className="flex flex-col gap-2 items-center w-full animate-pulse min-h-[100px]">
        {currentWord.split(' ').map((word, wIdx) => (
          <div key={wIdx} className="flex gap-1 justify-center flex-wrap">
            {word.split('').map((char, cIdx) => (
              <div key={cIdx} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-amber-500 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-base font-bold">
                {char.toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 2. 최종 정답 (모두 맞췄을 때)
  if (isCorrect) {
    return (
      <div className="flex flex-col gap-2 w-full items-center mb-4 min-h-[100px]">
        <div className="flex flex-col gap-2 w-full items-center mb-2 animate-bounce">
          {currentWord.split(' ').map((word, wIdx) => (
            <div key={`final-${wIdx}`} className="flex gap-1 justify-center flex-wrap">
              {word.split('').map((char, cIdx) => (
                <div key={`${wIdx}-${cIdx}`} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-base font-bold">
                  {char.toUpperCase()}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 font-black text-xs tracking-widest animate-bounce text-green-500">
          {message || 'EXCELLENT!'}
        </div>
      </div>
    );
  }

  // 3. 게임 진행 중 화면 렌더링
  
  // 이미 맞춘 단어들
  const solvedArea = solvedWordsData.map((data, idx) => (
    <div key={`solved-${idx}`} className="flex gap-1 justify-center flex-wrap mb-2 animate-bounce">
      {data.letters.map(l => (
        <div key={l.id} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center justify-center text-base font-bold">
          {l.char.toUpperCase()}
        </div>
      ))}
    </div>
  ));

  let inputArea;

  // 힌트 단계가 낮을 때는 입력된 글자만 순서대로 보여줌 (기존 방식)
  if (!isCorrect && hintStage < 3) {
    inputArea = (
      <div className="flex flex-wrap gap-1 md:gap-2 w-full justify-center items-center min-h-[60px]">
        {selectedLetters.map((l) => (
          <div key={l.id} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-indigo-600 bg-indigo-50 text-indigo-800 rounded-lg flex items-center justify-center text-base font-bold -translate-y-1">
            {l.char.toUpperCase()}
          </div>
        ))}
        {selectedLetters.length === 0 && ( 
          <span className="text-gray-300 text-xs font-bold tracking-widest animate-pulse uppercase">TAP LETTERS</span> 
        )}
      </div>
    );
  } else {
    // 힌트 단계가 높으면(3단계 이상) 빈 칸(구조)을 보여줌
    const allWords = currentWord.split(' ');
    const solvedWordsList = solvedWordsData.map(d => d.word.toUpperCase());
    const remainingWords = allWords.filter(w => !solvedWordsList.includes(w.toUpperCase()));
    
    let letterIndex = 0;

    inputArea = (
      <div className="flex flex-col gap-2 w-full items-center">
        {remainingWords.map((word, idx) => {
          const wordLen = word.length;
          const currentLetters = selectedLetters.slice(letterIndex, letterIndex + wordLen);
          letterIndex += wordLen;
          
          const emptyCount = Math.max(0, wordLen - currentLetters.length);
          const emptySlots = Array(emptyCount).fill(0);

          return (
            <div key={`rem-${idx}`} className="flex gap-1 justify-center flex-wrap min-h-[50px]">
              {currentLetters.map(l => (
                <div key={l.id} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-indigo-600 bg-indigo-50 text-indigo-800 rounded-lg flex items-center justify-center text-base font-bold -translate-y-1">
                  {l.char.toUpperCase()}
                </div>
              ))}
              {emptySlots.map((_, i) => (
                <div key={`empty-${i}`} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gray-200 bg-gray-100 rounded-lg flex items-center justify-center">
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col justify-start items-center mb-4 min-h-[100px]">
      <div className="flex flex-col gap-2 w-full items-center mb-2">{solvedArea}</div>
      {inputArea}
      {message && <div className="mt-2 font-black text-xs tracking-widest animate-bounce text-amber-500">{message}</div>}
    </div>
  );
};

export default AnswerBoard;
