import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

// 왼쪽 패널 세션 리스트 컨테이너
const LeftSessionList = styled.div`
  margin-top: 32px;
  width: 100%;
  max-width: 550px;
  height: 80vh;
  overflow-y: auto;
  transition: opacity 0.6s ease, visibility 0.6s ease;
  opacity: ${props => props.active ? 1 : 0};
  visibility: ${props => props.active ? 'visible' : 'hidden'};
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-sizing: border-box;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

// 왼쪽 패널 세션 카드
const LeftSessionCard = styled.div`
  width: 100%;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid #f59e0b;
  background: ${props => props.selected ? '#e0f2fe' : '#f9fafb'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.selected ? '#e0f2fe' : '#f3f4f6'};
  }
`;

// View Chat 버튼 (칩 스타일)
const ViewChatButton = styled.button`
  padding: 4px 10px;
  background:rgb(177, 177, 177);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: #ea580c;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// 모달 오버레이
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  padding: 20px;
`;

// 모달 컨테이너
const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

// 모달 헤더
const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
`;

// 모달 제목
const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
`;

// 모달 닫기 버튼
const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }
`;

// 모달 바디
const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  
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

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => props.bgColor || '#f3f4f6'};
  color: ${props => props.textColor || '#1f2937'};
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const CustomTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #1f2937;
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: normal;
  white-space: normal;
  max-width: 300px;
  z-index: 1000;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 10px;
    border: 5px solid transparent;
    border-top-color: #1f2937;
  }
`;

// 세션 리스트 컴포넌트
const SessionListComponent = ({ active, sessions, color, renderContent, selectedSession, onSessionClick }) => {
  const [modalSession, setModalSession] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [filteredIssueType, setFilteredIssueType] = useState(null);
  const [filteredPurpose, setFilteredPurpose] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Purpose 색상 매핑
  const PURPOSE_COLORS = {
    'Information Seeking': '#0ea5e9',
    'Content Generation': '#16a34a', 
    'Language Refinement': '#E6B000',
    'Meta-cognitive Engagement': '#8b5cf6',
    'Conversational Repair': '#ec4899',
    'Unknown': '#9ca3af'
  };
  
  // Issue Type 색상 매핑
  const ISSUE_COLORS = {
    'No Issues': '#16a34a',
    'factual_error': '#ef4444',
    'misalignment': '#F5840B',
    'api_call_error': '#6b7280',
    'api_key_missing': '#9ca3af',
    'unknown': '#d1d5db',
    'none': '#16a34a'
  };

  // 할루시네이션 점수에 따른 색상
  const getHallucinationColor = (score) => {
    if (score >= 4) return '#ef4444'; // 빨강
    if (score >= 3) return '#f59e0b'; // 주황
    if (score >= 2) return '#fbbf24'; // 노랑
    return '#16a34a'; // 초록
  };

  // 텍스트 자르기 함수
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 메시지 접고 펼치기
  const toggleMessage = (messageId) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // 모달 열렸을 때 body 스크롤 방지 및 필터 초기화
  useEffect(() => {
    if (modalSession) {
      document.body.style.overflow = 'hidden';
      setExpandedMessages(new Set()); // 모달 열릴 때 초기화
      setFilteredIssueType(null); // 필터 초기화
      setFilteredPurpose(null); // 필터 초기화
      setIsFilterExpanded(true); // 필터 펼침 상태로 초기화
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalSession]);

  const handleViewChat = (e, session) => {
    e.stopPropagation(); // 부모 카드의 onClick 이벤트 방지
    setModalSession(session);
  };

  const closeModal = () => {
    setModalSession(null);
  };

  return (
    <>
      <LeftSessionList active={active}>
        <h4 style={{ color: '#1f2937', marginBottom: '20px', fontSize: '21px', fontWeight: '600'}}>
          Sessions
        </h4>
        {sessions.map((session, index) => (
          <LeftSessionCard 
            key={index} 
            color={color}
            selected={selectedSession === index}
            onClick={() => onSessionClick(index)}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '8px',
              gap: '10px'
            }}>
              <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '17px', flex: 1 }}>
                {session.fileName}
              </div>
              <ViewChatButton onClick={(e) => handleViewChat(e, session)}>
                View Chat
              </ViewChatButton>
            </div>
            <div style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6' }}>
              <div>Turns: {session.turnCount}</div>
              {renderContent && renderContent(session)}
            </div>
          </LeftSessionCard>
        ))}
      </LeftSessionList>

      {/* 대화 내용 모달 */}
      {modalSession && ReactDOM.createPortal(
        <ModalOverlay onClick={closeModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{modalSession.fileName}</ModalTitle>
              <ModalCloseButton onClick={closeModal}>×</ModalCloseButton>
            </ModalHeader>
            {/* 세션 통계 정보 */}
            {(() => {
              const avgHallucination = modalSession.turns.reduce((sum, turn) => 
                sum + (turn.hallucination_score || 0), 0) / modalSession.turnCount;
              
              const purposeCounts = {};
              modalSession.turns.forEach(turn => {
                const purpose = turn.purpose || 'Unknown';
                purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
              });
              const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
              const topPurposeName = topPurpose ? topPurpose[0] : 'Unknown';
              
              return (
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Turns</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      {modalSession.turnCount}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Avg Hallucination Score</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#facc15' }}>
                      {avgHallucination.toFixed(1)}/5
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Over-reliance Score</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
                      {modalSession.over_reliance_score}/5
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Top Purpose</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: PURPOSE_COLORS[topPurposeName] || '#9ca3af' }}>
                      {topPurposeName}
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* 필터 섹션 */}
            {(() => {
              // 세션에 실제로 존재하는 issue types와 purposes 수집
              const availableIssueTypes = new Set();
              const availablePurposes = new Set();
              
              modalSession.turns.forEach(turn => {
                let issueType = turn.issue_type;
                if (issueType === 'none') {
                  issueType = 'No Issues';
                } else if (!issueType || issueType === 'unknown') {
                  issueType = 'unknown';
                }
                if (issueType) {
                  availableIssueTypes.add(issueType);
                }
                const purpose = turn.purpose || 'Unknown';
                availablePurposes.add(purpose);
              });

              // 모든 가능한 issue types와 purposes
              const allIssueTypes = ['No Issues', 'factual_error', 'misalignment'];
              const allPurposes = ['Information Seeking', 'Content Generation', 'Language Refinement', 'Meta-cognitive Engagement', 'Conversational Repair'];

              // 필터링된 turns
              const filteredTurns = modalSession.turns.filter(turn => {
                if (filteredIssueType) {
                  let turnIssueType = turn.issue_type;
                  if (turnIssueType === 'none') {
                    turnIssueType = 'No Issues';
                  } else if (!turnIssueType || turnIssueType === 'unknown') {
                    turnIssueType = 'unknown';
                  }
                  if (turnIssueType !== filteredIssueType) {
                    return false;
                  }
                }
                if (filteredPurpose) {
                  const turnPurpose = turn.purpose || 'Unknown';
                  if (turnPurpose !== filteredPurpose) {
                    return false;
                  }
                }
                return true;
              });

              return (
                <>
                  <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff'
                  }}>
                    <div 
                      style={{ 
                        marginBottom: isFilterExpanded ? '12px' : '0',
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span>Filters</span>
                        {!isFilterExpanded && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {filteredIssueType ? (
                              <div
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: ISSUE_COLORS[filteredIssueType] || '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {filteredIssueType}
                              </div>
                            ) : null}
                            {filteredPurpose ? (
                              <div
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: PURPOSE_COLORS[filteredPurpose] || '#9ca3af',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {filteredPurpose}
                              </div>
                            ) : null}
                            {!filteredIssueType && !filteredPurpose && (
                              <div
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: '#f59e0b',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                All
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {isFilterExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                    {isFilterExpanded && (
                      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                      {/* Issue Type 필터 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '0 0 auto' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Issue Type:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <button
                            onClick={() => setFilteredIssueType(null)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: filteredIssueType === null ? '#f59e0b' : '#ffffff',
                              color: filteredIssueType === null ? '#ffffff' : '#6b7280',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            All
                          </button>
                          {allIssueTypes.map(issueType => {
                            const isAvailable = availableIssueTypes.has(issueType);
                            const isSelected = filteredIssueType === issueType;
                            return (
                              <button
                                key={issueType}
                                onClick={() => isAvailable && setFilteredIssueType(issueType)}
                                disabled={!isAvailable}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? (ISSUE_COLORS[issueType] || '#ef4444') : (isAvailable ? '#ffffff' : '#f3f4f6'),
                                  color: isSelected ? '#ffffff' : (isAvailable ? '#6b7280' : '#9ca3af'),
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                                  opacity: isAvailable ? 1 : 0.5,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {issueType}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Purpose 필터 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 auto' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Purpose:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <button
                            onClick={() => setFilteredPurpose(null)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: filteredPurpose === null ? '#f59e0b' : '#ffffff',
                              color: filteredPurpose === null ? '#ffffff' : '#6b7280',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            All
                          </button>
                          {allPurposes.map(purpose => {
                            const isAvailable = availablePurposes.has(purpose);
                            const isSelected = filteredPurpose === purpose;
                            return (
                              <button
                                key={purpose}
                                onClick={() => isAvailable && setFilteredPurpose(purpose)}
                                disabled={!isAvailable}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  backgroundColor: isSelected ? (PURPOSE_COLORS[purpose] || '#9ca3af') : (isAvailable ? '#ffffff' : '#f3f4f6'),
                                  color: isSelected ? '#ffffff' : (isAvailable ? '#6b7280' : '#9ca3af'),
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                                  opacity: isAvailable ? 1 : 0.5,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {purpose}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      </div>
                    )}
                    {isFilterExpanded && filteredTurns.length !== modalSession.turns.length && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                        Showing {filteredTurns.length} of {modalSession.turns.length} turns
                      </div>
                    )}
                  </div>
                  <ModalBody>
                    {filteredTurns.length > 0 ? (
                      filteredTurns.map((turn, index) => {
                        const originalIndex = modalSession.turns.indexOf(turn);
                        const userMessageId = `user-${modalSession.fileName}-${originalIndex}`;
                        const assistantMessageId = `assistant-${modalSession.fileName}-${originalIndex}`;
                        const isUserExpanded = expandedMessages.has(userMessageId);
                        const isAssistantExpanded = expandedMessages.has(assistantMessageId);
                        
                        return (
                          <div key={originalIndex} style={{ marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '15px' }}>
                            <div style={{ marginBottom: '10px' }}>
                              <div 
                                style={{
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #dbeafe',
                                  borderRadius: '6px',
                                  padding: '12px',
                                  marginBottom: '8px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => toggleMessage(userMessageId)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <strong style={{ color: '#1e40af', fontSize: '14px' }}>👤 User (Turn {turn.turn || originalIndex + 1})</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {turn.purpose && (
                                <MetaChip 
                                  bgColor={PURPOSE_COLORS[turn.purpose] || '#9ca3af'}
                                  textColor="white"
                                >
                                  {turn.purpose}
                                </MetaChip>
                              )}
                              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                {isUserExpanded ? '△' : '▽'}
                              </span>
                            </div>
                          </div>
                          <p style={{ 
                            margin: 0, 
                            lineHeight: '1.4', 
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {isUserExpanded ? turn.user : truncateText(turn.user, 100)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <div 
                          style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            borderRadius: '6px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => toggleMessage(assistantMessageId)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <TooltipContainer
                              onMouseEnter={() => {
                                if (turn.hallucination_reason && turn.hallucination_score > 0) {
                                  setExpandedMessages(prev => new Set(prev).add(`tooltip-${modalSession.fileName}-${originalIndex}`));
                                }
                              }}
                              onMouseLeave={() => {
                                setExpandedMessages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(`tooltip-${modalSession.fileName}-${originalIndex}`);
                                  return newSet;
                                });
                              }}
                            >
                              <strong style={{ 
                                color: '#16a34a', 
                                fontSize: '14px',
                                cursor: turn.hallucination_reason && turn.hallucination_score > 0 ? 'help' : 'default'
                              }}>
                                🤖 Assistant
                              </strong>
                              {turn.hallucination_reason && turn.hallucination_score > 0 && (
                                <CustomTooltip show={expandedMessages.has(`tooltip-${modalSession.fileName}-${originalIndex}`)}>
                                  <strong>Hallucination Reason:</strong><br />
                                  {turn.hallucination_reason}
                                </CustomTooltip>
                              )}
                            </TooltipContainer>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {(() => {
                                // 점수가 1이거나 issue_type이 'none'이면 'No Issues'로 표시
                                let displayIssueType = turn.issue_type;
                                if (turn.hallucination_score === 1 || turn.issue_type === 'none' || !turn.issue_type) {
                                  displayIssueType = 'No Issues';
                                } else if (turn.issue_type === 'unknown') {
                                  displayIssueType = null; // unknown은 표시하지 않음
                                }
                                
                                if (displayIssueType) {
                                  const issueBgColor = ISSUE_COLORS[displayIssueType] || ISSUE_COLORS['unknown'];
                                  return (
                                    <MetaChip 
                                      bgColor={issueBgColor}
                                      textColor="white"
                                    >
                                      {displayIssueType}
                                    </MetaChip>
                                  );
                                }
                                return null;
                              })()}
                              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                {isAssistantExpanded ? '△' : '▽'}
                              </span>
                            </div>
                          </div>
                          <p style={{ 
                            margin: 0, 
                            lineHeight: '1.4', 
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {isAssistantExpanded ? turn.assistant : truncateText(turn.assistant, 150)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  No turns match the selected filters
                </div>
              )}
                  </ModalBody>
                </>
              );
            })()}
          </ModalContainer>
        </ModalOverlay>,
        document.body
      )}
    </>
  );
};

export default SessionListComponent;
