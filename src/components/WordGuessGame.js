import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles, X, Delete, ArrowRight } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 상태 관리 ---
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
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
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(() => !localStorage.getItem('install-guide-seen'));

  const targetWords = useMemo(() => currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0), [currentWord]);

  // --- 로컬 스토리지 동기화 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-ids', JSON.stringify(usedWordIds));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIds, currentWord, category, scrambledLetters]);

  // --- 레벨에 따른 단어 수(DB 종류) 결정 로직 ---
  const getWordTypeByLevel = useCallback((currentLevel) => {
    const rand = Math.random() * 100;

    if (currentLevel >= 1 && currentLevel <= 5) return 1;
    if (currentLevel >= 6 && currentLevel <= 10) return currentLevel % 2 === 0 ? 2 : 1;
    if (currentLevel >= 11 && currentLevel <= 20) return 2;
    if (currentLevel >= 21 && currentLevel < 100) {
        if (currentLevel >= 30) return rand < 30 ? 1 : 2; // 30레벨 이상 1단어 확률 30%
        return 2;
    }
    if (currentLevel >= 100 && currentLevel <= 105) return 3;
    if (currentLevel > 105) {
        if (rand < 60) return 3; // 60% 확률 3단어
        if (rand < 90) return 2; // 30% 확률 2단어
        return 1;                // 10% 확률 1단어
    }
    return 1;
  }, []);

  // --- 단어 로드 로직 (중복 제거 포함) ---
  const loadNewWord = useCallback(() => {
    const wordType = getWordTypeByLevel(level);
    let db = wordType === 1 ? wordDatabase : wordType === 2 ? twoWordDatabase : threeWordDatabase;
    const dbPrefix = `DB${wordType}`;

    // 이미 사용한 단어 제외 필터링
    let availableWords = db.filter(item => !usedWordIds.includes(`${dbPrefix}-${item.word}`));

    // 만약 해당 DB의 모든 단어를 다 썼다면 (초기화 또는 순환)
    if (availableWords.length === 0) {
      availableWords = db;
    }

    const selectedWordObj = availableWords[Math.floor(Math.random() * availableWords.length)];
    const wordId = `${dbPrefix}-${selectedWordObj.word}`;

    const chars = selectedWordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `letter-${Date.now()}-${i}-${Math.random()}` 
    })).sort(() => Math.random() - 0.5);

    setUsedWordIds(prev => [...prev, wordId]); // 사용한 ID 목록에 추가
    setCurrentWord(selectedWordObj.word);
    setCategory(selectedWordObj.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIds, getWordTypeByLevel]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  // --- 정답 체크 및 레벨업 ---
  useEffect(() => {
    if (selectedLetters.length === 0 || !currentWord || isCorrect) return;
    const userAll = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAll = currentWord.replace(/\s/g, '').toLowerCase();
    if (userAll.length === correctAll.length && userAll === correctAll) setIsCorrect(true);
  }, [selectedLetters, currentWord, isCorrect]);

  const handleNextLevel = () => {
    setScore(s => s + (targetWords.length * 10));
    setLevel(l => l + 1);
    setCurrentWord('');
  };

  const removeLastLetter = () => {
    if (selectedLetters.length === 0 || isCorrect) return;
    const last = selectedLetters[selectedLetters.length - 1];
    setSelectedLetters(prev => prev.slice(0, -1));
    setScrambledLetters(prev => [...prev, last]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans">
      {/* 설치 안내 및 게임 카드는 이전과 동일한 UI 유지 */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        <div className="w-full flex justify-between items-center mb-8 font-black text-indigo-600">
          <span className="flex items-center gap-1"><Sparkles size={18}/> LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <h2 className="text-3xl font-black text-gray-900 uppercase mb-2">{category}</h2>
        <div className="bg-indigo-100 text-indigo-700 text-[10px] px-3 py-1 rounded-full font-bold mb-8 uppercase tracking-widest">
            {targetWords.length} Words Challenge
        </div>

        {/* 글자 버튼 영역 */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} 
              className="w-12 h-12 bg-white border-2 border-gray-100 rounded-2xl font-black text-xl shadow-sm hover:border-indigo-400 active:scale-90 transition-all">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 정답 영역 */}
        <div className="w-full min-h-[150px] bg-gray-50 rounded-3xl flex flex-wrap justify-center items-center p-6 mb-8 border-2 border-dashed border-gray-200">
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-bold uppercase tracking-widest text-sm">Tap Letters</span> : 
            selectedLetters.map(l => <span key={l.id} className="text-4xl font-black text-indigo-600 mx-1 animate-in fade-in zoom-in">{l.char.toUpperCase()}</span>)
          }
        </div>

        {/* 하단 버튼 */}
        <div className="w-full">
          {isCorrect ? (
            <button onClick={handleNextLevel} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg animate-bounce">
              NEXT LEVEL <ArrowRight className="inline ml-2"/>
            </button>
          ) : (
            <div className="flex gap-3 w-full">
              <button onClick={() => { setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-100 py-5 rounded-[1.5rem] font-black text-gray-400 text-xs">RESET</button>
              <button onClick={removeLastLetter} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2 shadow-xl">
                <Delete size={20}/> BACKSPACE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
