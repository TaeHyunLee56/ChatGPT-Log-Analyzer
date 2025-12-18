import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { uploadAnalysisData } from '../firebase';
import SessionListComponent from './SessionList';

// 메인 컨테이너 - 두 개의 컬럼으로 나뉨
const ScrollytellingContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background-color: #f9fafb;
  min-width: 1200px;
`;
// 헤더
const Header = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #f59e0b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
`;
const Title = styled.h2`
  color: #f59e0b;
  font-size: 24px;
  font-weight: 700;
`;
const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const ViewingBadge = styled.div`
  padding: 10px 15px;
  background-color: #e0f2fe;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #0369a1;
  display: flex;
  align-items: center;
  gap: 8px;
`;
const CloseButton = styled.button`
  background-color: transparent;
  border: none;
  color: #0369a1;
  cursor: pointer;
  font-size: 14px;  
  &:hover {
    opacity: 0.7;
  }
`;
const DownloadButton = styled.button`
  background-color: #f59e0b;
  color: #ffffff;
  padding: 10px 15px;
  border: 1.5px solid #f59e0b;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  font-weight: 500;
  &:hover {
    background-color: #d97706;
  }
`;
const ResetButton = styled.button`
  background-color: #e5e7eb;
  color: #374151;
  padding: 10px 15px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
  &:hover {
    background-color: #d1d5db;
  }
`;
// 왼쪽 영역 - 스크롤에 따라 변경되는 핵심 지표
const LeftPanel = styled.div`
  width: 40%; 
  height: 100vh;
  // background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  padding: 60px 40px;
  display: block;
  position: sticky;
  top: 0;
  border-right: 2px solid #e5e7eb;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;

    // background-color: red;

`;

// 오른쪽 영역 - 스크롤 가능한 상세 그래프
const RightPanel = styled.div`
  margin-top: 60px;
  width: 60%;
  height: 100vh;
  overflow-y: auto;
  padding: 0;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
`;

// 섹션 컨테이너 - 각 그래프 섹션
const Section = styled.div`
  min-height: 100vh;
  padding: 80px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: ${props => props.active ? 1 : 0.2};
  transform: ${props => props.active ? 'scale(1)' : 'scale(0.95)'};
  transition: opacity 0.6s ease, transform 0.6s ease;
  position: relative;
`;

// 왼쪽 핵심 지표 카드
const KeyMetricCard = styled.div`

  width: 100%;
  max-width: 400px;
  text-align: center;
  transition: transform 0.6s ease, opacity 0.6s ease, visibility 0.6s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: ${props => {
    if (!props.active) return 'translate(-50%, -50%) scale(0.95)';
    return 'translate(-50%, -50%) scale(1.05)';
  }};
  opacity: ${props => props.active ? 1 : 0};
  visibility: ${props => props.active ? 'visible' : 'hidden'};
  pointer-events: ${props => props.active ? 'auto' : 'none'};
`;

const KeyMetricTitle = styled.h3`
  font-size: 19px;
  color: #6b7280;
  margin-bottom: 15px;
  font-weight: 500;
`;

const IntroTitle = styled.h1`
  font-size: 40px;
  color: #1f2937;
  margin-bottom: 20px;
  font-weight: 700;
  line-height: 1.2;
`;

const IntroDescription = styled.p`
  font-size: 19px;
  color: #6b7280;
  line-height: 1.8;
  margin: 0;
`;

const StatsContainer = styled.div`
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  margin-top: 40px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  padding: 30px 25px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 5px solid ${props => props.color || '#9ca3af'};
`;

const StatLabel = styled.p`
  margin: 0 0 10px 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
`;

const StatValue = styled.p`
  margin: 0;
  font-size: 56px;
  font-weight: bold;
  color: ${props => props.color || '#1f2937'};
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

const StatUnit = styled.span`
  color: #9ca3af;
  font-size: 16px;
  font-weight: normal;
`;

const SummaryBox = styled.div`
  padding: 12px;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  margin-top: 20px;
  width: 100%;
`;

const SummaryText = styled.p`
  margin: 0;
  color: #1e40af;
  font-size: 14px;
  line-height: 1.5;
`;

const HallucinationList = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: 40px;
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const HallucinationItem = styled.div`
  padding: 0;
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const TypeText = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background-color: ${props => props.bgColor || '#f3f4f6'};
  border-radius: 3px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  font-family: monospace;
`;

const ScoreText = styled.span`
  font-weight: 500;
  color: ${props => props.color || '#1f2937'};
  font-size: 14px;
`;

const ReasonText = styled.p`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
`;

const GraphCard = styled.div`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  min-height: 300px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  position: relative;
`;

const SessionBadge = styled.div`
  align-self: flex-start;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.isSelected ? '#0369a1' : '#6b7280'};
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  width: 100%;
`;

const KeyMetricValue = styled.div`
  font-size: ${props => props.large ? '80px' : '56px'};
  font-weight: 700;
  color: ${props => props.color || '#111827'};
  line-height: 1.2;
  margin-bottom: 10px;
`;

const KeyMetricDescription = styled.p`
  font-size: 15px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
`;

// 그래프 섹션 제목
const SectionTitle = styled.h2`
  font-size: 40px;
  color: #1f2937;
  margin-bottom: 20px;
  text-align: center;
`;

const SectionDescription = styled.p`
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 40px;
  text-align: center;
  max-width: 600px;
`;

const DefinitionsBox = styled.div`
  margin-top: 20px;
  width: 100%;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const DefinitionsTitle = styled.h4`
  color: #1f2937;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
`;

const DefinitionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DefinitionItem = styled.div``;

const DefinitionLabel = styled.strong`
  font-size: 14px;
  color: ${props => props.color || '#1f2937'};
`;

const DefinitionText = styled.p`
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

// 그래프 컨테이너
const ChartContainer = styled.div`
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
`;



/**
 * Scrollytelling 형태의 분석 결과 컴포넌트
 * @param {object} data - GptLogUploader에서 전달받은 분석 JSON 데이터
 * @param {function} onReset - App 컴포넌트의 상태를 리셋하여 업로더 화면으로 돌아가는 콜백
 * @param {function} onNavigateToCompare - CompareData 페이지로 이동하는 콜백
 */
const Scroll = ({ data, onReset, onNavigateToCompare }) => {
  const [activeSection, setActiveSection] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [hoveredScatterIndex, setHoveredScatterIndex] = useState(null);
  const rightPanelRef = useRef(null);
  const sectionRefs = useRef([]);
  
  if (!data) return <p style={{color: '#111827'}}>Loading analysis data...</p>;

  // 스크롤 위치 추적 - 스크롤 이벤트만 사용 (더 안정적)
  useEffect(() => {
    if (!rightPanelRef.current) return;

    let ticking = false;
    let lastActiveSection = 0;
    
    const handleScroll = () => {
      if (!rightPanelRef.current || ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        if (!rightPanelRef.current) {
          ticking = false;
          return;
        }
        
        const scrollTop = rightPanelRef.current.scrollTop;
        const viewportHeight = rightPanelRef.current.clientHeight;
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + viewportHeight;
        const viewportCenter = scrollTop + viewportHeight / 2;
        
        // 각 섹션의 가시성과 중앙 거리 계산
        let bestIndex = lastActiveSection;
        let bestScore = -Infinity;
        
        sectionRefs.current.forEach((ref, index) => {
          if (ref) {
            const sectionTop = ref.offsetTop;
            const sectionBottom = sectionTop + ref.offsetHeight;
            const sectionCenter = sectionTop + ref.offsetHeight / 2;
            
            // 섹션이 뷰포트에 얼마나 보이는지 계산
            const visibleTop = Math.max(sectionTop, viewportTop);
            const visibleBottom = Math.min(sectionBottom, viewportBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibilityRatio = visibleHeight / viewportHeight;
            
            // 섹션 중앙과 뷰포트 중앙 사이의 거리 (가까울수록 좋음)
            const distanceFromCenter = Math.abs(viewportCenter - sectionCenter);
            const distanceScore = 1 - (distanceFromCenter / viewportHeight); // 0~1 범위
            
            // 종합 점수: 가시성 60% + 중앙 거리 40%
            const score = visibilityRatio * 0.6 + distanceScore * 0.4;
            
            if (score > bestScore) {
              bestScore = score;
              bestIndex = index;
            }
          }
        });
        
        // 섹션 전환: 점수가 충분히 높고 이전과 다를 때만 업데이트
        if (bestIndex !== lastActiveSection && bestScore > 0.3) {
          setActiveSection(bestIndex);
          lastActiveSection = bestIndex;
        }
        
        ticking = false;
      });
    };

    // 초기 실행을 위한 지연
    const timeoutId = setTimeout(() => {
      const rightPanel = rightPanelRef.current;
      if (rightPanel) {
        rightPanel.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // 초기 실행
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      const rightPanel = rightPanelRef.current;
      if (rightPanel) {
        rightPanel.removeEventListener('scroll', handleScroll);
      }
    };
  }, [data]);

 // Issue Type 데이터 집계 함수
  const getIssueTypeData = () => {
  const issueTypeCounts = {};
  let totalTurns = 0;
  
  filteredSessions.forEach(session => {
    session.turns.forEach(turn => {
      let issueType = turn.issue_type || 'unknown';
      if (issueType === 'none') {
        issueType = 'No Issues';
      }
      issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
      totalTurns++;
    });
  });
  
  return Object.entries(issueTypeCounts).map(([issueType, count]) => ({
    name: issueType,
    value: count,
    percentage: ((count / totalTurns) * 100).toFixed(1),
    fill: ISSUE_COLORS[issueType] || ISSUE_COLORS['unknown']
  }));
  };
  // Purpose 데이터 집계 함수
  const getPurposeData = () => {
    const purposeCounts = {};
    let totalTurns = 0;
    
    filteredSessions.forEach(session => {
      session.turns.forEach(turn => {
        const purpose = turn.purpose || 'Unknown';
        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
        totalTurns++;
      });
    });
    
    return Object.entries(purposeCounts).map(([purpose, count]) => ({
      name: purpose,
      value: count,
      percentage: ((count / totalTurns) * 100).toFixed(1),
      fill: PURPOSE_COLORS[purpose] || PURPOSE_COLORS['Unknown']
    }));
  };
  const ISSUE_COLORS = {
    'No Issues': '#16a34a',
    'factual_error': '#ef4444',
    'misalignment': '#F5840B',
    'api_call_error': '#6b7280',
    'api_key_missing': '#9ca3af',
    'unknown': '#d1d5db'
  };
  // 차트 색상 배열
  const PURPOSE_COLORS = {
    'Information Seeking': '#0ea5e9',
    'Content Generation': '#16a34a', 
    'Language Refinement': '#E6B000',
    'Meta-cognitive Engagement': '#8b5cf6',
    'Conversational Repair': '#ec4899',
    'Unknown': '#9ca3af'
  };
  // Purpose별 이미지 경로 매핑
  const PURPOSE_IMAGES = {
    'Information Seeking': '/icons/purpose_informationSeeking.png',
    'Content Generation': '/icons/purpose_contentGeneration.png',
    'Language Refinement': '/icons/purpose_LanguageRefinement.png',
    'Meta-cognitive Engagement': '/icons/purpose_MetaCognitiveEngagement.png',
    'Conversational Repair': '/icons/purpsoe_ConversationalRepair.png',
    'Unknown': null // Unknown은 기본 색상 사용
  };

  // Legend 컴포넌트
  const ChartLegend = ({ colorMap, nameFormatter = (name) => name }) => {
    return (
      <div style={{ width: '20%', paddingTop: '20px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Legend</div>
          {Object.entries(colorMap).map(([key, color]) => (
            <div key={`legend-${key}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                width: '14px',
  height: '14px',
                backgroundColor: color,
                marginRight: '10px',
                borderRadius: '3px'
              }}></div>
              <span style={{ fontSize: '14px' }}>{nameFormatter(key)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 평균 점수 표시 컴포넌트
  const AverageScoreDisplay = ({ label, score, maxScore = 5, variant = 'default' }) => {
    const baseStyle = {
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center',
      width: '100%'
    };

    if (variant === 'compact') {
      return (
        <div style={baseStyle}>
          <strong>{label}:</strong> {score} / {maxScore}
        </div>
      );
    }

    if (variant === 'bordered') {
      return (
        <div style={{
          ...baseStyle,
          marginTop: '15px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '15px'
        }}>
          <strong>{label}:</strong> {score} / {maxScore}
        </div>
      );
    }

    // default variant
    return (
      <div style={baseStyle}>
        <strong>{label}:</strong> {score} / {maxScore}
      </div>
    );
  };

  // 산점도 데이터 생성 함수
  const getScatterData = () => {
    const scatterData = [];
    let turnIndex = 0;
    
    data.sessions.forEach(session => {
      session.turns.forEach((turn, index) => {
        scatterData.push({
          x: turnIndex + 1,
          y: turn.hallucination_score || 0,
          purpose: turn.purpose || 'Unknown',
          fill: PURPOSE_COLORS[turn.purpose] || PURPOSE_COLORS['Unknown'],
          turnNumber: turn.turn || turnIndex + 1,
          issueType: turn.issue_type || 'unknown',
          sessionIndex: data.sessions.indexOf(session)
        });
        turnIndex++;
      });
    });
    
    return scatterData;
  };

  // 세션 클릭 핸들러
  const handleSessionClick = (index) => {
    if (selectedSession === index) {
      setSelectedSession(null); // 같은 세션 클릭 시 선택 해제
    } else {
      setSelectedSession(index);
    }
  };

  // 필터링된 데이터 (선택된 세션이 있으면 해당 세션만, 없으면 전체)
  const filteredSessions = selectedSession !== null ? [data.sessions[selectedSession]] : data.sessions;
  
  // 데이터 요약 계산
  const totalTurns = selectedSession !== null ? data.sessions[selectedSession].turnCount : data.totalTurns;
  const totalFiles = selectedSession !== null ? 1 : data.totalFiles;
  const avgTurns = (totalTurns / totalFiles).toFixed(1);
  
  const avgOverReliance = (
    filteredSessions.reduce((sum, s) => sum + s.over_reliance_score, 0) / filteredSessions.length
  ).toFixed(1);

  const avgHallucination = (() => {
    let totalHallucinationScore = 0;
    let totalTurnCount = 0;
    
    filteredSessions.forEach(session => {
      session.turns.forEach(turn => {
        totalHallucinationScore += (turn.hallucination_score || 0);
        totalTurnCount++;
      });
    });
    
    return totalTurnCount > 0 ? (totalHallucinationScore / totalTurnCount).toFixed(1) : '0.0';
  })();

  // 가장 많이 사용된 Purpose
  const mostCommonPurpose = getPurposeData().sort((a, b) => b.value - a.value)[0];

  // 3가지 키 메트릭스 정의
  const keyMetrics = [
    {
      id: 1,
      title: 'Average Hallucination',
      value: `${avgHallucination}/5`,
      color: '#f59e0b',
      description: 'How often does ChatGPT hallucinate?',
      large: true
    },
    {
      id: 2,
      title: 'Over-reliance Score',
      value: `${avgOverReliance}/5`,
      color: '#f59e0b',
      description: 'How dependent are you on AI?',
      large: true
    },
    {
      id: 3,
      title: 'Most Common Purpose',
      value: mostCommonPurpose?.name || 'N/A',
      color: '#f59e0b',
      description: `${mostCommonPurpose?.percentage || 0}% of conversations`,
      large: false
    }
  ];

  // 현재 활성 섹션에 따라 왼쪽 패널에 표시할 메트릭 결정
  const getCurrentMetric = () => {
    // 섹션 구조:
    // 1: 평균 Turn 분석
    // 2: 메트릭 1 (Hallucination Score)
    // 3: 메트릭 1 상세 (Hallucination Issue Types)
    // 4: Hallucination Reasons
    // 5: 메트릭 2 (Over-reliance Score)
    // 6: 메트릭 2 상세
    // 7: 메트릭 3 (Most Common Purpose)
    // 8: 메트릭 3 상세
    // 9: 통합 분석
    // 10: Upload & Compare
    
    if (activeSection === 1) {
      return null; // 평균 Turn 분석에서는 메트릭 표시 안 함
    } else if (activeSection >= 2 && activeSection <= 4) {
      return keyMetrics[0]; // Hallucination Score
    } else if (activeSection === 5 || activeSection === 6) {
      return keyMetrics[1]; // Over-reliance Score
    } else if (activeSection === 7 || activeSection === 8) {
      return keyMetrics[2]; // Most Common Purpose
    } else if (activeSection === 9 || activeSection === 10) {
      return null; // 통합 분석과 Upload & Compare에서는 메트릭 표시 안 함
    }
    return null;
  };

  const currentMetric = getCurrentMetric();

  // Upload 버튼 클릭 핸들러
  const handleUpload = async () => {
    try {
      setUploading(true);
      setUploadError(null);
      
      // Firebase에 데이터 업로드
      await uploadAnalysisData(data);
      
      // 업로드 성공 시 CompareData 페이지로 이동
      if (onNavigateToCompare) {
        onNavigateToCompare();
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      setUploadError('업로드에 실패했습니다. Firebase 설정을 확인해주세요.');
      setUploading(false);
    }
  };
  // JSON 다운로드 핸들러
  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollytellingContainer>
      <Header>
        <Title>ChatGPT log Analyzer</Title>
        <HeaderButtons>
          {selectedSession !== null && (
            <ViewingBadge>
              Viewing: {data.sessions[selectedSession].fileName}
              <CloseButton onClick={() => setSelectedSession(null)}>
                ✕
              </CloseButton>
            </ViewingBadge>
          )}
          <DownloadButton onClick={handleDownloadJSON}>Download Analysis JSON</DownloadButton>
          <ResetButton onClick={onReset}>Reset & Upload New Data</ResetButton>
        </HeaderButtons>
      </Header>
      
      <LeftPanel>
        {/* 인트로 - 섹션 1 */}
        <KeyMetricCard active={activeSection === 1}>
          <IntroTitle>
            Understanding Your AI Conversations
          </IntroTitle>
          <IntroDescription>
            Dive into your conversation patterns across three critical dimensions: 
            accuracy of responses, dependency levels, and conversation purposes.
          </IntroDescription>
        </KeyMetricCard>
        
        {/* 메트릭 1: Hallucination Score */}
        <KeyMetricCard active={activeSection === 2}>
          <KeyMetricTitle>{keyMetrics[0].title}</KeyMetricTitle>
          <KeyMetricValue large={keyMetrics[0].large} color={keyMetrics[0].color}>
            {keyMetrics[0].value}
          </KeyMetricValue>
          <KeyMetricDescription>{keyMetrics[0].description}</KeyMetricDescription>
        </KeyMetricCard>
        
        {/* 섹션 3, 4: Hallucination 관련 세션 리스트 - 모든 세션 표시 */}
        <SessionListComponent 
          active={activeSection === 3 || activeSection === 4}
          sessions={data.sessions}
          color="#facc15"
          selectedSession={selectedSession}
          onSessionClick={handleSessionClick}
          renderContent={(session) => {
            const avgHallucination = session.turns.reduce((sum, turn) => 
              sum + (turn.hallucination_score || 0), 0) / session.turnCount;
            
            return (
              <div style={{ marginTop: '6px' }}>
                Avg Hallucination Score: <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                  {avgHallucination.toFixed(1)}/5
                </span>
              </div>
            );
          }}
        />
        
        {/* 메트릭 2: Over-reliance Score */}
        <KeyMetricCard active={activeSection === 5}>
          <KeyMetricTitle>{keyMetrics[1].title}</KeyMetricTitle>
          <KeyMetricValue large={keyMetrics[1].large} color={keyMetrics[1].color}>
            {keyMetrics[1].value}
          </KeyMetricValue>
          <KeyMetricDescription>{keyMetrics[1].description}</KeyMetricDescription>
        </KeyMetricCard>
        
        {/* 섹션 6: Over-reliance 관련 세션 리스트 */}
        <SessionListComponent 
          active={activeSection === 6}
          sessions={data.sessions}
          color="#f59e0b"
          selectedSession={selectedSession}
          onSessionClick={handleSessionClick}
          renderContent={(session) => (
            <div style={{ marginTop: '6px' }}>
              Over-reliance Score: <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                {session.over_reliance_score}/5
              </span>
            </div>
          )}
        />
        
        {/* 메트릭 3: Most Common Purpose */}
        <KeyMetricCard active={activeSection === 7}>
          <KeyMetricTitle>{keyMetrics[2].title}</KeyMetricTitle>
          <KeyMetricValue large={keyMetrics[2].large} color={keyMetrics[2].color} style={{fontSize: '40px'}}>
            {keyMetrics[2].value}
          </KeyMetricValue>
          <KeyMetricDescription>{keyMetrics[2].description}</KeyMetricDescription>
        </KeyMetricCard>
        
        {/* 섹션 8: Purpose 관련 세션 리스트 */}
        <SessionListComponent 
          active={activeSection === 8}
          sessions={data.sessions}
          color="#16a34a"
          selectedSession={selectedSession}
          onSessionClick={handleSessionClick}
          renderContent={(session) => {
            const purposeCounts = {};
            session.turns.forEach(turn => {
              const purpose = turn.purpose || 'Unknown';
              purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
            });
            const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
            
            return topPurpose && (
              <div style={{ marginTop: '6px' }}>
                Top Purpose: <span style={{ color: PURPOSE_COLORS[topPurpose[0]] || '#16a34a', fontWeight: '500' }}>
                  {topPurpose[0]}
                </span> ({topPurpose[1]})
              </div>
            );
          }}
        />
        
        {/* 섹션 9: 통합 분석 세션 리스트 */}
        <SessionListComponent 
          active={activeSection === 9}
          sessions={data.sessions}
          color="#8b5cf6"
          selectedSession={selectedSession}
          onSessionClick={handleSessionClick}
          renderContent={(session) => {
            const avgHallucination = session.turns.reduce((sum, turn) => 
              sum + (turn.hallucination_score || 0), 0) / session.turnCount;
            
            // 이슈 타입별 카운트 계산
            const issueTypeCounts = {};
            session.turns.forEach(turn => {
              let issueType = turn.issue_type || 'unknown';
              if (issueType === 'none') {
                issueType = 'No Issues';
              } else if (!issueType || issueType === 'unknown') {
                issueType = 'unknown';
              }
              issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
            });
            const topIssueType = Object.entries(issueTypeCounts).sort((a, b) => b[1] - a[1])[0];
            const topIssueTypeName = topIssueType ? topIssueType[0] : 'unknown';
            const hallucinationColor = ISSUE_COLORS[topIssueTypeName] || ISSUE_COLORS['unknown'];
            
            const purposeCounts = {};
            session.turns.forEach(turn => {
              const purpose = turn.purpose || 'Unknown';
              purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
            });
            const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
            
            return (
              <>
                <div style={{ marginTop: '6px' }}>
                  Avg Hallucination Score: <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                    {avgHallucination.toFixed(1)}/5
                  </span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  Over-reliance Score: <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                    {session.over_reliance_score}/5
                  </span>
                </div>
                {topPurpose && (
                  <div style={{ marginTop: '4px' }}>
                    Top Purpose: <span style={{ color: PURPOSE_COLORS[topPurpose[0]] || '#16a34a', fontWeight: '500' }}>
                      {topPurpose[0]}
                    </span>
                  </div>
                )}
              </>
            );
          }}
        />
        
        {/* 섹션 10: Upload & Compare */}
        <KeyMetricCard active={activeSection === 10}>
          <IntroTitle style={{ fontSize: '32px' }}>
            What's Your Score?
          </IntroTitle>
          <IntroDescription style={{ fontSize: '16px', marginBottom: '30px' }}>
            Compare your AI usage patterns with others
          </IntroDescription>
          
          {/* Privacy Notice */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'left',
            maxWidth: '400px'
          }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '15px', fontWeight: '600' }}>
                  Privacy Protected
                </h4>
                <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
                  Only your <strong>analyzed scores</strong> will be uploaded. 
                  Your <strong>conversation contents are NOT uploaded</strong> and remain completely private.
                </p>
              </div>
          </div>
        </KeyMetricCard>
      </LeftPanel>

      <RightPanel ref={rightPanelRef}>
        {/* 섹션 1: 평균 Turn 분석 */}
        <Section 
          ref={el => sectionRefs.current[1] = el}
          active={activeSection === 1}
        >
          <SectionTitle>Conversation Activity Overview</SectionTitle>
          <SectionDescription>
            How active are your ChatGPT conversations?
          </SectionDescription>
          
          <StatsContainer>
            <StatsGrid>
              <StatCard color="#facc15">
                <StatLabel>Total Sessions</StatLabel>
                <StatValue color="#facc15">{totalFiles}</StatValue>
                <StatUnit>sessions</StatUnit>
              </StatCard>
              <StatCard color="#facc15">
                <StatLabel>Total Conversations</StatLabel>
                <StatValue color="#facc15">{totalTurns}</StatValue>
                <StatUnit>turns</StatUnit>
              </StatCard>
              <StatCard color="#f59e0b">
                <StatLabel>Average Turns</StatLabel>
                <StatValue color="#f59e0b">{avgTurns}</StatValue>
                <StatUnit>turns</StatUnit>
              </StatCard>
            </StatsGrid>
            <SummaryBox>
              <SummaryText>
                <strong>Analysis:</strong> On average, <strong>{avgTurns} turns</strong> of conversation occurred per session. 
                A total of <strong>{totalTurns} turns</strong> of conversation were analyzed across <strong>{totalFiles} sessions</strong>.
              </SummaryText>
            </SummaryBox>
          </StatsContainer>
        </Section>

        {/* 섹션 2: 메트릭 1 - Hallucination Score */}
        <Section 
          ref={el => sectionRefs.current[2] = el}
          active={activeSection === 2}
        >
          <SectionTitle>Hallucination Score</SectionTitle>
          <SectionDescription>
            How often does ChatGPT hallucinate in your conversations?
          </SectionDescription>
        </Section>

        {/* 섹션 3: 메트릭 1 상세 - Hallucination Issue Types */}
        <Section 
          ref={el => sectionRefs.current[3] = el}
          active={activeSection === 3}
        >
          <SectionTitle>Hallucination Issue Types</SectionTitle>
          <SectionDescription>
            What types of hallucinations are occurring?
          </SectionDescription>
          <GraphCard>
            <SessionBadge isSelected={selectedSession !== null}>
              {selectedSession !== null ? `Selected Session: ${data.sessions[selectedSession].fileName}` : 'All Sessions'}
            </SessionBadge>
            <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
              <ResponsiveContainer width="80%" height={250}>
                <BarChart data={getIssueTypeData()} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" height={40} fontSize={11}/>
                  <YAxis 
                    label={{ value: 'Turn Count', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '11px' } }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} turns (${getIssueTypeData().find(d => d.value === value)?.percentage || 0}%)`, 
                      'Turns'
                    ]}
                  />
                  <Bar dataKey="value">
                    {getIssueTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend 
                colorMap={(() => {
                  const issueData = getIssueTypeData();
                  const currentColorMap = {};
                  issueData.forEach(item => {
                    currentColorMap[item.name] = item.fill;
                  });
                  return currentColorMap;
                })()}
                nameFormatter={(name) => {
                  if (name === 'factual_error') return 'Factual Error';
                  if (name === 'api_call_error') return 'API Call Error';
                  if (name === 'api_key_missing') return 'API Key Missing';
                  return name;
                }}
              />
            </div>
            {/* 이슈 타입 설명 */}
            <DefinitionsBox>
              <DefinitionsTitle>Issue Type Definitions</DefinitionsTitle>
              <DefinitionsList>
                <DefinitionItem>
                  <DefinitionLabel color="#ef4444">Factual Error:</DefinitionLabel>
                  <DefinitionText>
                    When the response contains incorrect, misleading, or fabricated information
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <DefinitionLabel color="#F5840B">Misalignment:</DefinitionLabel>
                  <DefinitionText>
                    When the response does not directly address the user's last intent
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <DefinitionLabel color="#16a34a">No Issues:</DefinitionLabel>
                  <DefinitionText>
                    When the hallucination score is 1 (perfect)
                  </DefinitionText>
                </DefinitionItem>
              </DefinitionsList>
            </DefinitionsBox>
            <AverageScoreDisplay 
              label="Avg Hallucination Score" 
              score={avgHallucination} 
              maxScore={5}
              variant="bordered"
            />
          </GraphCard>
        </Section>

        {/* 섹션 4: Hallucination Reasons */}
        <Section 
          ref={el => sectionRefs.current[4] = el}
          active={activeSection === 4}
        >
          <SectionTitle>Hallucination Reasons</SectionTitle>
          <SectionDescription>
            Why did these hallucinations happen?
          </SectionDescription>
          
          <GraphCard>
            <SessionBadge isSelected={selectedSession !== null}>
              {selectedSession !== null ? `Selected Session: ${data.sessions[selectedSession].fileName}` : 'All Sessions'}
            </SessionBadge>
            {(() => {
              // 특정 세션이 선택되었을 때는 해당 세션의 모든 turn reason 표시
              if (selectedSession !== null) {
                const session = data.sessions[selectedSession];
                const hallucinationData = session.turns
                  .map((turn, turnIndex) => ({
                    turn,
                    turnIndex: turnIndex + 1, // Turn 번호 (1부터 시작)
                    turnNumber: turn.turn || turnIndex + 1
                  }))
                  .filter(({ turn }) => 
                    turn.hallucination_reason && 
                    turn.hallucination_reason !== 'none' && 
                    turn.hallucination_score > 0
                  );

                if (hallucinationData.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: '#9ca3af',
                      fontSize: '18px'
                    }}>
                      No significant hallucinations detected in this session
                    </div>
                  );
                }

                return (
                  <HallucinationList style={{ 
                    marginTop: 0, 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '20px', 
                    backgroundColor: 'transparent', 
                    boxShadow: 'none', 
                    border: 'none',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {hallucinationData.map(({ turn, turnIndex, turnNumber }) => {
                      const scoreColor = turn.hallucination_score >= 3 ? '#ef4444' : 
                                        turn.hallucination_score >= 2 ? '#f59e0b' : 
                                        '#16a34a';
                      const issueType = turn.issue_type && turn.issue_type !== 'none' && turn.issue_type !== 'unknown'
                        ? turn.issue_type
                        : 'unknown';
                      
                      // Issue type 이름 포맷팅
                      const formatIssueType = (type) => {
                        if (type === 'factual_error') return 'factual_error';
                        if (type === 'api_call_error') return 'api_call_error';
                        if (type === 'api_key_missing') return 'api_key_missing';
                        return type;
                      };
                      
                      // Issue type에 맞는 배경색 가져오기
                      const issueBgColor = ISSUE_COLORS[issueType] || ISSUE_COLORS['unknown'];
                      
                      return (
                        <HallucinationItem key={`${selectedSession}-${turnIndex}`}>
                          <ItemHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TypeText bgColor={issueBgColor}>{formatIssueType(issueType)}</TypeText>
                              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                Turn {turnNumber}
                              </span>
                            </div>
                            <ScoreText color={scoreColor}>
                              Score {turn.hallucination_score}/5
                            </ScoreText>
                          </ItemHeader>
                          <ReasonText>{turn.hallucination_reason}</ReasonText>
                        </HallucinationItem>
                      );
                    })}
                  </HallucinationList>
                );
              }

              // 전체 세션일 때는 상위 3개만 표시 (기존 로직)
              const hallucinationData = filteredSessions.flatMap((session, sessionIndex) => 
                session.turns
                  .filter(turn => 
                    turn.hallucination_reason && 
                    turn.hallucination_reason !== 'none' && 
                    turn.hallucination_score > 0
                  )
                  .map((turn, turnIndex) => ({
                    turn,
                    sessionIndex,
                    turnIndex
                  }))
              )
              .sort((a, b) => b.turn.hallucination_score - a.turn.hallucination_score)
              .slice(0, 3);

              if (hallucinationData.length === 0) {
                return (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#9ca3af',
                    fontSize: '18px'
                  }}>
                    No significant hallucinations detected
                  </div>
                );
              }

              return (
                <>
                  <HallucinationList style={{ marginTop: 0, width: '100%', maxWidth: '100%', padding: '20px', backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }}>
                    {hallucinationData.map(({ turn, sessionIndex, turnIndex }) => {
                      const scoreColor = turn.hallucination_score >= 3 ? '#ef4444' : 
                                        turn.hallucination_score >= 2 ? '#f59e0b' : 
                                        '#16a34a';
                      const issueType = turn.issue_type && turn.issue_type !== 'none' && turn.issue_type !== 'unknown'
                        ? turn.issue_type
                        : 'unknown';
                      
                      // Issue type 이름 포맷팅
                      const formatIssueType = (type) => {
                        if (type === 'factual_error') return 'factual_error';
                        if (type === 'api_call_error') return 'api_call_error';
                        if (type === 'api_key_missing') return 'api_key_missing';
                        return type;
                      };
                      
                      // Issue type에 맞는 배경색 가져오기
                      const issueBgColor = ISSUE_COLORS[issueType] || ISSUE_COLORS['unknown'];
                      
                      return (
                        <HallucinationItem key={`${sessionIndex}-${turnIndex}`}>
                          <ItemHeader>
                            <TypeText bgColor={issueBgColor}>{formatIssueType(issueType)}</TypeText>
                            <ScoreText color={scoreColor}>
                              Score {turn.hallucination_score}/5
                            </ScoreText>
                          </ItemHeader>
                          <ReasonText>{turn.hallucination_reason}</ReasonText>
                        </HallucinationItem>
                      );
                    })}
                  </HallucinationList>
                  <AverageScoreDisplay 
                    label="Avg Hallucination Score" 
                    score={avgHallucination} 
                    maxScore={5}
                    variant="bordered"
                  />
                </>
              );
            })()}
          </GraphCard>
        </Section>

        {/* 섹션 5: 메트릭 2 - Over-reliance Score */}
        <Section 
          ref={el => sectionRefs.current[5] = el}
          active={activeSection === 5}
        >
          <SectionTitle>Over-reliance Score</SectionTitle>
          <SectionDescription>
            How dependent are you on ChatGPT?
          </SectionDescription>
        </Section>

        {/* 섹션 6: 메트릭 2 상세 - Over-reliance 분석 */}
        <Section 
          ref={el => sectionRefs.current[6] = el}
          active={activeSection === 6}
        >
          <SectionTitle>Over-reliance & Hallucination</SectionTitle>
          <SectionDescription>
            {selectedSession === null 
              ? "Do you rely more on ChatGPT when it hallucinates more?"
              : "When did hallucinations occur in this conversation?"
            }
          </SectionDescription>
          
          {selectedSession === null ? (
            // 전체 세션 뷰: Bar chart
            <GraphCard>
              <SessionBadge isSelected={false}>
                All Sessions
              </SessionBadge>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  barCategoryGap="20%"
                  barGap={0}
                  data={filteredSessions.map((session, index) => {
                    const avgHallucination = session.turns.reduce((sum, turn) => 
                      sum + (turn.hallucination_score || 0), 0) / session.turnCount;
                    
                    // 'ChatGPT-' 접두사 제거
                    let displayName = session.fileName;
                    if (displayName.startsWith('ChatGPT-')) {
                      displayName = displayName.substring(8);
                    }
                    // 한글 문자를 안전하게 자르기 (서로게이트 페어 고려)
                    if (displayName.length > 20) {
                      // 유니코드 문자 단위로 자르기 (서로게이트 페어 보존)
                      const chars = Array.from(displayName);
                      displayName = chars.slice(0, 20).join('') + '...';
                    }
                    
                    return {
                      name: displayName,
                      fullName: session.fileName,
                      avgHallucination: parseFloat(avgHallucination.toFixed(1)),
                      overReliance: session.over_reliance_score,
                      turns: session.turnCount
                    };
                  })}
                  margin={{ top: 20, right: 20, bottom: 32, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    height={40}
                    fontSize={11}
                    angle={0}
                    textAnchor="middle"
                    label={{ value: 'Session', position: 'bottom', offset: 5, fontSize: '12px' }}
                  />
                  <YAxis 
                    label={{ value: 'Score', angle: -90, position: 'insideLeft', textAnchor: 'middle', fontSize: '11px' }}
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}>
                            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>{data.fullName}</p>
                            <p style={{ margin: 0, color: '#f59e0b' }}>Avg Hallucination Score: {data.avgHallucination}/5</p>
                            <p style={{ margin: 0, color: '#f59e0b' }}>Over-reliance Score: {data.overReliance}/5</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Turns: {data.turns}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend align="right" verticalAlign="top"/>
                  <Bar dataKey="avgHallucination" fill="#facc15" name="Avg Hallucination" />
                  <Bar dataKey="overReliance" fill="#f59e0b" name="Over-reliance" />
                </BarChart>
              </ResponsiveContainer>
              
              <SummaryBox>
                <SummaryText>
                  <strong>Analysis:</strong> Each bar represents a session. The chart compares average hallucination scores (yellow) 
                  and over-reliance levels (orange) across all sessions. Higher bars indicate higher scores in each category.
                </SummaryText>
              </SummaryBox>
              
              <AverageScoreDisplay 
                label="Avg Over-reliance Score" 
                score={avgOverReliance} 
                maxScore={5}
                variant="bordered"
              />
            </GraphCard>
          ) : (
            // 특정 세션 뷰: 턴별 할루시네이션 추이
            <StatsContainer>
              <SessionBadge isSelected={true} style={{ alignSelf: 'flex-start' }}>
                Selected Session: {data.sessions[selectedSession].fileName}
              </SessionBadge>
              {/* 평균 할루시네이션, Over-reliance Score와 Advice 크게 표시 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 2fr',
                gap: '20px',
                marginBottom: '48px'
              }}>
                <StatCard style={{ padding: '15px' }}>
                  <StatLabel>Avg Hallucination</StatLabel>
                  <StatValue style={{ fontSize: '40px', color: '#f59e0b' }}>
                    {(data.sessions[selectedSession].turns.reduce((sum, turn) => 
                      sum + (turn.hallucination_score || 0), 0) / data.sessions[selectedSession].turnCount).toFixed(1)}
                    <StatUnit>/5</StatUnit>
                  </StatValue>
                </StatCard>
                
                <StatCard style={{ padding: '15px' }}>
                  <StatLabel>Over-reliance Score</StatLabel>
                  <StatValue style={{ fontSize: '40px', color: '#f59e0b' }}>
                    {data.sessions[selectedSession].over_reliance_score}
                    <StatUnit>/5</StatUnit>
                  </StatValue>
                </StatCard>
                
                <div style={{
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#92400e', fontSize: '16px' }}>
                    Advice
                  </div>
                  <div style={{ color: '#92400e', fontSize: '15px', lineHeight: '1.5' }}>
                    {data.sessions[selectedSession].over_reliance_advice || 'No specific advice available for this session.'}
                  </div>
                </div>
              </div>

              {/* 턴별 할루시네이션 차트 */}
              <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
                <ResponsiveContainer width="80%" height={350}>
                  <LineChart 
                    data={data.sessions[selectedSession].turns.map((turn, index) => {
                      let issueType = turn.issue_type || 'unknown';
                      if (issueType === 'none') {
                        issueType = 'No Issues';
                      }
                      return {
                        turn: index + 1,
                        hallucination: turn.hallucination_score || 0,
                        purpose: turn.purpose || 'Unknown',
                        purposeColor: PURPOSE_COLORS[turn.purpose || 'Unknown'] || PURPOSE_COLORS['Unknown'],
                        imagePath: PURPOSE_IMAGES[turn.purpose || 'Unknown'],
                        issueType: issueType,
                        issueColor: ISSUE_COLORS[issueType] || ISSUE_COLORS['unknown']
                      };
                    })}
                    margin={{ top: 10, right: 20, bottom: 50, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="turn" 
                      label={{ value: 'Turn Number', position: 'bottom', fontSize: '11px' }}
                    />
                    <YAxis 
                      label={{ value: 'Hallucination Score', angle: -90, position: 'insideLeft', textAnchor: 'middle', fontSize: '11px' }}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: 'white',
                              padding: '10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Turn {data.turn}</p>
                              <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>Hallucination Score: {data.hallucination}/5</p>
                              <p style={{ margin: 0, color: data.purposeColor, fontWeight: '500', fontSize: '13px' }}>Purpose: {data.purpose}</p>
                              <p style={{ margin: 0, color: data.issueColor, fontWeight: '500', fontSize: '13px' }}>Issue Type: {data.issueType}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hallucination" 
                      stroke="none"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={6} 
                            fill={payload.issueColor || '#f59e0b'}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill={payload.issueColor || '#f59e0b'}
                            stroke="#fff"
                            strokeWidth={3}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <ChartLegend 
                  colorMap={(() => {
                    const issueTypes = new Set();
                    data.sessions[selectedSession].turns.forEach(turn => {
                      let issueType = turn.issue_type || 'unknown';
                      if (issueType === 'none') {
                        issueType = 'No Issues';
                      }
                      issueTypes.add(issueType);
                    });
                    const currentColorMap = {};
                    issueTypes.forEach(issueType => {
                      currentColorMap[issueType] = ISSUE_COLORS[issueType] || ISSUE_COLORS['unknown'];
                    });
                    return currentColorMap;
                  })()}
                  nameFormatter={(name) => {
                    if (name === 'factual_error') return 'Factual Error';
                    if (name === 'api_call_error') return 'API Call Error';
                    if (name === 'api_key_missing') return 'API Key Missing';
                    return name;
                  }}
                />
              </div>
              
              <SummaryBox>
                <SummaryText>
                  <strong>Analysis:</strong> This chart shows how hallucination scores varied across different turns in the conversation. 
                  The over-reliance score of {data.sessions[selectedSession].over_reliance_score}/5 indicates 
                  {data.sessions[selectedSession].over_reliance_score >= 4 ? ' high dependency' : 
                   data.sessions[selectedSession].over_reliance_score >= 3 ? ' moderate dependency' : 
                   ' low dependency'} on AI responses.
                </SummaryText>
              </SummaryBox>
            </StatsContainer>
          )}
        </Section>

        {/* 섹션 7: 메트릭 3 - Most Common Purpose */}
        <Section 
          ref={el => sectionRefs.current[7] = el}
          active={activeSection === 7}
        >
          <SectionTitle>Your Primary Use Case</SectionTitle>
          <SectionDescription>
            What do you use ChatGPT for most often?
          </SectionDescription>
        </Section>

        {/* 섹션 8: 메트릭 3 상세 - Purpose 상세 분석 */}
        <Section 
          ref={el => sectionRefs.current[8] = el}
          active={activeSection === 8}
        >
          <SectionTitle>Purpose Distribution</SectionTitle>
          <SectionDescription>
            Which purposes do you use ChatGPT for most often?
          </SectionDescription>
          <GraphCard>
            <SessionBadge isSelected={selectedSession !== null}>
              {selectedSession !== null ? `Selected Session: ${data.sessions[selectedSession].fileName}` : 'All Sessions'}
            </SessionBadge>
            <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
              <ResponsiveContainer width="80%" height={350}>
                <BarChart data={getPurposeData()} margin={{ top: 20, right: 20, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    height={40}
                    fontSize={11}
                    angle={0}
                    textAnchor="middle"
                    label={{ value: 'Purpose Type', position: 'bottom', offset: 5, fontSize: '12px' }}
                  />
                  <YAxis 
                    fontSize={11}
                    label={{ value: 'Turn Count', angle: -90, position: 'insideLeft', textAnchor: 'middle', style: { fontSize: '11px' } }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}>
                            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>{data.name}</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                              {data.value} turns ({data.percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value">
                    {getPurposeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend 
                colorMap={(() => {
                  const purposeData = getPurposeData();
                  const currentColorMap = {};
                  purposeData.forEach(item => {
                    currentColorMap[item.name] = item.fill;
                  });
                  return currentColorMap;
                })()}
              />
            </div>
            {/* Purpose 설명 */}
            <DefinitionsBox>
              <DefinitionsTitle>Purpose Definitions</DefinitionsTitle>
              <DefinitionsList>
                <DefinitionItem>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={PURPOSE_IMAGES['Information Seeking']} 
                      alt="Information Seeking" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <DefinitionLabel color="#0ea5e9">Information Seeking:</DefinitionLabel>
                  </div>
                  <DefinitionText>
                    Requesting explanations, fact-checking, or exploring background information
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={PURPOSE_IMAGES['Content Generation']} 
                      alt="Content Generation" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <DefinitionLabel color="#16a34a">Content Generation:</DefinitionLabel>
                  </div>
                  <DefinitionText>
                    Creating new content such as text, code, tables, or creative ideas
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={PURPOSE_IMAGES['Language Refinement']} 
                      alt="Language Refinement" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <DefinitionLabel color="#E6B000">Language Refinement:</DefinitionLabel>
                  </div>
                  <DefinitionText>
                    Improving text quality through grammar correction, translation, or clarification
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={PURPOSE_IMAGES['Meta-cognitive Engagement']} 
                      alt="Meta-cognitive Engagement" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <DefinitionLabel color="#8b5cf6">Meta-cognitive Engagement:</DefinitionLabel>
                  </div>
                  <DefinitionText>
                    Reflecting on learning processes and correcting misconceptions
                  </DefinitionText>
                </DefinitionItem>
                <DefinitionItem>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={PURPOSE_IMAGES['Conversational Repair']} 
                      alt="Conversational Repair" 
                      style={{ width: '20px', height: '20px' }}
                    />
                    <DefinitionLabel color="#ec4899">Conversational Repair:</DefinitionLabel>
                  </div>
                  <DefinitionText>
                    Correcting errors or resetting context when conversation goes off track
                  </DefinitionText>
                </DefinitionItem>
              </DefinitionsList>
            </DefinitionsBox>
            <div style={{ 
              marginTop: '20px', 
              fontSize: '14px', 
              color: '#6b7280',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '15px',
              textAlign: 'center',
              width: '100%'
            }}>
              <strong>Total Turns:</strong> {totalTurns}
            </div>
          </GraphCard>
        </Section>

        {/* 섹션 9: 통합 분석 - 의존도 x 할루시네이션 x 목적 */}
        <Section 
          ref={el => sectionRefs.current[9] = el}
          active={activeSection === 9}
        >
          <SectionTitle>The Complete Picture</SectionTitle>
          <SectionDescription>
            {selectedSession === null 
              ? "How do accuracy, dependency, and usage patterns connect?"
              : "What happened at each step of this conversation?"
            }
          </SectionDescription>
          
          {selectedSession === null ? (
            // 전체 세션 뷰: Scatter plot with purpose colors
            <StatsContainer>
              <SessionBadge isSelected={false} style={{ alignSelf: 'flex-start' }}>
                All Sessions
              </SessionBadge>
              <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
                <ResponsiveContainer width="80%" height={450}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Avg Hallucination"
                      label={{ value: 'Average Hallucination Score', position: 'bottom', fontSize: '11px' }}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Over-reliance"
                      label={{ value: 'Over-reliance Score', angle: -90, position: 'insideLeft', textAnchor: 'middle', fontSize: '11px' }}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: 'white',
                              padding: '12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>{data.name}</p>
                              <p style={{ margin: 0, color: '#f59e0b' }}>Avg Hallucination Score: {data.x.toFixed(1)}/5</p>
                              <p style={{ margin: 0, color: '#f59e0b' }}>Over-reliance Score: {data.y}/5</p>
                              <p style={{ margin: 0, color: data.fill, fontWeight: '500' }}>Top Purpose: {data.topPurpose}</p>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Turns: {data.turns}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      data={filteredSessions.map((session, index) => {
                        const avgHallucination = session.turns.reduce((sum, turn) => 
                          sum + (turn.hallucination_score || 0), 0) / session.turnCount;
                        
                        const purposeCounts = {};
                        session.turns.forEach(turn => {
                          const purpose = turn.purpose || 'Unknown';
                          purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
                        });
                        const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
                        const topPurposeName = topPurpose ? topPurpose[0] : 'Unknown';
                        
                        return {
                          x: avgHallucination,
                          y: session.over_reliance_score,
                          name: session.fileName,
                          turns: session.turnCount,
                          topPurpose: topPurposeName,
                          fill: PURPOSE_COLORS[topPurposeName] || PURPOSE_COLORS['Unknown'],
                          imagePath: PURPOSE_IMAGES[topPurposeName],
                          index: index
                        };
                      })}
                      shape={(props) => {
                        const { cx, cy, payload } = props;
                        const imagePath = payload.imagePath;
                        const isHovered = hoveredScatterIndex === payload.index;
                        const size = isHovered ? 28 : 24; // 호버 시 크게
                        const r = isHovered ? 7 : 6; // 호버 시 크게
                        
                        if (imagePath) {
                          // 이미지가 있으면 이미지로 표시
                          return (
                            <g
                              onMouseEnter={() => setHoveredScatterIndex(payload.index)}
                              onMouseLeave={() => setHoveredScatterIndex(null)}
                            >
                              {isHovered && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={size / 2 + 2}
                                  fill="#fff"
                                  stroke={payload.fill}
                                  strokeWidth={2}
                                />
                              )}
                              <image
                                x={cx - size / 2}
                                y={cy - size / 2}
                                width={size}
                                height={size}
                                href={imagePath}
                                style={{ cursor: 'pointer' }}
                              />
                            </g>
                          );
                        } else {
                          // 이미지가 없으면 기본 원형으로 표시
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill={payload.fill}
                              fillOpacity={0.7}
                              stroke={isHovered ? payload.fill : "#fff"}
                              strokeWidth={isHovered ? 3 : 2}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredScatterIndex(payload.index)}
                              onMouseLeave={() => setHoveredScatterIndex(null)}
                            />
                          );
                        }
                      }}
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                {/* 범례 */}
                <ChartLegend 
                  colorMap={(() => {
                    const purposes = new Set();
                    filteredSessions.forEach(session => {
                      const purposeCounts = {};
                      session.turns.forEach(turn => {
                        const purpose = turn.purpose || 'Unknown';
                        purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
                      });
                      const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
                      if (topPurpose) {
                        purposes.add(topPurpose[0]);
                      }
                    });
                    const currentColorMap = {};
                    purposes.forEach(purpose => {
                      currentColorMap[purpose] = PURPOSE_COLORS[purpose] || PURPOSE_COLORS['Unknown'];
                    });
                    return currentColorMap;
                  })()}
                />
              </div>
              
              <SummaryBox>
                <SummaryText>
                  <strong>Analysis:</strong> Each point represents a session. The color indicates the most frequently used purpose. 
                  This visualization helps identify patterns such as whether high hallucination scores correlate with specific purposes 
                  or over-reliance levels.
                </SummaryText>
              </SummaryBox>
            </StatsContainer>
          ) : (
            // 특정 세션 뷰: 턴별 할루시네이션 추이
            <StatsContainer>
              <SessionBadge isSelected={true} style={{ alignSelf: 'flex-start' }}>
                Selected Session: {data.sessions[selectedSession].fileName}
              </SessionBadge>
              {/* 턴별 할루시네이션 차트 */}
              <div style={{ display: 'flex', width: '100%', gap: '20px', alignItems: 'flex-start' }}>
                <ResponsiveContainer width="80%" height={350}>
                  <LineChart 
                    data={data.sessions[selectedSession].turns.map((turn, index) => ({
                      turn: index + 1,
                      hallucination: turn.hallucination_score || 0,
                      purpose: turn.purpose || 'Unknown',
                      purposeColor: PURPOSE_COLORS[turn.purpose || 'Unknown'] || PURPOSE_COLORS['Unknown'],
                      imagePath: PURPOSE_IMAGES[turn.purpose || 'Unknown']
                    }))}
                    margin={{ top: 10, right: 20, bottom: 50, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="turn" 
                      label={{ value: 'Turn Number', position: 'bottom', fontSize: '11px' }}
                    />
                    <YAxis 
                      label={{ value: 'Hallucination Score', angle: -90, position: 'insideLeft', textAnchor: 'middle', fontSize: '11px' }}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: 'white',
                              padding: '10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                              <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Turn {data.turn}</p>
                              <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>Hallucination Score: {data.hallucination}/5</p>
                              <p style={{ margin: 0, color: data.purposeColor, fontWeight: '500', fontSize: '13px' }}>Purpose: {data.purpose}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hallucination" 
                      stroke="none"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const imagePath = payload.imagePath;
                        const size = 20; // 이미지 크기
                        
                        if (imagePath) {
                          // 이미지가 있으면 이미지로 표시
                          return (
                            <g>
                              <image
                                x={cx - size / 2}
                                y={cy - size / 2}
                                width={size}
                                height={size}
                                href={imagePath}
                                style={{ cursor: 'pointer' }}
                              />
                            </g>
                          );
                        } else {
                          // 이미지가 없으면 기본 원형으로 표시
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={6} 
                              fill={payload.purposeColor}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{ cursor: 'pointer' }}
                            />
                          );
                        }
                      }}
                      activeDot={(props) => {
                        const { cx, cy, payload } = props;
                        const imagePath = payload.imagePath;
                        const size = 24; // 활성화된 점은 조금 더 크게
                        
                        if (imagePath) {
                          return (
                            <g>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={size / 2 + 2}
                                fill="#fff"
                                stroke={payload.purposeColor}
                                strokeWidth={2}
                              />
                              <image
                                x={cx - size / 2}
                                y={cy - size / 2}
                                width={size}
                                height={size}
                                href={imagePath}
                                style={{ cursor: 'pointer' }}
                              />
                            </g>
                          );
                        } else {
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill={payload.purposeColor}
                              stroke="#fff"
                              strokeWidth={3}
                              style={{ cursor: 'pointer' }}
                            />
                          );
                        }
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* 범례 */}
                <ChartLegend 
                  colorMap={(() => {
                    const purposes = new Set();
                    data.sessions[selectedSession].turns.forEach(turn => {
                      const purpose = turn.purpose || 'Unknown';
                      purposes.add(purpose);
                    });
                    const currentColorMap = {};
                    purposes.forEach(purpose => {
                      currentColorMap[purpose] = PURPOSE_COLORS[purpose] || PURPOSE_COLORS['Unknown'];
                    });
                    return currentColorMap;
                  })()}
                />
              </div>

              <SummaryBox>
                <SummaryText>
                  <strong>Analysis:</strong> This view shows hallucination patterns across the conversation with purpose-colored dots. 
                  Each dot's color represents the purpose of that turn, helping identify which purposes correlate with higher hallucination scores throughout the session.
                </SummaryText>
              </SummaryBox>
            </StatsContainer>
          )}
        </Section>

        {/* 섹션 10: Upload & Compare */}
        <Section 
          ref={el => sectionRefs.current[10] = el}
          active={activeSection === 10}
          style={{ marginBottom: '60px' }}
        >
          <SectionTitle>Upload Your Score & Compare with Others</SectionTitle>
          <SectionDescription>
            See how your AI usage patterns compare to the community
          </SectionDescription>
          
          <StatsContainer style={{ maxWidth: '800px' }}>
            {/* 데이터 써머리 */}
            <div style={{
              marginBottom: '30px'
            }}>
              <h3 style={{ 
                margin: '0 0 60px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#1f2937',
                textAlign: 'center'
              }}>
                Your Analysis Summary
              </h3>
              
              {/* 기본 통계 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Total Sessions</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>{totalFiles}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Total Turns</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>{totalTurns}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Avg Turns/Session</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>{avgTurns}</div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                marginBottom: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {/* 주요 점수 */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  borderTop: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Hallucination Score</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
                    {avgHallucination}<span style={{ fontSize: '18px', color: '#6b7280', fontWeight: '400' }}>/5</span>
                  </div>
                </div>
                
                <div style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  borderTop: '1px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Over-reliance Score</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
                    {avgOverReliance}<span style={{ fontSize: '18px', color: '#6b7280', fontWeight: '400' }}>/5</span>
                  </div>
                </div>
              </div>

              {/* Purpose & Issue Type */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Primary Purpose</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: PURPOSE_COLORS[mostCommonPurpose?.name || 'Unknown'] || '#16a34a',
                      borderRadius: '3px'
                    }}></div>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {mostCommonPurpose?.name || 'N/A'}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      ({mostCommonPurpose?.percentage || '0'}%)
                    </span>
                  </div>
                </div>
                
                {(() => {
                  const issueTypeData = getIssueTypeData();
                  const topIssueType = issueTypeData.sort((a, b) => b.value - a.value)[0];
                  return (
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Most Common Issue</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: topIssueType?.fill || '#d1d5db',
                          borderRadius: '3px'
                        }}></div>
                        <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                          {topIssueType?.name === 'factual_error' ? 'Factual Error' : 
                           topIssueType?.name === 'api_call_error' ? 'API Call Error' :
                           topIssueType?.name === 'api_key_missing' ? 'API Key Missing' :
                           topIssueType?.name || 'N/A'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          ({topIssueType?.percentage || '0'}%)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '60px',
              gap: '15px'
            }}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  background: uploading ? '#9ca3af' : '#f59e0b',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  opacity: uploading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
                  }
                }}
              >
                {uploading ? 'Uploading...' : 'Upload & Compare My Scores'}
              </button>
              
              {uploadError && (
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '14px',
                  textAlign: 'center',
                  maxWidth: '400px'
                }}>
                  {uploadError}
                </div>
              )}
            </div>
          </StatsContainer>
        </Section>
      </RightPanel>

    </ScrollytellingContainer>
  );
};

export default Scroll;
