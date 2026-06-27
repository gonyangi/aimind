// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 사용자가 제공한 Firebase 웹앱 설정값을 환경 변수로부터 동적으로 로드
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 다른 컴포넌트에서 활용할 수 있도록 인증(Auth) 및 데이터베이스(Firestore) 객체 추출 및 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
