import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // 1. LocalStorage에서 상태 복구
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 0);
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

  // 상태 변경 시 LocalStorage 실시간 저장
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  // 새 단어 로드 로직
  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';
    const available = db.map((_, i) => i).filter(i => !usedWordIndices.includes(`${dbKey}-${i}`));
    
    let targetIndex = available.length === 0 ? Math.floor(Math.random() * db.length) : available[Math.floor(Math.random() * available.length)];
    const wordObj = db[targetIndex];
    
    // 단어를 글자 단위로 쪼개고 섞기
    const chars = wordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ char, id: Math.random() + i }));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(chars); // 이 부분이 버튼을 생성합니다
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIndices]);

  useEffect(() => {
    if (!currentWord || scrambledLetters.length === 0) {
      loadNewWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, currentWord]);

  const checkGuess = () => {
    const user = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correct = currentWord.replace(/\s/g, '').toLowerCase();

    if (user === correct) {
      setMessage('EXCELLENT! 🎉');
      setIsCorrect(true);
      setTimeout(() => {
        setCurrentWord('');
        setScore(s => s + (level * 10));
        setLevel(l => l + 1);
      }, 1500);
    } else {
      setMessage('TRY AGAIN!');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-bold text-indigo-600 uppercase">
            <Sparkles size={18} className="text-yellow-400" /> Level {level}
          </div>
          <div className="flex items-center gap-1 font-black">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>

        {/* 카테고리 & 도구 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">{category}</h2>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs font-bold px-4 py-2 bg-gray-50 border rounded-full">
              <Lightbulb size={14} /> HINT
            </button>
            <button onClick={() => setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5))} className="flex items-center gap-1 text-xs font-bold px-4 py-2 bg-gray-50 border rounded-full">
              <RotateCcw size={14} /> SHUFFLE
            </button>
          </div>
          {showHint && <div className="mt-3 text-xs text-indigo-500 font-bold uppercase">Starts with: {currentWord[0]?.toUpperCase()}</div>}
        </div>

        {/* 선택 가능한 알파벳 버튼 영역 (복구 완료) */}
        <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button 
              key={l.id} 
              onClick={() => {
                setScrambledLetters(prev => prev.filter(i => i.id !== l.id));
                setSelectedLetters(prev => [...prev, l]);
                setMessage('');
              }} 
              className="w-12 h-12 bg-white border-2 border-gray-100 rounded-xl font-bold text-xl shadow-sm hover:border-indigo-500 active:scale-90 transition-all"
            >
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 답변 영역 (큰 글자 한 줄 배치) */}
        <div className="min-h-[100px] bg-indigo-50 rounded-2xl flex justify-center items-center p-4 mb-8 border-2 border-dashed border-indigo-200 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-2 whitespace-nowrap">
            {selectedLetters.length === 0 ? (
              <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Select Letters</span>
            ) : (
              selectedLetters.map(l => (
                <span 
                  key={l.id} 
                  onClick={() => {
                    setSelectedLetters(prev => prev.filter(i => i.id !== l.id));
                    setScrambledLetters(prev => [...prev, l]);
                  }} 
                  className={`font-black text-indigo-600 cursor-pointer animate-in fade-in zoom-in duration-200 ${
                    selectedLetters.length > 8 ? 'text-2xl' : 'text-4xl'
                  }`}
                >
                  {l.char.toUpperCase()}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 하단 제어 버튼 */}
        <div className="flex gap-2">
          <button onClick={() => {
            setScrambledLetters(prev => [...prev, ...selectedLetters]);
            setSelectedLetters([]);
            setMessage('');
          }} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-400">RESET</button>
          <button onClick={checkGuess} disabled={selectedLetters.length === 0 || isCorrect} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:bg-green-500 transition-colors">
            {isCorrect ? 'PERFECT!' : 'CHECK'}
          </button>
        </div>
        
        {message && <div className="mt-4 text-center font-black text-indigo-600 tracking-widest">{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
