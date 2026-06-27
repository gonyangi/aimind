// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 사용자가 제공한 Firebase 웹앱 설정값 적용 (aimind-5f168 프로젝트용으로 업데이트)
const firebaseConfig = {
  apiKey: "AIzaSyAF9y0x2FX2Pikniz434RumY9SMU2G9btI",
  authDomain: "aimind-5f168.firebaseapp.com",
  projectId: "aimind-5f168",
  storageBucket: "aimind-5f168.firebasestorage.app",
  messagingSenderId: "916681095385",
  appId: "1:916681095385:web:5bbf9251866e70cea2a6c8"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 다른 컴포넌트에서 활용할 수 있도록 인증(Auth) 및 데이터베이스(Firestore) 객체 추출 및 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
