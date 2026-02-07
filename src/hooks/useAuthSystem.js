import { useState, useEffect, useCallback } from 'react';
import { supabase, logout, saveProgress, syncGameData } from '../supabase';

export const useAuthSystem = (playSound, levelRef, scoreRef, setLevel, setScore) => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [message, setMessage] = useState('');

  // 1. 데이터 동기화 함수
  const checkDataConflict = useCallback(async (userId) => {
    if (!navigator.onLine) return;
    const currentLevel = Number(localStorage.getItem('word-game-level') || 1);
    const currentScore = Number(localStorage.getItem('word-game-score') || 300);
    
    // DB와 통신 (딱 한 번!)
    const result = await syncGameData(userId, currentLevel, currentScore, user?.email);

    if (result.status === 'CONFLICT') {
      setConflictData({ ...result.serverData, type: 'level_mismatch' });
    } else if (result.status === 'UPDATE_LOCAL') {
      // 충돌 없이 서버 데이터가 더 최신이면 조용히 업데이트
      setLevel(result.serverData.level);
      setScore(result.serverData.score);
      localStorage.setItem('word-game-level', result.serverData.level);
      localStorage.setItem('word-game-score', result.serverData.score);
      console.log("⚡ 서버 데이터로 자동 업데이트됨");
    }
  }, [user, setLevel, setScore]); 

  // 2. 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        setMessage('ONLINE: SYNCING...'); 
        setTimeout(() => setMessage(''), 2000); 
        if (user) checkDataConflict(user.id); 
    };
    const handleOffline = () => { setIsOnline(false); setMessage('OFFLINE MODE'); };
    window.addEventListener('online', handleOnline); 
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [user, checkDataConflict]);

  // 3. 로그인 상태 감지
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setUser(session.user); checkDataConflict(session.user.id); }
    };
    initSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setMessage('LOGIN SUCCESS!'); setTimeout(() => setMessage(''), 2000); checkDataConflict(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, [checkDataConflict]);

  // ★ [핵심 수정] 루프 제거: 새로고침(reload)을 하지 않고 상태만 업데이트
  const handleResolveConflict = async (choice) => {
    playSound('click'); 
    if (!conflictData || !user) return;
    
    if (choice === 'server') {
      // [서버 데이터 선택]
      const newLevel = Number(conflictData.level);
      const newScore = Number(conflictData.score);

      // 1. 상태 업데이트 (이러면 useGameLogic이 알아서 감지함)
      setLevel(newLevel); 
      setScore(newScore);
      
      // 2. 로컬 저장
      localStorage.setItem('word-game-level', newLevel); 
      localStorage.setItem('word-game-score', newScore);
      
      setMessage('LOADED SERVER DATA!');
      setConflictData(null); 
      
      // ★ window.location.reload() 삭제됨! 루프 해결!

    } else {
      // [내 기기 데이터 선택]
      await saveProgress(user.id, levelRef.current, scoreRef.current, user.email);
      setConflictData(null); 
      setMessage('SAVED LOCAL DATA!');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLogout = async () => {
    playSound('click');
    try { await logout(); setUser(null); setMessage('LOGGED OUT'); setTimeout(() => { setMessage(''); window.location.reload(); }, 1000); } 
    catch (e) { window.location.reload(); }
  };

  return {
    user, isOnline, showLoginModal, setShowLoginModal, conflictData, message, setMessage,
    handleResolveConflict, handleLogout
  };
};
