import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, Download } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const fourWordDatabase = [
  { word: 'BIG RED FIRE TRUCK', category: 'VEHICLES', type: 'Phrase' },
  { word: 'DEEP BLUE OCEAN WATER', category: 'NATURE', type: 'Phrase' },
  { word: 'SPRING SUMMER FALL WINTER', category: 'SEASON', type: 'Normal' }
];

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
  
  // 광고 관련 상태
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [adClickCount, setAdClickCount] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const matchedWordsRef = useRef(new Set());
  const audioCtxRef = useRef(null);

  // --- Orientation Lock ---
  useEffect(() => {
    if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
       window.screen.orientation.lock('portrait').catch(e => console.log('Orientation lock failed:', e));
    }
  }, []);

  // --- Install Prompt Listener ---
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    });
  };

  // --- 오디오 재생 ---
  const playSound = useCallback(async (type) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'wordSuccess') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'allSuccess') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.08); o.start(ctx.currentTime + i*0.08); o.stop(ctx.currentTime + 0.4);
        });
      } else if (type === 'reward') {
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.05, ctx.currentTime + i*0.1); o.start(ctx.currentTime + i*0.1); o.stop(ctx.currentTime + i*0.1 + 0.3);
        });
      }
    } catch (e) {}
  }, []);

  // --- 데이터 보존 로직 ---
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

  // --- 광고 쿨타임 및 제한 로직 ---
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const savedDate = localStorage.getItem('ad-click-date');
    const savedCount = Number(localStorage.getItem('ad-click-count')) || 0;
    const lastClickTime = Number(localStorage.getItem('ad-last-click-time')) || 0;

    if (savedDate !== today) {
      localStorage.setItem('ad-click-date', today);
      localStorage.setItem('ad-click-count', '0');
      setAdClickCount(0);
    } else {
      setAdClickCount(savedCount);
    }

    const checkCooldown = () => {
      const now = Date.now();
      const diff = now - lastClickTime;
      if (diff < 5 * 60 * 1000) {
        setIsAdVisible(false);
        setTimeout(() => setIsAdVisible(true), (5 * 60 * 1000) - diff);
      }
    };
    checkCooldown();
  }, []);

  // --- 새로운 단어 불러오기 ---
  const loadNewWord = useCallback(() => {
    let dbPool = [];
    let forceNormal = false;
    const rand = Math.random() * 100;

    if (level <= 5) dbPool = wordDatabase;
    else if (level <= 10) dbPool = (level % 2 === 0) ? twoWordDatabase : wordDatabase;
    else if (level <= 20) { dbPool = twoWordDatabase; forceNormal = true; }
    else if (level < 100) {
      if (rand < 20) dbPool = wordDatabase;
      else if (rand < 80) dbPool = twoWordDatabase;
      else dbPool = threeWordDatabase;
    } else if (level <= 105) { dbPool = threeWordDatabase; forceNormal = true; }
    else if (level < 501) {
      if (rand < 20) dbPool = wordDatabase;
      else if (rand < 60) dbPool = twoWordDatabase;
      else dbPool = threeWordDatabase;
    } else {
      if (rand < 10) dbPool = wordDatabase;
      else if (rand < 30) dbPool = twoWordDatabase;
      else if (rand < 90) dbPool = threeWordDatabase;
      else dbPool = fourWordDatabase;
    }

    let available = dbPool.filter(item => !usedWordIds.includes(item.word));
    if (forceNormal) available = available.filter(i => i.type === 'Normal');
    
    if (available.length === 0) {
      setUsedWordIds([]);
      available = dbPool;
    }

    const sel = available[Math.floor(Math.random() * available.length)];
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

  // --- 힌트 & 광고 핸들러 ---
  const handleHint = () => {
    playSound('click');
    if (isCorrect || hintLevel >= 2) return;
    if (hintLevel === 0 && score >= 100) { setScore(s => s - 100); setHintLevel(1); }
    else if (hintLevel === 1 && score >= 200) { setScore(s => s - 200); setHintLevel(2); }
    else { setMessage("Not enough points!"); setTimeout(() => setMessage(''), 2000); }
  };

  const handleRewardAd = () => {
    if (adClickCount >= 20) return;
    playSound('click');
    setIsAdLoading(true);
    setIsAdVisible(false);
    setTimeout(() => {
      const newCount = adClickCount + 1;
      setAdClickCount(newCount);
      setScore(s => s + 200);
      setIsAdLoading(false);
      localStorage.setItem('ad-click-count', newCount.toString());
      localStorage.setItem('ad-last-click-time', Date.now().toString());
      playSound('reward'); 
      setMessage('+200P Reward!');
      setTimeout(() => setMessage(''), 2000);
      if (newCount < 20) setTimeout(() => setIsAdVisible(true), 5 * 60 * 1000);
    }, 2500);
  };

  const hintDisplay = useMemo(() => {
    if (hintLevel === 0 || !currentWord) return null;
    const words = currentWord.split(/\s+/);
    return `Hints: ${words.map(w => {
      const f = w[0].toUpperCase();
      const l = w[w.length-1].toUpperCase();
      return hintLevel === 1 ? `${f}...` : (w.length > 1 ? `${f}...${l}` : f);
    }).join(' / ')}`;
  }, [currentWord, hintLevel]);

  // --- 렌더링 로직 (Refactored) ---
  const targetWords = useMemo(() => currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0), [currentWord]);
  
  const { solvedComponents, inputStreamComponent, allMatched } = useMemo(() => {
    let tempSelected = [...selectedLetters];
    let matchedCount = 0;
    let usedInMatch = new Set();
    const solvedWordsData = [];

    // 1. Identify Matches
    targetWords.forEach((target, idx) => {
      let matchInfo = null;
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        if (slice.map(l => l.char).join('').toLowerCase() === target) {
          matchInfo = slice;
          slice.forEach(l => usedInMatch.add(l.id));
          matchedCount++;
          if (!matchedWordsRef.current.has(idx)) {
            matchedWordsRef.current.add(idx); playSound('wordSuccess');
          }
          break;
        }
      }

      if (matchInfo) {
        solvedWordsData.push({ idx, target, chars: matchInfo });
      }
    });

    // 2. Render Solved Words (Each on a new line/block)
    const solved = solvedWordsData.map((item) => (
      <div key={item.idx} className="flex flex-col items-center mb-2 w-full">
        <div className="flex gap-1 items-center justify-center min-h-[32px]">
          {item.chars.map(l => (
            <span key={l.id} className="text-2xl font-black text-green-500">
              {l.char.toUpperCase()}
            </span>
          ))}
          <span className="text-green-500 ml-1">✓</span>
        </div>
        <div className="h-1 rounded-full mt-0.5 bg-green-400 w-full" />
      </div>
    ));

    // 3. Render Input Stream (Remaining letters, continuous, no breaks)
    const remaining = selectedLetters.filter(l => !usedInMatch.has(l.id));
    const inputStream = (
      <div className="flex flex-wrap justify-center gap-1 min-h-[32px]">
        {remaining.map(l => (
          <span key={l.id} className="text-2xl font-black text-indigo-600">
            {l.char.toUpperCase()}
          </span>
        ))}
      </div>
    );

    return { 
      solvedComponents: solved,
      inputStreamComponent: inputStream,
      allMatched: matchedCount === targetWords.length && selectedLetters.length === currentWord.replace(/\s/g, '').length 
    };
  }, [selectedLetters, targetWords, currentWord, playSound]);

  useEffect(() => {
    if (allMatched && !isCorrect && currentWord) {
      setIsCorrect(true); playSound('allSuccess');
    }
  }, [allMatched, isCorrect, currentWord, playSound]);

  const processNextLevel = () => {
    playSound('click');
    setUsedWordIds(p => [...p, currentWord]);
    setScore(s => s + 50);
    setLevel(l => l + 1);
    setCurrentWord('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        <div className="w-full flex justify-between items-center mb-4 font-black text-indigo-600">
          <span>LEVEL {level}</span>
          <span className="flex items-center gap-1"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <div className="text-center mb-6">
          <div className="flex gap-2 justify-center mb-1">
            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{targetWords.length} Words</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${wordType === 'Phrase' ? 'bg-pink-100 text-pink-600' : 'bg-green-100 text-green-600'}`}>{wordType}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">{category}</h2>
          {hintDisplay && <div className="text-indigo-500 font-bold text-xs h-4">{hintDisplay}</div>}
        </div>

        <div className="w-full space-y-2 mb-6">
          <div className="flex gap-2 w-full">
            <button onClick={handleHint} disabled={isCorrect || hintLevel >= 2} className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm">
              <Lightbulb size={12}/> {hintLevel === 0 ? 'Hint 1' : hintLevel === 1 ? 'Hint 2' : 'No More'}
            </button>
            <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm">
              <RotateCcw size={12}/> Shuffle
            </button>
          </div>

          {deferredPrompt && (
            <button onClick={handleInstallClick} className="w-full px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95 shadow-sm">
              <Download size={14}/> INSTALL APP
            </button>
          )}

          {isAdVisible && adClickCount < 20 ? (
            <button onClick={handleRewardAd} className="w-full px-4 py-2.5 bg-amber-400 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95">
              <PlayCircle size={14}/> {isAdLoading ? 'WATCHING...' : `GET FREE +200P (${adClickCount}/20)`}
            </button>
          ) : (
            <div className="w-full py-2 text-center text-[9px] text-gray-400 font-bold italic bg-gray-50 rounded-lg">
              {adClickCount >= 20 ? "Daily limit reached" : "Next reward in 5 mins"}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-10 h-10 bg-white border-2 border-gray-100 rounded-xl font-black text-lg active:scale-90 shadow-sm">{l.char.toUpperCase()}</button>
          ))}
        </div>

        <div className={`w-full min-h-[120px] rounded-[1.5rem] flex flex-col justify-center items-center p-4 mb-6 border-2 border-dashed ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest text-center">Tap letters below</span> :
            <div className="w-full flex flex-col items-center">
              {solvedComponents}
              {inputStreamComponent}
            </div>
          }
          {(isCorrect || message) && <div className="text-green-500 font-black mt-2 text-xs animate-bounce">{message || 'CORRECT!'}</div>}
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={processNextLevel} className="w-full bg-green-500 text-white py-4 rounded-[1.5rem] font-black text-xl shadow-lg flex items-center justify-center gap-2">NEXT LEVEL <ArrowRight size={24}/></button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-50 py-4 rounded-xl font-black text-gray-400 border border-gray-100 text-[10px] uppercase">Reset</button>
              <button onClick={() => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } }} className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 shadow-xl"><Delete size={20}/> BACK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
