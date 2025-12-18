// GptLogUploader.jsx - 최종 버전

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ApiKeyModal from './ApiKeyModal'; 
import OpenAI from 'openai'; 

// Bookmarklet Code (전체 세션 수집)
const BOOKMARKLET_CODE = `javascript:(()=>{   try {     const container = document.querySelector('main') || document.body;     const text = container.innerText;     const result = {       source: "ChatGPT Share Page",       captured_at: new Date().toISOString(),       conversation: text.split("\n").filter(Boolean)     };     const blob = new Blob([JSON.stringify(result, null, 2)], {type: "application/json"});     const a = document.createElement("a");     a.href = URL.createObjectURL(blob);     a.download = "chat-data.json";     document.body.appendChild(a);     a.click();     document.body.removeChild(a);   } catch(err) {     alert("%EB%8C%80%ED%99%94 %EC%B6%94%EC%B6%9C %EC%8B%A4%ED%8C%A8! (DOM %EA%B5%AC%EC%A1%B0 %EB%B3%80%EA%B2%BD %EB%98%90%EB%8A%94 %EB%B9%84%EA%B3%B5%EA%B0%9C %EB%A7%81%ED%81%AC%EC%9D%BC %EC%88%98 %EC%9E%88%EC%9D%8C)");     console.error(err);   } })();`;

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  box-sizing: border-box;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  background-color: #f9fafb;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
`;

const TitleWrapper = styled.div`
  margin: 40px 0 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
`;

const Section = styled.div`
  width: 1200px;
  max-width: 90%;
  background: #f9fafb;
  padding: 40px; 
  border-radius: 12px; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb; 
`;

const SectionTitle = styled.h2`
  color: #f59e0b;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 29px;
`;

const StepList = styled.ul`
  margin-top: 20px;
  list-style: none;
  padding-left: 0;
`;

const StepItem = styled.li`
  margin-bottom: 15px;
  font-size: 17px;
  line-height: 1.6;
  padding-left: 10px;
  border-left: 2px solid #f59e0b;
  text-align: left;
  color: #374151;
`;

const StepSubTitle = styled.h3`
  color: #111827;
  margin-top: 5px;
  margin-bottom: 8px;
  font-size: 18px;
`;

const Key = styled.span`
  display: inline-block;
  background: #f3f4f6;
  color: #111827;
  padding: 2px 4px;
  border-radius: 6px;
  margin: 0 4px;
  font-family: monospace;
  font-weight: bold;
  border-bottom: 3px solid #d1d5db;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  vertical-align: middle;
  font-size: 12px;
`;

const CopyButton = styled.button`
  width: 100%;
  background-color: #f59e0b;
  color: #ffffff;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s ease, transform 0.1s;
  
  &:hover {
    background-color: #d97706;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const HiddenCodeBlock = styled.div`
  display: none; 
`;

const FileInputWrapper = styled.label`
  display: block;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  
  text-align: center;
  padding: 25px 20px; 
  margin-top: 15px;
  border: 2px dashed #f59e0b; 
  border-radius: 8px;
  background-color: #fef3c7; 
  color: #6b7280;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #d97706;
    background-color: #fde68a; 
  }
`;

const HiddenFileInput = styled.input.attrs({ type: 'file' })`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const AnalyzeButton = styled(CopyButton)`
  width: 300px; 
  background-color: #f59e0b;
  color: #ffffff;
  margin: 32px 0 60px 0;
  
  &:hover {
    background-color: #d97706;
  }
  
  &:active {
    background-color: #b45309;
  }
  
  ${props => props.disabled && `
    background-color: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    &:hover {
        background-color: #d1d5db;
    }
  `}
`;

const StatusMessage = styled.p`
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
  background-color: ${props => props.$isError ? '#fee2e2' : '#f3f4f6'};
  border: 1px solid ${props => props.$isError ? '#fca5a5' : '#e5e7eb'};
  color: ${props => props.$isError ? '#dc2626' : '#374151'};
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 15px;
  width: 100%;
`;

const FileListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 10px 15px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const FileName = styled.span`
  color: #16a34a;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AnalyzedBadge = styled.span`
  background-color: #f59e0b;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 19px;
  padding: 0 5px;
  
  &:hover {
    color: #dc2626;
  }
`;

const AnalysisBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  flex-direction: column;
  color: #111827;
  text-align: center;
`;

const fadeInInfo = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const InfoBox = styled.div`
  animation: ${fadeInInfo} 0.5s ease-in;
`;

const AnalysisModalContent = styled.div`
  background: #ffffff;
  backdrop-filter: blur(10px);
  padding: 40px 60px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 700px;
  max-width: 90%;
  border: 2px solid #f59e0b;
  animation: ${fadeIn} 0.5s ease-out;
  color: #111827;
`;

// ----------------------------------------------------------------

const GptLogUploader = React.forwardRef(({ onAnalysisComplete }, ref) => {
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [status, setStatus] = useState('Upload at least 3 files to analyze.');
  const [isError, setIsError] = useState(false);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [preAnalyzedData, setPreAnalyzedData] = useState(null); // 분석된 JSON 데이터
  const containerRef = useRef(null);

  const MIN_FILES = 3;

  // 파일 개수 계산 헬퍼 함수
  const getFileCounts = (files) => {
    const normalFiles = files.filter(f => !f.isAnalyzed);
    const analyzedFiles = files.filter(f => f.isAnalyzed);
    return {
      normal: normalFiles.length,
      analyzed: analyzedFiles.length,
      total: normalFiles.length + analyzedFiles.length
    };
  };

  // 분석 가능 여부 체크 함수
  const canAnalyze = (files) => {
    const counts = getFileCounts(files);
    // analyzed 파일이 하나라도 있으면 개수 제한 없음
    if (counts.analyzed > 0) {
      return true;
    }
    // analyzed 파일이 없으면 MIN_FILES 체크
    return counts.total >= MIN_FILES;
  };

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const containerTop = containerRef.current?.getBoundingClientRect().top || 0;
      const relativeScroll = scrollTop - containerTop;
      setScrolled(relativeScroll > 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 확인

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 1. 데이터 정제 로직 (새로운 구조 지원)
  const processConversationData = (data) => {
      // ChatGPT Exporter 형식: { messages: [{ role, say }] }
      if (data.messages && Array.isArray(data.messages)) {
          const turns = [];
          let currentTurn = { user: '', assistant: '' };
          let turnCounter = 0;

          for (let message of data.messages) {
              if (message.role === 'Prompt') {
                  // 이전 턴이 완성되어 있으면 저장
                  if (currentTurn.user && currentTurn.assistant) {
                      turns.push({
                          turn: ++turnCounter,
                          user: currentTurn.user.trim(),
                          assistant: currentTurn.assistant.trim()
                      });
                      currentTurn = { user: '', assistant: '' };
                  }
                  // 새로운 유저 메시지 시작
                  currentTurn.user = (message.say || '').trim();
              } else if (message.role === 'Response') {
                  // 어시스턴트 응답
                  currentTurn.assistant = (message.say || '').trim();
              }
          }

          // 마지막 턴 저장
          if (currentTurn.user || currentTurn.assistant) {
              turns.push({
                  turn: ++turnCounter,
                  user: currentTurn.user.trim(),
                  assistant: currentTurn.assistant.trim()
              });
          }

          return turns.filter(turn => turn.user || turn.assistant);
      }

      // 새로운 구조: { chats: [{ user, assistant }] }
      if (data.chats && Array.isArray(data.chats)) {
          return data.chats.map((chat, index) => ({
              turn: index + 1,
              user: (chat.user || '').trim(),
              assistant: (chat.assistant || '').trim()
          })).filter(turn => turn.user || turn.assistant);
      }
      
      // 기존 구조: { conversation: [...] } (하위 호환성)
      if (data.conversation && Array.isArray(data.conversation)) {
          const USER_PREFIX = "나의 말:";
          const ASSISTANT_PREFIX = "ChatGPT의 말:";
          const IGNORE_LINES = ["ChatGPT", "로그인", "무료로 회원 가입", "ChatGPT와 익명 간의 대화의 사본입니다.", "대화 신고하기", "첨부", "검색", "학습하기", "음성", "SELECT", "EXPORT", "ChatGPT는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요. 쿠키 기본 설정을 참고하세요."];
          
          let turns = [];
          let currentTurn = { user: '', assistant: '' };
          let currentSpeaker = null;
          let turnCounter = 0;

          const normalizeText = (text) => text.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0 && !IGNORE_LINES.includes(line)).join('\n');

          for (let line of data.conversation) {
              if (line.startsWith(USER_PREFIX)) {
                  if (currentSpeaker === ASSISTANT_PREFIX && currentTurn.assistant) {
                      turns.push({
                          turn: ++turnCounter,
                          user: normalizeText(currentTurn.user),
                          assistant: normalizeText(currentTurn.assistant),
                      });
                      currentTurn = { user: '', assistant: '' };
                  }
                  currentSpeaker = USER_PREFIX;
                  currentTurn.user += line.substring(USER_PREFIX.length).trim() + '\n';
                  
              } else if (line.startsWith(ASSISTANT_PREFIX)) {
                  currentSpeaker = ASSISTANT_PREFIX;
                  currentTurn.assistant += line.substring(ASSISTANT_PREFIX.length).trim() + '\n';
                  
              } else if (currentSpeaker) {
                  if (currentSpeaker === USER_PREFIX) {
                      currentTurn.user += line + '\n';
                  } else if (currentSpeaker === ASSISTANT_PREFIX) {
                      currentTurn.assistant += line + '\n';
                  }
              }
          }

          if (currentTurn.user || currentTurn.assistant) {
              turns.push({
                  turn: ++turnCounter,
                  user: normalizeText(currentTurn.user),
                  assistant: normalizeText(currentTurn.assistant),
              });
          }
          return turns;
      }
      
      return [];
  };

  // 2. 개별 턴 분석 함수 (OpenAI API 사용, 유지)
  const analyzeTurnWithOpenAI = async (turn, history, apiKey) => {
    if (!apiKey) return { ...turn, hallucination_score: 0, issue_type: "api_key_missing", hallucination_reason: "API Key not provided.", purpose: "Error" };
    
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true }); 

    const context = history.map(t => `User: ${t.user}\nAssistant: ${t.assistant}`).join('\n');
    
    const systemPrompt = `
        Analyze the assistant's response for hallucinations and categorize the user's LAST intent.

        HALLUCINATION SCORING:
        1–5 scale
        (1 = low, 5 = high)


        ISSUE TYPE (choose one):
        - "factual_error": Wrong or fabricated information
        - "misalignment": Doesn't match user's request
        - "none": Only if score is 1

        PURPOSE (choose the MOST ACCURATE one based on user's intent):
        
        - "Information Seeking" - The most basic purpose. User seeks new knowledge or verification of existing knowledge.
           Includes: requesting concept explanations, fact-checking, exploring background information, verifying sources of ideas/claims.
           Examples: "What is X?", "Explain Y", "Is this true?", "Tell me about Z", "What's the source of this idea?"
        
        - "Content Generation" - User instructs ChatGPT to create a NEW artifact (text, code, or any creative output) with specific format and requirements.
           Includes: generating text (essays, reports, emails, stories, scenarios, poetry), writing code, creating tables/lists, generating creative ideas (marketing copy, titles, slogans, design/UX planning).
           Examples: "Write a report about X", "Create a login page code", "Generate a table of data", "Come up with marketing slogans"
        
        - "Language Refinement" - User improves QUALITY of their ALREADY WRITTEN text to make it clearer and more professional.
           Includes: grammar/spelling correction, style improvement (formal/informal tone), translation, clarification and summarization of complex sentences.
           Examples: "Fix grammar in this text", "Make this more formal", "Translate this", "Simplify this sentence"
        
        - "Meta-cognitive Engagement" - User reflects on their own learning process, knowledge state, or problem-solving strategy to improve themselves.
           Includes: correcting misconceptions ("Is my understanding correct?"), identifying knowledge gaps ("What should I learn next?"), requesting learning strategies, self-reflection on weaknesses of their own arguments/ideas.
           Examples: "I understood X as Y, is that correct?", "What should I learn next to understand this?", "How should I study for this exam?", "What are the weaknesses in my argument?"
        
        - "Conversational Repair" - User adjusts and controls the conversation when interaction is not smooth or there are problems with responses.
           Includes: pointing out errors and requesting corrections ("You're wrong, please check again"), adjusting prompts ("That's not what I meant, I want X"), rejecting inappropriate responses, resetting context when conversation is too long or off-topic.
           Examples: "You're wrong, check again", "That's not what I want, please do X instead", "This is inappropriate, don't answer like this", "Let's start over"
        

        REQUIRED OUTPUT (valid JSON):
        {
          "hallucination_score": 1-5,
          "issue_type": "factual_error" OR "misalignment" OR "none",
          "reason": "Brief description of the hallucination issue (max 15 words). Use 'none' only when hallucination_score is 1 (no issues detected).",
          "purpose": one of the 5 purposes above
        }
    `;
    
    const userPrompt = `
        Analyze this conversation's assistant response and the user's message intent.

        ${context}
 
        Return valid JSON. 
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" } 
      });

      const analysisText = response.choices[0].message.content.trim();
      console.log(`Turn ${turn.turn} raw response:`, analysisText);
      
      const analysis = JSON.parse(analysisText);
      
      // 응답 검증 및 기본값 설정
      const validPurposes = ["Information Seeking", "Content Generation", "Language Refinement", "Meta-cognitive Engagement", "Conversational Repair"];
      const purpose = validPurposes.includes(analysis.purpose) ? analysis.purpose : "Information Seeking";
      const hallucination_score = (analysis.hallucination_score >= 1 && analysis.hallucination_score <= 5) ? analysis.hallucination_score : 2;
      
      // issue_type 검증
      let issue_type;
      if (["factual_error", "misalignment", "none"].includes(analysis.issue_type)) {
        issue_type = analysis.issue_type;
      } else {
        issue_type = (hallucination_score === 1) ? "none" : "factual_error";
      }
      
      // reason 검증 (간단하게)
      let hallucination_reason = analysis.reason || "No specific issue identified";
      if (hallucination_score === 1) {
        hallucination_reason = "none";
      }
      
      return {
        ...turn,
        hallucination_score: hallucination_score,
        issue_type: issue_type,
        hallucination_reason: hallucination_reason,
        purpose: purpose,
      };
    } catch (error) {
      console.error(`OpenAI analysis failed for turn ${turn.turn}:`, error);
      console.error('Error details:', error.message);
      return { 
        ...turn, 
        hallucination_score: 2, 
        issue_type: "none", 
        hallucination_reason: "Analysis failed", 
        purpose: "Information Seeking" 
      };
    }
  };

  // 3. 세션별 Over-reliance Score 분석 함수 (수정된 로직 유지)
  const analyzeOverReliance = async (sessionText, apiKey) => {
    if (!apiKey) return { score: 0, advice: "API key missing for analysis." };
    
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const systemPrompt = `
        You are an expert in analyzing user dependency on AI models.
        
        HIGH DEPENDENCY:
        - "One-shot" requests: broad tasks or full solutions demanded without breakdown.
        - Uncritical acceptance: no verification, no questioning, simply taking output as-is.
        - Low-quality feedback: vague corrections like "다시 해줘", "더 잘해줘", "업그레이드해줘".
        
        LOW DEPENDENCY:
        - Stepwise, incremental requests showing independent reasoning.
        - Verification, critique, or constraint-adding after receiving output.
        - User applies their own judgment before requesting modifications.
        
        SCORING:
        1 = Very low dependency (expert, critical, independent)
        2 = Low dependency
        3 = Medium
        4 = High dependency
        5 = Very high dependency (one-shot requests + uncritical + vague repeats)
        
        REQUIRED OUTPUT FORMAT (valid JSON only):
        {
          "over_reliance_score": 1-5,
          "advice": "sharp advice under 15 words explaining dependency issue"
        }
    `;
    
    const userPrompt = `
        Analyze user dependency in this session.
        
        Conversation:
        ---
        ${sessionText}
        ---
        
        Return valid JSON matching the required format.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const resultText = response.choices[0].message.content.trim();
      console.log('Over-reliance raw response:', resultText);
      
      const result = JSON.parse(resultText);
      
      // 응답 검증
      const score = (result.over_reliance_score >= 1 && result.over_reliance_score <= 5) ? result.over_reliance_score : 3;
      const advice = result.advice || "Moderate AI dependency observed.";
      
      return {
        score: score,
        advice: advice
      };
    } catch (error) {
      console.error("OpenAI over-reliance analysis failed:", error);
      console.error('Error details:', error.message);
      return { score: 3, advice: "Unable to analyze dependency level." };
    }
  };


  // 4. 분석 시작 버튼 핸들러
  const handleAnalyzeStart = () => {
      const counts = getFileCounts(uploadedFiles);
      
      // analyzed 파일이 하나라도 있으면 개수 제한 없이 진행
      if (counts.analyzed > 0) {
          // 일반 파일이 있으면 API 호출 필요
          if (counts.normal > 0) {
              setIsModalVisible(true);
              return;
          }
          // 일반 파일이 없고 분석된 데이터만 있으면 바로 사용
          if (preAnalyzedData) {
              setAnalyzedData(preAnalyzedData);
              setStatus(`✅ 기존 분석 결과를 사용합니다.`);
              if (onAnalysisComplete) {
                  onAnalysisComplete(preAnalyzedData);
              }
              return;
          }
          // preAnalyzedData가 없으면 analyzedFiles에서 직접 추출
          const analyzedFiles = uploadedFiles.filter(f => f.isAnalyzed);
          if (analyzedFiles.length > 0 && analyzedFiles[0].data) {
              setAnalyzedData(analyzedFiles[0].data);
              setStatus(`✅ 기존 분석 결과를 사용합니다.`);
              if (onAnalysisComplete) {
                  onAnalysisComplete(analyzedFiles[0].data);
              }
              return;
          }
      }
      
      // analyzed 파일이 없으면 MIN_FILES 체크
      if (counts.normal > 0) {
          if (counts.total < MIN_FILES) {
              alert(`Error: Please upload at least ${MIN_FILES} JSON files. Currently: ${counts.total} files.`);
              setStatus(`⚠️ Please upload at least ${MIN_FILES} files to analyze. Currently: ${counts.total} files.`);
              setIsError(true);
              return;
          }
          setIsModalVisible(true);
          return;
      }
      
      // 파일이 없으면 에러
      if (counts.total < MIN_FILES) {
          alert(`Error: Please upload at least ${MIN_FILES} JSON files.`);
          setStatus(`⚠️ Please upload at least ${MIN_FILES} files to analyze.`);
          setIsError(true);
          return;
      }
      
      setIsModalVisible(true);
  };
  
  // 5. 모달 제출 핸들러 (유지)
  const handleModalSubmit = async (apiKey) => {
      setIsModalVisible(false);
      await handleAnalyzeClick(apiKey);
  };

  // 정보 루프 애니메이션
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentInfoIndex((prev) => (prev + 1) % 3);
      }, 3000); // 4초마다 변경
      return () => clearInterval(interval);
    } else {
      setCurrentInfoIndex(0);
    }
  }, [isAnalyzing]);

  // 6. 핵심 분석 실행 함수 (수정: 분석된 파일은 건너뛰고 일반 파일만 분석 후 병합)
  const handleAnalyzeClick = async (apiKey) => {
    setIsAnalyzing(true);
    setStatus('Starting LLM Analysis... This may take some time.');
    setIsError(false);
    setAnalyzedData(null);

    // 1. 일반 파일(분석 전)과 분석된 파일 분리
    const normalFiles = uploadedFiles.filter(f => !f.isAnalyzed);
    const analyzedFiles = uploadedFiles.filter(f => f.isAnalyzed);
    
    // 분석된 파일에서 기존 sessions 추출
    const existingSessions = [];
    if (preAnalyzedData && preAnalyzedData.sessions) {
        existingSessions.push(...preAnalyzedData.sessions);
    } else {
        // preAnalyzedData가 없으면 analyzedFiles에서 직접 추출
        analyzedFiles.forEach(fileObj => {
            if (fileObj.data && fileObj.data.sessions && Array.isArray(fileObj.data.sessions)) {
                existingSessions.push(...fileObj.data.sessions);
            }
        });
    }

    // 2. 일반 파일 데이터 정제
    let newSessions = normalFiles.map(fileObj => {
        const refinedTurns = processConversationData(fileObj.data);
        // metadata.title이 있으면 그것을 사용, 없으면 파일명 사용
        let sessionTitle = fileObj.name;
        if (fileObj.data.metadata && fileObj.data.metadata.title) {
            sessionTitle = `ChatGPT-${fileObj.data.metadata.title}.json`;
        }
        return {
            fileName: sessionTitle,
            capturedAt: fileObj.data.captured_at || fileObj.data.metadata?.dates?.exported,
            turnCount: refinedTurns.length,
            turns: refinedTurns
        };
    });

    const analyzedSessions = [...existingSessions]; // 기존 분석된 sessions 복사
    let totalTurnsProcessed = 0;
    let overallTotalTurns = newSessions.reduce((sum, s) => sum + s.turnCount, 0); 
    
    // 3. 일반 파일만 새로 분석
    for (let session of newSessions) {
        const analyzedTurns = [];
        const sessionHistory = [];

        // 개별 턴 분석
        for (const turn of session.turns) {
            setStatus(`Analyzing turn ${turn.turn} in file: ${session.fileName} (${totalTurnsProcessed + 1} / ${overallTotalTurns} total turns)`);
            const resultTurn = await analyzeTurnWithOpenAI(turn, sessionHistory, apiKey);
            analyzedTurns.push(resultTurn);
            sessionHistory.push({ user: turn.user, assistant: turn.assistant }); 
            totalTurnsProcessed++;
        }
        
        // 세션 텍스트 준비
        const sessionText = sessionHistory.map(t => `User: ${t.user}\nAssistant: ${t.assistant}`).join('\n---\n');

        // 세션별 Over-reliance Score 계산
        setStatus(`Calculating Over-reliance Score for file: ${session.fileName}...`);
        const overRelianceResult = await analyzeOverReliance(sessionText, apiKey);
        
        analyzedSessions.push({
            ...session,
            turns: analyzedTurns,
            over_reliance_score: overRelianceResult.score,
            over_reliance_advice: overRelianceResult.advice
        });
    }
    
    // 4. 최종 결과 생성 (기존 + 새로 분석한 sessions 병합)
    const totalTurns = analyzedSessions.reduce((sum, s) => sum + s.turnCount, 0);
    const finalResult = {
        totalFiles: analyzedSessions.length,
        generatedDate: new Date().toLocaleDateString('ko-KR'),
        totalTurns: totalTurns, 
        sessions: analyzedSessions
    };

    setIsAnalyzing(false);
    setAnalyzedData(finalResult);
    
    console.log("--- FINAL LLM ANALYZED DATA ---");
    console.log(JSON.stringify(finalResult, null, 2));
    console.log("-----------------------------");
    
    setStatus(`✅ Analysis Complete! Total ${analyzedSessions.length} files analyzed.`);
    // 💡 분석이 완료되면 App 컴포넌트에 데이터를 전달하여 화면 전환을 요청합니다.
    if (onAnalysisComplete) {
      onAnalysisComplete(finalResult);
    }
  };
  
  // 7. 기타 핸들러 (유지)
  const copyBookmarkletCode = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
      setCopyStatus('Code Copied!');
      setTimeout(() => setCopyStatus('Copy Code'), 2000);
    }).catch(() => {
      setCopyStatus('❌ Copy Failed');
      setTimeout(() => setCopyStatus('Copy Code'), 2000);
    });
  };
  
  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) return;

    setStatus(`Reading ${selectedFiles.length} file(s)...`);
    setIsError(false);

    const fileReaders = selectedFiles.map(file => {
        return new Promise((resolve, reject) => {
            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                reject({ file: file.name, error: 'Not a JSON file' });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                    const data = JSON.parse(e.target.result);
                    
                    // 분석된 JSON 파일인지 확인
                    // 1. sessions 배열이 있고
                    // 2. totalFiles, totalTurns가 숫자이고
                    // 3. sessions[0]에 turns 배열이 있고 각 turn에 분석 결과 필드가 있는 경우
                    const isAnalyzedJSON = data && 
                        data.sessions && Array.isArray(data.sessions) && 
                        data.sessions.length > 0 &&
                        typeof data.totalFiles === 'number' && 
                        typeof data.totalTurns === 'number' &&
                        data.sessions[0].turns && Array.isArray(data.sessions[0].turns) &&
                        data.sessions[0].turns.length > 0 &&
                        (data.sessions[0].turns[0].hallucination_score !== undefined || 
                         data.sessions[0].turns[0].purpose !== undefined ||
                         data.sessions[0].over_reliance_score !== undefined);
                    
                    if (isAnalyzedJSON) {
                        // 분석된 JSON 파일
                        resolve({ name: file.name, data: data, isAnalyzed: true });
                    } 
                    // 일반 대화 JSON 파일 (messages, chats, conversation 형식)
                    else if (data && (
                        (data.messages && Array.isArray(data.messages)) ||
                        (data.chats && Array.isArray(data.chats)) || 
                        (data.conversation && Array.isArray(data.conversation))
                    )) {
                        resolve({ name: file.name, data: data, isAnalyzed: false });
                    } else {
                        reject({ file: file.name, error: 'Invalid structure' });
                    }
                } catch (err) {
                    reject({ file: file.name, error: 'JSON parse error' });
                }
            };
            reader.onerror = () => reject({ file: file.name, error: 'Read error' });
            reader.readAsText(file);
        });
    });

    try {
        const results = await Promise.allSettled(fileReaders);
        const successfulUploads = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        
        const failedUploads = results
            .filter(r => r.status === 'rejected')
            .map(r => r.reason);

        // 분석된 JSON 파일과 일반 파일 분리
        const analyzedFiles = successfulUploads.filter(f => f.isAnalyzed);
        const normalFiles = successfulUploads.filter(f => !f.isAnalyzed);

        // 분석된 JSON 파일이 있으면 저장
        if (analyzedFiles.length > 0) {
            // 첫 번째 분석된 파일 사용 (여러 개면 첫 번째만)
            setPreAnalyzedData(analyzedFiles[0].data);
        }

        // 일반 파일과 분석된 파일 모두 업로드 목록에 추가 (분석된 파일도 표시하기 위해)
        const newNormalFiles = normalFiles.filter(newFile => 
            !uploadedFiles.some(existing => existing.name === newFile.name)
        );
        
        const newAnalyzedFiles = analyzedFiles.filter(newFile => 
            !uploadedFiles.some(existing => existing.name === newFile.name)
        );

        setUploadedFiles(prev => {
            const updated = [...prev, ...newNormalFiles, ...newAnalyzedFiles];
            const counts = getFileCounts(updated);
            const newFilesCount = newNormalFiles.length + newAnalyzedFiles.length;
            
            // 상태 메시지 업데이트
            // analyzed 파일이 하나라도 있으면 개수 제한 없으므로 "Need X more to analyze" 메시지 표시 안 함
            const hasNormalFiles = counts.normal > 0;
            const hasAnalyzedFiles = counts.analyzed > 0;
            const needMoreMsg = counts.total < MIN_FILES && hasNormalFiles && !hasAnalyzedFiles ? ` (Need ${MIN_FILES - counts.total} more to analyze)` : '';
            
            if (failedUploads.length > 0) {
                setStatus(`Added ${newFilesCount} files. Failed: ${failedUploads.map(f => f.file).join(', ')}. Total: ${counts.total}${needMoreMsg}`);
                setIsError(true);
            } else if (newFilesCount === 0 && successfulUploads.length > 0) {
                setStatus(`No new files added (duplicates skipped). Total: ${counts.total}${needMoreMsg}`);
            } else {
                setStatus(`Successfully added ${newFilesCount} files. Total: ${counts.total}${needMoreMsg}`);
                setIsError(counts.total < MIN_FILES && hasNormalFiles && !hasAnalyzedFiles);
            }
            
            return updated;
        });
        
        event.target.value = '';

    } catch (err) {
        console.error(err);
        setStatus('An unexpected error occurred.');
        setIsError(true);
    }
  };

  const removeFile = (fileName) => {
      // 제거할 파일이 분석된 파일인지 확인
      const fileToRemove = uploadedFiles.find(f => f.name === fileName);
      if (fileToRemove && fileToRemove.isAnalyzed) {
          setPreAnalyzedData(null);
      }
      
      setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
      setStatus(`Removed '${fileName}'.`);
      setAnalyzedData(null);
  };


  return (
    <Container ref={containerRef}>


      <ContentWrapper>
        <TitleWrapper>
        <h1 style={{ fontSize: '32px', color: '#111827'}}>Analyze your ChatGPT usage patterns</h1>
        <h2 style={{ fontSize: '20px', color: '#6b7280' }}>You can find how hallucination risks and overreliance quietly shape your ChatGPT usage.</h2>

        </TitleWrapper>
        
        <Section>
        <SectionTitle>Step 1: Export ChatGPT Conversations as JSON</SectionTitle>
        
        <StepList>
          <StepItem>
            <StepSubTitle>1. Install Extension</StepSubTitle>
            <p>Install <a href="https://chromewebstore.google.com/detail/ilmdofdhpnhffldihboadndccenlnfll" target="_blank" rel="noopener noreferrer" style={{color: '#f59e0b', textDecoration: 'underline', fontWeight: '600'}}>ChatGPT Exporter</a> from Chrome Web Store.</p>
          </StepItem>
          <StepItem>
            <StepSubTitle>2. Export as JSON</StepSubTitle>
            <p>Open a ChatGPT conversation → Click extension icon → Select <strong>JSON</strong> → Export. Repeat for <strong>at least 3 conversations</strong>.</p>
          </StepItem>
        </StepList>
      </Section>
      
      {/* Step 2: Upload */}
      <Section>
        <SectionTitle>Step 2: Upload Downloaded Files (3+ files)</SectionTitle>
        <p>You need to upload at least <Key>3</Key> JSON files. They will be merged and analyzed by OpenAI.</p>
        
        <FileInputWrapper htmlFor="file-upload">
          <p style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#f59e0b', fontWeight: 'bold', background: 'none' }}>
            Click to Browse Files
          </p>
          <p style={{ fontSize: '14px', margin: 0, background: 'none' }}>
            Select multiple <Key>.json</Key> files to upload.
          </p>
          
          <HiddenFileInput 
            id="file-upload" 
            accept=".json" 
            multiple 
            onChange={handleFileUpload} 
          />
        </FileInputWrapper>

        {uploadedFiles.length > 0 && (
            <FileList>
                {uploadedFiles.map(file => (
                    <FileListItem key={file.name}>
                        <FileName>
                            📄 {file.name}
                            {file.isAnalyzed && <AnalyzedBadge>Analyzed</AnalyzedBadge>}
                        </FileName>
                        <RemoveButton onClick={() => removeFile(file.name)} title="Remove file">
                            ✕
                        </RemoveButton>
                    </FileListItem>
                ))}
            </FileList>
        )}

        <StatusMessage $isError={isError}>{status}</StatusMessage>
      </Section>

        {/* Step 3: Analyze 버튼 */}
        <AnalyzeButton 
          onClick={handleAnalyzeStart} 
          disabled={!canAnalyze(uploadedFiles) || isAnalyzing}
        >
          {isAnalyzing ? `Analyzing...` : `Analyze ${uploadedFiles.length > 0 ? `${uploadedFiles.length} Files` : 'Data'}`}
        </AnalyzeButton>
      </ContentWrapper>

      
      {/* API Key 모달 */}
      <ApiKeyModal 
          isVisible={isModalVisible} 
          onClose={() => setIsModalVisible(false)}
          onSubmit={handleModalSubmit}
      />

      {/* 💡 분석 중 UI (전체 화면 모달) */}
      {isAnalyzing && (
          <AnalysisBackdrop>
              <AnalysisModalContent>
                  <h3>LLM Analysis in Progress...</h3>
                  <p style={{ color: '#f59e0b', fontSize: '19px', fontWeight: 'bold', margin: '20px 0' }}>
                    {status}
                  </p>
                  <div style={{ 
                    marginTop: '40px', 
                    borderTop: '1px solid #e5e7eb', 
                    paddingTop: '30px',
                    minHeight: '350px',
                    position: 'relative'
                  }}>
                    {currentInfoIndex === 0 && (
                      <InfoBox>
                        <h4 style={{ color: '#111827', fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                          1. Hallucination
                        </h4>
                        <div style={{ textAlign: 'left', color: '#374151' }}>
                          <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '3px solid #ef4444' }}>
                            <strong style={{ color: '#ef4444', fontSize: '16px' }}>Factual Error:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                              When the response contains incorrect, misleading, or fabricated information
                            </p>
                          </div>
                          <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '3px solid #F5840B' }}>
                            <strong style={{ color: '#F5840B', fontSize: '16px' }}>Misalignment:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                              When the response does not directly address the user's last intent
                            </p>
                          </div>
                          <div style={{ paddingLeft: '12px', borderLeft: '3px solid #16a34a' }}>
                            <strong style={{ color: '#16a34a', fontSize: '16px' }}>No Issues:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                              When the hallucination score is 1 (perfect)
                            </p>
                          </div>
                        </div>
                      </InfoBox>
                    )}
                    
                    {currentInfoIndex === 1 && (
                      <InfoBox>
                        <h4 style={{ color: '#111827', fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                          2. Over-reliance
                        </h4>
                        <div style={{ 
                          background: '#f9fafb',
                          padding: '20px',
                          borderRadius: '12px',
                          textAlign: 'left',
                          color: '#374151'
                        }}>
                          <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', fontWeight: '600', color: '#f59e0b', marginBottom: '12px' }}>
                            About Over-reliance:
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: '#6b7280' }}>
                            This score measures your dependency on AI assistance. Scores 1-2 indicate balanced usage, while 4-5 suggest excessive dependency. The analysis evaluates whether you're using AI as a tool or becoming overly reliant on it, and provides personalized advice to improve your usage patterns.
                          </p>
                        </div>
                      </InfoBox>
                    )}
                    
                    {currentInfoIndex === 2 && (
                      <InfoBox>
                        <h4 style={{ color: '#111827', fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                          3. Purpose
                        </h4>
                        <div style={{ textAlign: 'left', color: '#374151' }}>
                          <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '3px solid #0ea5e9' }}>
                            <strong style={{ color: '#0ea5e9', fontSize: '16px' }}>Information Seeking:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', wordBreak: 'break-word' }}>
                              Requesting explanations, fact-checking, or exploring background information
                            </p>
                          </div>
                          <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '3px solid #16a34a' }}>
                            <strong style={{ color: '#16a34a', fontSize: '16px' }}>Content Generation:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', wordBreak: 'break-word' }}>
                              Creating new content such as text, code, tables, or creative ideas
                            </p>
                          </div>
                          <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '3px solid #E6B000' }}>
                            <strong style={{ color: '#E6B000', fontSize: '16px' }}>Language Refinement:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', wordBreak: 'break-word' }}>
                              Improving text quality through grammar correction, translation, or clarification
                            </p>
                          </div>
                          <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '3px solid #8b5cf6' }}>
                            <strong style={{ color: '#8b5cf6', fontSize: '16px' }}>Meta-cognitive Engagement:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', wordBreak: 'break-word' }}>
                              Reflecting on learning processes and correcting misconceptions
                            </p>
                          </div>
                          <div style={{ paddingLeft: '12px', borderLeft: '3px solid #ec4899' }}>
                            <strong style={{ color: '#ec4899', fontSize: '16px' }}>Conversational Repair:</strong>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#6b7280', wordBreak: 'break-word' }}>
                              Correcting errors or resetting context when conversation goes off track
                            </p>
                          </div>
                        </div>
                      </InfoBox>
                    )}
                  </div>
              </AnalysisModalContent>
          </AnalysisBackdrop>
      )}
      
    </Container>
  );
});

export default GptLogUploader;