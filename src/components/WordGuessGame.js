import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, loginWithGoogle, logout, saveProgress, loadProgress } from '../supabase';
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase, fiveWordDatabase, LEVEL_CONFIG } from '../data/wordDatabase';

// 분리된 컴포넌트 임포트
import SyncConflictModal from './SyncConflictModal';
import GameHeader from './GameHeader';
import GameControls from './GameControls';
import AnswerBoard from './AnswerBoard';

// [배포 버전]
const CURRENT_VERSION = '1.3.2'; 

const WordGuessGame = () => {
  // --- [1] 상태 관리 ---
  const [user, setUser] = useState(null); 
  const [isOnline, setIsOnline] = useState(navigator.onLine); 
  
  // [추가됨] 앱 설치 이벤트 저장용 상태
  const [deferredPrompt, setDeferredPrompt] = useState(null);

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
  const [solvedWordsData, setSolvedWordsData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-solved-data')) || []; } catch { return []; }
  });

  const [isCorrect, setIsCorrect] = useState(false);
  const [hintStage, setHintStage] = useState(() => Number(localStorage.getItem('word-game-hint-stage')) || 0);
  const [message, setMessage] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  
  const [hintMessage, setHintMessage] = useState(() => localStorage.getItem('word-game-hint-message') || ''); 
  
  const [conflictData, setConflictData] = useState(null); 
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [adClickCount, setAdClickCount] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const audioCtxRef = useRef(null);

  // 버전 체크
  useEffect(() => {
    const savedVersion = localStorage.getItem('game-version');
    if (savedVersion !== CURRENT_VERSION) {
        localStorage.setItem('game-version', CURRENT_VERSION);
    }
  }, []);

  // [추가됨] PWA 설치 가능 여부 감지
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // 1. 브라우저가 자동으로 설치 배너를 띄우지 않게 막음
      e.preventDefault();
      // 2. 나중에 버튼 누르면 실행하기 위해 이벤트를 저장해둠
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // [추가됨] 설치 버튼 클릭 핸들러
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // 설치 프롬프트 띄우기
    deferredPrompt.prompt();
    
    // 유저가 설치했는지 취소했는지 확인
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null); // 설치했으면 버튼 숨기기
    }
  };

  // --- [2] 사운드 ---
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
      } else if (type === 'partialSuccess') { 
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'allSuccess') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = f;
          g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.08); o.start(ctx.currentTime + i*0.08); o.stop(ctx.currentTime + i*0.1); 
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

  // --- [3] 데이터 동기화 및 인증 ---
  const checkDataConflict = useCallback(async (userId) => {
      if (!navigator.onLine) return;
      try {
          const dbData = await loadProgress(userId);
          if (dbData) {
              const localLevel = Number(localStorage.getItem('word-game-level') || 1);
              const localScore = Number(localStorage.getItem('word-game-score') || 300);
              if (dbData.level !== localLevel) {
                  setConflictData({ ...dbData, type: 'level_mismatch' }); 
              } else if (dbData.score > localScore) {
                   setScore(dbData.score);
                   localStorage.setItem('word-game-score', dbData.score);
              } else if (localScore > dbData.score) {
                  await saveProgress(userId, localLevel, localScore, user?.email);
              }
          }
      } catch (error) { console.error("Sync Check Failed:", error); }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setMessage('ONLINE: SYNCING...'); setTimeout(() => setMessage(''), 2000); if (user) checkDataConflict(user.id); };
    const handleOffline = () => { setIsOnline(false); setMessage('OFFLINE MODE'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [user, checkDataConflict]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); if (session?.user) checkDataConflict(session.user.id); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); if (session?.user) checkDataConflict(session.user.id); });
    return () => subscription.unsubscribe();
  }, [checkDataConflict]);

  const handleResolveConflict = async (choice) => {
    playSound('click'); if (!conflictData || !user) return;
    if (choice === 'server') {
        setLevel(conflictData.level); setScore(conflictData.score);
        localStorage.setItem('word-game-level', conflictData.level); localStorage.setItem('word-game-score', conflictData.score);
        setCurrentWord(''); setSolvedWordsData([]); setConflictData(null); setMessage('LOADED SERVER DATA!');
    } else {
        await saveProgress(user.id, level, score, user.email); setConflictData(null); setMessage('SAVED LOCAL DATA!');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLogin = async () => { if (!isOnline) { setMessage("OFFLINE: Can't Login"); setTimeout(() => setMessage(''), 1500); return; } playSound('click'); await loginWithGoogle(); };
  const handleLogout = async () => { playSound('click'); await logout(); setUser(null); setMessage('LOGGED OUT'); setTimeout(() => setMessage(''), 1500); };

  // --- [4] 자동 저장 및 광고 ---
  useEffect(() => {
    localStorage.setItem('word-game-level', level); localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-current-word', currentWord); localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType); localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters)); localStorage.setItem('word-game-solved-data', JSON.stringify(solvedWordsData));
    localStorage.setItem('word-game-hint-stage', hintStage); localStorage.setItem('word-game-hint-message', hintMessage);
    if (isOnline && user && !conflictData) { const timer = setTimeout(() => { saveProgress(user.id, level, score, user.email); }, 1000); return () => clearTimeout(timer); }
  }, [level, score, currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWordsData, hintStage, hintMessage, user, conflictData, isOnline]);

  useEffect(() => {
    const today = new Date().toLocaleDateString(); const savedDate = localStorage.getItem('ad-click-date');
    const savedCount = Number(localStorage.getItem('ad-click-count')) || 0; const lastClickTime = Number(localStorage.getItem('ad-last-click-time')) || 0;
    if (savedDate !== today) { localStorage.setItem('ad-click-date', today); localStorage.setItem('ad-click-count', '0'); setAdClickCount(0); } else { setAdClickCount(savedCount); }
    const checkCooldown = () => { const now = Date.now(); const diff = now - lastClickTime; if (diff < 10 * 60 * 1000) { setIsAdVisible(false); setTimeout(() => setIsAdVisible(true), (10 * 60 * 1000) - diff); } };
    checkCooldown();
  }, []);

  // --- [5] 게임 플레이 로직 ---
  const loadNewWord = useCallback(() => {
    const config = (LEVEL_CONFIG && LEVEL_CONFIG.find(c => level <= c.maxLevel)) || (LEVEL_CONFIG ? LEVEL_CONFIG[LEVEL_CONFIG.length - 1] : { probs: { 1: 100 } });
    const rand = Math.random() * 100; let cumProb = 0; let targetWordCount = 1;
    for (const [count, prob] of Object.entries(config.probs)) { cumProb += prob; if (rand < cumProb) { targetWordCount = Number(count); break; } }
    let targetPool = wordDatabase;
    if (targetWordCount === 2) targetPool = twoWordDatabase; else if (targetWordCount === 3) targetPool = threeWordDatabase; else if (targetWordCount === 4) targetPool = fourWordDatabase; else if (targetWordCount === 5) targetPool = fiveWordDatabase;
    if (!targetPool || targetPool.length === 0) targetPool = wordDatabase;
    const magicNumber = 17; const fixedIndex = ((level * magicNumber)) % targetPool.length; const selectedPick = targetPool[fixedIndex] || wordDatabase[0];
    setCurrentWord(selectedPick.word); setCategory(selectedPick.category); setWordType(selectedPick.type ? selectedPick.type.toUpperCase() : 'NORMAL');
    const wordStr = selectedPick.word; const chars = wordStr.replace(/\s/g, '').split('').map((char, i) => ({ char, id: `l-${Date.now()}-${i}-${Math.random()}` })).sort(() => Math.random() - 0.5);
    setScrambledLetters(chars); setSelectedLetters([]); setSolvedWordsData([]); setIsCorrect(false); setHintStage(0); setHintMessage(''); localStorage.removeItem('word-game-hint-message'); setIsFlashing(false); setMessage('');
  }, [level]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);
  const wordCountDisplay = useMemo(() => { if (!currentWord) return ''; const count = currentWord.trim().split(/\s+/).length; return `${count} WORD${count > 1 ? 'S' : ''}`; }, [currentWord]);
  const getHintButtonText = () => { if (hintStage === 0) return '1ST LETTER (100P)'; if (hintStage === 1) return '1ST & LAST (200P)'; if (hintStage === 2) return 'SHOW SPACES (300P)'; return 'FLASH ANSWER (500P)'; };
  const handleHint = async () => {
    playSound('click'); if (isCorrect) return; const words = currentWord.split(' '); let newScore = score;
    if (hintStage === 0) { if (score >= 100) { newScore -= 100; setScore(newScore); setHintStage(1); setHintMessage(`HINT: ${words.map(w => w[0].toUpperCase() + '...').join('  /  ')}`); if (isOnline && user) await saveProgress(user.id, level, newScore, user.email); } else { setMessage("Need 100 Points!"); setTimeout(() => setMessage(''), 1500); } } 
    else if (hintStage === 1) { if (score >= 200) { newScore -= 200; setScore(newScore); setHintStage(2); setHintMessage(`HINT: ${words.map(w => w.length > 1 ? w[0].toUpperCase() + '...' + w[w.length-1].toUpperCase() : w[0].toUpperCase()).join('  /  ')}`); if (isOnline && user) await saveProgress(user.id, level, newScore, user.email); } else { setMessage("Need 200 Points!"); setTimeout(() => setMessage(''), 1500); } } 
    else if (hintStage === 2) { if (score >= 300) { newScore -= 300; setScore(newScore); setHintStage(3); setMessage("WORD STRUCTURE REVEALED!"); setTimeout(() => setMessage(''), 1500); if (isOnline && user) await saveProgress(user.id, level, newScore, user.email); } else { setMessage("Need 300 Points!"); setTimeout(() => setMessage(''), 1500); } } 
    else if (hintStage >= 3) { if (score >= 500) { newScore -= 500; setScore(newScore); setIsFlashing(true); playSound('flash'); setTimeout(() => { setIsFlashing(false); }, 500); if (isOnline && user) await saveProgress(user.id, level, newScore, user.email); } else { setMessage("Need 500 Points!"); setTimeout(() => setMessage(''), 1500); } }
  };
  const handleShuffle = () => { playSound('click'); setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5)); };
  const handleRewardAd = () => {
    if (!isOnline) { setMessage("Need Internet for Ads"); setTimeout(() => setMessage(''), 1500); return; } if (adClickCount >= 10) return;
    playSound('click'); setIsAdLoading(true); setIsAdVisible(false);
    setTimeout(async () => {
      const newCount = adClickCount + 1; const newScore = score + 200; setAdClickCount(newCount); setScore(newScore); setIsAdLoading(false);
      localStorage.setItem('ad-click-count', newCount.toString()); localStorage.setItem('ad-last-click-time', Date.now().toString()); playSound('reward'); setMessage('+200P Reward!'); setTimeout(() => setMessage(''), 2000);
      if (isOnline && user) await saveProgress(user.id, level, newScore, user.email);
      if (newCount < 10) setTimeout(() => setIsAdVisible(true), 10 * 60 * 1000);
    }, 2500);
  };
  const handleLetterClick = (letter) => { playSound('click'); setSelectedLetters(prev => [...prev, letter]); setScrambledLetters(prev => prev.filter(l => l.id !== letter.id)); };
  const handleReset = () => { playSound('click'); setScrambledLetters(prev => [...prev, ...selectedLetters]); setSelectedLetters([]); };
  const handleBackspace = () => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(prev => prev.slice(0, -1)); setScrambledLetters(prev => [...prev, last]); } };
  const processNextLevel = async () => {
    playSound('click'); const nextLevel = level + 1; const nextScore = score + 50; setScore(nextScore); setLevel(nextLevel); setCurrentWord(''); setSolvedWordsData([]); 
    if (isOnline && user) await saveProgress(user.id, nextLevel, nextScore, user.email);
  };
  useEffect(() => {
    if (!currentWord) return; const enteredStr = selectedLetters.map(l => l.char).join('').toUpperCase(); const targetWords = currentWord.toUpperCase().split(' '); const alreadySolvedWords = solvedWordsData.map(data => data.word.toUpperCase());
    const matchIndex = targetWords.findIndex(word => word === enteredStr && !alreadySolvedWords.includes(word));
    if (matchIndex !== -1) { const matchedWord = targetWords[matchIndex]; const newSolvedData = [...solvedWordsData, { word: matchedWord, letters: [...selectedLetters] }]; setSolvedWordsData(newSolvedData); setSelectedLetters([]); playSound('partialSuccess'); if (newSolvedData.length === targetWords.length) { setIsCorrect(true); playSound('allSuccess'); } }
  }, [selectedLetters, currentWord, solvedWordsData, playSound]);

  // --- [6] 렌더링 ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      <SyncConflictModal conflictData={conflictData} currentLevel={level} currentScore={score} onResolve={handleResolveConflict} />
      <div className="bg-white rounded-[2rem] p-4 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        
        {/* GameHeader에 설치 버튼 관련 Props 전달 */}
        <GameHeader 
          level={level} score={score} user={user} isOnline={isOnline} 
          onLogin={handleLogin} onLogout={handleLogout}
          
          // [추가됨] 설치 버튼 표시 여부 및 핸들러
          showInstallBtn={!!deferredPrompt}
          onInstall={handleInstallClick}
        />

        <GameControls category={category} wordType={wordType} wordCountDisplay={wordCountDisplay} hintMessage={hintMessage} isCorrect={isCorrect} hintStage={hintStage} hintButtonText={getHintButtonText()} onHint={handleHint} onShuffle={handleShuffle} isAdVisible={isAdVisible} isAdLoading={isAdLoading} adClickCount={adClickCount} onRewardAd={handleRewardAd} isOnline={isOnline} scrambledLetters={scrambledLetters} onLetterClick={handleLetterClick} onReset={handleReset} onBackspace={handleBackspace} onNextLevel={processNextLevel}>
            <AnswerBoard currentWord={currentWord} solvedWordsData={solvedWordsData} selectedLetters={selectedLetters} isCorrect={isCorrect} isFlashing={isFlashing} hintStage={hintStage} message={message} />
        </GameControls>
      </div>
    </div>
  );
};
export default WordGuessGame;
