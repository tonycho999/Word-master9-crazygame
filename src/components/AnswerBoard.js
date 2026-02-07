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
  
  // 공통 스타일: 글자 크기 및 간격 조정 (12글자 대응을 위해 너비를 w-6 ~ w-8로 조정)
  // 박스(border) 제거, 밑줄 스타일 적용
  const letterBaseStyle = "w-6 h-8 sm:w-8 sm:h-10 flex items-end justify-center text-xl sm:text-2xl font-black select-none";
  
  // 1. 힌트 플래시 효과 (정답 잠깐 보여주기)
  if (isFlashing) {
    return (
      <div className="flex flex-col gap-2 items-center w-full animate-pulse min-h-[80px]">
        {currentWord.split(' ').map((word, wIdx) => (
          <div key={wIdx} className="flex gap-0.5 justify-center flex-nowrap">
            {word.split('').map((char, cIdx) => (
              <div key={cIdx} className={`${letterBaseStyle} text-amber-600`}>
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
      <div className="flex flex-col gap-2 w-full items-center mb-4 min-h-[80px]">
        <div className="flex flex-col gap-2 w-full items-center mb-2 animate-bounce">
          {currentWord.split(' ').map((word, wIdx) => (
            <div key={`final-${wIdx}`} className="flex gap-0.5 justify-center flex-nowrap">
              {word.split('').map((char, cIdx) => (
                <div key={`${wIdx}-${cIdx}`} className={`${letterBaseStyle} text-green-600`}>
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
  
  // 이미 맞춘 단어들 표시
  const solvedArea = solvedWordsData.map((data, idx) => (
    <div key={`solved-${idx}`} className="flex gap-0.5 justify-center flex-nowrap mb-2 animate-bounce">
      {data.letters.map(l => (
        <div key={l.id} className={`${letterBaseStyle} text-green-600`}>
          {l.char.toUpperCase()}
        </div>
      ))}
    </div>
  ));

  let inputArea;

  // 힌트 단계가 낮을 때는 입력된 글자만 순서대로 보여줌
  if (!isCorrect && hintStage < 3) {
    inputArea = (
      <div className="flex flex-wrap gap-1 justify-center items-center min-h-[60px]">
        {selectedLetters.map((l) => (
          // 입력된 글자는 박스 없이 글자만 진하게 표시
          <div key={l.id} className={`${letterBaseStyle} text-indigo-800 border-b-2 border-indigo-200`}>
            {l.char.toUpperCase()}
          </div>
        ))}
        {selectedLetters.length === 0 && ( 
          <span className="text-gray-300 text-xs font-bold tracking-widest animate-pulse uppercase">TAP LETTERS</span> 
        )}
      </div>
    );
  } else {
    // 힌트 3단계 이상: 빈 칸(구조)을 밑줄로 보여줌
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
            // flex-nowrap을 사용하여 단어가 줄바꿈되지 않게 함
            <div key={`rem-${idx}`} className="flex gap-1 justify-center flex-nowrap min-h-[40px]">
              {/* 입력된 글자 */}
              {currentLetters.map(l => (
                <div key={l.id} className={`${letterBaseStyle} text-indigo-800 border-b-2 border-indigo-500`}>
                  {l.char.toUpperCase()}
                </div>
              ))}
              {/* 빈 칸 (짧은 언더바 표시) */}
              {emptySlots.map((_, i) => (
                <div key={`empty-${i}`} className="w-6 h-8 sm:w-8 sm:h-10 flex items-end justify-center border-b-2 border-gray-300">
                   {/* 빈 공간은 투명하게 처리하거나 얇은 밑줄만 유지 */}
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
