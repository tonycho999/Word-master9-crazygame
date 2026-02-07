import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------
// [유지] 고객님의 주소와 키
// ----------------------------------------------------------------
const supabaseUrl = 'https://sfepjxhwlpisdpcdklwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZXBqeGh3bHBpc2RwY2RrbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjE3NjUsImV4cCI6MjA4NTg5Nzc2NX0.murbKE8QvK9Qe2tw1BF8_XJK7bG4QWEHjmbgoACONcY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 게임에서 사용할 기능들 ---

// 1. 로그인 (비상용 - 메인 화면의 모달이 주로 사용됨)
export const loginWithGoogle = async () => {
  const email = window.prompt("Enter email for Magic Link:");
  if (!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) alert(error.message);
  else alert("Check your email inbox!");
};

// 2. 로그아웃
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout Error:', error);
};

// 3. [디버깅 모드] 데이터 저장 함수
export const saveProgress = async (userId, level, score, email) => {
  console.log("🚀 [저장 시도] 데이터:", { userId, level, score, email });

  try {
    const updates = {
      userid: userId,    
      level: Number(level),
      score: Number(score),
      // updated_at: new Date(), // ★ 에러 방지를 위해 잠시 껐습니다. (DB에 컬럼 추가 후 주석 해제하세요)
    };

    if (email) {
      updates.email = email;
    }

    // DB에 저장 요청
    const { data, error } = await supabase
      .from('game_progress') 
      .upsert(updates, { onConflict: 'userid' })
      .select(); 

    // 에러 발생 시 알림
    if (error) {
      console.error("❌ [저장 실패] DB 에러:", error); 
      // 에러 메시지를 띄워서 원인을 파악합니다.
      alert("데이터 저장 실패!\n원인: " + error.message);
      throw error;
    }
    
    console.log("✅ [저장 성공] DB 응답:", data);

  } catch (error) {
    console.error("❌ [시스템 에러]:", error.message);
  }
};

// 4. 데이터 불러오기
export const loadProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('userid', userId)
      .maybeSingle(); 

    if (error) {
      console.error("불러오기 에러:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Load Error:', error.message);
    return null;
  }
};
