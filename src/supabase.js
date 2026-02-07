import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------
// [유지] 고객님의 주소와 키
// ----------------------------------------------------------------
const supabaseUrl = 'https://sfepjxhwlpisdpcdklwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZXBqeGh3bHBpc2RwY2RrbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjE3NjUsImV4cCI6MjA4NTg5Nzc2NX0.murbKE8QvK9Qe2tw1BF8_XJK7bG4QWEHjmbgoACONcY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 게임에서 사용할 기능들 ---

// 1. 로그인 (매직 링크 방식 - WordGuessGame.js에서 직접 호출하지만, 비상용으로 남겨둠)
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

// 3. [수정됨] 데이터 저장 (data 변수 제거하여 빌드 에러 해결)
export const saveProgress = async (userId, level, score, email) => {
  try {
    const updates = {
      userid: userId,    
      level: Number(level),
      score: Number(score),
      updated_at: new Date(),
    };

    if (email) {
      updates.email = email;
    }

    // [수정] 여기서 { data, error } 에서 data를 지웠습니다.
    const { error } = await supabase
      .from('game_progress') 
      .upsert(updates, { onConflict: 'userid' });

    if (error) throw error;
    
    console.log("DB 저장 성공:", updates);

  } catch (error) {
    console.error('Save Error:', error.message);
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

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Load Error:', error.message);
    return null;
  }
};
