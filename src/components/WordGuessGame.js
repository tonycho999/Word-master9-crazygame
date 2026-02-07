import React, { useState, useEffect, useRef } from 'react';
import { supabase, saveProgress } from '../supabase'; 
import { Mail, X, Send } from 'lucide-react';

// Hooks 임포트
import { useSound } from '../hooks/useSound';
import { useAuthSystem } from '../hooks/useAuthSystem';
import { useGameLogic } from '../hooks/useGameLogic';

// UI 컴포넌트
import SyncConflictModal from './SyncConflictModal';
import GameHeader from './GameHeader';
import GameControls from './GameControls';
import AnswerBoard from './AnswerBoard';

const CURRENT_VERSION = '1.3.9'; 

const WordGuessGame = () => {
  // [1] 기본 상태 (레벨, 점수는 메인에서 관리 - Source of Truth)
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  
  // Ref (비동기 처리용)
  const levelRef = useRef(level);
  const scoreRef = useRef(score);
  useEffect(() => { levelRef.current = level; scoreRef.current = score; }, [level, score]);

  // [2] 커스텀 훅 불러오기
  const playSound = useSound();
  const auth = useAuthSystem(playSound, levelRef, scoreRef, setLevel, setScore);
  const game = useGameLogic(playSound, level, score, setScore, auth.setMessage);

  // [3] 로컬 상태 (이메일 입력, 광고, PWA) - 간단한 건 여기에 둠
  const [inputEmail, setInputEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [adClickCount, setAdClickCount] = useState(() => Number(localStorage.getItem('ad-click-count')) || 0);
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [isAdLoading, setIsAdLoading] = useState(false);

  // 자동 저장 및 버전 관리
  useEffect(() => {
    localStorage.setItem('game-version', CURRENT_VERSION);
    localStorage.setItem('word-game-level', level); 
    localStorage.setItem('word-game-score', score);
    if (auth.isOnline && auth.user && !auth.conflictData) { 
        const timer = setTimeout(() => saveProgress(auth.user.id, level, score, auth.user.email), 1000); 
        return () => clearTimeout(timer); 
    }
  }, [level, score, auth.isOnline, auth.user, auth.conflictData]);

  // PWA & AD Cooldown
  useEffect(() => {
    const handleInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleInstall);
    const today = new Date().toLocaleDateString();
    if (localStorage.getItem('ad-click-date') !== today) { localStorage.setItem('ad-click-date', today); setAdClickCount(0); }
    const diff = Date.now() - (Number(localStorage.getItem('ad-last-click-time')) || 0);
    if (diff < 10 * 60 * 1000) { setIsAdVisible(false); setTimeout(() => setIsAdVisible(true), (10 * 60 * 1000) - diff); }
    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  // [4] 메인 액션들 (광고, 다음 레벨)
  const handleRewardAd = () => {
    if (!auth.isOnline) { auth.setMessage("Need Internet for Ads"); return; }
    if (adClickCount >= 10) return;
    playSound('click'); setIsAdLoading(true); setIsAdVisible(false);
    setTimeout(async () => {
      const newScore = scoreRef.current + 200; setScore(newScore); setAdClickCount(c => c + 1); setIsAdLoading(false);
      localStorage.setItem('ad-click-count', (adClickCount + 1).toString()); localStorage.setItem('ad-last-click-time', Date.now().toString());
      playSound('reward'); auth.setMessage('+200P Reward!'); setTimeout(() => auth.setMessage(''), 2000);
      if (auth.isOnline && auth.user) await saveProgress(auth.user.id, levelRef.current, newScore, auth.user.email);
      if (adClickCount + 1 < 10) setTimeout(() => setIsAdVisible(true), 10 * 60 * 1000);
    }, 2500);
  };

  const processNextLevel = async () => {
    playSound('click');
    const nextLevel = levelRef.current + 1; const nextScore = scoreRef.current + 50;
    setScore(nextScore); setLevel(nextLevel);
    game.setCurrentWord(''); game.setSolvedWordsData([]);
    if (auth.isOnline && auth.user) await saveProgress(auth.user.id, nextLevel, nextScore, auth.user.email);
  };

  const sendMagicLink = async (e) => {
    e.preventDefault(); if (!inputEmail.includes('@')) return auth.setMessage('Invalid Email');
    setIsSendingEmail(true); playSound('click');
    const { error } = await supabase.auth.signInWithOtp({ email: inputEmail, options: { emailRedirectTo: window.location.origin } });
    setIsSendingEmail(false);
    if (error) auth.setMessage(error.message.includes('rate limit') ? 'Too many requests' : 'Error');
    else { auth.setMessage('Check your email!'); auth.setShowLoginModal(false); }
    setTimeout(() => auth.setMessage(''), 3000);
  };

  // --- [5] 렌더링 ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans text-gray-900 select-none relative">
      <SyncConflictModal conflictData={auth.conflictData} currentLevel={level} currentScore={score} onResolve={auth.handleResolveConflict} />

      {auth.showLoginModal && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Mail size={24}/> LOGIN</h3><button onClick={() => auth.setShowLoginModal(false)}><X size={24}/></button></div>
                  <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
                      <input type="email" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 bg-indigo-50" required />
                      <button type="submit" disabled={isSendingEmail} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black">{isSendingEmail ? 'SENDING...' : 'SEND MAGIC LINK'}</button>
                  </form>
              </div>
          </div>
      )}

      <div className="bg-white rounded-[2rem] p-4 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        <GameHeader level={level} score={score} user={auth.user} isOnline={auth.isOnline} onLogin={() => auth.setShowLoginModal(true)} onLogout={auth.handleLogout} showInstallBtn={!!deferredPrompt} onInstall={() => deferredPrompt?.prompt()} />
        <GameControls 
            category={game.category} wordType={game.wordType} wordCountDisplay={`${game.currentWord.split(/\s+/).length} WORDS`}
            hintMessage={game.hintMessage} isCorrect={game.isCorrect} hintStage={game.hintStage} hintButtonText={game.hintStage === 0 ? '1ST LETTER (100P)' : game.hintStage === 1 ? '1ST & LAST (200P)' : game.hintStage === 2 ? 'SHOW SPACES (300P)' : 'FLASH ANSWER (500P)'}
            onHint={game.handleHint} onShuffle={game.handleShuffle} isAdVisible={isAdVisible} isAdLoading={isAdLoading} adClickCount={adClickCount} onRewardAd={handleRewardAd} isOnline={auth.isOnline}
            scrambledLetters={game.scrambledLetters} onLetterClick={game.handleLetterClick} onReset={game.handleReset} onBackspace={game.handleBackspace} onNextLevel={processNextLevel}
        >
            <AnswerBoard currentWord={game.currentWord} solvedWordsData={game.solvedWordsData} selectedLetters={game.selectedLetters} isCorrect={game.isCorrect} isFlashing={game.isFlashing} hintStage={game.hintStage} message={auth.message} />
        </GameControls>
      </div>
    </div>
  );
};
export default WordGuessGame;
