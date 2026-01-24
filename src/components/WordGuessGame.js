import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 1. 상태 및 Refs ---
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
  const [hintLevel, setHintLevel] = useState(() => Number(localStorage.getItem('word-game-hint-level')) || 0);
  const [message, setMessage] = useState('');
  const [isAdLoading, setIsAdLoading] = useState(false);

  const matchedWordsRef = useRef(new Set());
  const audioCtxRef = useRef(null);

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
    localStorage.setItem('word-game-hint-level', hintLevel);
  }, [level, score, usedWordIds, currentWord, category, wordType, scrambledLetters, selectedLetters, hintLevel]);

  // --- 3. 효과음 엔진 (끊김 방지 재사용 패턴) ---
  const playSound = useCallback(async (type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'wordSuccess') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'allSuccess') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.08);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.08 + 0.3);
          o.start(ctx.currentTime + i*0.08); o.stop(ctx.currentTime + 0.4);
        });
      } else if (type === 'reward') {
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.05, ctx.currentTime + i*0.1);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.1 + 0.3);
          o.start(ctx.currentTime + i*0.1); o.stop(ctx.currentTime + i*0.1 + 0.3);
        });
      }
    } catch (e) { console.warn('Audio failed', e); }
  }, []);

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

  // --- 5. 핸들러 ---
  const handleHint = () => {
    playSound('click');
    if (isCorrect) return;
    if (hintLevel === 0 && score >= 100) {
      setScore(s => s - 100); setHintLevel(1);
    } else if (hintLevel === 1 && score >= 200) {
      setScore(s => s - 200); setHintLevel(2);
    } else {
      setMessage("Low points!"); setTimeout(() => setMessage(''), 2000);
    }
  };

  const hintDisplay = useMemo(() => {
    if (hintLevel === 0 || !currentWord) return null;
    const words = currentWord.split(/\s+/);
    const hintParts = words.map(word => {
      const first = word.charAt(0).toUpperCase();
      const last = word.charAt(word.length - 1).toUpperCase();
      if (hintLevel === 1) return `${first}...`;
      if (hintLevel === 2) return word.length > 1 ? `${first}...${last}` : first;
      return "";
    });
    return `Hints: ${hintParts.join(' / ')}`;
  }, [currentWord, hintLevel]);

  const handleRewardAd = () => {
    playSound('click');
    setIsAdLoading(true);
    setTimeout(() => {
      setScore(s => s + 200);
      setIsAdLoading(false);
      playSound('reward');
      setMessage('+200P Reward!');
      setTimeout(() => setMessage(''), 2000);
    }, 2500);
  };

  // --- 6. 실시간 로직 ---
  const targetWords = useMemo(() => currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0), [currentWord]);
  const wordCount = targetWords.length;

  const { renderedComponents, allMatched } = useMemo(() => {
    let tempSelected = [...selectedLetters];
    let matchedCount = 0;
    let usedInMatch = new Set();

    const wordResults = targetWords.map((target, idx) => {
      let matchInfo = null;
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        if (slice.map(l => l.char).join('').toLowerCase() === target) {
          matchInfo = { letters: slice };
          slice.forEach(l => usedInMatch.add(l.id));
          matchedCount++;
          if (!matchedWordsRef.current.has(idx)) {
            matchedWordsRef.current.add(idx); playSound('wordSuccess');
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
        <div key={`word-${idx}`} className="flex flex-col items-center mb-2 last:mb-0">
          <div className="flex gap-1 items-center flex-wrap justify-center min-h-[32px]">
            {displayLetters.map((l) => (
              <span key={l.id} className={`text-2xl font-black transition-all ${isWordMatch ? 'text-green-500' : 'text-indigo-600'}`}>
                {l.char.toUpperCase()}
              </span>
            ))}
            {isWordMatch && <span className="text-green-500 ml-1 font-bold text-lg">✓</span>}
          </div>
          <div className={`h-1 rounded-full mt-0.5 transition-all duration-500 ${isWordMatch ? 'bg-green-400 w-full' : 'bg-indigo-50 w-12'}`} />
        </div>
      );
    });

    return { 
      renderedComponents: components, 
      allMatched: matchedCount === targetWords.length && selectedLetters.length === currentWord.replace(/\s/g, '').length 
    };
  }, [selectedLetters, targetWords, currentWord, playSound]);

  useEffect(() => {
    if (allMatched && !isCorrect && currentWord) {
      setIsCorrect(true); playSound('allSuccess');
    }
  }, [allMatched, isCorrect, currentWord, playSound]);

  const processNextLevel = () => {
    playSound('click'); setScore(s => s + 50); setLevel(l => l + 1);
    setUsedWordIds(p => [...p, currentWord]); setCurrentWord('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans relative text-gray-900">
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto">
        <div className="w-full flex justify-between items-center mb-4 font-black text-indigo-600">
          <span className="text-lg">LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <div className="text-center mb-6">
          <div className="flex gap-2 justify-center mb-1">
            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{wordCount} {wordCount > 1 ? 'Words' : 'Word'}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${wordType === 'Phrase' ? 'bg-pink-100 text-pink-600' : 'bg-green-100 text-green-600'}`}>{wordType}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-1">{category}</h2>
          {hintDisplay && <div className="text-indigo-500 font-bold text-xs animate-pulse h-4">{hintDisplay}</div>}
        </div>

        {/* --- 버튼 섹션 --- */}
        <div className="w-full space-y-2 mb-6">
          <div className="flex gap-2 w-full">
            <button onClick={handleHint} disabled={isCorrect || hintLevel >= 2} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm disabled:opacity-40">
              <Lightbulb size={12}/> Hint {hintLevel + 1}
            </button>
            <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm">
              <RotateCcw size={12}/> Shuffle
            </button>
          </div>
          <button onClick={handleRewardAd} className="w-full px-4 py-2.5 bg-amber-400 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95 shadow-md">
            <PlayCircle size={14}/> {isAdLoading ? 'WATCHING...' : 'GET FREE +200P'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[50px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-10 h-10 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm hover:border-indigo-400 active:scale-90 transition-all">{l.char.toUpperCase()}</button>
          ))}
        </div>

        {/* --- 정답 공간 최적화 (폰트 축소, 패딩 축소) --- */}
        <div className={`w-full min-h-[120px] rounded-[1.5rem] flex flex-col justify-center items-center p-4 mb-6 border-2 border-dashed transition-all ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest text-center px-4">Tap letters below</span> : <div className="w-full">{renderedComponents}</div>}
          {(isCorrect || message) && <div className="text-green-500 font-black mt-2 text-xs tracking-widest animate-bounce">{message || 'CORRECT!'}</div>}
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={processNextLevel} className="w-full bg-green-500 text-white py-4 rounded-[1.5rem] font-black text-xl shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all">NEXT LEVEL <ArrowRight size={24}/></button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-50 py-4 rounded-xl font-black text-gray-400 border border-gray-100 uppercase text-[10px]">Reset</button>
              <button onClick={() => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } }} className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95"><Delete size={20}/> BACK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
