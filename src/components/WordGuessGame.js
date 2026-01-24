import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 1. 상태 관리 (로컬 스토리지 연동) ---
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
  const [wordType, setWordType] = useState(() => localStorage.getItem('word-game-word-type') || 'Normal');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-scrambled');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedLetters, setSelectedLetters] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-selected');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [isAdLoading, setIsAdLoading] = useState(false);

  const matchedWordsRef = useRef(new Set());

  // --- 2. 데이터 영구 저장 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-ids', JSON.stringify(usedWordIds));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters));
  }, [level, score, usedWordIds, currentWord, category, wordType, scrambledLetters, selectedLetters]);

  // --- 3. 효과음 엔진 ---
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'wordSuccess') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'allSuccess') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(); o.connect(ctx.destination);
          o.frequency.value = f; o.start(ctx.currentTime + i*0.08); o.stop(ctx.currentTime + 0.4);
        });
      }
    } catch (e) {}
  };

  // --- 4. 단어 로드 ---
  const loadNewWord = useCallback(() => {
    let db = level <= 5 ? wordDatabase : (level <= 15 ? twoWordDatabase : threeWordDatabase);
    const preferPhrase = Math.random() < 0.5;
    let filtered = db.filter(i => !usedWordIds.includes(i.word) && (level <= 5 ? true : i.type === (preferPhrase ? 'Phrase' : 'Normal')));
    if (filtered.length === 0) filtered = db;

    const sel = filtered[Math.floor(Math.random() * filtered.length)];
    const chars = sel.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}-${Math.random()}` 
    })).sort(() => Math.random() - 0.5);

    setCurrentWord(sel.word);
    setCategory(sel.category);
    setWordType(sel.type || 'Normal');
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setHintLevel(0);
    setMessage('');
    matchedWordsRef.current = new Set();
  }, [level, usedWordIds]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  // --- 5. 힌트 기능 (완전 수정) ---
  const handleHint = () => {
    playSound('click');
    if (score < 100 || isCorrect || hintLevel > 0) return;

    // 공백을 제외한 정답의 첫 글자
    const targetChar = currentWord.replace(/\s/g, '').charAt(0).toUpperCase();
    
    // 섞인 글자들 중에서 해당 글자 찾기
    const foundIdx = scrambledLetters.findIndex(l => l.char.toUpperCase() === targetChar);

    if (foundIdx !== -1) {
      const hintLetter = scrambledLetters[foundIdx];
      
      // 1. 점수 차감 및 힌트 상태 변경
      setScore(s => s - 100);
      setHintLevel(1);

      // 2. 글자 이동 로직
      // 먼저 Reset 기능을 수행하여 모든 선택된 글자를 되돌린 후 힌트 글자를 첫 번째로 설정
      const allReturnedLetters = [...scrambledLetters, ...selectedLetters];
      const remainingAfterHint = allReturnedLetters.filter(l => l.id !== hintLetter.id);
      
      setSelectedLetters([hintLetter]); // 힌트 글자를 첫 번째로 강제 지정
      setScrambledLetters(remainingAfterHint); // 나머지는 다시 섞인 목록으로
    } else {
      setMessage("첫 글자가 이미 정답 칸에 있습니다!");
      setTimeout(() => setMessage(''), 2000);
    }
  };

  // --- 6. 실시간 로직 ---
  const targetWords = useMemo(() => 
    currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  , [currentWord]);

  const wordCount = targetWords.length;

  const { renderedComponents, allMatched } = useMemo(() => {
    let tempSelected = [...selectedLetters];
    let matchedCount = 0;
    let usedInMatch = new Set();

    const wordResults = targetWords.map((target, idx) => {
      let matchInfo = null;
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        const sliceText = slice.map(l => l.char).join('').toLowerCase();
        if (sliceText === target) {
          matchInfo = { letters: slice, isMatch: true };
          slice.forEach(l => usedInMatch.add(l.id));
          matchedCount++;
          if (!matchedWordsRef.current.has(idx)) {
            matchedWordsRef.current.add(idx);
            playSound('wordSuccess');
          }
          break;
        }
      }
      return { target, matchInfo };
    });

    let unmatchedLetters = selectedLetters.filter(l => !usedInMatch.has(l.id));

    const components = wordResults.map((res, idx) => {
      const isWordMatch = res.matchInfo !== null;
      const displayLetters = isWordMatch ? res.matchInfo.letters : unmatchedLetters.splice(0, res.target.length);
      return (
        <div key={`word-${idx}`} className="flex flex-col items-center mb-4 last:mb-0">
          <div className="flex gap-1 items-center flex-wrap justify-center min-h-[40px]">
            {displayLetters.map((l) => (
              <span key={l.id} className={`text-3xl font-black transition-all ${isWordMatch ? 'text-green-500 scale-110' : 'text-indigo-600'}`}>
                {l.char.toUpperCase()}
              </span>
            ))}
            {isWordMatch && <span className="text-green-500 ml-2 font-bold text-xl animate-bounce">✓</span>}
          </div>
          <div className={`h-1.5 rounded-full mt-1 transition-all duration-500 ${isWordMatch ? 'bg-green-400 w-full' : 'bg-indigo-100 w-16'}`} />
        </div>
      );
    });

    return { 
      renderedComponents: components, 
      allMatched: matchedCount === targetWords.length && selectedLetters.length === currentWord.replace(/\s/g, '').length 
    };
  }, [selectedLetters, targetWords, currentWord]);

  useEffect(() => {
    if (allMatched && !isCorrect && currentWord) {
      setIsCorrect(true);
      playSound('allSuccess');
      setMessage('EXCELLENT! 🎉');
    }
  }, [allMatched, isCorrect, currentWord]);

  const processNextLevel = () => {
    playSound('click');
    setScore(s => s + 50);
    setLevel(l => l + 1);
    setUsedWordIds(p => [...p, currentWord]);
    setCurrentWord('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans relative">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto">
        <div className="w-full flex justify-between items-center mb-6 font-black text-indigo-600">
          <span className="text-lg uppercase">LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex gap-2 justify-center mb-2">
            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{wordCount} {wordCount > 1 ? 'Words' : 'Word'}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${wordType === 'Phrase' ? 'bg-pink-100 text-pink-600' : 'bg-green-100 text-green-600'}`}>{wordType}</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">{category}</h2>
        </div>

        <div className="flex gap-2 mb-8">
          <button onClick={handleHint} disabled={score < 100 || hintLevel > 0 || isCorrect} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black flex items-center gap-1 uppercase active:scale-95 shadow-sm">
            <Lightbulb size={12}/> Hint (-100P)
          </button>
          <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black flex items-center gap-1 uppercase active:scale-95 shadow-sm">
            <RotateCcw size={12}/> Shuffle
          </button>
          <button onClick={() => { playSound('click'); setIsAdLoading(true); setTimeout(() => { setScore(s => s + 200); setIsAdLoading(false); playSound('allSuccess'); }, 3000); }} className="px-4 py-2 bg-amber-400 text-white rounded-full text-[10px] font-black flex items-center gap-1 active:scale-95 shadow-md">
            <PlayCircle size={12}/> {isAdLoading ? '...' : '+200P'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm hover:border-indigo-400 active:scale-90 transition-all">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={`w-full min-h-[160px] rounded-[2rem] flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed transition-all ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest animate-pulse">Select letters</span> : <div className="w-full">{renderedComponents}</div>}
          {(isCorrect || message) && <div className="text-green-500 font-black mt-4 text-xs tracking-widest animate-bounce">{message || 'EXCELLENT! 🎉'}</div>}
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={processNextLevel} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all">NEXT LEVEL <ArrowRight size={28}/></button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-50 py-5 rounded-[1.5rem] font-black text-gray-400 border border-gray-100 uppercase text-[10px]">Reset</button>
              <button onClick={() => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } }} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2 shadow-xl active:scale-95"><Delete size={22}/> BACK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
