import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';

// 작성한 화면(페이지) 컴포넌트 임포트
import Login from './pages/Login';
import StudentDiary from './pages/StudentDiary';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 변경 리스너 등록
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        
        // 5초 타임아웃 프로미스 정의 (데이터베이스가 생성되지 않았을 때 무한 대기 차단용)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore Connection Timeout')), 5000)
        );

        try {
          // Firestore에서 해당 사용자의 UID를 키로 하여 문서(역할 데이터 등)를 가져옵니다.
          const userDocRef = doc(db, 'users', currentUser.uid);
          
          // 5초 이내에 응답이 없으면 강제로 catch 블록으로 이동시킵니다.
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            timeoutPromise
          ]);
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role); // 'student' 또는 'teacher' 역할 저장
          } else {
            // 회원가입 직후 Firestore 문서 저장이 아직 완료되지 않은 경우를 대비해 1.5초 후 재시도
            console.warn('Firestore 사용자 문서가 없습니다. 1.5초 후 재시도합니다...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const retryDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (retryDoc.exists()) {
              setRole(retryDoc.data().role);
            } else {
              // 재시도 후에도 없으면 비정상 계정으로 간주하여 자동 로그아웃
              console.error('재시도 후에도 Firestore 사용자 정보가 없습니다.');
              alert('사용자 정보를 찾을 수 없습니다. 다시 회원가입 해주세요.\n(Firebase 콘솔 > Firestore Database > users 컬렉션이 비어있을 수 있습니다.)');
              await signOut(auth);
              setRole(null);
            }
          }
        } catch (error) {
          console.error('사용자 역할을 불러오는 중 오류 발생:', error);
          alert('데이터베이스 연결 시간이 초과되었습니다. Firebase 콘솔에서 Firestore Database가 생성되고 규칙이 활성화되어 있는지 확인해 주세요.');
          // 무한 로딩 루프를 깨기 위해 자동 로그아웃 수행
          await signOut(auth);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, []);

  // 로딩 중일 때 표시할 화면 (간단한 스피너 구성)
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #3b82f6',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>사용자 정보를 확인하고 있습니다...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 로그인 경로: 로그인 시 사용자 역할에 따라 각각의 페이지로 리다이렉트 */}
        <Route 
          path="/login" 
          element={
            user ? (
              role === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/student" replace />
            ) : (
              <Login />
            )
          } 
        />

        {/* 학생 일기장 경로: 로그인 상태이면서 학생 계정일 때만 진입 허용 */}
        <Route 
          path="/student" 
          element={
            user && role === 'student' ? <StudentDiary /> : <Navigate to="/login" replace />
          } 
        />

        {/* 교사용 대시보드 경로: 로그인 상태이면서 교사 계정일 때만 진입 허용 */}
        <Route 
          path="/teacher" 
          element={
            user && role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" replace />
          } 
        />

        {/* 그 외 정의되지 않은 모든 주소는 로그인 상태에 따라 자동 리다이렉트 */}
        <Route 
          path="*" 
          element={
            user ? (
              role === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/student" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
