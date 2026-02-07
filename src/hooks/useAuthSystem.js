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
    
    // [중요] 비교 전 확실하게 숫자로 변환
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

  // 4. 액션 핸들러들
  const handleResolveConflict = async (choice) => {
    playSound('click'); 
    if (!conflictData || !user) return;
    
    if (choice === 'server') {
      // [서버 데이터 선택 시]
      // 1. 로컬 스토리지에 확실하게 저장 (숫자로 변환)
      const newLevel = Number(conflictData.level);
      const newScore = Number(conflictData.score);
      
      localStorage.setItem('word-game-level', newLevel); 
      localStorage.setItem('word-game-score', newScore);
      
      setMessage('LOADED SERVER DATA!');
      
      // [핵심 수정] 서버 데이터를 가져올 때는 "새로고침"을 해야 루프가 확실히 끊기고
      // 게임 단어(Word)도 해당 레벨에 맞게 다시 로딩됩니다.
      // (이때는 인터넷이 연결된 상태이므로 화면 깨짐 현상이 없습니다!)
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } else {
      // [내 기기 데이터 선택 시]
      // 서버에 내 데이터를 덮어씌움 (새로고침 필요 없음)
      await saveProgress(user.id, levelRef.current, scoreRef.current, user.email);
      setConflictData(null); 
      setMessage('SAVED LOCAL DATA!');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleLogout = async () => {
    playSound('click');
    try { 
        await logout(); 
        setUser(null); 
        setMessage('LOGGED OUT'); 
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
