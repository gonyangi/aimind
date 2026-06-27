import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

import path from 'path';
import { fileURLToPath } from 'url';

// .env 파일의 절대 경로를 계산하여 항상 올바르게 로드하도록 보강
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// CORS 설정: 프론트엔드(Vite 개발 서버: 5173 포트)로부터의 통신을 허용
app.use(cors({
  origin: 'http://localhost:5173'
}));

// HTTP 요청 바디(Body)의 JSON 데이터를 해석하기 위한 미들웨어 설정
app.use(express.json());

// 환경 변수로부터 제미나이 API 키 추출
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
  console.warn("⚠️ 경고: GEMINI_API_KEY가 올바르게 설정되지 않았습니다. backend/.env 파일을 수정해주세요.");
}

// 제미나이 SDK 초기화
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * 학생의 일기를 받아서 제미나이 AI의 따뜻한 피드백을 생성하는 API 엔드포인트
 * URL: POST http://localhost:5001/api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { diaryContent } = req.body;

    // 데이터 유효성 검사
    if (!diaryContent || diaryContent.trim() === '') {
      return res.status(400).json({ error: '일기 내용이 비어있습니다. 내용을 작성한 후 전송해주세요.' });
    }

    // 제미나이 모델 생성 (gemini-1.5-flash 모델 적용)
    // systemInstruction을 통해 AI의 페르소나를 '따뜻하고 격려하는 초등 교사'로 제어합니다.
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `너는 학생들의 속마음과 일상을 공감해주는 초등학교 선생님이야. 
학생이 쓴 일기를 읽고, 해당 학생의 마음에 적극적으로 공감하고 격려와 응원의 답변을 해줘. 
말투는 반말 대신 부드럽고 다정한 존댓말(해요체)을 사용해줘. 
답변의 길이는 3~4문장 내외로 간결하고 따뜻하게 작성해줘. 
아이들이 상처받지 않고 위로를 얻거나 긍정적인 힘을 낼 수 있는 말로 대답해줘.`
    });

    // 제미나이 API 호출하여 피드백 텍스트 생성
    const result = await model.generateContent(diaryContent);
    const response = await result.response;
    const aiFeedback = response.text();

    // 프론트엔드로 성공 응답 전송
    res.json({ feedback: aiFeedback });

  } catch (error) {
    // 실제 에러 내용을 콘솔과 응답에 모두 출력 (문제 진단용)
    console.error('제미나이 API 통신 중 에러 발생:', error?.message || error);
    res.status(500).json({ 
      error: 'AI 피드백을 생성하는 중 오류가 발생했습니다.',
      detail: error?.message || String(error)
    });
  }
});

// 백엔드 웹 서버 기동
app.listen(PORT, () => {
  console.log(`🚀 AI 일기 분석 백엔드 서버가 http://localhost:${PORT} 에서 활성화되었습니다.`);
});
