import React from 'react';

const AnswerBoard = ({ currentWord, solvedWords, selectedLetters, isCorrect, isFlashing, hintStage, message }) => {
  // 현재 입력 중인 단어 (아직 엔터 안 친 상태)
  // 멀티 단어 게임에서는 "어떤 단어를 입력 중인지" 명확하지 않으므로, 
  // 입력 중인 글자들은 별도의 "입력 슬롯"이나 가장 마지막 빈칸에 보여주는 게 일반적입니다.
  // 하지만 요청하신 대로 "입력한 글자"는 별도로 보여주고, 정답 칸은 "숨김" 처리합니다.

  return (
    <div className="flex flex-col items-center gap-4 mb-6 min-h-[120px] justify-center w-full">
      {/* Toast Message */}
      {message && (
        <div className="absolute top-20 z-50 bg-gray-900/95 text-white px-6 py-2 rounded-full text-sm font-black animate-bounce shadow-xl border border-gray-700 backdrop-blur-sm tracking-wide">
          {message}
        </div>
      )}

      {/* 1. 정답 단어들이 표시되는 영역 (맞춘 것만 보임 + 힌트 3단계일 때 구조 보임) */}
      <div className="flex flex-col gap-2 w-full items-center">
        {currentWord.split(' ').map((word, wordIndex) => {
          // 이 단어를 맞췄는지 확인
          const isSolved = solvedWords.includes(word);
          
          // 보여줄지 말지 결정
          // 조건: 이미 맞췄거나(isSolved) OR 힌트레벨이 3(구조 공개)일 때만 박스를 그린다.
          // 그 외(아직 못 맞춤 + 힌트 1,2)에는 아예 숨긴다(null).
          const shouldShowStructure = isSolved || hintStage === 3;

          if (!shouldShowStructure) {
             // 아직 못 맞췄고 구조 힌트도 안 썼으면 -> 빈 공간만 차지하거나 아예 숨김
             // "줄이 바뀐다"는 표현을 위해, 아직 못 맞춘 단어는 화면에 안 그립니다.
             // 다만, 사용자가 입력 중인 글자(Selected Letters)를 보여줄 공간이 필요합니다.
             return null; 
          }

          return (
            <div key={wordIndex} className="flex gap-1 flex-wrap justify-center animate-fade-in">
              {word.split('').map((char, charIndex) => {
                return (
                  <div
                    key={charIndex}
                    className={`
                      w-10 h-12 flex items-center justify-center rounded-lg text-xl font-black shadow-sm transition-all duration-300 border-2
                      ${isSolved 
                        ? 'bg-green-500 text-white border-green-600 shadow-green-200' // 정답
                        : 'bg-white border-blue-400 shadow-blue-100' // 힌트 3단계 (구조만 표시, 글자 없음)
                      }
                      ${isSolved && isFlashing ? 'bg-yellow-300 border-yellow-500 scale-110' : ''}
                    `}
                  >
                    {/* 맞췄을 때만 글자 보여줌 */}
                    {isSolved ? char : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 2. 현재 입력 중인 글자 표시 영역 (항상 맨 아래에 별도로 표시) */}
      {/* 정답을 맞추기 전까지 사용자가 누른 글자들을 보여주는 '입력 트레이'입니다. */}
      {!isCorrect && selectedLetters.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center mt-2 p-2 bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200">
           {selectedLetters.map((item, idx) => (
             <div key={item.id} className="w-10 h-12 flex items-center justify-center rounded-lg text-xl font-black bg-indigo-600 text-white shadow-md animate-bounce-short">
               {item.char}
             </div>
           ))}
           {/* 커서 깜빡임 효과 (입력 대기 중) */}
           <div className="w-1 h-8 bg-indigo-300 animate-pulse self-center ml-1"></div>
        </div>
      )}
      
      {/* 입력된 게 없을 때 안내 문구 (힌트 3 미만일 때) */}
      {!isCorrect && selectedLetters.length === 0 && hintStage < 3 && solvedWords.length < currentWord.split(' ').length && (
          <div className="text-gray-400 text-xs font-bold animate-pulse tracking-widest mt-4">
            TAP LETTERS TO GUESS
          </div>
      )}

    </div>
  );
};

export default AnswerBoard;
