import React, { useState, useEffect, useRef } from 'react';
import { supabase, saveProgress } from '../supabase'; 
import { Mail, X, Send, Key, ArrowLeft } from 'lucide-react';

import { useSound } from '../hooks/useSound';
import { useAuthSystem } from '../hooks/useAuthSystem';
import { useGameLogic } from '../hooks/useGameLogic';

import SyncConflictModal from './SyncConflictModal';
import GameHeader from './GameHeader';
import GameControls from './GameControls';
import AnswerBoard from './AnswerBoard';

const CURRENT_VERSION = '1.4.3';

const WordGuessGame = () => {
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
  
  // ★ [수정] 광고 쿨타임 타이머 상태 추가
  const [adCooldown, setAdCooldown] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // 버전 체크 로직 (생략 - 기존 유지)
  useEffect(() => {
    const checkVersion = async () => {
      const savedVersion = localStorage.getItem('game-version');
      if (savedVersion && savedVersion !== CURRENT_VERSION) {
        if ('caches' in window) { try { const keys = await caches.keys(); await Promise.all(keys.map(key => caches.delete(key))); } catch (err) {} }
        if ('serviceWorker' in navigator) { const registrations = await navigator.serviceWorker.getRegistrations(); for (const registration of registrations) { await registration.unregister(); } }
        localStorage.setItem('game-version', CURRENT_VERSION);
        window.location.reload(true);
        return;
      }
      localStorage.setItem('game-version', CURRENT_VERSION);
    };
    checkVersion();
  }, []);

  // 자동 저장
  useEffect(() => {
    localStorage.setItem('word-game-level', level); 
    localStorage.setItem('word-game-score', score);
    if (auth.isOnline && auth.user && !auth.conflictData) { 
        const timer = setTimeout(() => saveProgress(auth.user.id, level, score, auth.user.email), 1000); 
        return () => clearTimeout(timer); 
    }
  }, [level, score, auth.isOnline, auth.user, auth.conflictData]);

  // PWA & 광고 쿨타임 초기화 로직
  useEffect(() => {
    const handleInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleInstall);
    
    const today = new Date().toLocaleDateString();
    if (localStorage.getItem('ad-click-date') !== today) { localStorage.setItem('ad-click-date', today); setAdClickCount(0); }
    
    // 남은 시간 계산
    const lastClickTime = Number(localStorage.getItem('ad-last-click-time')) || 0;
    const diffSeconds = Math.floor((Date.now() - lastClickTime) / 1000);
    const cooldownTime = 10 * 60; // 10분 (600초)

    if (diffSeconds < cooldownTime) {
      setAdCooldown(cooldownTime - diffSeconds);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  // ★ [추가] 타이머 작동 로직
  useEffect(() => {
    if (adCooldown > 0) {
      const timer = setInterval(() => {
        setAdCooldown(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adCooldown]);

  // [수정] 광고 보상 함수 (타이머 적용)
  const handleRewardAd = () => {
    if (!auth.isOnline) { auth.setMessage("Need Internet for Ads"); return; }
    if (adClickCount >= 10) return;
    
    playSound('click'); 
    setIsAdLoading(true);
    // 버튼을 숨기는 대신 로딩 중으로 변경
    
    setTimeout(async () => {
      const newScore = scoreRef.current + 200; 
      setScore(newScore); 
      setAdClickCount(c => c + 1); 
      setIsAdLoading(false);
      
      // 시간 저장 및 쿨타임 설정 (600초 = 10분)
      const now = Date.now();
      localStorage.setItem('ad-click-count', (adClickCount + 1).toString()); 
      localStorage.setItem('ad-last-click-time', now.toString());
      
      setAdCooldown(600); // ★ 10분 카운트 시작

      playSound('reward'); 
      auth.setMessage('+200P Reward!'); 
      setTimeout(() => auth.setMessage(''), 2000);
      
      if (auth.isOnline && auth.user) await saveProgress(auth.user.id, levelRef.current, newScore, auth.user.email);
    }, 2500);
  };

  const processNextLevel = async () => {
    playSound('click');
    const nextLevel = levelRef.current + 1; const nextScore = scoreRef.current + 50;
    setScore(nextScore); setLevel(nextLevel);
    game.setCurrentWord(''); 
    game.setSolvedWords([]); 
    if (auth.isOnline && auth.user) await saveProgress(auth.user.id, nextLevel, nextScore, auth.user.email);
  };

  // OTP ... (기존과 동일)
  const handleSendOtp = async (e) => { e.preventDefault(); if (!inputEmail.includes('@')) return auth.setMessage('Invalid Email'); setIsLoading(true); playSound('click'); const { error } = await supabase.auth.signInWithOtp({ email: inputEmail }); setIsLoading(false); if (error) { auth.setMessage(error.message.includes('rate limit') ? 'Wait a moment...' : 'Error sending code'); } else { setIsOtpSent(true); auth.setMessage('Code sent to email!'); } setTimeout(() => auth.setMessage(''), 3000); };
  const handleVerifyOtp = async (e) => { e.preventDefault(); if (otp.length < 6) return auth.setMessage('Enter 6 digits'); setIsLoading(true); playSound('click'); const { error } = await supabase.auth.verifyOtp({ email: inputEmail, token: otp, type: 'email' }); setIsLoading(false); if (error) { auth.setMessage('Wrong Code. Try again.'); } else { auth.setMessage('LOGIN SUCCESS!'); auth.setShowLoginModal(false); setIsOtpSent(false); setOtp(''); } setTimeout(() => auth.setMessage(''), 3000); };
  const closeLoginModal = () => { auth.setShowLoginModal(false); setIsOtpSent(false); setOtp(''); setInputEmail(''); };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Word Master", "applicationCategory": "GameApplication", "operatingSystem": "Any", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }, "description": "Free online English word guess puzzle game." }) }} />
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
            hintButtonText={game.hintStage === 0 ? '1ST LETTER (100P)' : game.hintStage === 1 ? '1ST & LAST (200P)' : game.hintStage === 2 ? 'SHOW SPACES (300P)' : 'FLASH ANSWER (500P)'}
            onHint={game.handleHint} onShuffle={game.handleShuffle} 
            isAdVisible={isAdVisible} isAdLoading={isAdLoading} adClickCount={adClickCount} onRewardAd={handleRewardAd} isOnline={auth.isOnline} 
            adCooldown={adCooldown} // ★ adCooldown 전달
            scrambledLetters={game.scrambledLetters} onLetterClick={game.handleLetterClick} onReset={game.handleReset} onBackspace={game.handleBackspace} onNextLevel={processNextLevel}
        >
            <AnswerBoard currentWord={game.currentWord} solvedWords={game.solvedWords} selectedLetters={game.selectedLetters} isCorrect={game.isCorrect} isFlashing={game.isFlashing} hintStage={game.hintStage} message={auth.message} />
        </GameControls>
      </div>

      {level === 1 && (
        <footer className="mt-8 text-center max-w-md mx-auto opacity-20 text-indigo-100 selection:bg-transparent pointer-events-none">
          <h1 className="text-[10px] font-bold mb-1">Word Master - Free Online English Word Guess Puzzle Game</h1>
          <div className="flex justify-center gap-2 text-[8px] font-medium mb-1"><h2>English Vocabulary Training</h2><span>•</span><h2>Brain Teasers & Logic Puzzles</h2><span>•</span><h2>Wordle Style Gameplay</h2></div>
          <p className="text-[8px] leading-tight px-4">Play the best free word puzzle game online. Guess the hidden words, improve your English vocabulary, and challenge your brain with 1000+ levels.</p>
        </footer>
      )}
    </div>
  );
};
export default WordGuessGame;
