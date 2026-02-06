import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, RefreshCcw, LogIn, LogOut, Save, Server, Smartphone } from 'lucide-react';
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
  const [hintStage, setHintStage] = useState(() => Number(localStorage.getItem('word-game-hint-stage')) || 0);
  const [message, setMessage] = useState('');
  const [hintMessage, setHintMessage] = useState(''); // 상단에 띄울 힌트 텍스트
  const [isFlashing, setIsFlashing] = useState(false);
  
  // [NEW] 데이터 충돌 해결용 상태
  const [conflictData, setConflictData] = useState(null); // { level, score, date... }

  const [isAdVisible, setIsAdVisible] = useState(true);
  const [adClickCount, setAdClickCount] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

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
      } else if (type === 'reward') {
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.05, ctx.currentTime + i*0.1); o.start(ctx.currentTime + i*0.1); o.stop(ctx.currentTime + i*0.1 + 0.3);
        });
      }
    } catch (e) {}
  }, []);

  // --- 로그인 및 데이터 싱크 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkDataConflict(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkDataConflict(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // [NEW] 데이터 충돌 체크 함수
  const checkDataConflict = async (userId) => {
      const dbData = await loadProgress(userId);
      if (dbData) {
          const localLevel = Number(localStorage.getItem('word-game-level') || 1);
          // 서버 데이터와 로컬 레벨이 다르면 선택창 띄우기
          if (dbData.level !== localLevel) {
              setConflictData(dbData); // 모달 오픈
          } else {
              // 같으면 그냥 점수만 최신화 (높은 쪽으로)
              if (dbData.score > score) setScore(dbData.score);
          }
      }
  };

  // [NEW] 데이터 선택 핸들러 (서버 vs 로컬)
  const handleResolveConflict = async (choice) => {
    playSound('click');
    if (!conflictData || !user) return;

    if (choice === 'server') {
        // 서버 데이터 선택 -> 로컬 덮어쓰기 & 단어 리로드
        setLevel(conflictData.level);
        setScore(conflictData.score);
        localStorage.setItem('word-game-level', conflictData.level);
        localStorage.setItem('word-game-score', conflictData.score);
        // 레벨이 바뀌었으니 단어 강제 리셋
        setCurrentWord(''); 
        setConflictData(null);
        setMessage('LOADED SERVER DATA!');
    } else {
        // 로컬 데이터 선택 -> 서버 덮어쓰기
        await saveProgress(user.id, level, score);
        setConflictData(null);
        setMessage('SAVED LOCAL DATA!');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLogin = async () => { playSound('click'); await loginWithGoogle(); };
  const handleLogout = async () => { playSound('click'); await logout(); setUser(null); setMessage('LOGGED OUT'); setTimeout(() => setMessage(''), 1500); };

  // --- 저장 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters));
    localStorage.setItem('word-game-hint-stage', hintStage);
    
    // 자동 저장 (충돌 해결 중일 땐 저장 안 함)
    if (user && !conflictData) {
        const timer = setTimeout(() => { saveProgress(user.id, level, score); }, 1000);
        return () => clearTimeout(timer);
    }
  }, [level, score, currentWord, category, wordType, scrambledLetters, selectedLetters, hintStage, user, conflictData]);

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
    setHintStage(0);
    setHintMessage('');
    setIsFlashing(false);
    setMessage('');
  }, [level]);

  // currentWord가 비어있으면(초기 or 레벨변경 시) 로드
  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  const wordCountDisplay = useMemo(() => {
    if (!currentWord) return '';
    const count = currentWord.trim().split(/\s+/).length;
    return `${count} WORD${count > 1 ? 'S' : ''}`; 
  }, [currentWord]);

  // --- [NEW] 힌트 로직 개편 ---
  const handleHint = () => {
    playSound('click');
    if (isCorrect) return;

    const cleanWord = currentWord.replace(/\s/g, ''); // 공백 제거한 전체 문자열

    if (hintStage === 0) {
        // 1단계: 첫 글자 (100P)
        if (score >= 100) { 
            setScore(s => s - 100); 
            setHintStage(1); 
            setHintMessage(`FIRST LETTER: ${cleanWord[0].toUpperCase()}`);
        } else { setMessage("Need 100 Points!"); setTimeout(() => setMessage(''), 1500); }
    } 
    else if (hintStage === 1) {
        // 2단계: 끝 글자 추가 (200P)
        if (score >= 200) { 
            setScore(s => s - 200); 
            setHintStage(2); 
            setHintMessage(`FIRST: ${cleanWord[0].toUpperCase()} / LAST: ${cleanWord[cleanWord.length-1].toUpperCase()}`);
        } else { setMessage("Need 200 Points!"); setTimeout(() => setMessage(''), 1500); }
    } 
    else if (hintStage === 2) {
        // 3단계: 자리수(빈칸) 보여주기 (300P)
        if (score >= 300) { 
            setScore(s => s - 300); 
            setHintStage(3); 
            setMessage("WORD STRUCTURE REVEALED!");
            setTimeout(() => setMessage(''), 1500);
        } else { setMessage("Need 300 Points!"); setTimeout(() => setMessage(''), 1500); }
    }
    else if (hintStage >= 3) {
        // 4단계: 정답 0.5초 보여주기 (500P)
        if (score >= 500) { 
            setScore(s => s - 500); 
            setIsFlashing(true); 
            playSound('flash'); 
            setTimeout(() => { setIsFlashing(false); }, 500); 
        } else { setMessage("Need 500 Points!"); setTimeout(() => setMessage(''), 1500); }
    }
  };

  const getHintButtonText = () => {
      if (hintStage === 0) return '1ST LETTER (100P)';
      if (hintStage === 1) return 'LAST LETTER (200P)';
      if (hintStage === 2) return 'SHOW SPACES (300P)';
      return 'FLASH ANSWER (500P)';
  };

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
    setCurrentWord(''); // 단어 리셋 -> useEffect에 의해 새 단어 로드됨

    if (user) {
        await saveProgress(user.id, nextLevel, nextScore);
    }
  };

  // --- 정답 체크 ---
  useEffect(() => {
    if (!currentWord) return;
    const targetClean = currentWord.replace(/\s/g, '').toLowerCase();
    const selectedClean = selectedLetters.map(l => l.char).join('').toLowerCase();
    
    if (targetClean.length > 0 && targetClean === selectedClean) {
        if (!isCorrect) { setIsCorrect(true); playSound('allSuccess'); }
    } else { setIsCorrect(false); }
  }, [selectedLetters, currentWord, isCorrect, playSound]);

  // --- 렌더링 로직 (완전 변경) ---
  const renderedAnswerArea = useMemo(() => {
    // 1. Flash 힌트 (정답 잠깐 보여주기)
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

    // [중요] 힌트 3단계(자리수 공개) 전에는 그냥 한 줄로 붙여서 보여줌
    // 자리수 유추 불가 (스페이스X, 줄바꿈X)
    if (!isCorrect && hintStage < 3) {
        return (
            <div className="flex flex-wrap gap-1 md:gap-2 w-full justify-center items-center min-h-[60px]">
                {selectedLetters.map((l) => (
                    <div key={l.id} className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-indigo-600 bg-indigo-50 text-indigo-800 rounded-t-lg flex items-center justify-center text-2xl font-black -translate-y-1">
                      {l.char.toUpperCase()}
                    </div>
                ))}
                {selectedLetters.length === 0 && ( 
                    <span className="text-gray-300 text-xs font-bold tracking-widest animate-pulse uppercase">TAP LETTERS</span> 
                )}
            </div>
        );
    }

    // 정답이거나, 힌트 3단계 이상이면 -> "단어별로 띄워서" 보여줌 (기존 방식)
    const words = currentWord.split(' ');
    let letterIndex = 0;

    const containerClass = "flex flex-col gap-3 w-full items-center"; // 단어별 줄바꿈 (구조 보여줌)

    return (
      <div className={containerClass}>
        {words.map((word, wIdx) => {
           const wordLen = word.length;
           const wordLetters = selectedLetters.slice(letterIndex, letterIndex + wordLen);
           
           // 아직 입력 안 된 빈칸(Placeholder) 보여주기 (힌트 3단계 이상일 때만)
           const emptySlots = [];
           if (!isCorrect && hintStage >= 3 && wordLetters.length < wordLen) {
               for(let i=0; i < (wordLen - wordLetters.length); i++) emptySlots.push(i);
           }

           letterIndex += wordLen;
           const isThisWordComplete = wordLetters.map(l => l.char).join('').toLowerCase() === word.toLowerCase();
           
           return (
             <div key={wIdx} className="flex gap-2 justify-center flex-wrap min-h-[50px]">
                {/* 입력된 글자 */}
                {wordLetters.map((l) => (
                    <div key={l.id} className={`w-10 h-12 sm:w-12 sm:h-14 border-b-4 rounded-t-lg flex items-center justify-center text-2xl font-black transition-all duration-200 -translate-y-1 ${isCorrect ? '!border-green-500 !bg-green-50 !text-green-600' : isThisWordComplete ? 'border-green-400 bg-green-50 text-green-600' : 'border-indigo-600 bg-indigo-50 text-indigo-800'}`}>
                      {l.char.toUpperCase()}
                    </div>
                ))}
                {/* 빈칸 (힌트 3단계 이상일 때만 보임) */}
                {emptySlots.map((_, idx) => (
                    <div key={`empty-${idx}`} className="w-10 h-12 sm:w-12 sm:h-14 border-b-4 border-gray-200 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    </div>
                ))}
             </div>
           );
        })}
      </div>
    );
  }, [currentWord, selectedLetters, isCorrect, isFlashing, hintStage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      
      {/* [NEW] 데이터 충돌 해결 모달 */}
      {conflictData && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-bounce">
                  <h3 className="text-xl font-black text-indigo-600 mb-2">SYNC CONFLICT</h3>
                  <p className="text-sm text-gray-600 mb-6 font-bold">Different levels found. Which one to keep?</p>
                  
                  <div className="flex flex-col gap-3">
                      <button onClick={() => handleResolveConflict('server')} className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600">
                          <Server size={20}/> 
                          <div className="flex flex-col items-start text-xs">
                              <span>LOAD SERVER SAVE</span>
                              <span className="text-indigo-200">LEVEL {conflictData.level} (Score {conflictData.score})</span>
                          </div>
                      </button>
                      <button onClick={() => handleResolveConflict('local')} className="w-full py-4 bg-gray-200 text-gray-600 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-gray-300">
                          <Smartphone size={20}/> 
                          <div className="flex flex-col items-start text-xs">
                              <span>KEEP CURRENT</span>
                              <span className="text-gray-500">LEVEL {level} (Score {score})</span>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

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
           {/* [NEW] 힌트 메시지 표시 영역 */}
           {hintMessage && (
               <div className="mt-2 py-1 px-3 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-lg animate-pulse inline-block border border-indigo-100">
                   {hintMessage}
               </div>
           )}
        </div>
        {/* 기능 버튼 */}
        <div className="flex gap-3 w-full mb-3">
            <button onClick={handleHint} disabled={isCorrect} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black flex items-center justify-center gap-1 uppercase hover:bg-gray-200 active:scale-95 transition-all"><Lightbulb size={14}/> {getHintButtonText()}</button>
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
        {/* 정답 영역 */}
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
