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
  // 현재는 메인 컴포넌트(WordGuessGame.js)에서 모달창으로 처리하므로 
  // 이 함수는 거의 사용되지 않지만, 호환성을 위해 남겨둡니다.
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

// 3. [최종 수정] 데이터 저장 (upsert 사용 + 이메일 저장 추가)
// 파라미터에 email을 추가했습니다.
export const saveProgress = async (userId, level, score, email) => {
  try {
    // DB 컬럼명에 맞게 데이터 준비
    const updates = {
      userid: userId,    // 컬럼명: userid
      level: Number(level),
      score: Number(score),
      updated_at: new Date(),
    };

    // 이메일이 전달되었을 때만 updates 객체에 포함 (빈 값 덮어쓰기 방지)
    if (email) {
      updates.email = email; // 컬럼명: email
    }

    // upsert: 데이터가 없으면 insert, 있으면 update를 한 번에 처리
    // onConflict: 'userid' -> userid가 같은 행이 있으면 덮어쓴다는 뜻
    const { data, error } = await supabase
      .from('game_progress') // 테이블 이름
      .upsert(updates, { onConflict: 'userid' });

    if (error) throw error;
    
    console.log("DB 저장 성공:", updates);

  } catch (error) {
    console.error('Save Error:', error.message);
  }
};

// 4. [최종 수정] 데이터 불러오기
export const loadProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('userid', userId)
      .maybeSingle(); // 데이터가 0개거나 1개일 때 안전하게 처리

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Load Error:', error.message);
    return null;
  }
};
