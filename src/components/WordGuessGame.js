import React, { useState, useEffect, useRef } from 'react';
import { saveProgress } from '../firebase'; // Firebase로 변경
import { Mail, X, LogIn, ArrowLeft } from 'lucide-react'; // 아이콘 변경

// Hooks
import { useSound } from '../hooks/useSound';
import { useAuthSystem } from '../hooks/useAuthSystem';
import { useGameLogic } from '../hooks/useGameLogic';
import { useAppVersion } from '../hooks/useAppVersion'; 

// SEO
import { Helmet } from 'react-helmet-async';

// Components
import SyncConflictModal from './SyncConflictModal';
import GameHeader from './GameHeader';
import GameControls from './GameControls';
import AnswerBoard from './AnswerBoard';

const CURRENT_VERSION = '1.5.1'; // 버전 업

const WordGuessGame = () => {
  const isUpdating = useAppVersion(CURRENT_VERSION);

  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  
  const levelRef = useRef(level);
  const scoreRef = useRef(score);
  useEffect(() => { levelRef.current = level; scoreRef.current = score; }, [level, score]);

  const playSound = useSound();
  
  // Auth Hook (Firebase 버전)
  const auth = useAuthSystem(playSound, levelRef, scoreRef, setLevel, setScore);
  const game = useGameLogic(playSound, level, score, setScore, auth.setMessage);

  // ★ 기존의 이메일/OTP 관련 state 다 지움 (필요 없음)
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [adClickCount, setAdClickCount] = useState(() => Number(localStorage.getItem('ad-click-count')) || 0);
  const [adCooldown, setAdCooldown] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdVisible] = useState(true);

  // PWA & 광고 초기화 (기존 동일)
  useEffect(() => {
    const handleInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleInstall);
    
    const today = new Date().toLocaleDateString();
    if (localStorage.getItem('ad-click-date') !== today) { localStorage.setItem('ad-click-date', today); setAdClickCount(0); }
    
    const lastClickTime = Number(localStorage.getItem('ad-last-click-time')) || 0;
    const diffSeconds = Math.floor((Date.now() - lastClickTime) / 1000);
    const cooldownTime = 10 * 60; 

    if (diffSeconds < cooldownTime) setAdCooldown(cooldownTime - diffSeconds);
    
    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  // 타이머 작동 (기존 동일)
  useEffect(() => {
    if (adCooldown > 0) {
      const timer = setInterval(() => {
        setAdCooldown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adCooldown]);

  // 자동 저장 (Firebase)
  useEffect(() => {
    localStorage.setItem('word-game-level', level); 
    localStorage.setItem('word-game-score', score);
    // 로그인 되어있고 충돌상태가 아닐 때만 자동 저장
    if (auth.isOnline && auth.user && !auth.conflictData) { 
        const timer = setTimeout(() => saveProgress(auth.user.uid, level, score, auth.user.email), 2000); 
        return () => clearTimeout(timer); 
    }
  }, [level, score, auth.isOnline, auth.user, auth.conflictData]);

  // 광고 보상 핸들러 (기존 동일)
  const handleRewardAd = () => {
    if (!auth.isOnline) { auth.setMessage("Need Internet for Ads"); return; }
    if (adClickCount >= 10) return;
    playSound('click'); setIsAdLoading(true); 
    setTimeout(async () => {
      const newScore = scoreRef.current + 200; setScore(newScore); setAdClickCount(c => c + 1); setIsAdLoading(false); 
      localStorage.setItem('ad-click-count', (adClickCount + 1).toString()); 
      localStorage.setItem('ad-last-click-time', Date.now().toString());
      setAdCooldown(600); playSound('reward'); auth.setMessage('+200P Reward!'); setTimeout(() => auth.setMessage(''), 2000);
      if (auth.isOnline && auth.user) await saveProgress(auth.user.uid, levelRef.current, newScore, auth.user.email);
    }, 2500);
  };

  const processNextLevel = async () => {
    playSound('click');
    const nextLevel = levelRef.current + 1; const nextScore = scoreRef.current + 50;
    setScore(nextScore); setLevel(nextLevel);
    game.setCurrentWord(''); game.setSolvedWords([]); 
    if (auth.isOnline && auth.user) await saveProgress(auth.user.uid, nextLevel, nextScore, auth.user.email);
  };

  // 업데이트 로딩
  if (isUpdating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black">UPDATING GAME...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      
      <Helmet>
        <title>{`Word Master - Level ${level} (영어 단어 퍼즐)`}</title>
        <meta name="description" content={`Word Master Level ${level} 도전 중!`} />
        <meta property="og:title" content={`🧠 Word Master - Lv.${level} 도전!`} />
        <meta property="og:image" content="https://word-master9.vercel.app/og-image.png" />
      </Helmet>

      {/* 데이터 충돌 해결 모달 */}
      <SyncConflictModal conflictData={auth.conflictData} currentLevel={level} currentScore={score} onResolve={auth.handleResolveConflict} />

      {/* ★ [변경] 로그인 모달: 구글 로그인 버튼만 깔끔하게 표시 */}
      {auth.showLoginModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2">
                    <LogIn size={24}/> LOGIN
                  </h3>
                  <button onClick={() => auth.setShowLoginModal(false)}><X size={24}/></button>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-xl mb-6 border border-indigo-100 text-center">
                    <p className="text-sm text-gray-600 font-bold mb-1">Save your progress ☁️</p>
                    <p className="text-xs text-gray-500">Log in to sync across devices.</p>
                </div>

                {/* 구글 로그인 버튼 */}
                <button 
                  onClick={auth.handleGoogleLogin} 
                  className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Sign in with Google
                </button>
            </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-4 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        <GameHeader level={level} score={score} user={auth.user} isOnline={auth.isOnline} onLogin={() => auth.setShowLoginModal(true)} onLogout={auth.handleLogout} showInstallBtn={!!deferredPrompt} onInstall={() => deferredPrompt?.prompt()} />
        <GameControls 
            category={game.category} wordType={game.wordType} wordCountDisplay={`${game.currentWord.split(/\s+/).length} WORDS`}
            hintMessage={game.hintMessage} isCorrect={game.isCorrect} hintStage={game.hintStage}
            hintButtonText={game.hintStage === 0 ? '1ST LETTER (100P)' : game.hintStage === 1 ? '1ST & LAST (200P)' : game.hintStage === 2 ? 'SHOW STRUCTURE (300P)' : 'FLASH ANSWER (500P)'}
            onHint={game.handleHint} onShuffle={game.handleShuffle} 
            isAdVisible={isAdVisible} isAdLoading={isAdLoading} adClickCount={adClickCount} onRewardAd={handleRewardAd} isOnline={auth.isOnline} 
            adCooldown={adCooldown} 
            scrambledLetters={game.scrambledLetters} onLetterClick={game.handleLetterClick} onReset={game.handleReset} onBackspace={game.handleBackspace} onNextLevel={processNextLevel}
        >
            <AnswerBoard currentWord={game.currentWord} solvedWords={game.solvedWords} selectedLetters={game.selectedLetters} isCorrect={game.isCorrect} isFlashing={game.isFlashing} hintStage={game.hintStage} message={auth.message} />
        </GameControls>
      </div>

      {level === 1 && (
        <footer className="mt-8 text-center max-w-md mx-auto opacity-20 text-indigo-100 selection:bg-transparent pointer-events-none">
          <h1 className="text-[10px] font-bold mb-1">Word Master</h1>
          <p className="text-[8px] px-4 mb-2">Improve your English vocabulary with 1000+ levels.</p>
          <div className="flex justify-center gap-3 text-[8px] pointer-events-auto">
             <a href="/privacy.html" target="_blank" rel="noreferrer" className="hover:text-white underline">Privacy Policy</a>
             <span>•</span>
             <a href="/terms.html" target="_blank" rel="noreferrer" className="hover:text-white underline">Terms of Service</a>
          </div>
        </footer>
      )}
    </div>
  );
};
export default WordGuessGame;
