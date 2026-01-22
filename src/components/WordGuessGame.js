import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles, X, Delete, ArrowRight } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 1. 상태 관리 및 로컬 저장소 데이터 복구 ---
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem('word-game-score');
    return savedScore !== null ? Number(savedScore) : 300;
  });
  const [usedWordIds, setUsedWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-used-ids');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-scrambled');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(() => !localStorage.getItem('install-guide-seen'));

  const targetWords = useMemo(() => 
    currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  , [currentWord]);

  // --- 2. 데이터 자동 저장 (효과) ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-ids', JSON.stringify(usedWordIds));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIds, currentWord, category, scrambledLetters]);

  // --- 3. 중복 방지 단어 로드 로직 ---
  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbPrefix = level <= 19 ? 'LV1' : level <= 99 ? 'LV2' : 'LV3';

    const availableWords = db.filter(item => {
      const wordId = `${dbPrefix}-${item.word}-${item.category}`;
      return !usedWordIds.includes(wordId);
    });

    let selectedWordObj = availableWords.length > 0 
      ? availableWords[Math.floor(Math.random() * availableWords.length)]
      : db[Math.floor(Math.random() * db.length)];

    const wordId = `${dbPrefix}-${selectedWordObj.word}-${selectedWordObj.category}`;

    const chars = selectedWordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, 
      id: `letter-${Date.now()}-${i}-${Math.random()}` 
    }));

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setUsedWordIds(prev => [...prev, wordId]);
    setCurrentWord(selectedWordObj.word);
    setCategory(selectedWordObj.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIds]);

  useEffect(() => {
    if (!currentWord) loadNewWord();
  }, [currentWord, loadNewWord]);

  // --- 4. 정답 판정 및 자동 저장 ---
  useEffect(() => {
    if (selectedLetters.length === 0 || !currentWord || isCorrect) return;
    const userAll = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAll = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAll.length === correctAll.length && userAll === correctAll) {
      setIsCorrect(true);
      setMessage('EXCELLENT! 🎉');
    }
  }, [selectedLetters, currentWord, isCorrect]);

  const goToNextLevel = () => {
    const earnedScore = targetWords.length * 10;
    setScore(s => s + earnedScore);
    setLevel(l => l + 1);
    setCurrentWord(''); // loadNewWord 트리거
    setIsCorrect(false);
  };

  const removeLastLetter = () => {
    if (selectedLetters.length === 0 || isCorrect) return;
    const lastLetter = selectedLetters[selectedLetters.length - 1];
    setSelectedLetters(prev => prev.slice(0, -1));
    setScrambledLetters(prev => [...prev, lastLetter]);
  };

  const renderFreeOrderWords = () => {
    let tempSelected = [...selectedLetters];
    let matchedWords = Array(targetWords.length).fill(null);
    let usedInMatch = new Set();

    targetWords.forEach((target, wordIdx) => {
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        const sliceText = slice.map(l => l.char).join('').toLowerCase();
        if (sliceText === target) {
          matchedWords[wordIdx] = { letters: slice, isMatch: true };
          slice.forEach(l => usedInMatch.add(l.id));
          break;
        }
      }
    });

    let unmatchedLetters = selectedLetters.filter(l => !usedInMatch.has(l.id));
    
    return targetWords.map((target, idx) => {
      const isWordCorrect = matchedWords[idx] !== null;
      const displayLetters = isWordCorrect ? matchedWords[idx].letters : unmatchedLetters.splice(0, target.length);

      return (
        <div key={`row-${idx}`} className="flex flex-col items-center mb-6 last:mb-0 w-full">
          <div className="flex gap-2 items-center flex-wrap justify-center min-h-[48px]">
            {displayLetters.map((l) => (
              <span key={l.id} className={`font-black tracking-widest ${isWordCorrect ? 'text-green-500 scale-110 transition-transform' : 'text-indigo-600'} ${target.length > 10 ? 'text-2xl' : 'text-4xl'}`}>
                {l.char.toUpperCase()}
              </span>
            ))}
          </div>
          <div className={`h-1.5 rounded-full mt-2 transition-all duration-700 ${isWordCorrect ? 'bg-green-400 w-full' : 'bg-indigo-100 w-24'}`} />
        </div>
      );
    });
  };

  return (
    <div className="w-full min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
      
      {/* 1. 설치 안내 모달 (중앙 배치 레이어) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative text-center border-t-8 border-indigo-500">
            <button onClick={() => setShowInstallGuide(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"><X size={28} /></button>
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles size={40} />
            </div>
            <h3 className="text-2xl font-black mb-4 text-indigo-900 uppercase tracking-tight">App Installation</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">홈 화면에 추가하여 더 빠르게 게임을 시작하세요!</p>
            <button 
              onClick={() => { localStorage.setItem('install-guide-seen', 'true'); setShowInstallGuide(false); }} 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition-colors"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}

      {/* 2. 메인 게임 카드 */}
      <div className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-2xl w-full max-w-md flex flex-col items-stretch transition-all duration-500">
        
        {/* 점수 및 레벨 상단바 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-tighter text-lg">
            <Sparkles size={20} className="text-yellow-400" /> Level {level}
          </div>
          <div className="flex items-center gap-2 font-black text-gray-700 text-lg">
            <Trophy size={22} className="text-yellow-500" /> {score}
          </div>
        </div>

        {/* 카테고리 정보 및 힌트 버튼 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-2 text-gray-900 leading-none">{category}</h2>
          <span className="text-[12px] font-black text-white bg-indigo-500 px-5 py-1.5 rounded-full inline-block shadow-md uppercase mb-6">
            {targetWords.length} {targetWords.length > 1 ? 'WORDS' : 'WORD'}
          </span>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => !showHint && score >= 100 && (setScore(s => s - 100), setShowHint(true))} 
              className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-full text-xs font-black shadow-sm transition-transform active:scale-95 hover:border-indigo-200"
            >
              <Lightbulb size={16} className={`inline mr-2 ${showHint ? 'text-yellow-500' : 'text-gray-400'}`}/>
              {showHint ? 'HINT ON' : 'HINT (-100)'}
            </button>
            <button 
              onClick={() => !isCorrect && setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5))} 
              className="px-6 py-3 bg-gray-50 border-2 border-gray-100 rounded-full text-xs font-black shadow-sm transition-transform active:scale-95 hover:border-indigo-200"
            >
              <RotateCcw size={16} className="inline mr-2 text-gray-400"/>SHUFFLE
            </button>
          </div>
          {showHint && (
            <div className="mt-5 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-xs text-indigo-700 font-bold animate-pulse">
              HINT: {targetWords.map(w => w[0].toUpperCase() + "...").join(", ")}
            </div>
          )}
        </div>

        {/* 글자 선택 버튼 영역 */}
        <div className="flex flex-wrap gap-3 justify-center mb-10 min-h-[64px]">
          {scrambledLetters.map(l => (
            <button 
              key={l.id} 
              onClick={() => {
                if (isCorrect) return;
                setScrambledLetters(prev => prev.filter(i => i.id !== l.id));
                setSelectedLetters(prev => [...prev, l]);
                setMessage('');
              }} 
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-gray-100 rounded-[1.2rem] font-black text-xl shadow-md active:scale-90 transition-all hover:border-indigo-400 hover:text-indigo-600"
            >
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 답변 입력 및 시각화 영역 */}
        <div className="min-h-[200px] bg-indigo-50 rounded-[2.5rem] flex flex-col justify-center items-center p-8 mb-10 border-2 border-dashed border-indigo-100 shadow-inner">
          {selectedLetters.length === 0 ? (
            <span className="text-indigo-200 text-sm font-black uppercase tracking-[0.3em] text-center">Touch Letters</span>
          ) : (
            <div className="w-full">{renderFreeOrderWords()}</div>
          )}
        </div>

        {/* 하단 인터랙션 버튼 영역 */}
        <div className="min-h-[80px]">
          {isCorrect ? (
            <button 
              onClick={goToNextLevel}
              className="w-full bg-green-500 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl flex items-center justify-center gap-3 animate-bounce hover:bg-green-600 transition-colors"
            >
              NEXT LEVEL <ArrowRight size={32} />
            </button>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setScrambledLetters(prev => [...prev, ...selectedLetters]);
                  setSelectedLetters([]);
                  setMessage('');
                }} 
                className="flex-1 bg-gray-50 py-6 rounded-[2rem] font-black text-gray-400 uppercase text-sm border-2 border-gray-100 hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={removeLastLetter} 
                disabled={selectedLetters.length === 0} 
                className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl active:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center gap-3 transition-all"
              >
                <Delete size={28} /> Backspace
              </button>
            </div>
          )}
        </div>
        
        {message && <div className="mt-8 text-center font-black text-indigo-600 tracking-[0.3em] uppercase text-sm animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
