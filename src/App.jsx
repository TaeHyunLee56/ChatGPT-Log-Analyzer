import React, { useState, useRef, useEffect } from 'react';
import styled from "styled-components";

import GptLogUploader from './components/GptLogUploader.jsx';
// import Dashboard from './components/Dashboard.jsx';
import Scroll from './components/Scroll.jsx';
import CompareData from './components/CompareData.jsx';

const Container = styled.div`
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow-y: auto;
  height: 100vh;
  position: relative;
  /* 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const IntroContainer = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  width: 100%;
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  position: relative;
  flex-shrink: 0;
  padding: 60px 20px;
`;

const IntroContent = styled.div`
  max-width: 1000px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const IntroTitle = styled.h1`
  font-weight: 800;
  font-size: 72px;
  color: #111827;
  margin-bottom: 36px;
  text-align: center;
  letter-spacing: -1px;
  line-height: 1.2;
`;

const IntroSubtitle = styled.p`
  font-size: 24px;
  color: #6b7280;
  margin-bottom: 24px;
  font-weight: 500;
  text-align: center;
`;

const IntroDescription = styled.p`
  font-size: 18px;
  color: #4b5563;
  margin-bottom: 60px;
  font-weight: 400;
  text-align: center;
  max-width: 700px;
  line-height: 1.7;
`;

const AnalysisPreview = styled.div`
  width: 100%;
  margin-bottom: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TimelineContainer = styled.div`
  width: 100%;
  max-width: 900px;
  position: relative;
  padding: 30px 0 24px 0;
  margin: 0 auto;
`;

const TimelineLine = styled.div`
  position: relative;
  width: 100%;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-bottom: 0;
`;

const TimelineProgress = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #f59e0b;
  width: ${props => props.progress}%;
  transition: width 0.05s linear;
  border-radius: 2px;
`;

const RotatingMetricBox = styled.div`
  width: 100%;
  // max-width: 800px;
  // min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const MetricItem = styled.div`
  text-align: center;
  animation: ${props => props.isActive ? 'fadeIn' : 'fadeOut'} 0.5s ease-in-out;
  opacity: ${props => props.isActive ? 1 : 0};
  position: ${props => props.isActive ? 'relative' : 'absolute'};
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;

const MetricNumber = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  margin-right: 8px;
`;

const MetricText = styled.span`
  font-size: 48px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  text-align: center;
  display: inline-block;
`;

const HighlightedWord = styled.span`
  background-color: ${props => props.color || '#f59e0b'};
  color: white;
  padding: 4px 12px;
  border-radius: 8px;
  display: inline-block;
  margin: 0 4px;
`;

const MetricBoxTitle = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #f59e0b;
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: -0.5px;
`;

const MetricBoxDescription = styled.div`
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
  text-align: center;
  font-weight: 400;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  margin-top: 40px;
`;

const MetricCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #f59e0b;
  }
`;

const MetricTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const MetricTitleAccent = styled.span`
  color: #f59e0b;
`;

const MetricDescription = styled.p`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
`;

const AnalysisCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-left-color: #d97706;
  }
`;

const CardTitle = styled.h3`
  font-size: 22px;
  color: #1f2937;
  margin: 0 0 8px 0;
  font-weight: 700;
  letter-spacing: -0.3px;
`;

const CardTitleAccent = styled.span`
  color: #f59e0b;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const ValueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  flex: 1;
`;

const ValueSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ValueSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '';
    width: 3px;
    height: 3px;
    background: #f59e0b;
    border-radius: 50%;
    display: inline-block;
  }
`;

const ScrollBtn = styled.p`
  display: inline-block;
  font-size: 16px;
  font-weight: 400;
  color: #6b7280;
  border-bottom: 1px solid #6b7280;
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 1;
  
  &:hover {
    color: #1f2937;
    border-bottom-color: #1f2937;
  }
`;

const UploaderWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function App() {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const introRef = useRef(null);
  const uploaderWrapperRef = useRef(null);
  // 분석 결과를 저장할 상태 (null이면 업로더, 데이터가 있으면 대시보드 표시)
  const [analyzedData, setAnalyzedData] = useState(null);
  // 현재 페이지 상태: 'uploader', 'scroll', 'compare'
  const [currentPage, setCurrentPage] = useState('uploader');
  // 인트로 메트릭 루프 인덱스
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  

  const handleScroll = () => {
    // UploaderWrapper로 스크롤
    if (uploaderWrapperRef.current) {
      uploaderWrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // GptLogUploader가 분석을 완료했을 때 호출할 콜백 함수
  const handleAnalysisComplete = (data) => {
    setAnalyzedData(data);
    setCurrentPage('scroll');
  };

  // CompareData 페이지로 이동
  const handleNavigateToCompare = () => {
    setCurrentPage('compare');
  };

  // 업로더로 돌아가기
  const handleReset = () => {
    setAnalyzedData(null);
    setCurrentPage('uploader');
  };

  // Scroll 페이지로 돌아가기
  const handleBackToScroll = () => {
    setCurrentPage('scroll');
  };

  // 인트로 메트릭 루프 애니메이션
  useEffect(() => {
    if (currentPage === 'uploader') {
      const interval = setInterval(() => {
        setCurrentMetricIndex((prev) => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setCurrentMetricIndex(0);
    }
  }, [currentPage]);

  const metrics = [
    {
      number: 1,
      text: 'Hallucination',
      suffix: 'of LLM',
      highlightColor: '#f59e0b'
    },
    {
      number: 2,
      text: 'Over-reliance',
      suffix: 'of your usage',
      highlightColor: '#f59e0b'
    },
    {
      number: 3,
      text: 'Purpose',
      suffix: 'of your conversations',
      highlightColor: '#f59e0b'
    }
  ];


  return (
    <>
    {currentPage === 'compare' ? (
      <CompareData myData={analyzedData} onBack={handleBackToScroll} />
    ) : currentPage === 'scroll' ? (
      <Scroll data={analyzedData} onReset={handleReset} onNavigateToCompare={handleNavigateToCompare} />
    ) : (
      <Container ref={containerRef}>
        <IntroContainer ref={introRef}>
          <IntroContent>
            <IntroSubtitle>ChatGPT log Analyzer</IntroSubtitle>
            <IntroTitle>Are you Addicted to LLMs?</IntroTitle>
            
            <AnalysisPreview>
              <RotatingMetricBox>
                {metrics.map((metric, index) => (
                  <MetricItem key={index} isActive={currentMetricIndex === index}>
                    <MetricText>
                      <HighlightedWord color={metric.highlightColor}>{metric.text}</HighlightedWord> {metric.suffix}
                    </MetricText>
                  </MetricItem>
                ))}
              </RotatingMetricBox>
            </AnalysisPreview>
          </IntroContent>
          
          <ScrollBtn onClick={handleScroll}>
            continue
          </ScrollBtn>
        </IntroContainer>
        <UploaderWrapper ref={uploaderWrapperRef}>
          <GptLogUploader 
            ref={inputRef} 
            onAnalysisComplete={handleAnalysisComplete} 
          />
        </UploaderWrapper>
      </Container>
    )}
    </>
  )
}

export default App