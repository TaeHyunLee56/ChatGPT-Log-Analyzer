// CompareData.jsx - User comparison page
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import { getAllAnalysisData } from '../firebase';

const Container = styled.div`
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  padding: 80px 40px 40px;
  box-sizing: border-box;
  overflow-y: auto;
`;

const Header = styled.div`
  position: fixed;
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
  margin: 0;
`;

const BackButton = styled.button`
  background-color: #e5e7eb;
  color: #374151;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;

  &:hover {
    background-color: #d1d5db;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 40px;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 29px;
  color: #1f2937;
  margin: 0 0 20px 0;
`;

const SectionDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 30px 0;
  line-height: 1.6;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: ${props => props.borderColor ? `5px solid ${props.borderColor}` : '5px solid #3b82f6'};
  border-radius: 8px;
  padding: 25px 30px;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${props => props.color || '#6b7280'};
  margin-bottom: 15px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 40px;
  font-weight: 700;
  color: ${props => props.color || '#1f2937'};
  margin-bottom: 8px;
`;

const StatSubtext = styled.div`
  font-size: 15px;
  color: ${props => props.color || '#9ca3af'};
  font-weight: ${props => props.bold ? '600' : '400'};
  line-height: 1.5;
`;

const RankBadge = styled.div`
  display: inline-block;
  padding: 8px 20px;
  background: ${props => {
    if (props.rank <= 10) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    if (props.rank <= 30) return 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)';
    if (props.rank <= 50) return 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)';
    return '#e5e7eb';
  }};
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 18px;
  margin-top: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
`;

const ChartContainer = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const LoadingText = styled.div`
  text-align: center;
  font-size: 19px;
  color: #6b7280;
  padding: 60px 20px;
`;

const ErrorText = styled.div`
  text-align: center;
  font-size: 18px;
  color: #ef4444;
  padding: 40px 20px;
  background: #fee2e2;
  border-radius: 8px;
  border: 1px solid #fecaca;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  margin: 0;
  color: #1e40af;
  font-size: 15px;
  line-height: 1.6;
`;

const PurposeTag = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => props.color || '#9ca3af'};
  color: white;
  margin: 5px;
`;

const CompareData = ({ myData, onBack }) => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [hoveredScatterIndex, setHoveredScatterIndex] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllAnalysisData();
      setAllData(data);
      
      // Calculate my data
      const myHallucinationScore = calculateAvgHallucination(myData);
      const myOverRelianceScore = calculateAvgOverReliance(myData);
      const myPurpose = getMostCommonPurpose(myData);
      
      // Calculate rank (lower is better for Hallucination and Over-reliance, so lower=true)
      const hallucinationRank = calculateRank(data, myHallucinationScore, 'avgHallucinationScore', true);
      const overRelianceRank = calculateRank(data, myOverRelianceScore, 'avgOverRelianceScore', true);
      
      // Calculate "Top X%" 
      // Rank 1 of 5 → Top 20%
      // Rank 3 of 5 → Top 60%
      const hallucinationTopPercent = ((hallucinationRank / data.length) * 100).toFixed(1);
      const overRelianceTopPercent = ((overRelianceRank / data.length) * 100).toFixed(1);
      
      setMyStats({
        hallucinationScore: myHallucinationScore,
        overRelianceScore: myOverRelianceScore,
        purpose: myPurpose,
        hallucinationRank,
        overRelianceRank,
        hallucinationPercentile: hallucinationTopPercent,
        overReliancePercentile: overRelianceTopPercent,
        totalUsers: data.length
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check your Firebase configuration.');
      setLoading(false);
    }
  };

  // Calculate average Hallucination Score
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

  // Calculate average Over-reliance Score
  const calculateAvgOverReliance = (data) => {
    const sum = data.sessions.reduce((acc, session) => acc + session.over_reliance_score, 0);
    return parseFloat((sum / data.sessions.length).toFixed(2));
  };

  // Get most common Purpose
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

  // Calculate rank (lower=true means lower score is better)
  const calculateRank = (allData, myScore, field, lower = false) => {
    const scores = allData.map(d => d[field]).filter(s => s !== undefined);
    // Don't add my score again as it may already be in allData
    scores.sort((a, b) => lower ? a - b : b - a);
    
    // Find where my score ranks (return best rank if there are ties)
    let rank = 1;
    for (let i = 0; i < scores.length; i++) {
      if (lower ? myScore <= scores[i] : myScore >= scores[i]) {
        return rank;
      }
      rank++;
    }
    return rank; // My score is the lowest (or highest)
  };

  // Purpose color mapping
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

  // Generate distribution chart data
  const getDistributionData = (field, label) => {
    if (!allData.length || !myStats) return [];
    
    // Don't add myStats again - it's already in allData from Firebase
    const allScores = allData.map(d => d[field]).filter(s => s !== undefined);    
    // Divide 0-5 range into 0.5 intervals
    const bins = {};
    for (let i = 0; i <= 5; i += 0.5) {
      bins[i.toFixed(1)] = 0;
    }
    
    allScores.forEach(score => {
      const bin = (Math.floor(score * 2) / 2).toFixed(1);
      if (bins[bin] !== undefined) {
        bins[bin]++;
      }
    });
    
    return Object.entries(bins).map(([range, count]) => ({
      range: `${range}`,
      count,
      isMyRange: myStats && 
        ((field === 'avgHallucinationScore' && 
          Math.abs(parseFloat(range) - myStats.hallucinationScore) < 0.25) ||
        (field === 'avgOverRelianceScore' && 
          Math.abs(parseFloat(range) - myStats.overRelianceScore) < 0.25))
    }));
  };

  // Purpose distribution data
  const getPurposeDistributionData = () => {
    if (!allData.length || !myStats) return [];
    
    const purposeCounts = {};
    
    // Aggregate purpose distribution from all users (myData is already in allData)
    allData.forEach(data => {
      if (data.purposeDistribution) {
        Object.entries(data.purposeDistribution).forEach(([purpose, count]) => {
          purposeCounts[purpose] = (purposeCounts[purpose] || 0) + count;
        });
      }
    });
    
    return Object.entries(purposeCounts)
      .map(([purpose, count]) => ({
        name: purpose,
        value: count,
        fill: PURPOSE_COLORS[purpose] || PURPOSE_COLORS['Unknown'],
        isMyPurpose: purpose === myStats.purpose
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Scatter plot data - all users' positions
  const getScatterData = () => {
    if (!allData.length || !myStats) return [];
    
    return allData.map((data, index) => {
      const isMe = 
        Math.abs(data.avgHallucinationScore - myStats.hallucinationScore) < 0.01 &&
        Math.abs(data.avgOverRelianceScore - myStats.overRelianceScore) < 0.01;
      
      const purpose = data.mostCommonPurpose || 'Unknown';
      
      return {
        x: data.avgHallucinationScore,
        y: data.avgOverRelianceScore,
        isMe: isMe,
        purpose: purpose,
        fill: PURPOSE_COLORS[purpose] || '#9ca3af',
        imagePath: PURPOSE_IMAGES[purpose],
        index: index
      };
    });
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Score Comparison</Title>
          <BackButton onClick={onBack}>← Back</BackButton>
        </Header>
        <ContentWrapper>
          <LoadingText>Loading data...</LoadingText>
        </ContentWrapper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Score Comparison</Title>
          <BackButton onClick={onBack}>← Back</BackButton>
        </Header>
        <ContentWrapper>
          <ErrorText>{error}</ErrorText>
          <InfoBox style={{ marginTop: '20px' }}>
            <InfoText>
              <strong>Firebase Setup Instructions:</strong><br />
              1. Create a project in Firebase Console<br />
              2. Enable Firestore Database<br />
              3. Add a web app in project settings<br />
              4. Replace firebaseConfig in src/firebase.js with your configuration
            </InfoText>
          </InfoBox>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>ChatGPT log Analyzer</Title>
        <BackButton onClick={onBack}>← Back</BackButton>
      </Header>
      
      <ContentWrapper>
        <InfoBox>
          <InfoText>
            <strong>Compared with {myStats?.totalUsers || 0} users' data.</strong> 
            Lower scores indicate healthier AI usage patterns.
          </InfoText>
        </InfoBox>

        {/* My Score Summary */}
        <Section>
          <SectionTitle>My Scores</SectionTitle>
          <SectionDescription>
            Your AI usage pattern scores and rankings
          </SectionDescription>
          
          <StatGrid>
            <StatCard borderColor="#f59e0b">
              <StatLabel color="#f59e0b">Hallucination Score</StatLabel>
              <div style={{ 
                fontSize: '45px', 
                fontWeight: '700', 
                color: '#1f2937',
                lineHeight: '1.1',
                margin: '5px 0'
              }}>
                Top {myStats?.hallucinationPercentile}%
              </div>
              <StatSubtext style={{ marginTop: '12px', fontSize: '14px' }}>
                Score: {myStats?.hallucinationScore?.toFixed(2) || 'N/A'}/5 · 
                Rank {myStats?.hallucinationRank} of {myStats?.totalUsers}
              </StatSubtext>
            </StatCard>
            
            <StatCard borderColor="#f59e0b">
              <StatLabel color="#f59e0b">Over-reliance Score</StatLabel>
              <div style={{ 
                fontSize: '45px', 
                fontWeight: '700', 
                color: '#1f2937',
                lineHeight: '1.1',
                margin: '5px 0'
              }}>
                Top {myStats?.overReliancePercentile}%
              </div>
              <StatSubtext style={{ marginTop: '12px', fontSize: '14px' }}>
                Score: {myStats?.overRelianceScore?.toFixed(2) || 'N/A'}/5 · 
                Rank {myStats?.overRelianceRank} of {myStats?.totalUsers}
              </StatSubtext>
            </StatCard>
            
            <StatCard borderColor="#f59e0b">
              <StatLabel color="#f59e0b">Primary Purpose</StatLabel>
              <div style={{ 
                fontSize: '45px', 
                fontWeight: '700', 
                color: '#1f2937',
                lineHeight: '1.1',
                margin: '5px 0'
              }}>
                {myStats?.purpose || 'Unknown'}
              </div>
              <StatSubtext style={{ marginTop: '12px', fontSize: '14px' }}>
                Most used purpose
              </StatSubtext>
            </StatCard>
          </StatGrid>
        </Section>

        {/* Scatter Plot - User Distribution */}
        <Section>
          <SectionTitle>User Distribution Map</SectionTitle>
          <SectionDescription>
            Compare your scores with all users at a glance. Position, scores, and primary purpose all in one view.
          </SectionDescription>
          
          <ChartContainer>
            <ResponsiveContainer width="100%" height={600}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Hallucination Score"
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  label={{ value: 'Hallucination Score', position: 'bottom', offset: 40 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Over-reliance Score"
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  label={{ value: 'Over-reliance Score', angle: -90, position: 'insideLeft' }}
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
                          {data.isMe && (
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#ef4444' }}>
                              YOU
                            </p>
                          )}
                          <p style={{ margin: data.isMe ? '4px 0 0 0' : '0', fontSize: '14px', color: '#f59e0b' }}>
                            Hallucination Score: {data.x.toFixed(2)}/5
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#f59e0b' }}>
                            Over-reliance Score: {data.y.toFixed(2)}/5
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            Primary: {data.purpose}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  data={getScatterData()} 
                  fill="#8884d8"
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
                          {(isHovered || payload.isMe) && (
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
                          stroke={(isHovered || payload.isMe) ? payload.fill : "#fff"}
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredScatterIndex(payload.index)}
                          onMouseLeave={() => setHoveredScatterIndex(null)}
                        />
                      );
                    }
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Legend for Purpose Colors */}
          <div style={{ 
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              Purpose Colors
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              {Object.entries(PURPOSE_COLORS)
                .filter(([purpose]) => purpose !== 'Unknown')
                .map(([purpose, color]) => {
                const imagePath = PURPOSE_IMAGES[purpose];
                return (
                  <div key={purpose} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {imagePath ? (
                      <img 
                        src={imagePath} 
                        alt={purpose}
                        style={{
                          width: '20px',
                          height: '20px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '1px solid white'
                      }}></div>
                    )}
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>{purpose}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <InfoBox style={{ marginTop: '20px' }}>
            <InfoText>
              <strong>📍 How to Read:</strong><br />
              • <strong>Dot colors</strong>: Each user's primary purpose<br />
              • <strong>X-axis (Hallucination)</strong> & <strong>Y-axis (Over-reliance)</strong>: Lower is better<br />
              • <strong>Lower-left corner (0,0)</strong>: Best performance<br />
              • <strong>Upper-right corner (5,5)</strong>: Needs improvement
            </InfoText>
          </InfoBox>
        </Section>

        {/* Overall Analysis */}
        <Section>
          <SectionTitle>Overall Analysis</SectionTitle>
          <SectionDescription>
            Comprehensive evaluation of your AI usage patterns
          </SectionDescription>
          
          <div style={{ 
            padding: '25px', 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            lineHeight: '1.8'
          }}>
            <p style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
              {myStats?.hallucinationPercentile < 30 && myStats?.overReliancePercentile < 30 ? (
                '🎉 Excellent! You demonstrate very healthy AI usage patterns.'
              ) : myStats?.hallucinationPercentile < 50 && myStats?.overReliancePercentile < 50 ? (
                '👍 Good! You maintain relatively healthy AI usage patterns.'
              ) : myStats?.hallucinationPercentile < 70 && myStats?.overReliancePercentile < 70 ? (
                '⚠️ Caution needed. Consider reducing AI dependency and strengthening critical thinking.'
              ) : (
                '🚨 Improvement needed. Develop the habit of verifying AI responses rather than blindly trusting them.'
              )}
            </p>
            <p style={{ margin: 0, fontSize: '15px', color: '#92400e' }}>
              • Hallucination Score: Top {myStats?.hallucinationPercentile}% 
              {myStats?.hallucinationPercentile < 50 ? ' - High accuracy level.' : ' - Relatively high hallucination occurrence.'}<br />
              • Over-reliance Score: Top {myStats?.overReliancePercentile}%
              {myStats?.overReliancePercentile < 50 ? ' - Appropriate dependency level.' : ' - High AI dependency.'}<br />
              • Primary Purpose: {myStats?.purpose} - 
              {myStats?.purpose === 'Information Seeking' && ' Information exploration focused usage.'}
              {myStats?.purpose === 'Content Generation' && ' Content creation focused usage.'}
              {myStats?.purpose === 'Language Refinement' && ' Language improvement focused usage.'}
              {myStats?.purpose === 'Meta-cognitive Engagement' && ' Metacognitive engagement focused usage.'}
              {myStats?.purpose === 'Conversational Repair' && ' Conversation correction focused usage.'}
            </p>
          </div>
        </Section>
      </ContentWrapper>
    </Container>
  );
};

export default CompareData;
