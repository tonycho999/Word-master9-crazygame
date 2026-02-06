import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------
// [유지] 고객님의 주소와 키
// ----------------------------------------------------------------
const supabaseUrl = 'https://sfepjxhwlpisdpcdklwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZXBqeGh3bHBpc2RwY2RrbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjE3NjUsImV4cCI6MjA4NTg5Nzc2NX0.murbKE8QvK9Qe2tw1BF8_XJK7bG4QWEHjmbgoACONcY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 게임에서 사용할 기능들 ---

// 1. 로그인
export const loginWithGoogle = async () => {
  const email = window.prompt("Please enter your email to save progress:\n(A login link will be sent to your inbox)");
  if (!email) return;

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.origin,
    }
  });

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("📩 Check your inbox!\nClick the link in the email to log in and save your game.");
  }
};

// 2. 로그아웃
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout Error:', error);
  else alert("Logged out successfully.");
};

// 3. [강력 수정] 데이터 저장 (중복 무시 버전)
export const saveProgress = async (userId, level, score) => {
  try {
    const safeLevel = Number(level);
    const safeScore = Number(score);

    // 1. 데이터 조회 (single()을 빼서 에러 방지)
    const { data, error } = await supabase
      .from('game_progress')
      .select('id')
      .eq('userid', userId); // 중복이 있어도 에러 안 남

    if (error) throw error;

    if (data && data.length > 0) {
      // 2. 데이터가 있으면 (1개든 10개든) 전부 업데이트
      const { error: updateError } = await supabase
        .from('game_progress')
        .update({ level: safeLevel, score: safeScore })
        .eq('userid', userId);
      
      if (updateError) throw updateError;
    } else {
      // 3. 없으면 새로 생성
      const { error: insertError } = await supabase
        .from('game_progress')
        .insert({ userid: userId, level: safeLevel, score: safeScore });
      
      if (insertError) throw insertError;
    }
    console.log("DB 저장 성공 (강제):", safeLevel, safeScore);
  } catch (error) {
    console.error('Save Error:', error.message);
  }
};

// 4. [강력 수정] 데이터 불러오기 (중복 무시 버전)
export const loadProgress = async (userId) => {
  const { data, error } = await supabase
    .from('game_progress')
    .select('*')
    .eq('userid', userId); // single() 제거

  if (error) return null;

  // 데이터가 여러 개면 첫 번째 것만 사용
  return (data && data.length > 0) ? data[0] : null;
};
