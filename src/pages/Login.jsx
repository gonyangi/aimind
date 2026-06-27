import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { LogIn, UserPlus, ShieldAlert, GraduationCap, User } from 'lucide-react';

const Login = () => {
  // 회원가입 모드 여부 상태 관리 (true: 회원가입, false: 로그인)
  const [isSignUp, setIsSignUp] = useState(false);
  
  // 폼 입력 데이터 상태 관리
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // 'student' 또는 'teacher'

  // 통신 진행 및 에러 제어 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 회원가입 및 로그인 모드 전환 처리
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  // 폼 전송 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 입력 유효성 검사
    if (!username || !password) {
      setError('아이디와 비밀번호를 모두 입력해 주세요.');
      setLoading(false);
      return;
    }

    // Firebase Auth용 가상 이메일 생성
    const email = `${username.trim()}@aimind.com`;

    if (isSignUp) {
      // 회원가입 시 추가 유효성 검사
      if (!name) {
        setError('이름을 입력해 주세요.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        setLoading(false);
        return;
      }

      try {
        // 1. Firebase Auth 계정 생성
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Firestore 데이터베이스의 'users' 컬렉션에 사용자 메타데이터(이름, 역할) 저장
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name,
          email: email,
          role: role, // 'student' 또는 'teacher'
          createdAt: serverTimestamp()
        });

        console.log('회원가입 및 Firestore 등록 완료:', user.uid);
      } catch (err) {
        console.error('회원가입 오류:', err);
        // Firebase 에러 코드별 친절한 한글 안내
        if (err.code === 'auth/email-already-in-use') {
          setError('이미 등록된 아이디입니다.');
        } else if (err.code === 'auth/invalid-email') {
          setError('아이디 형식이 올바르지 않습니다. (영문, 숫자 권장)');
        } else {
          setError('회원가입 도중 문제가 발생했습니다. 다시 시도해 주세요.');
        }
      }
    } else {
      // 로그인 처리
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('로그인 성공');
      } catch (err) {
        console.error('로그인 오류:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        } else {
          setError('로그인 도중 문제가 발생했습니다. 입력 정보를 확인해 주세요.');
        }
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* 백그라운드 디자인 데코레이션 */}
      <div className="aurora-bg aurora-1"></div>
      <div className="aurora-bg aurora-2"></div>

      <div className="glass-card" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI Mind Diary</h1>
          <p style={styles.subtitle}>
            {isSignUp ? '소중한 성장의 첫걸음을 함께 시작해요' : '나만의 인공지능 마음 일기장'}
          </p>
        </div>

        {/* 로그인 / 회원가입 탭 */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => isSignUp && toggleMode()} 
            style={{
              ...styles.tab,
              color: !isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: !isSignUp ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            로그인
          </button>
          <button 
            onClick={() => !isSignUp && toggleMode()} 
            style={{
              ...styles.tab,
              color: isSignUp ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: isSignUp ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            회원가입
          </button>
        </div>

        {/* 에러 피드백 영역 */}
        {error && (
          <div style={styles.errorBox}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 회원가입 시에만 노출되는 추가 필드 (이름, 역할) */}
          {isSignUp && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>이름</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명을 입력해 주세요"
                  className="glass-input"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>나는 누구인가요?</label>
                <div style={styles.roleCardContainer}>
                  {/* 학생 선택 카드 */}
                  <div 
                    onClick={() => setRole('student')}
                    style={{
                      ...styles.roleCard,
                      borderColor: role === 'student' ? 'var(--accent-primary)' : 'var(--card-border)',
                      background: role === 'student' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <User size={28} color={role === 'student' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    <span style={{ 
                      ...styles.roleLabel, 
                      color: role === 'student' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>학생</span>
                  </div>
                  
                  {/* 교사 선택 카드 */}
                  <div 
                    onClick={() => setRole('teacher')}
                    style={{
                      ...styles.roleCard,
                      borderColor: role === 'teacher' ? 'var(--accent-primary)' : 'var(--card-border)',
                      background: role === 'teacher' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <GraduationCap size={28} color={role === 'teacher' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    <span style={{ 
                      ...styles.roleLabel, 
                      color: role === 'teacher' ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>선생님</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>아이디</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="영문 또는 숫자 아이디 입력"
              className="glass-input"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력"
              className="glass-input"
              required
            />
          </div>

          {/* 회원가입 시에만 노출되는 비밀번호 확인 필드 */}
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>비밀번호 확인</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                className="glass-input"
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              '처리 중...'
            ) : isSignUp ? (
              <>
                <UserPlus size={18} />
                가입하기
              </>
            ) : (
              <>
                <LogIn size={18} />
                로그인
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// CSS-in-JS 스타일 정의
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '1.5rem',
    position: 'relative'
  },
  card: {
    width: '460px',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)'
  },
  tabContainer: {
    display: 'flex',
    width: '100%',
    borderBottom: '1px solid var(--card-border)',
    marginBottom: '0.5rem'
  },
  tab: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)'
  },
  roleCardContainer: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.25rem'
  },
  roleCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    gap: '0.5rem',
    transition: 'all 0.25s ease'
  },
  roleLabel: {
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  submitBtn: {
    width: '100%',
    marginTop: '0.5rem'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    color: '#fca5a5',
    fontSize: '0.9rem'
  }
};

export default Login;
