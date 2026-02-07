import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, logout, saveProgress, syncGameData } from '../supabase';

export const useAuthSystem = (playSound, levelRef, scoreRef, setLevel, setScore) => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [message, setMessage] = useState('');

  // 무한 루프 방지용 안전장치
  const isCheckingRef = useRef(false); 
  const hasCheckedRef = useRef(false); 

  // 1. 데이터 동기화 함수
  const checkDataConflict = useCallback(async (userId) => {
    if (isCheckingRef.current || hasCheckedRef.current || !navigator.onLine) return;

    isCheckingRef.current = true; 
    console.log("🔒 [Sync] DB 데이터 확인 시작");

    try {
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
            hasCheckedRef.current = true; 
        } else {
            hasCheckedRef.current = true; 
        }
    } catch (e) {
        console.error(e);
    } finally {
        isCheckingRef.current = false; 
    }
  }, [user, setLevel, setScore]); 

  // 2. 온라인 상태 감지
  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        hasCheckedRef.current = false; 
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
      if (session?.user) setUser(session.user);
    };
    initSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
             hasCheckedRef.current = false;
             setMessage('LOGIN SUCCESS!'); 
             setTimeout(() => setMessage(''), 2000); 
        }
      } else if (event === 'SIGNED_OUT') { 
          setUser(null); 
          hasCheckedRef.current = false; 
      }
    });
    return () => subscription.unsubscribe();
  }, []); 

  // 4. 유저 변경 시 체크
  useEffect(() => {
      if (user && !hasCheckedRef.current) {
          checkDataConflict(user.id);
      }
  }, [user, checkDataConflict]);

  // 5. 액션 핸들러들
  const handleResolveConflict = async (choice) => {
    playSound('click'); 
    if (!conflictData || !user) return;
    
    if (choice === 'server') {
      const newLevel = Number(conflictData.level);
      const newScore = Number(conflictData.score);

      setLevel(newLevel); 
      setScore(newScore);
      localStorage.setItem('word-game-level', newLevel); 
      localStorage.setItem('word-game-score', newScore);
      
      setMessage('LOADED SERVER DATA!');
      setConflictData(null); 
      hasCheckedRef.current = true; 
    } else {
      await saveProgress(user.id, levelRef.current, scoreRef.current, user.email);
      setConflictData(null); 
      hasCheckedRef.current = true; 
      setMessage('SAVED LOCAL DATA!');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  // ★ [핵심 수정] 로그아웃 시 데이터 초기화 (악용 방지)
  const handleLogout = async () => {
    playSound('click');
    try { 
        // 1. 서버 로그아웃
        await logout(); 
    } catch (e) { 
        console.error(e); 
    } finally {
        // 2. [중요] 내 폰의 점수 데이터를 1레벨/300점으로 강제 초기화
        localStorage.removeItem('word-game-level');
        localStorage.removeItem('word-game-score');
        
        // 3. 좀비 세션 방지 (로그인 토큰 삭제)
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('sb-')) localStorage.removeItem(key);
        });

        // 4. 화면 즉시 반영
        setUser(null);
        setLevel(1);
        setScore(300);
        hasCheckedRef.current = false;
        setMessage('RESET TO LV.1'); 
        
        // 5. 확실한 초기화를 위해 새로고침
        setTimeout(() => { 
            setMessage(''); 
            window.location.reload(); 
        }, 1000); 
    }
  };

  return {
    user, isOnline, showLoginModal, setShowLoginModal, conflictData, message, setMessage,
    handleResolveConflict, handleLogout
  };
};
