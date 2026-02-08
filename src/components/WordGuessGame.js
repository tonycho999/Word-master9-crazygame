import React, { useState, useEffect, useRef } from 'react';
import { supabase, saveProgress } from '../supabase'; 
import { Mail, X, Send, Key, ArrowLeft } from 'lucide-react';

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

// 버전 1.4.8
const CURRENT_VERSION = '1.4.8';

const WordGuessGame = () => {
  // [1] 버전 체크 (전용 훅 사용)
  const isUpdating = useAppVersion(CURRENT_VERSION);

  // [2] 기본 상태
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  
  const levelRef = useRef(level);
  const scoreRef = useRef(score);
  useEffect(() => { levelRef.current = level; scoreRef.current = score; }, [level, score]);

  const playSound = useSound();
  const auth = useAuthSystem(playSound, levelRef, scoreRef, setLevel, setScore);
  const game = useGameLogic(playSound, level, score, setScore, auth.setMessage);

  const [inputEmail, setInputEmail] = useState('');
  const [otp, setOtp] = useState(''); 
  const [isOtpSent, setIsOtpSent] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [adClickCount, setAdClickCount] = useState(() => Number(localStorage.getItem('ad-click-count')) || 0);
  const [adCooldown, setAdCooldown] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdVisible] = useState(true);

  // PWA & 광고 초기화
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

  // 타이머 작동
  useEffect(() => {
    if (adCooldown > 0) {
      const timer = setInterval(() => {
        setAdCooldown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adCooldown]);

  // 자동 저장
  useEffect(() => {
    localStorage.setItem('word-game-level', level); 
    localStorage.setItem('word-game-score', score);
    if (auth.isOnline && auth.user && !auth.conflictData) { 
        const timer = setTimeout(() => saveProgress(auth.user.id, level, score, auth.user.email), 1000); 
        return () => clearTimeout(timer); 
    }
  }, [level, score, auth.isOnline, auth.user, auth.conflictData]);

  // 핸들러들
  const handleRewardAd = () => {
    if (!auth.isOnline) { auth.setMessage("Need Internet for Ads"); return; }
    if (adClickCount >= 10) return;
    playSound('click'); setIsAdLoading(true); 
    setTimeout(async () => {
      const newScore = scoreRef.current + 200; setScore(newScore); setAdClickCount(c => c + 1); setIsAdLoading(false); 
      localStorage.setItem('ad-click-count', (adClickCount + 1).toString()); 
      localStorage.setItem('ad-last-click-time', Date.now().toString());
      setAdCooldown(600); playSound('reward'); auth.setMessage('+200P Reward!'); setTimeout(() => auth.setMessage(''), 2000);
      if (auth.isOnline && auth.user) await saveProgress(auth.user.id, levelRef.current, newScore, auth.user.email);
    }, 2500);
  };

  const processNextLevel = async () => {
    playSound('click');
    const nextLevel = levelRef.current + 1; const nextScore = scoreRef.current + 50;
    setScore(nextScore); setLevel(nextLevel);
    game.setCurrentWord(''); game.setSolvedWords([]); 
    if (auth.isOnline && auth.user) await saveProgress(auth.user.id, nextLevel, nextScore, auth.user.email);
  };

  const handleSendOtp = async (e) => { e.preventDefault(); if (!inputEmail.includes('@')) return auth.setMessage('Invalid Email'); setIsLoading(true); playSound('click'); const { error } = await supabase.auth.signInWithOtp({ email: inputEmail }); setIsLoading(false); if (error) { auth.setMessage(error.message.includes('rate limit') ? 'Wait a moment...' : 'Error sending code'); } else { setIsOtpSent(true); auth.setMessage('Code sent to email!'); } setTimeout(() => auth.setMessage(''), 3000); };
  const handleVerifyOtp = async (e) => { e.preventDefault(); if (otp.length < 6) return auth.setMessage('Enter 6 digits'); setIsLoading(true); playSound('click'); const { error } = await supabase.auth.verifyOtp({ email: inputEmail, token: otp, type: 'email' }); setIsLoading(false); if (error) { auth.setMessage('Wrong Code. Try again.'); } else { auth.setMessage('LOGIN SUCCESS!'); auth.setShowLoginModal(false); setIsOtpSent(false); setOtp(''); } setTimeout(() => auth.setMessage(''), 3000); };
  const closeLoginModal = () => { auth.setShowLoginModal(false); setIsOtpSent(false); setOtp(''); setInputEmail(''); };

  // 업데이트 로딩 화면
  if (isUpdating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black">UPDATING GAME...</h2>
        <p className="text-sm opacity-80 mt-2">Latest Version: v{CURRENT_VERSION}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      
      {/* ★ [수정] title 태그 내부를 문자열 템플릿으로 감싸서 에러 해결 */}
      <Helmet>
        <title>{`Word Master - Level ${level}`}</title>
        <meta name="description" content={`Level ${level} English Word Puzzle`} />
        <meta property="og:title" content={`Word Master - Lv.${level}`} />
      </Helmet>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "VideoGame", "name": "Word Master", "description": "Free English Word Puzzle", "genre": ["Puzzle", "Educational"], "playMode": "SinglePlayer", "applicationCategory": "Game", "operatingSystem": "Any", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }, "author": { "@type": "Person", "name": "Word Master Team" } }) }} />

      <SyncConflictModal conflictData={auth.conflictData} currentLevel={level} currentScore={score} onResolve={auth.handleResolveConflict} />

      {auth.showLoginModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-black text-indigo-600 flex items-center gap-2">{isOtpSent ? <Key size={24}/> : <Mail size={24}/>} {isOtpSent ? 'VERIFY CODE' : 'LOGIN'}</h3><button onClick={closeLoginModal}><X size={24}/></button></div>
                {!isOtpSent && (<div className="bg-indigo-50 p-3 rounded-xl mb-4 border border-indigo-100"><p className="text-xs text-indigo-800 font-bold leading-relaxed mb-1">⚠️ <span className="text-red-500">Log out resets device to Lv.1</span></p><p className="text-[10px] text-gray-500 font-medium leading-tight">Server data is safe. Log in to restore.</p></div>)}
                {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="flex flex-col gap-3"><input type="email" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 bg-white focus:border-indigo-500 outline-none font-bold text-indigo-900" required /><button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">{isLoading ? 'SENDING...' : 'SEND CODE'} <Send size={16}/></button></form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3"><p className="text-xs text-center text-gray-500 font-bold">Enter the 6-digit code sent to<br/><span className="text-indigo-600">{inputEmail}</span></p><input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="123456" className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 bg-white focus:border-indigo-500 outline-none font-black text-center text-2xl tracking-widest text-indigo-900" inputMode="numeric" autoFocus required /><button type="submit" disabled={isLoading} className="w-full py-3 bg-green-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50">{isLoading ? 'VERIFYING...' : 'VERIFY & LOGIN'} <Key size={16}/></button><button type="button" onClick={() => { setIsOtpSent(false); setOtp(''); }} className="text-xs text-gray-400 font-bold flex items-center justify-center gap-1 hover:text-gray-600 mt-2"><ArrowLeft size={12}/> Change Email</button></form>
                )}
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
          <p className="text-[8px] px-4">Improve your English vocabulary with 1000+ levels.</p>
        </footer>
      )}
    </div>
  );
};
export default WordGuessGame;
