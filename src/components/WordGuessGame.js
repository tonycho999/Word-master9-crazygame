import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, RefreshCcw, LogIn, LogOut } from 'lucide-react';
import { supabase, loginWithGoogle, logout, saveProgress, loadProgress } from '../supabase';
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase, fiveWordDatabase, LEVEL_CONFIG } from '../data/wordDatabase';

const WordGuessGame = () => {
  // --- 상태 관리 ---
  const [user, setUser] = useState(null); 

  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [wordType, setWordType] = useState(() => localStorage.getItem('word-game-word-type') || 'Normal');
  
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-scrambled')) || []; } catch { return []; }
  });
  const [selectedLetters, setSelectedLetters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-selected')) || []; } catch { return []; }
  });

  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(() => Number(localStorage.getItem('word-game-hint-level')) || 0);
  const [message, setMessage] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [completedWordCount, setCompletedWordCount] = useState(0);

  const [isAdVisible, setIsAdVisible] = useState(true);
  const [adClickCount, setAdClickCount] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const matchedWordsRef = useRef(new Set());
  const audioCtxRef = useRef(null);

  // --- 사운드 ---
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
      } else if (type === 'flash') { 
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'allSuccess') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.08); o.start(ctx.currentTime + i*0.08); o.stop(ctx.currentTime + 0.4);
        });
      } else if (type === 'partialSuccess') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'reward') {
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.05, ctx.currentTime + i*0.1); o.start(ctx.currentTime + i*0.1); o.stop(ctx.currentTime + i*0.1 + 0.3);
        });
      }
    } catch (e) {}
  }, []);

  // --- 로그인 체크 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) syncData(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) syncData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncData = async (userId) => {
      const data = await loadProgress(userId);
      if (data) {
          const localLevel = Number(localStorage.getItem('word-game-level') || 1);
          if (data.level > localLevel) {
              setLevel(data.level);
              setScore(data.score);
              setMessage('DATA LOADED!');
              setTimeout(() => setMessage(''), 2000);
          }
      }
  };

  const handleLogin = async () => { playSound('click'); await loginWithGoogle(); };
  const handleLogout = async () => { playSound('click'); await logout(); setUser(null); setMessage('LOGGED OUT'); setTimeout(() => setMessage(''), 1500); };

  // --- 데이터 저장 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters));
    localStorage.setItem('word-game-hint-level', hintLevel);
    
    // (자동 저장은 백업용으로 유지)
    if (user) {
        const timer = setTimeout(() => { saveProgress(user.id, level, score); }, 1000);
        return () => clearTimeout(timer);
    }
  }, [level, score, currentWord, category, wordType, scrambledLetters, selectedLetters, hintLevel, user]);

  // --- 광고 쿨타임 ---
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
        if (diff < 10 * 60 * 1000) {
            setIsAdVisible(false);
            setTimeout(() => setIsAdVisible(true), (10 * 60 * 1000) - diff);
        }
    };
    checkCooldown();
  }, []);

  // --- 단어 로드 ---
  const loadNewWord = useCallback(() => {
    const config = (LEVEL_CONFIG && LEVEL_CONFIG.find(c => level <= c.maxLevel)) 
                   || (LEVEL_CONFIG ? LEVEL_CONFIG[LEVEL_CONFIG.length - 1] : { probs: { 1: 100 } });
    const rand = Math.random() * 100;
    let cumProb = 0;
    let targetWordCount = 1;
    for (const [count, prob] of Object.entries(config.probs)) {
        cumProb += prob;
        if (rand < cumProb) { targetWordCount = Number(count); break; }
    }
    let targetPool = wordDatabase;
    if (targetWordCount === 2) targetPool = twoWordDatabase;
    else if (targetWordCount === 3) targetPool = threeWordDatabase;
    else if (targetWordCount === 4) targetPool = fourWordDatabase;
    else if (targetWordCount === 5) targetPool = fiveWordDatabase;
    if (!targetPool || targetPool.length === 0) targetPool = wordDatabase;

    const magicNumber = 17; 
    const fixedIndex = ((level * magicNumber)) % targetPool.length;
    const selectedPick = targetPool[fixedIndex] || wordDatabase[0];

    setCurrentWord(selectedPick.word);
    setCategory(selectedPick.category);
    setWordType(selectedPick.type ? selectedPick.type.toUpperCase() : 'NORMAL');

    const wordStr = selectedPick.word;
    const chars = wordStr.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}-${Math.random()}` 
    })).sort(() => Math.random() - 0.5);

    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setHintLevel(0);
    setIsFlashing(false);
    setMessage('');
    setCompletedWordCount(0);
    matchedWordsRef.current = new Set();
  }, [level]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  const wordCountDisplay = useMemo(() => {
    if (!currentWord) return '';
    const count = currentWord.trim().split(/\s+/).length;
    return `${count} WORD${count > 1 ? 'S' : ''}`; 
  }, [currentWord]);

  // --- 버튼 핸들러 ---
  const handleHint = () => {
    playSound('click');
    if (isCorrect) return;
    if (hintLevel === 0) { if (score >= 100) { setScore(s => s - 100); setHintLevel(1); } else { setMessage("Need 100 Points!"); setTimeout(() => setMessage(''), 1500); } }
    else if (hintLevel === 1) { if (score >= 150) { setScore(s => s - 150); setHintLevel(2); } else { setMessage("Need 150 Points!"); setTimeout(() => setMessage(''), 1500); } }
    else if (hintLevel >= 2) { if (score >= 200) { setScore(s => s - 200); setIsFlashing(true); playSound('flash'); setTimeout(() => { setIsFlashing(false); }, 500); } else { setMessage("Need 200 Points!"); setTimeout(() => setMessage(''), 1500); } }
  };
  const hintDisplay = useMemo(() => {
    if (hintLevel === 0 || !currentWord) return null;
    const words = currentWord.split(/\s+/);
    return words.map(word => {
        const first = word.charAt(0).toUpperCase();
        const last = word.charAt(word.length - 1).toUpperCase();
        if (hintLevel === 1) return `${first}...`;
        if (hintLevel >= 2) return word.length > 1 ? `${first}...${last}` : first;
        return "";
    }).join(' / ');
  }, [currentWord, hintLevel]);

  const handleShuffle = () => { playSound('click'); setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5)); };
  const handleRewardAd = () => {
    if (adClickCount >= 10) return;
    playSound('click'); setIsAdLoading(true); setIsAdVisible(false);
    setTimeout(() => {
      const newCount = adClickCount + 1;
      setAdClickCount(newCount); setScore(s => s + 200); setIsAdLoading(false);
      localStorage.setItem('ad-click-count', newCount.toString());
      localStorage.setItem('ad-last-click-time', Date.now().toString());
      playSound('reward'); setMessage('+200P Reward!'); setTimeout(() => setMessage(''), 2000);
      if (newCount < 10) setTimeout(() => setIsAdVisible(true), 10 * 60 * 1000);
    }, 2500);
  };
  const handleLetterClick = (letter) => { playSound('click'); setSelectedLetters(prev => [...prev, letter]); setScrambledLetters(prev => prev.filter(l => l.id !== letter.id)); };
  const handleReset = () => { playSound('click'); setScrambledLetters(prev => [...prev, ...selectedLetters]); setSelectedLetters([]); };
  const handleBackspace = () => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(prev => prev.slice(0, -1)); setScrambledLetters(prev => [...prev, last]); } };

  const processNextLevel = async () => {
    playSound('click');
    const nextLevel = level + 1;
    const nextScore = score + 50;

    setScore(nextScore);
    setLevel(nextLevel);
    setCurrentWord('');

    if (user) {
        await saveProgress(user.id, nextLevel, nextScore);
        console.log("DB 저장 완료");
    }
  };

  // --- 정답 체크 ---
  useEffect(() => {
    if (!currentWord) return;
    const words = currentWord.split(' ');
    let currentCheckIndex = 0; let matchedCount = 0;
    words.forEach(word => {
        const wordLen = word.length;
        const enteredChunk = selectedLetters.slice(currentCheckIndex, currentCheckIndex + wordLen);
        const enteredStr = enteredChunk.map(l => l.char).join('').toLowerCase();
        if (enteredStr === word.toLowerCase()) matchedCount++;
        currentCheckIndex += wordLen;
    });
    if (matchedCount > completedWordCount) {
        if (matchedCount < words.length) { playSound('partialSuccess'); setMessage('NICE!'); setTimeout(() => setMessage(''), 1000); }
    }
    setCompletedWordCount(matchedCount);
    const targetClean = currentWord.replace(/\s/g, '').toLowerCase();
    const selectedClean = selectedLetters.map(l => l.char).join('').toLowerCase();
    if (targetClean.length > 0 && targetClean === selectedClean) {
        if (!isCorrect) { setIsCorrect(true); playSound('allSuccess'); }
    } else { setIsCorrect(false); }
  }, [selectedLetters, currentWord, isCorrect, playSound, completedWordCount]);

  // --- [수정된 부분] 렌더링 로직 ---
  const renderedAnswerArea = useMemo(() => {
    if (isFlashing) {
         return (
             <div className="flex flex-col gap-3 items-center w-full animate-pulse">
                {currentWord.split(' ').map((word, wIdx) => (
                    <div key={wIdx} className="flex gap-1 justify-center flex-wrap">
                        {word.split('').map((char, cIdx) => (
                           <div key={cIdx} className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-amber-500 bg-amber-50 text-amber-600 rounded-t-lg flex items-center justify-center text-2xl font-black">
                                {char.toUpperCase()}
                           </div>
                        ))}
                    </div>
                ))}
             </div>
         );
    }
    const words = currentWord.split(' ');
    let letterIndex = 0;

    // [핵심] 정답이 아닐 때(!isCorrect)는 flex-wrap으로 가로 배치, 정답일 때는 flex-col로 세로(단어별) 배치
    const containerClass = isCorrect 
      ? "flex flex-col gap-3 w-full items-center" 
      : "flex flex-wrap gap-3 md:gap-5 w-full justify-center items-center";

    return (
      <div className={containerClass}>
        {words.map((word, wIdx) => {
           const wordLen = word.length;
           const wordLetters = selectedLetters.slice(letterIndex, letterIndex + wordLen);
           letterIndex += wordLen;
           const isThisWordComplete = wordLetters.map(l => l.char).join('').toLowerCase() === word.toLowerCase();
           
           return (
             <div key={wIdx} className="flex gap-2 justify-center flex-wrap min-h-[50px]">
                {wordLetters.map((l, idx) => (
                    <div key={l.id} className={`w-10 h-12 sm:w-12 sm:h-14 border-b-4 rounded-t-lg flex items-center justify-center text-2xl font-black transition-all duration-200 -translate-y-1 ${isCorrect ? '!border-green-500 !bg-green-50 !text-green-600' : isThisWordComplete ? 'border-green-400 bg-green-50 text-green-600' : 'border-indigo-600 bg-indigo-50 text-indigo-800'}`}>
                      {l.char.toUpperCase()}
                    </div>
                ))}
             </div>
           );
        })}
        {selectedLetters.length === 0 && ( <span className="text-gray-300 text-xs font-bold tracking-widest animate-pulse uppercase mt-2">Tap letters to answer</span> )}
      </div>
    );
  }, [currentWord, selectedLetters, isCorrect, isFlashing]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none">
      <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 min-h-[600px]">
        {/* 상단 */}
        <div className="w-full flex justify-between items-center mb-2 font-black text-indigo-600">
          <span className="text-lg">LEVEL {level}</span>
          <div className="flex items-center gap-3">
             {user ? (
                <button onClick={handleLogout} className="text-[10px] bg-red-100 text-red-500 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-200"><LogOut size={12}/> OUT</button>
             ) : (
                <button onClick={handleLogin} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-200 animate-pulse"><LogIn size={12}/> SAVE</button>
             )}
             <span className="flex items-center gap-1"><Trophy size={18} className="text-yellow-500"/> {score}</span>
          </div>
        </div>
        {/* 카테고리 */}
        <div className="text-center mb-5 w-full">
           <div className="flex justify-center gap-2 mb-2">
             <span className="py-1 px-3 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-widest">{wordCountDisplay}</span>
             <span className={`py-1 px-3 text-[10px] font-black rounded-full uppercase tracking-widest ${wordType === 'PHRASE' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>{wordType}</span>
           </div>
           <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">{category}</h2>
           {hintLevel > 0 && ( <div className="text-indigo-500 font-bold text-lg mt-2 tracking-widest animate-bounce bg-indigo-50 py-1 px-4 rounded-lg inline-block">{hintDisplay}</div> )}
        </div>
        {/* 기능 버튼 */}
        <div className="flex gap-3 w-full mb-3">
            <button onClick={handleHint} disabled={isCorrect} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black flex items-center justify-center gap-1 uppercase hover:bg-gray-200 active:scale-95 transition-all"><Lightbulb size={14}/> {hintLevel === 0 ? 'HINT 1 (100P)' : hintLevel === 1 ? 'HINT 2 (150P)' : 'FLASH (200P)'}</button>
            <button onClick={handleShuffle} disabled={isCorrect} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black flex items-center justify-center gap-1 uppercase hover:bg-gray-200 active:scale-95 disabled:opacity-50 transition-all"><RotateCcw size={14}/> SHUFFLE</button>
        </div>
        {/* 광고 버튼 */}
        <div className="w-full mb-6">
           {isAdVisible && adClickCount < 10 ? (
            <button onClick={handleRewardAd} className="w-full py-3 bg-amber-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 active:scale-95 shadow-md hover:bg-amber-500 transition-all"><PlayCircle size={16}/> {isAdLoading ? 'LOADING...' : `WATCH AD (+200P) (${adClickCount}/10)`}</button>
          ) : ( <div className="w-full py-2 text-center text-[10px] text-gray-400 font-bold italic bg-gray-50 rounded-lg">{adClickCount >= 10 ? "Daily limit reached (10/10)" : "Next reward in 10 mins"}</div> )}
        </div>
        {/* 알파벳 버튼 */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 min-h-[100px] content-start">
          {scrambledLetters.map(l => ( <button key={l.id} onClick={() => handleLetterClick(l)} className="w-11 h-11 bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-gray-100 rounded-lg font-black text-xl text-indigo-600 active:translate-y-1 active:shadow-none transition-all hover:border-indigo-300">{l.char.toUpperCase()}</button> ))}
          {scrambledLetters.length === 0 && !isCorrect && ( <div className="text-gray-300 text-xs font-bold italic py-4">All letters placed</div> )}
        </div>
        {/* 정답 */}
        <div className="w-full h-px bg-gray-100 mb-8 relative"> <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-300 text-[10px] font-bold">ANSWER</span> </div>
        <div className="w-full flex-grow flex flex-col justify-start items-center mb-6">
            {renderedAnswerArea}
            {(isCorrect || message) && ( <div className={`mt-4 font-black text-sm tracking-widest animate-bounce ${isCorrect ? 'text-green-500' : 'text-amber-500'}`}>{message || 'EXCELLENT!'}</div> )}
        </div>
        {/* 하단 컨트롤 */}
        <div className="w-full mt-auto pt-4 border-t border-gray-50">
          {isCorrect ? (
            <button onClick={processNextLevel} className="w-full py-4 bg-green-500 text-white rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-green-600 active:scale-95 transition-all">NEXT LEVEL <ArrowRight size={24}/></button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-4 bg-gray-200 text-gray-500 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-gray-300 active:scale-95 transition-all"><RefreshCcw size={18}/> RESET</button>
              <button onClick={handleBackspace} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"><Delete size={22}/> BACK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
