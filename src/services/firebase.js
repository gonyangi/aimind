// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 사용자가 제공한 Firebase 웹앱 설정값 적용
const firebaseConfig = {
  apiKey: "AIzaSyCsZ8n0Lpe4j9CBOBKd2M0LY1EdQF4C-nQ",
  authDomain: "aimind-2141a.firebaseapp.com",
  projectId: "aimind-2141a",
  storageBucket: "aimind-2141a.firebasestorage.app",
  messagingSenderId: "1028316123016",
  appId: "1:1028316123016:web:df7c5b68eebf0a1928f43d"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 다른 컴포넌트에서 활용할 수 있도록 인증(Auth) 및 데이터베이스(Firestore) 객체 추출 및 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
