import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BookOpen, Send, LogOut, MessageSquareHeart, Calendar, Heart, Sparkles, Smile } from 'lucide-react';

const StudentDiary = () => {
  const [studentName, setStudentName] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaries, setDiaries] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState('');
  const [error, setError] = useState('');

  const currentUser = auth.currentUser;

  // 1. 컴포넌트 마운트 시 Firestore에서 학생 실명 불러오기
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setStudentName(userDoc.data().name);
          }
        } catch (err) {
          console.error('학생 정보 로딩 에러:', err);
        }
      }
    };
    fetchStudentInfo();
  }, [currentUser]);

  // 2. 실시간으로 Firestore에서 해당 학생이 쓴 일기만 구독(구독 취소 처리 포함)
  useEffect(() => {
    if (!currentUser) return;

    // 본인이 작성한 일기장 데이터를 생성일 역순으로 정렬
    const q = query(
      collection(db, 'diaries'),
      where('studentUid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const diaryList = [];
      snapshot.forEach((doc) => {
        diaryList.push({ id: doc.id, ...doc.data() });
      });
      setDiaries(diaryList);
    }, (err) => {
      console.error('실시간 일기 데이터 로딩 실패:', err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. 일기 작성 및 AI 선생님 답장 요청 핸들러
  const handleSubmitDiary = async (e) => {
    e.preventDefault();
    if (!diaryContent.trim()) return;

    setLoading(true);
    setError('');
    setLatestFeedback('');

    try {
      // (1) Express 로컬 백엔드 서버로 분석 요청 송신
      const response = await fetch('http://localhost:5001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diaryContent }),
      });

      if (!response.ok) {
        throw new Error('AI 응답을 생성하지 못했습니다.');
      }

      const data = await response.json();
      const feedback = data.feedback;
      setLatestFeedback(feedback);

      // (2) 성공적으로 가져온 답변과 일기 원본을 Firestore에 실시간 기록
      await addDoc(collection(db, 'diaries'), {
        studentUid: currentUser.uid,
        studentName: studentName || currentUser.email.split('@')[0],
        diaryContent: diaryContent,
        aiFeedback: feedback,
        createdAt: serverTimestamp(),
      });

      // 작성 폼 초기화
      setDiaryContent('');
    } catch (err) {
      console.error('일기 전송 중 오류 발생:', err);
      setError('AI 선생님께 편지를 보내는 중 연결에 문제가 발생했어요. 백엔드 서버가 구동 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    signOut(auth);
  };

  // Firestore 타임스탬프 한글 날짜 포맷팅 헬퍼
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '방금 전';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div style={styles.container}>
      {/* 몽환적인 그라데이션 장식 원 배경 */}
      <div className="aurora-bg aurora-1"></div>
      <div className="aurora-bg aurora-2"></div>

      {/* 헤더 바 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <BookOpen size={24} color="var(--accent-primary)" />
          <h2 style={styles.headerTitle}>{studentName || '학생'} 님의 마음 일기장</h2>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} className="btn btn-secondary">
          <LogOut size={16} />
          로그아웃
        </button>
      </header>

      <main style={styles.mainLayout}>
        {/* 왼쪽: 일기 작성 공간 */}
        <section style={styles.writeSection}>
          <div className="glass-card" style={styles.writeCard}>
            <div style={styles.writeHeader}>
              <Smile size={22} color="var(--accent-warning)" />
              <h3 style={styles.sectionTitle}>오늘 있었던 일을 솔직하게 적어보세요</h3>
            </div>
            
            <form onSubmit={handleSubmitDiary} style={styles.form}>
              <textarea
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                placeholder="오늘 하루는 어땠나요? 기뻤던 일, 슬펐던 일, 혹은 걱정되는 일들을 선생님에게 편지 쓰듯이 편하게 남겨보세요."
                style={styles.textarea}
                disabled={loading}
                required
              />
              
              <div style={styles.formFooter}>
                <span style={styles.charCount}>{diaryContent.length}자 작성 중</span>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !diaryContent.trim()}
                  style={styles.sendBtn}
                >
                  {loading ? (
                    <span>전송 중... ✏️</span>
                  ) : (
                    <>
                      <Send size={16} />
                      생각 전송하기
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* 에러가 발생한 경우 노출 */}
            {error && <div style={styles.errorBox}>{error}</div>}
          </div>

          {/* AI 실시간 피드백 알림창 */}
          {(latestFeedback || loading) && (
            <div className="glass-card" style={styles.feedbackCard}>
              <div style={styles.feedbackHeader}>
                <Sparkles size={20} color="var(--accent-secondary)" />
                <h4 style={styles.feedbackTitle}>AI 마음 우체통의 답장</h4>
              </div>
              {loading ? (
                <div style={styles.loadingWrapper}>
                  <div style={styles.spinner} />
                  <p style={styles.loadingText}>선생님이 소중한 일기를 읽고 정성스레 편지를 쓰는 중이에요... 조금만 기다려주세요! 📝</p>
                </div>
              ) : (
                <div style={styles.feedbackContent}>
                  <MessageSquareHeart size={28} color="var(--accent-secondary)" style={styles.feedbackIcon} />
                  <p style={styles.feedbackText}>{latestFeedback}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 오른쪽: 지난 일기 리스트 모아보기 */}
        <section style={styles.historySection}>
          <div style={styles.historyHeader}>
            <Heart size={20} color="var(--accent-secondary)" />
            <h3 style={styles.sectionTitle}>내가 쓴 일기 보관함</h3>
          </div>

          <div style={styles.diaryScrollArea}>
            {diaries.length === 0 ? (
              <div style={styles.emptyState}>
                <p>보관함에 일기가 아직 없어요.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>첫 일기를 작성해 보세요!</p>
              </div>
            ) : (
              diaries.map((diary) => (
                <div key={diary.id} className="glass-card" style={styles.diaryHistoryCard}>
                  <div style={styles.historyCardMeta}>
                    <div style={styles.dateBadge}>
                      <Calendar size={14} color="var(--text-secondary)" />
                      <span>{formatTimestamp(diary.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div style={styles.historyDiaryContent}>
                    <p>{diary.diaryContent}</p>
                  </div>
                  
                  <div style={styles.historyAiReply}>
                    <div style={styles.replyTeacherMeta}>
                      <div style={styles.teacherAvatar}>👩‍🏫</div>
                      <span style={styles.replyTeacherTitle}>AI 선생님의 공감 한 줄</span>
                    </div>
                    <p style={styles.replyTeacherText}>{diary.aiFeedback}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

// 스타일링 정의
const styles = {
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--card-border)',
    zIndex: 10
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem'
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '2rem',
    alignItems: 'start',
    zIndex: 10
  },
  writeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  writeCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  writeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  textarea: {
    width: '100%',
    height: '240px',
    padding: '1.25rem',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid var(--input-border)',
    borderRadius: '16px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '1rem',
    lineHeight: '1.6',
    resize: 'none',
    outline: 'none',
    transition: 'all 0.25s ease'
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  charCount: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  sendBtn: {
    padding: '0.75rem 1.5rem'
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '0.75rem 1.25rem',
    color: '#fca5a5',
    fontSize: '0.875rem'
  },
  feedbackCard: {
    padding: '1.75rem',
    borderLeft: '4px solid var(--accent-secondary)'
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  feedbackTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem 0',
    gap: '1rem',
    textAlign: 'center'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--accent-secondary)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  feedbackContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0.5rem 0'
  },
  feedbackIcon: {
    flexShrink: 0,
    marginTop: '0.25rem'
  },
  feedbackText: {
    fontSize: '0.975rem',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  historySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  diaryScrollArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    maxHeight: '620px',
    overflowY: 'auto',
    paddingRight: '0.5rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '16px',
    border: '1px dashed var(--card-border)'
  },
  diaryHistoryCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  historyCardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '0.25rem 0.6rem',
    borderRadius: '8px'
  },
  historyDiaryContent: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    background: 'rgba(0, 0, 0, 0.1)',
    padding: '0.875rem 1.125rem',
    borderRadius: '12px',
    borderLeft: '3px solid var(--text-muted)'
  },
  historyAiReply: {
    fontSize: '0.9rem',
    lineHeight: '1.6',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    padding: '0.875rem 1.125rem',
    borderRadius: '12px'
  },
  replyTeacherMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  teacherAvatar: {
    fontSize: '1.1rem'
  },
  replyTeacherTitle: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontSize: '0.85rem'
  },
  replyTeacherText: {
    color: 'var(--text-primary)'
  }
};

export default StudentDiary;
