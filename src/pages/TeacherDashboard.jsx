import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { LayoutDashboard, Users, BookOpen, Calendar, Search, LogOut, MessageSquare, ChevronDown, ChevronUp, Clock } from 'lucide-react';

const TeacherDashboard = () => {
  const [teacherName, setTeacherName] = useState('');
  const [diaries, setDiaries] = useState([]);
  const [filteredDiaries, setFilteredDiaries] = useState([]);
  
  // 검색 및 상세 토글 제어 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDiaryId, setExpandedDiaryId] = useState(null);

  // 학급 통계 메트릭 상태 관리
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    todayCount: 0,
    activeStudents: 0
  });

  const currentUser = auth.currentUser;

  // 1. 교사 정보(실명) 가져오기
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setTeacherName(userDoc.data().name);
          }
        } catch (err) {
          console.error('교사 정보 로딩 에러:', err);
        }
      }
    };
    fetchTeacherInfo();
  }, [currentUser]);

  // 2. 전체 학급 학생의 일기 목록 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, 'diaries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const diaryList = [];
      const studentSet = new Set();
      let todayCount = 0;

      // 오늘 날짜 계산용 기준시 설정
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data = doc.data();
        diaryList.push({ id: doc.id, ...data });

        // 작성에 참여한 고유 학생 UID 수집
        if (data.studentUid) {
          studentSet.add(data.studentUid);
        }

        // 오늘 작성된 일기 개수 계산
        if (data.createdAt) {
          const diaryDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          diaryDate.setHours(0, 0, 0, 0);
          if (diaryDate.getTime() === today.getTime()) {
            todayCount++;
          }
        }
      });

      setDiaries(diaryList);
      setFilteredDiaries(diaryList);

      // 통계 지표 업데이트
      setMetrics({
        totalCount: diaryList.length,
        todayCount: todayCount,
        activeStudents: studentSet.size
      });
    }, (err) => {
      console.error('전체 일기 수신 오류:', err);
    });

    return () => unsubscribe();
  }, []);

  // 3. 학생 이름 검색어 변경 시 필터링 처리
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDiaries(diaries);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = diaries.filter(diary => 
        diary.studentName && diary.studentName.toLowerCase().includes(lowerSearch)
      );
      setFilteredDiaries(filtered);
    }
  }, [searchTerm, diaries]);

  // 특정 일기 카드 아코디언 토글
  const toggleExpand = (id) => {
    if (expandedDiaryId === id) {
      setExpandedDiaryId(null);
    } else {
      setExpandedDiaryId(id);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    signOut(auth);
  };

  // 날짜 변환 포맷팅 헬퍼
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '방금 전';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      {/* 몽환적인 백그라운드 오로라 디자인 */}
      <div className="aurora-bg aurora-1"></div>
      <div className="aurora-bg aurora-2"></div>

      {/* 헤더 바 */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <LayoutDashboard size={24} color="var(--accent-primary)" />
          <h2 style={styles.headerTitle}>{teacherName || '교사'} 선생님 대시보드</h2>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} className="btn btn-secondary">
          <LogOut size={16} />
          로그아웃
        </button>
      </header>

      {/* 메인 통계 요약 카드 영역 */}
      <section style={styles.metricsGrid}>
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <BookOpen size={24} color="var(--accent-primary)" />
          </div>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>누적 일기장</span>
            <span style={styles.metricValue}>{metrics.totalCount} <span style={styles.metricUnit}>개</span></span>
          </div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(236, 72, 153, 0.1)' }}>
            <Calendar size={24} color="var(--accent-secondary)" />
          </div>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>오늘 제출된 일기</span>
            <span style={{ ...styles.metricValue, color: 'var(--accent-secondary)' }}>{metrics.todayCount} <span style={styles.metricUnit}>개</span></span>
          </div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(16, 185, 129, 0.1)' }}>
            <Users size={24} color="var(--accent-success)" />
          </div>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>참여 학생 수</span>
            <span style={{ ...styles.metricValue, color: 'var(--accent-success)' }}>{metrics.activeStudents} <span style={styles.metricUnit}>명</span></span>
          </div>
        </div>
      </section>

      {/* 모니터링 메인 콘텐츠 */}
      <section className="glass-card" style={styles.mainCard}>
        <div style={styles.mainCardHeader}>
          <h3 style={styles.mainCardTitle}>학생들의 실시간 생각 모니터링</h3>
          
          {/* 학생 이름 실시간 검색 필드 */}
          <div style={styles.searchWrapper}>
            <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="학생 이름으로 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input"
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* 일기 리스트 스트림 */}
        <div style={styles.diaryListContainer}>
          {filteredDiaries.length === 0 ? (
            <div style={styles.emptyState}>
              <p>조회된 일기가 없습니다.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>학생들의 이름이 올바른지 혹은 일기를 제출했는지 확인해 보세요.</p>
            </div>
          ) : (
            filteredDiaries.map((diary) => {
              const isExpanded = expandedDiaryId === diary.id;
              return (
                <div 
                  key={diary.id} 
                  style={{
                    ...styles.diaryRowCard,
                    borderColor: isExpanded ? 'rgba(99, 102, 241, 0.3)' : 'var(--card-border)',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  {/* 요약 클릭 영역 */}
                  <div onClick={() => toggleExpand(diary.id)} style={styles.rowSummary}>
                    <div style={styles.rowStudentInfo}>
                      <div style={styles.studentAvatar}>👤</div>
                      <div>
                        <span style={styles.studentName}>{diary.studentName}</span>
                        <div style={styles.timeBadge}>
                          <Clock size={12} />
                          <span>{formatTimestamp(diary.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.rowPreview}>
                      <p style={styles.previewText}>
                        {diary.diaryContent.length > 50 
                          ? `${diary.diaryContent.slice(0, 50)}...` 
                          : diary.diaryContent}
                      </p>
                    </div>

                    <div style={styles.rowAction}>
                      {isExpanded ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  {/* 아코디언 확장 영역 */}
                  {isExpanded && (
                    <div style={styles.rowDetail}>
                      <div style={styles.divider}></div>
                      
                      <div style={styles.detailGrid}>
                        {/* 학생이 작성한 실제 일기 내용 */}
                        <div style={styles.detailBlock}>
                          <span style={styles.detailLabel}>📝 학생 일기 전문</span>
                          <div style={styles.diaryTextBox}>
                            <p style={styles.detailText}>{diary.diaryContent}</p>
                          </div>
                        </div>

                        {/* AI 선생님의 답변 내용 */}
                        <div style={styles.detailBlock}>
                          <span style={{ ...styles.detailLabel, color: 'var(--accent-secondary)' }}>👩‍🏫 AI 선생님 피드백</span>
                          <div style={styles.aiReplyTextBox}>
                            <p style={styles.detailText}>{diary.aiFeedback}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

// 스타일 가이드 정의
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    zIndex: 10
  },
  metricCard: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    borderRadius: '20px'
  },
  metricIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(99, 102, 241, 0.1)',
    flexShrink: 0
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '1.6rem',
    fontWeight: '750',
    color: 'var(--text-primary)'
  },
  metricUnit: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--text-secondary)'
  },
  mainCard: {
    padding: '2rem',
    zIndex: 10
  },
  mainCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  mainCardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600'
  },
  searchWrapper: {
    position: 'relative',
    width: '280px',
    maxWidth: '100%'
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  searchInput: {
    paddingLeft: '2.5rem',
    fontSize: '0.875rem'
  },
  diaryListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 1rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '16px',
    border: '1px dashed var(--card-border)'
  },
  diaryRowCard: {
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.25s ease'
  },
  rowSummary: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr 40px',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    cursor: 'pointer',
    gap: '1.5rem'
  },
  rowStudentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  studentAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    border: '1px solid var(--card-border)'
  },
  studentName: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: 'var(--text-primary)'
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem'
  },
  rowPreview: {
    overflow: 'hidden'
  },
  previewText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  rowAction: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rowDetail: {
    padding: '0 1.5rem 1.5rem 1.5rem'
  },
  divider: {
    height: '1px',
    background: 'var(--card-border)',
    marginBottom: '1.25rem'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start'
  },
  detailBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  detailLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--accent-primary)',
    letterSpacing: '0.02em'
  },
  diaryTextBox: {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    padding: '1rem',
    minHeight: '100px'
  },
  aiReplyTextBox: {
    background: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    borderRadius: '12px',
    padding: '1rem',
    minHeight: '100px'
  },
  detailText: {
    fontSize: '0.925rem',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap'
  }
};

export default TeacherDashboard;
