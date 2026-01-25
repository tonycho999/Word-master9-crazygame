import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallMessage, setShowIOSInstallMessage] = useState(false);
  const [adCooldown, setAdCooldown] = useState(0);
  const [adsWatched, setAdsWatched] = useState(0);

  const matchedWordsRef = useRef(new Set());
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastWatchedDate = localStorage.getItem('word-game-ad-date');
    if (lastWatchedDate === today) {
      setAdsWatched(Number(localStorage.getItem('word-game-ads-watched')) || 0);
    } else {
      localStorage.setItem('word-game-ad-date', today);
      localStorage.setItem('word-game-ads-watched', '0');
      setAdsWatched(0);
    }
  }, []);

  useEffect(() => {
    const cooldownTimer = setInterval(() => {
      const cooldownEnd = Number(localStorage.getItem('word-game-ad-cooldown') || 0);
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setAdCooldown(remaining);
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, []);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    if (isIOSDevice && !window.navigator.standalone) {
      setShowIOSInstallMessage(true);
    }
  }, []);

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

  const loadNewWord = useCallback(() => {
    let dbPool = [];
    let forceNormal = false;
    const rand = Math.random() * 100;

    // --- 레벨별 난이도 로직 적용 ---
    if (level <= 5) {
      dbPool = wordDatabase; // 1단어
    } else if (level <= 10) {
      dbPool = (level % 2 === 0) ? twoWordDatabase : wordDatabase; // 2단어, 1단어 번갈아
    } else if (level <= 20) {
      dbPool = twoWordDatabase; forceNormal = true; // 2단어 Normal Only
    } else if (level < 100) {
      if (rand < 20) dbPool = wordDatabase;
      else if (rand < 80) dbPool = twoWordDatabase;
      else dbPool = threeWordDatabase;
    } else if (level <= 105) {
      dbPool = threeWordDatabase; forceNormal = true; // 3단어 Normal Only
    } else if (level < 501) {
      if (rand < 20) dbPool = wordDatabase;
      else if (rand < 60) dbPool = twoWordDatabase;
      else dbPool = threeWordDatabase;
    } else {
      // 501레벨 이상 무제한
      if (rand < 10) dbPool = wordDatabase;
      else if (rand < 30) dbPool = twoWordDatabase;
      else if (rand < 90) dbPool = threeWordDatabase;
      else dbPool = fourWordDatabase; // 4단어 10%
    }

    let available = dbPool.filter(item => !usedWordIds.includes(item.word));
    if (forceNormal) available = available.filter(i => i.type === 'Normal');
    
    // 사용 가능한 단어가 없으면 리셋
    if (available.length === 0) {
      setUsedWordIds(prev => prev.filter(id => !dbPool.map(d => d.word).includes(id)));
      available = dbPool;
      if (forceNormal) available = available.filter(i => i.type === 'Normal');
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

  const handleHint = () => {
    playSound('click');
    if (isCorrect || hintLevel >= 3) return;
    if (score < 100) {
      setMessage("Not enough points!");
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    setScore(s => s - 100);
    setHintLevel(h => h + 1);
  };


  const hintDisplay = useMemo(() => {
    if (hintLevel === 0 || !currentWord) return null;
    const words = currentWord.split(/\s+/);
    const hintParts = words.map(word => {
      const first = word.charAt(0).toUpperCase();
      const last = word.charAt(word.length - 1).toUpperCase();
      if (hintLevel === 1) return `${first}...`;
      if (hintLevel === 2) return `${first}...${last}`;
      if (hintLevel === 3) return `${word.toUpperCase()} (${word.length})`;
      return "";
    });
    return `Hint: ${hintParts.join(' / ')}`;
  }, [currentWord, hintLevel]);

  const handleRewardAd = () => {
    if (adsWatched >= 10) return;
    playSound('click');
    setIsAdLoading(true);
    setTimeout(() => {
      setScore(s => s + 200);
      setIsAdLoading(false);
      playSound('reward');
      setMessage('+200P Reward!');
      const newAdsWatched = adsWatched + 1;
      localStorage.setItem('word-game-ads-watched', newAdsWatched);
      setAdsWatched(newAdsWatched);
      const cooldownEnd = Date.now() + 5 * 60 * 1000; // 5 minutes
      localStorage.setItem('word-game-ad-cooldown', cooldownEnd);
      setAdCooldown(300);
      setTimeout(() => setMessage(''), 2000);
    }, 2500);
  };

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
            {displayLetters.map((l, letterIdx) => (
              <span
                key={l.id}
                className={`text-2xl font-black transition-all ${
                  isWordMatch ? 'text-green-500' : 'text-indigo-600'
                }`}
              >
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
    playSound('click');
    setUsedWordIds(p => [...p, currentWord]);
    setScore(s => s + 50);
    setLevel(l => l + 1);
    setCurrentWord('');
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => {
        setInstallPrompt(null);
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans relative text-gray-900">
      {showIOSInstallMessage && (
        <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white text-center p-4 z-50">
          To install this game on your iPhone, tap the Share button and then 'Add to Home Screen'.
          <button onClick={() => setShowIOSInstallMessage(false)} className="absolute top-2 right-2 text-white font-bold">&times;</button>
        </div>
      )}
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto">
        {installPrompt && !isIOS && (
          <button
            onClick={handleInstallClick}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg animate-bounce"
          >
            INSTALL
          </button>
        )}
        <div className="w-full flex justify-between items-center mb-4 font-black text-indigo-600">
          <span className="text-lg uppercase">LEVEL {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <div className="text-center mb-6">
          <div className="flex gap-2 justify-center mb-1">
            <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{wordCount} {wordCount > 1 ? 'Words' : 'Word'}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${wordType === 'Phrase' ? 'bg-pink-100 text-pink-600' : 'bg-green-100 text-green-600'}`}>{wordType}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-1">{category}</h2>
          {hintDisplay && <div className="text-indigo-500 font-bold text-xs animate-pulse h-4 mt-1">{hintDisplay}</div>}
        </div>

        <div className="w-full space-y-2 mb-6">
          <div className="flex gap-2 w-full">
            <button
              onClick={handleHint}
              disabled={isCorrect || hintLevel >= 3 || score < 100}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm disabled:opacity-40"
            >
              <Lightbulb size={12} /> HINT {hintLevel + 1} (-100P)
            </button>
            <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 uppercase active:scale-95 shadow-sm">
              <RotateCcw size={12}/> Shuffle
            </button>
          </div>
          <button
            onClick={handleRewardAd}
            disabled={adCooldown > 0 || isAdLoading || adsWatched >= 10}
            className="w-full px-4 py-2.5 bg-amber-400 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle size={14} />
            {isAdLoading
              ? 'WATCHING...'
              : adCooldown > 0
              ? `WAIT ${Math.floor(adCooldown / 60)}:${(adCooldown % 60).toString().padStart(2, '0')}`
              : adsWatched >= 10
              ? 'DAILY LIMIT REACHED'
              : 'GET FREE +200P'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[50px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-10 h-10 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm hover:border-indigo-400 active:scale-90 transition-all">{l.char.toUpperCase()}</button>
          ))}
        </div>

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
