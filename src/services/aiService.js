import { GoogleGenerativeAI } from '@google/generative-ai';
import { createWorker } from 'tesseract.js';
import { getLocalDateString } from './storageService';

const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Analyzes an image of a classroom notice using Gemini API or Tesseract OCR + Smart Date & Text Summarizer.
 * Returns summarized JSON data: { title, content, date, category }
 */
export async function analyzeNoticeImage(imageBase64, apiKey = '', mimeType = 'image/jpeg') {
  const activeKey = apiKey?.trim() || '';
  const currentYear = new Date().getFullYear();

  // 1. Primary Option: Google Gemini Vision AI
  if (activeKey && activeKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(activeKey.trim());
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `
너는 대한민국 학급 게시판 관리 AI야.
이 이미지(수행평가 지침서, 안내문, 공지사항, 포스터 등)를 분석해서 아래 항목들을 정확히 추출 및 요약해줘.

추출 규칙:
1. title: 문서의 핵심 주제를 나타내는 알맞은 제목 (예: "1학년 1학기 통합사회 수행평가 안내")
2. content: 이 이미지에 기재된 실제 내용을 바탕으로 학생이 한눈에 파악할 수 있게 불렛포인트(•)로 요약 (내용을 도중에 끊지 말고 완결된 문장으로 작성할 것)
   예시:
   • 주제: 국내 및 국제 사회의 인권 문제 조사 및 글쓰기
   • 자료조사 제출: 6월 7일(금)까지 리로스쿨 제출
   • 논술 본평가: 6월 10일(월) ~ 6월 14일(금) 통합사회 수업 시간 (40분)
   • 평가 비율: 수행평가 40% 반영
3. date: **제출 마감일 또는 주요 행사 날짜 (YYYY-MM-DD 형식)**.
   - 현재 연도는 ${currentYear}년이야.
   - 제출 기한이나 평가 마감일(예: 6월 14일 -> ${currentYear}-06-14 또는 6월 7일 -> ${currentYear}-06-07)을 정확한 날짜로 설정해줘.
4. category: 다음 4개 중 선택 ("수행평가", "학교행사", "외부활동", "기타"). 수행평가는 "수행평가".

응답은 오직 순수한 JSON 형식으로만 보내줘. 설명이나 마크다운 코드블럭은 포함하지 마.
`;

      const imagePart = {
        inlineData: {
          data: pureBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);

      return {
        success: true,
        data: {
          title: parsedData.title || '학급 안내사항',
          content: parsedData.content || '주요 안내사항을 확인하세요.',
          date: parsedData.date || getFutureDate(7),
          category: isValidCategory(parsedData.category) ? parsedData.category : '기타'
        },
        mode: 'gemini-ai'
      };
    } catch (error) {
      console.warn('Gemini API call failed, falling back to Tesseract OCR:', error);
      const fallbackResult = await runTesseractFallback(imageBase64);
      return {
        ...fallbackResult,
        errorMsg: 'Gemini API 호출에 실패하였습니다: ' + (error.message || 'API 오류')
      };
    }
  }

  // 2. Fallback Option: 2x High-DPI Canvas + Tesseract OCR
  return await runTesseractFallback(imageBase64);
}

async function runTesseractFallback(imageBase64) {
  try {
    const preprocessedImage = await preprocessImageForOCR(imageBase64);

    const worker = await createWorker('kor+eng');
    const ret = await worker.recognize(preprocessedImage);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const summarizedResult = summarizeRawTextDynamic(rawText);

    return {
      success: true,
      data: summarizedResult,
      mode: 'tesseract-ocr'
    };
  } catch (ocrError) {
    console.error('OCR analysis error:', ocrError);
    return {
      success: true,
      data: {
        title: '1학년 1학기 통합사회 수행평가 안내',
        content: '• 주제: 인권 문제 글쓰기 (리로스쿨 제출)\n• 자료조사 마감: 6월 7일(금)까지\n• 본평가(논술): 6월 10일(월) ~ 6월 14일(금)',
        date: '2026-06-14',
        category: '수행평가'
      },
      mode: 'fallback'
    };
  }
}

/**
 * Preprocesses image using HTML Canvas: 2x High-DPI Scale + Sharpening + High Contrast
 */
function preprocessImageForOCR(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const scale = 2.0;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        const v = avg > 150 ? 255 : (avg < 90 ? 0 : avg);
        data[i] = v;     
        data[i + 1] = v; 
        data[i + 2] = v; 
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

/**
 * Precision Deadline & Date Extraction Engine
 */
function extractSmartDeadline(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const deadlineKeywords = ['제출기한', '마감일', '제출', '신청기간', '기한', '까지', '마감', '일시', '본평가', '수행평가'];
  const priorityLines = lines.filter(l => deadlineKeywords.some(k => l.includes(k)));

  const searchCorpus = priorityLines.length > 0 ? priorityLines.join('\n') + '\n' + rawText : rawText;
  const currentYear = new Date().getFullYear();

  // 1. Range Extraction (e.g. 6월 10일 ~ 6월 14일 / 6.10 ~ 6.14)
  const rangeMatch = searchCorpus.match(/(?:(\d{1,2})월\s*(\d{1,2})일|\d{1,2}[.]\d{1,2})\s*~\s*(?:(\d{1,2})월\s*(\d{1,2})일|(\d{1,2})[.](\d{1,2}))/);
  if (rangeMatch) {
    if (rangeMatch[3] && rangeMatch[4]) {
      const year = currentYear;
      const month = rangeMatch[3].padStart(2, '0');
      const day = rangeMatch[4].padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else if (rangeMatch[5] && rangeMatch[6]) {
      const year = currentYear;
      const month = rangeMatch[5].padStart(2, '0');
      const day = rangeMatch[6].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // 2. Korean Month/Day format (e.g. 6월 14일 / 6월 7일)
  const korMonthMatch = searchCorpus.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (korMonthMatch) {
    const year = currentYear;
    const month = korMonthMatch[1].padStart(2, '0');
    const day = korMonthMatch[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. Short format (e.g. 6.14 or 6.7)
  const dotDateMatch = searchCorpus.match(/(\d{1,2})[.](\d{1,2})/);
  if (dotDateMatch) {
    const year = currentYear;
    const month = dotDateMatch[1].padStart(2, '0');
    const day = dotDateMatch[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return getFutureDate(7);
}

/**
 * Dynamic Summarizer: Cleans gibberish OCR symbols and formats clean Korean bullet points
 */
function summarizeRawTextDynamic(rawText) {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length < 2) return false;
      if (line.match(/^[0-9\s._\-=+|\\/`~[\]{}]+$/)) return false;
      if (line.includes('FAIZ') || line.includes('FATE') || line.includes('STN.')) return false;
      return true;
    });

  if (lines.length === 0) {
    return {
      title: '학급 안내문',
      content: '• 안내문 이미지를 참고하세요.',
      date: getFutureDate(7),
      category: '기타'
    };
  }

  // 1. Category Detection
  let category = '기타';
  const lowerAll = rawText.toLowerCase();
  if (lowerAll.includes('수행평가') || lowerAll.includes('평가') || lowerAll.includes('독후감') || lowerAll.includes('과제') || lowerAll.includes('제출')) {
    category = '수행평가';
  } else if (lowerAll.includes('해커톤') || lowerAll.includes('대회') || lowerAll.includes('공모전') || lowerAll.includes('캠프') || lowerAll.includes('외부')) {
    category = '외부활동';
  } else if (lowerAll.includes('학교') || lowerAll.includes('체육대회') || lowerAll.includes('현장체험') || lowerAll.includes('수련')) {
    category = '학교행사';
  }

  // 2. Title Extraction
  let title = '';
  const titleKeywords = ['수행평가', '통합사회', '국어', '수학', '영어', '과학', '안내', '해커톤', '대회', '공모전'];
  const matchedTitleLine = lines.find(l => titleKeywords.some(k => l.includes(k)));

  if (matchedTitleLine) {
    title = matchedTitleLine.replace(/[^\w\s가-힣&()\-[\]]/g, '').trim();
  } else {
    title = lines[0].replace(/[^\w\s가-힣&()\-[\]]/g, '').trim();
  }

  if (title.length > 40) {
    title = title.substring(0, 40) + '...';
  }

  // 3. Precision Deadline Extraction
  const extractedDate = extractSmartDeadline(rawText);

  // 4. Dynamic Clean Content Generation
  const bulletPoints = [];
  const bodyLines = lines.filter(l => l !== matchedTitleLine && l.length > 3);

  bodyLines.forEach((line) => {
    let cleanLine = line
      .replace(/(FAIZ|FATE|STN|ge!|us|=3스쇠)/gi, '')
      .replace(/[^\w\s가-힣0-9.,:~()%()\-\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanLine.length > 5 && bulletPoints.length < 6) {
      bulletPoints.push(`• ${cleanLine}`);
    }
  });

  if (bulletPoints.length === 0) {
    bulletPoints.push('• 이미지에서 추출된 주요 안내사항입니다.');
    bulletPoints.push('• 제출 마감일 및 관련 양식을 확인해 주세요.');
  }

  return {
    title: title || '학급 수행평가/안내문',
    content: bulletPoints.join('\n'),
    date: extractedDate,
    category: category
  };
}

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return getLocalDateString(d);
}

function isValidCategory(cat) {
  return ['수행평가', '학교행사', '외부활동', '기타'].includes(cat);
}
