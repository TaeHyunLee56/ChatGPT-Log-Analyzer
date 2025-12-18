// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Firebase 설정 - 환경 변수에서 가져옴 (.env 파일)
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
const db = getFirestore(app);

/**
 * Firebase에 분석 데이터 업로드
 * @param {Object} analysisData - 분석 결과 데이터
 * @returns {Promise<string>} - 업로드된 문서의 ID
 */
export const uploadAnalysisData = async (analysisData) => {
  try {
    // 업로드할 데이터 구조 - score 중심으로만 저장 (대화내용 제외)
    const uploadData = {
      // 평균 점수들
      avgHallucinationScore: calculateAvgHallucination(analysisData),
      avgOverRelianceScore: calculateAvgOverReliance(analysisData),
      
      // 세션별 점수 정보 (대화 내용 제외)
      sessions: analysisData.sessions.map(session => ({
        fileName: session.fileName,
        turnCount: session.turnCount,
        overRelianceScore: session.over_reliance_score,
        avgHallucinationScore: session.turns.reduce((sum, turn) => 
          sum + (turn.hallucination_score || 0), 0) / session.turnCount,
        // Purpose 분포
        purposeDistribution: getPurposeDistribution(session),
        // Issue 유형 분포
        issueDistribution: getIssueDistribution(session)
      })),
      
      // 전체 통계
      totalFiles: analysisData.totalFiles,
      totalTurns: analysisData.totalTurns,
      
      // Purpose 통계
      mostCommonPurpose: getMostCommonPurpose(analysisData),
      purposeDistribution: getGlobalPurposeDistribution(analysisData),
      
      // 업로드 시각
      uploadedAt: serverTimestamp()
    };
    
    // Firestore에 저장
    const docRef = await addDoc(collection(db, 'analysisResults'), uploadData);
    console.log('데이터 업로드 성공, 문서 ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('데이터 업로드 실패:', error);
    throw error;
  }
};

/**
 * Firebase에서 모든 분석 데이터 가져오기
 * @returns {Promise<Array>} - 모든 분석 결과 데이터 배열
 */
export const getAllAnalysisData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'analysisResults'));
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  } catch (error) {
    console.error('데이터 가져오기 실패:', error);
    throw error;
  }
};

// === 헬퍼 함수들 ===

/**
 * 평균 Hallucination Score 계산
 */
const calculateAvgHallucination = (data) => {
  let totalScore = 0;
  let totalTurns = 0;
  
  data.sessions.forEach(session => {
    session.turns.forEach(turn => {
      totalScore += (turn.hallucination_score || 0);
      totalTurns++;
    });
  });
  
  return totalTurns > 0 ? parseFloat((totalScore / totalTurns).toFixed(2)) : 0;
};

/**
 * 평균 Over-reliance Score 계산
 */
const calculateAvgOverReliance = (data) => {
  const sum = data.sessions.reduce((acc, session) => acc + session.over_reliance_score, 0);
  return parseFloat((sum / data.sessions.length).toFixed(2));
};

/**
 * 세션의 Purpose 분포 계산
 */
const getPurposeDistribution = (session) => {
  const distribution = {};
  session.turns.forEach(turn => {
    const purpose = turn.purpose || 'Unknown';
    distribution[purpose] = (distribution[purpose] || 0) + 1;
  });
  return distribution;
};

/**
 * 세션의 Issue 분포 계산
 */
const getIssueDistribution = (session) => {
  const distribution = {};
  session.turns.forEach(turn => {
    let issueType = turn.issue_type || 'unknown';
    if (issueType === 'none') {
      issueType = 'No Issues';
    }
    distribution[issueType] = (distribution[issueType] || 0) + 1;
  });
  return distribution;
};

/**
 * 전체 데이터에서 가장 많이 사용된 Purpose
 */
const getMostCommonPurpose = (data) => {
  const purposeCounts = {};
  data.sessions.forEach(session => {
    session.turns.forEach(turn => {
      const purpose = turn.purpose || 'Unknown';
      purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
    });
  });
  
  const sorted = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : 'Unknown';
};

/**
 * 전체 Purpose 분포 계산
 */
const getGlobalPurposeDistribution = (data) => {
  const distribution = {};
  data.sessions.forEach(session => {
    session.turns.forEach(turn => {
      const purpose = turn.purpose || 'Unknown';
      distribution[purpose] = (distribution[purpose] || 0) + 1;
    });
  });
  return distribution;
};

export default db;
