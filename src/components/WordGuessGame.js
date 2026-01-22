import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles, Download, X } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 상태 관리 및 로컬 스토리지 복구 ---
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem('word-game-score');
    return savedScore !== null ? Number(savedScore) : 300; // 초기 점수 300점
  });
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-used-indices')) || []; } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-scrambled')) || []; } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(() => !localStorage.getItem('install-guide-seen'));

  // 정답 단어 리스트 메모이제이션
  const targetWords = useMemo(() => 
    currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  , [currentWord]);

  // --- 데이터 저장 효과 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  // --- 단어 로드 로직 ---
  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';
    const available = db.map((_, i) => i).filter(i => !usedWordIndices.includes(`${dbKey}-${i}`));
    
    let targetIndex = available.length === 0 ? Math.floor(Math.random() * db.length) : available[Math.floor(Math.random() * available.length)];
    const wordObj = db[targetIndex];
    
    const chars = wordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, 
      id: `letter-${Date.now()}-${i}-${Math.random()}` 
    }));

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIndices]);

  useEffect(() => {
    if (!currentWord) loadNewWord();
  }, [currentWord, loadNewWord]);

  // --- 핸들러 함수 ---
  const handleHintClick = () => {
    if (!showHint) {
      setScore(prev => Math.max(0, prev - 100)); // 힌트 사용 시 100점 차감
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  };

  const closeInstallGuide = () => {
    localStorage.setItem('install-guide-seen', 'true');
    setShowInstallGuide(false);
  };

  const checkGuess = () => {
    const userAll = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAll = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAll === correctAll) {
      setMessage('EXCELLENT! 🎉');
      setIsCorrect(true);
      const earnedScore = targetWords.length * 10; // 단어 수 * 10점 획득
      
      setTimeout(() => {
        setScore(s => s + earnedScore);
        setLevel(l => l + 1);
        setCurrentWord(''); // 이 값이 비워져야 loadNewWord가 실행됨
      }, 1500);
    } else {
      setMessage('TRY AGAIN!');
    }
  };

  // 순서와 상관없이 정답 단어를 찾아 배치하는 핵심 렌더링 로직
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
              <span key={l.id} onClick={() => {
                if (isCorrect) return;
                setSelectedLetters(prev => prev.filter(i => i.id !== l.id));
                setScrambledLetters(prev => [...prev, l]);
                setMessage('');
              }} className={`font-black cursor-pointer transition-all duration-300 ${isWordCorrect ? 'text-green-500 scale-110' : 'text-indigo-600'} ${target.length > 8 ? 'text-2xl' : 'text-4xl'}`}>
                {l.char.toUpperCase()}
              </span>
            ))}
            {isWordCorrect && <span className="text-green-500 font-bold ml-2 text-2xl animate-bounce">✓</span>}
          </div>
          <div className={`h-1.5 rounded-full mt-2 transition-all duration-500 ${isWordCorrect ? 'bg-green-400 w-full' : 'bg-indigo-100 w-20'}`} />
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 font-sans text-gray-800 relative">
      
      {/* --- 안드로이드/iOS 설치 안내 모달 --- */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center border-t-8 border-indigo-500">
            <button onClick={closeInstallGuide} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-black mb-2 text-indigo-900 uppercase">앱 설치 안내</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed font-medium">홈 화면에 추가하여 더 빠르게 시작하세요!</p>
            <div className="space-y-4 text-left bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md mt-0.5 min-w-[55px] text-center">ANDROID</div>
                <div>
                  <p className="text-xs font-bold text-gray-800 mb-1">크롬/삼성 브라우저</p>
                  <p className="text-[11px] text-gray-600 leading-tight">우측 상단 <strong>메뉴(⋮)</strong> 클릭 후 <br/><strong>'홈 화면에 추가'</strong>를 눌러주세요.</p>
                </div>
              </div>
              <div className="h-px bg-gray-200 w-full" />
              <div className="flex items-start gap-4">
                <div className="bg-gray-400 text-white text-[10px] font-black px-2 py-1 rounded-md mt-0.5 min-w-[55px] text-center">IOS</div>
                <div>
                  <p className="text-xs font-bold text-gray-800 mb-1">사파리(Safari)</p>
                  <p className="text-[11px] text-gray-600 leading-tight">하단 <strong>공유 아이콘(↑)</strong> 클릭 후 <br/><strong>'홈 화면에 추가'</strong>를 눌러주세요.</p>
                </div>
              </div>
            </div>
            <button onClick={closeInstallGuide} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">확인했습니다!</button>
          </div>
        </div>
      )}

      {/* --- 메인 게임 UI --- */}
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-bold text-indigo-600 uppercase">
            <Sparkles size={18} className="text-yellow-400" /> Level {level}
          </div>
          <div className="flex items-center gap-1 font-black text-gray-700">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-1 mb-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{category}</h2>
            <div className="mt-2">
              <span className="text-[11px] font-black text-white bg-indigo-500 px-3 py-1 rounded-full shadow-sm">
                {targetWords.length} {targetWords.length > 1 ? 'WORDS' : 'WORD'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={handleHintClick} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold active:bg-gray-200 transition-colors">
              <Lightbulb size={14} className={`inline mr-1 ${showHint ? 'text-yellow-500' : ''}`}/>
              {showHint ? 'HINT ON' : 'HINT (-100)'}
            </button>
            <button onClick={() => { if (!isCorrect) setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5)) }} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold active:bg-gray-200 transition-colors">
              <RotateCcw size={14} className="inline mr-1"/>SHUFFLE
            </button>
          </div>
          {showHint && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-700 font-bold">
              Hint: <span className="text-indigo-600">{targetWords.map(w => w[0].toUpperCase() + "...").join(", ")}</span>
            </div>
          )}
        </div>

        {/* 글자 선택 영역 */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => {
              if (isCorrect) return;
              setScrambledLetters(prev => prev.filter(i => i.id !== l.id));
              setSelectedLetters(prev => [...prev, l]);
              setMessage('');
            }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition-all">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 답변 영역 (자유 순서 매칭) */}
        <div className="min-h-[180px] bg-indigo-50 rounded-2xl flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed border-indigo-200">
          {selectedLetters.length === 0 ? (
            <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest text-center">Touch Letters to Answer</span>
          ) : (
            <div className="w-full">{renderFreeOrderWords()}</div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            if (isCorrect) return;
            setScrambledLetters(prev => [...prev, ...selectedLetters]);
            setSelectedLetters([]);
            setMessage('');
          }} className="flex-1 bg-gray-50 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">RESET</button>
          <button onClick={checkGuess} disabled={selectedLetters.length === 0 || isCorrect} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:bg-indigo-700 transition-all">
            {isCorrect ? 'PERFECT!' : 'CHECK'}
          </button>
        </div>
        
        {message && <div className="mt-4 text-center font-black text-indigo-600 tracking-widest uppercase animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
