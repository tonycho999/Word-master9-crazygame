import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------
// [설정] 고객님의 주소와 키 (공백 제거됨)
// ----------------------------------------------------------------
const supabaseUrl = 'https://sfepjxhwlpisdpcdklwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZXBqeGh3bHBpc2RwY2RrbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjE3NjUsImV4cCI6MjA4NTg5Nzc2NX0.murbKE8QvK9Qe2tw1BF8_XJK7bG4QWEHjmbgoACONcY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 1. 로그인/로그아웃 기능 ---

// 이메일 로그인 (비상용)
export const loginWithGoogle = async () => {
  const email = window.prompt("Enter email for Magic Link:");
  if (!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) alert(error.message);
  else alert("Check your email inbox!");
};

// 로그아웃
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout Error:', error);
};

// --- 2. 데이터 저장/불러오기 기능 ---

// [저장] updated_at 없이 점수와 레벨만 저장
export const saveProgress = async (userId, level, score, email) => {
  console.log("🚀 [저장 시도] 데이터:", { userId, level, score, email });

  try {
    // DB 컬럼과 정확히 일치하는 데이터 객체 생성
    const updates = {
      userid: userId,    
      level: Number(level),
      score: Number(score),
      // updated_at 제거됨 (이제 안 보냅니다)
    };

    // 이메일이 있을 때만 추가
    if (email) {
      updates.email = email;
    }

    // DB에 저장 요청 (upsert: 없으면 생성, 있으면 수정)
    const { data, error } = await supabase
      .from('game_progress') 
      .upsert(updates, { onConflict: 'userid' }) // userid가 같으면 덮어쓰기
      .select(); 

    if (error) {
      console.error("❌ [저장 실패] DB 에러:", error); 
      // 에러 원인 파악을 위해 알림창 띄움 (배포 후엔 주석 처리 가능)
      // alert("저장 실패: " + error.message); 
      throw error;
    }
    
    console.log("✅ [저장 성공] 완료:", data);

  } catch (error) {
    console.error("❌ [시스템 에러]:", error.message);
  }
};

// [불러오기]
export const loadProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('userid', userId)
      .maybeSingle(); // 데이터가 없으면 null 반환

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

// --- 3. [통합] 데이터 동기화 및 충돌 해결 로직 ---
export const syncGameData = async (userId, localLevel, localScore, email) => {
  console.log("🔄 [동기화 시작] 로컬 vs DB 비교 중...");
  
  try {
    // 1. DB 데이터 가져오기
    const dbData = await loadProgress(userId);

    // 2. DB에 데이터가 없으면 -> 로컬 데이터를 저장하고 끝냄 (새 유저)
    if (!dbData) {
      await saveProgress(userId, localLevel, localScore, email);
      return { status: 'SAVED_TO_DB', data: { level: localLevel, score: localScore } };
    }

    // 3. 비교 로직
    // [상황 A] 레벨이 다르면 -> 무조건 충돌 (사용자 선택 필요)
    if (dbData.level !== localLevel) {
      return { status: 'CONFLICT', serverData: dbData };
    }

    // [상황 B] 레벨은 같은데, DB 점수가 더 높음 -> DB 데이터로 내 폰을 업데이트
    if (dbData.score > localScore) {
      return { status: 'UPDATE_LOCAL', serverData: dbData };
    }

    // [상황 C] 레벨은 같은데, 내 점수가 더 높음 -> 내 점수를 DB에 저장
    if (localScore > dbData.score) {
      await saveProgress(userId, localLevel, localScore, email);
      return { status: 'SAVED_TO_DB', data: { level: localLevel, score: localScore } };
    }

    // [상황 D] 둘다 똑같음 -> 아무것도 안 함
    console.log("✨ 데이터가 완벽하게 일치합니다.");
    return { status: 'SYNCED', data: dbData };

  } catch (error) {
    console.error("동기화 로직 에러:", error);
    return { status: 'ERROR', error };
  }
};
