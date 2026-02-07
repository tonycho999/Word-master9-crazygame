import { useState, useEffect, useCallback } from 'react';
import { supabase, logout, saveProgress, syncGameData } from '../supabase';

export const useAuthSystem = (playSound, levelRef, scoreRef, setLevel, setScore) => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [message, setMessage] = useState('');

  // 1. 데이터 동기화 함수 (useEffect보다 위에 있어야 함)
  const checkDataConflict = useCallback(async (userId) => {
    if (!navigator.onLine) return;
    const currentLevel = Number(localStorage.getItem('word-game-level') || 1);
    const currentScore = Number(localStorage.getItem('word-game-score') || 300);
    
    const result = await syncGameData(userId, currentLevel, currentScore, user?.email);

    if (result.status === 'CONFLICT') {
      setConflictData({ ...result.serverData, type: 'level_mismatch' });
    } else if (result.status === 'UPDATE_LOCAL') {
      setLevel(result.serverData.level);
      setScore(result.serverData.score);
      localStorage.setItem('word-game-level', result.serverData.level);
      localStorage.setItem('word-game-score', result.serverData.score);
      console.log("⚡ 서버 데이터로 업데이트됨");
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
    
    return () => { 
        window.removeEventListener('online', handleOnline); 
        window.removeEventListener('offline', handleOffline); 
    };
  }, [user, checkDataConflict]);

  // 3. 로그인 상태 감지 (Auth Listener)
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

  // 4. 액션 핸들러들

  // ★ [수정됨] 충돌 해결 시 새로고침 없이 상태만 업데이트 (오프라인 화면 깨짐 방지)
  const handleResolveConflict = async (choice) => {
    playSound('click'); 
    if (!conflictData || !user) return;
    
    if (choice === 'server') {
      // 서버 데이터를 선택했을 때:
      // 1. 즉시 화면(State) 업데이트
      setLevel(conflictData.level); 
      setScore(conflictData.score);
      
      // 2. 로컬 저장소 업데이트
      localStorage.setItem('word-game-level', conflictData.level); 
      localStorage.setItem('word-game-score', conflictData.score);
      
      // 3. 모달 닫기 및 알림
      setConflictData(null); 
      setMessage('LOADED SERVER DATA!');
      
      // (중요) window.location.reload() 제거됨! -> 이제 화면 안 깨집니다.

    } else {
      // 내 데이터를 선택했을 때: 서버에 덮어쓰기
      await saveProgress(user.id, levelRef.current, scoreRef.current, user.email);
      setConflictData(null); 
      setMessage('SAVED LOCAL DATA!');
    }
    
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLogout = async () => {
    playSound('click');
    try { 
        await logout(); 
        setUser(null); 
        setMessage('LOGGED OUT'); 
        // 로그아웃은 확실한 초기화를 위해 새로고침 유지 (인터넷 연결 시 권장)
        setTimeout(() => { setMessage(''); window.location.reload(); }, 1000); 
    } catch (e) { 
        window.location.reload(); 
    }
  };

  return {
    user, isOnline, showLoginModal, setShowLoginModal, conflictData, message, setMessage,
    handleResolveConflict, handleLogout
  };
};
