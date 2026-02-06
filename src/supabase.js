import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------
// [중요] 아래 두 줄의 따옴표('') 안에 본인의 Supabase 주소와 키를 넣으세요!
// ----------------------------------------------------------------
const supabaseUrl = 'YOUR_SUPABASE_URL'; 
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 게임에서 사용할 기능들 ---

// 1. 구글 로그인 (수정됨: 에러 원인이었던 data 변수 삭제)
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // 로그인 후 원래 페이지로 돌아오기
    }
  });
  if (error) console.error('Login Error:', error);
};

// 2. 로그아웃
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout Error:', error);
};

// 3. 데이터 저장 (내 레벨, 점수 저장)
export const saveProgress = async (userId, level, score) => {
  // 내 데이터가 있는지 먼저 확인
  const { data: existingData } = await supabase
    .from('game_progress')
    .select('id')
    .eq('userid', userId) // 테이블 컬럼명이 'userid'인지 꼭 확인하세요!
    .single();

  if (existingData) {
    // 이미 있으면 -> 업데이트
    await supabase
      .from('game_progress')
      .update({ level: level, score: score })
      .eq('userid', userId);
  } else {
    // 없으면 -> 새로 만들기
    await supabase
      .from('game_progress')
      .insert({ userid: userId, level: level, score: score });
  }
};

// 4. 데이터 불러오기
export const loadProgress = async (userId) => {
  const { data, error } = await supabase
    .from('game_progress')
    .select('*')
    .eq('userid', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
};
