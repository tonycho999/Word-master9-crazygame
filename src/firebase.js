import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; // ★ 추가됨
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQT1f2RnrVtYFG3xTxqNiWeTDicwyQpSg",
  authDomain: "word-master9-crazygame.firebaseapp.com",
  projectId: "word-master9-crazygame",
  storageBucket: "word-master9-crazygame.firebasestorage.app",
  messagingSenderId: "709273616074",
  appId: "1:709273616074:web:f80d9d4e0b531a9ffe7e33",
  measurementId: "G-KZGKWR5PHT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider(); // ★ 구글 로그인 공급자 생성

// 데이터 저장 함수
export const saveProgress = async (userId, level, score, email) => {
  if (!userId) return;
  try {
    await setDoc(doc(db, "users", userId), {
      level, score, email, last_updated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Save Error:", error);
  }
};

// ★ 중요: 4가지 핵심 모듈 export
export { auth, googleProvider, signInWithPopup, signOut, db, analytics };
