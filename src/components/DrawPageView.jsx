import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Dices,
  RotateCcw,
  Eye,
  Download,
  Printer,
  Shuffle,
  CheckCircle2,
  Trash2,
  Calendar,
  History,
  HelpCircle,
  Trophy,
  Users
} from 'lucide-react';

// 부광고 2학년 1반 25명 명단 (201 학번.xlsx 기반)
export const CLASS_STUDENTS = [
  { number: 1, name: '김건영' },
  { number: 2, name: '김민결' },
  { number: 3, name: '김민규' },
  { number: 4, name: '김선재' },
  { number: 5, name: '김선중' },
  { number: 6, name: '김성호' },
  { number: 7, name: '김지환' },
  { number: 8, name: '민재완' },
  { number: 9, name: '박시현' },
  { number: 10, name: '박윤민' },
  { number: 11, name: '박준환' },
  { number: 12, name: '손희승' },
  { number: 13, name: '안태현' },
  { number: 14, name: '양현모' },
  { number: 15, name: '염지환' },
  { number: 16, name: '오정민' },
  { number: 17, name: '이상준' },
  { number: 18, name: '이승빈' },
  { number: 19, name: '이승훈' },
  { number: 20, name: '이지훈' },
  { number: 21, name: '이찬희' },
  { number: 22, name: '임시준' },
  { number: 23, name: '정시우' },
  { number: 24, name: '최윤호' },
  { number: 26, name: '홍준혁' },
];

export function shuffleStudents(students = CLASS_STUDENTS) {
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 원본 PDF 기준 기본 좌석 데이터
const INITIAL_SEAT_STUDENTS = [
  // 0: 단독석 (1분단 위쪽)
  { number: 8, name: '민재완' },
  // 1분단 (좌측 4행 2열)
  { number: 5, name: '김선중' }, { number: 3, name: '김민규' },
  { number: 1, name: '김건영' }, { number: 15, name: '염지환' },
  { number: 4, name: '김선재' }, { number: 22, name: '임시준' },
  { number: 6, name: '김성호' }, { number: 10, name: '박윤민' },
  // 2분단 (중앙 4행 2열)
  { number: 18, name: '이승빈' }, { number: 2, name: '김민결' },
  { number: 16, name: '오정민' }, { number: 13, name: '안태현' },
  { number: 11, name: '박준환' }, { number: 24, name: '최윤호' },
  { number: 12, name: '손희승' }, { number: 23, name: '정시우' },
  // 3분단 (우측 4행 2열)
  { number: 26, name: '홍준혁' }, { number: 9, name: '박시현' },
  { number: 20, name: '이지훈' }, { number: 14, name: '양현모' },
  { number: 7, name: '김지환' }, { number: 19, name: '이승훈' },
  { number: 21, name: '이찬희' }, { number: 17, name: '이상준' }
];

// 원본 PDF 1:1 매칭 좌표 (pt 단위)
const PDF_CELL_BOXES = [
  // 0: 단독석 (1분단 위쪽)
  { x: 227.5, y: 301, w: 86.5, h: 33.5 },
  // Block 1 (Cols 0, 1)
  { x: 139.5, y: 266, w: 86.5, h: 33.5 }, { x: 227.5, y: 266, w: 86.5, h: 33.5 },
  { x: 139.5, y: 231, w: 86.5, h: 33.5 }, { x: 227.5, y: 231, w: 86.5, h: 33.5 },
  { x: 139.5, y: 196, w: 86.5, h: 33.5 }, { x: 227.5, y: 196, w: 86.5, h: 33.5 },
  { x: 139.5, y: 161, w: 86.5, h: 33.5 }, { x: 227.5, y: 161, w: 86.5, h: 33.5 },
  // Block 2 (Cols 2, 3)
  { x: 327.5, y: 266, w: 86.5, h: 33.5 }, { x: 415.5, y: 266, w: 86.5, h: 33.5 },
  { x: 327.5, y: 231, w: 86.5, h: 33.5 }, { x: 415.5, y: 231, w: 86.5, h: 33.5 },
  { x: 327.5, y: 196, w: 86.5, h: 33.5 }, { x: 415.5, y: 196, w: 86.5, h: 33.5 },
  { x: 327.5, y: 161, w: 86.5, h: 33.5 }, { x: 415.5, y: 161, w: 86.5, h: 33.5 },
  // Block 3 (Cols 4, 5)
  { x: 515.5, y: 266, w: 86.5, h: 33.5 }, { x: 603.5, y: 266, w: 86.5, h: 33.5 },
  { x: 515.5, y: 231, w: 86.5, h: 33.5 }, { x: 603.5, y: 231, w: 86.5, h: 33.5 },
  { x: 515.5, y: 196, w: 86.5, h: 33.5 }, { x: 603.5, y: 196, w: 86.5, h: 33.5 },
  { x: 515.5, y: 161, w: 86.5, h: 33.5 }, { x: 603.5, y: 161, w: 86.5, h: 33.5 },
];

// 한글 자음/모음 및 이름 음절 스크램블 풀 ("따다다다닫" 효과용)
const HANGUL_SCRAMBLE_POOL = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍',
  '건', '민', '규', '선', '재', '중', '호', '지', '환', '완', '시', '현', '윤', '준', '희', '승', '태', '모', '염', '상',
  '빈', '훈', '찬', '우', '결', '성'
];

// 오디오 합성 비프/틱 사운드 (외부 파일 없이 부드러운 효과음)
const playDrawSound = (type = 'tick') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'lock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === 'winner') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // 오디오 컨텍스트 제한 시 조용히 무시
  }
};

export default function DrawPageView() {
  const [activeSubTab, setActiveSubTab] = useState('number'); // 'number' | 'seat'

  // 연출 효과 ON/OFF 상태
  const [isNumberAnimEnabled, setIsNumberAnimEnabled] = useState(true);
  const [isSeatAnimEnabled, setIsSeatAnimEnabled] = useState(true);

  // ----------------------------------------------------
  // 1. 번호 뽑기 상태 (한글자씩 따다다다닫 모션)
  // ----------------------------------------------------
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawStage, setDrawStage] = useState('idle'); // 'idle' | 'spinning' | 'revealing' | 'done'
  const [slotNumber, setSlotNumber] = useState(null);
  const [isNumberLocked, setIsNumberLocked] = useState(false);
  const [slotChars, setSlotChars] = useState([]);
  const [lockedChars, setLockedChars] = useState([false, false, false]);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [drawLogs, setDrawLogs] = useState([]);
  const [remainingPool, setRemainingPool] = useState([...CLASS_STUDENTS]);

  const animIntervalRef = useRef(null);
  const timeoutsRef = useRef([]);

  const handleStartNumberDraw = () => {
    if (isSpinning) return;

    let pool = allowDuplicate ? CLASS_STUDENTS : remainingPool;

    if (pool.length === 0) {
      if (window.confirm('모든 학생이 추첨되었습니다! 명단을 초기화하여 다시 추첨하시겠습니까?')) {
        pool = [...CLASS_STUDENTS];
        setRemainingPool([...CLASS_STUDENTS]);
      } else {
        return;
      }
    }

    // 기존 타이머 정리
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    // 당첨자 선정
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const targetNameChars = winner.name.split('');

    // [연출 OFF 모드] 즉시 결과 출력
    if (!isNumberAnimEnabled) {
      setSlotNumber(winner.number);
      setIsNumberLocked(true);
      setSlotChars(targetNameChars);
      setLockedChars(new Array(targetNameChars.length).fill(true));
      setSelectedWinner(winner);
      setDrawStage('done');
      setIsSpinning(false);
      playDrawSound('winner');

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setDrawLogs((prev) => [
        {
          id: Date.now(),
          number: winner.number,
          name: winner.name,
          time: timeStr
        },
        ...prev
      ]);

      if (!allowDuplicate) {
        setRemainingPool((prev) => prev.filter((s) => s.number !== winner.number));
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    // [연출 ON 모드] 룰렛 & 순차 락인 연출
    setIsSpinning(true);
    setDrawStage('spinning');
    setSelectedWinner(null);
    setIsNumberLocked(false);
    setLockedChars(new Array(targetNameChars.length).fill(false));
    setSlotNumber(Math.floor(Math.random() * 26) + 1);
    setSlotChars(
      targetNameChars.map(
        () => HANGUL_SCRAMBLE_POOL[Math.floor(Math.random() * HANGUL_SCRAMBLE_POOL.length)]
      )
    );

    // 1단계: 초고속 글자 셔플 ("따다다다닫")
    let currentLockedNumber = false;
    let currentLockedList = new Array(targetNameChars.length).fill(false);
    let currentChars = [...targetNameChars.map(() => HANGUL_SCRAMBLE_POOL[Math.floor(Math.random() * HANGUL_SCRAMBLE_POOL.length)])];

    animIntervalRef.current = setInterval(() => {
      if (!currentLockedNumber) {
        setSlotNumber(Math.floor(Math.random() * 26) + 1);
      }

      currentChars = currentChars.map((ch, idx) => {
        if (currentLockedList[idx]) {
          return targetNameChars[idx];
        }
        return HANGUL_SCRAMBLE_POOL[Math.floor(Math.random() * HANGUL_SCRAMBLE_POOL.length)];
      });
      setSlotChars([...currentChars]);
      playDrawSound('tick');
    }, 45);

    // 2단계: 순차적 락인
    timeoutsRef.current.push(
      setTimeout(() => {
        currentLockedNumber = true;
        setIsNumberLocked(true);
        setSlotNumber(winner.number);
        setDrawStage('revealing');
        playDrawSound('lock');
      }, 700)
    );

    targetNameChars.forEach((_, idx) => {
      const lockDelay = 1050 + idx * 320;
      timeoutsRef.current.push(
        setTimeout(() => {
          currentLockedList[idx] = true;
          setLockedChars([...currentLockedList]);
          currentChars[idx] = targetNameChars[idx];
          setSlotChars([...currentChars]);
          playDrawSound('lock');
        }, lockDelay)
      );
    });

    const totalDuration = 1050 + targetNameChars.length * 320 + 200;
    timeoutsRef.current.push(
      setTimeout(() => {
        if (animIntervalRef.current) clearInterval(animIntervalRef.current);
        setDrawStage('done');
        setSelectedWinner(winner);
        setIsSpinning(false);
        playDrawSound('winner');

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setDrawLogs((prev) => [
          {
            id: Date.now(),
            number: winner.number,
            name: winner.name,
            time: timeStr
          },
          ...prev
        ]);

        if (!allowDuplicate) {
          setRemainingPool((prev) => prev.filter((s) => s.number !== winner.number));
        }

        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      }, totalDuration)
    );
  };

  const handleResetLogs = () => {
    if (window.confirm('추첨 기록을 모두 삭제하시겠습니까?')) {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      setDrawLogs([]);
      setSelectedWinner(null);
      setSlotNumber(null);
      setSlotChars([]);
      setIsNumberLocked(false);
      setLockedChars([false, false, false]);
      setDrawStage('idle');
      setRemainingPool([...CLASS_STUDENTS]);
    }
  };

  // ----------------------------------------------------
  // 2. 자리 뽑기 상태 & 슬롯머신 전체화면 연출
  // ----------------------------------------------------
  const [dateRange, setDateRange] = useState('[8/24-9/18]');
  const [seatList, setSeatList] = useState(
    INITIAL_SEAT_STUDENTS.map((s, idx) => ({
      index: idx,
      student: s,
      isRevealed: true
    }))
  );
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [seatModalData, setSeatModalData] = useState(null); // 전체화면 슬롯머신 연출 데이터

  const allRevealed = seatList.every((s) => s.isRevealed);

  const handleStartSeatGame = () => {
    const shuffled = shuffleStudents();
    const newSeats = shuffled.map((st, idx) => ({
      index: idx,
      student: st,
      isRevealed: false
    }));
    setSeatList(newSeats);
    setIsGameStarted(true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleRevealSeat = (index, e) => {
    if (seatList[index].isRevealed) return;

    // [연출 OFF 모드] 그 자리에서 즉시 공개
    if (!isSeatAnimEnabled) {
      setSeatList((prev) =>
        prev.map((s) => (s.index === index ? { ...s, isRevealed: true } : s))
      );

      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { x, y }
        });
      }
      return;
    }

    // [연출 ON 모드] 전체화면 블러 슬롯머신 연출 팝업
    const targetStudent = seatList[index].student;

    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    setSeatModalData({
      index,
      student: targetStudent,
      currentDisplay: CLASS_STUDENTS[Math.floor(Math.random() * CLASS_STUDENTS.length)],
      status: 'rolling',
    });

    // 1단계: 슬롯 롤링 (빠르게 번호.이름 회전)
    animIntervalRef.current = setInterval(() => {
      setSeatModalData((prev) => {
        if (!prev || prev.status !== 'rolling') return prev;
        playDrawSound('tick');
        const rand = CLASS_STUDENTS[Math.floor(Math.random() * CLASS_STUDENTS.length)];
        return { ...prev, currentDisplay: rand };
      });
    }, 35);

    // 2단계: 0.65초 후 확정 락인 & 축하
    timeoutsRef.current.push(
      setTimeout(() => {
        if (animIntervalRef.current) clearInterval(animIntervalRef.current);

        setSeatModalData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentDisplay: targetStudent,
            status: 'locked',
          };
        });

        playDrawSound('winner');
        confetti({
          particleCount: 85,
          spread: 80,
          origin: { y: 0.5 }
        });

        // 3단계: 0.65초 후 즉시 닫힘 및 좌석 공개
        timeoutsRef.current.push(
          setTimeout(() => {
            finalizeSeatModal(index);
          }, 650)
        );
      }, 650)
    );
  };

  const finalizeSeatModal = (index) => {
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    setSeatList((prev) =>
      prev.map((s) => (s.index === index ? { ...s, isRevealed: true } : s))
    );
    setSeatModalData(null);
  };

  const handleRevealAllSeats = () => {
    if (seatModalData) {
      finalizeSeatModal(seatModalData.index);
    }

    let delay = 0;
    seatList.forEach((s) => {
      if (!s.isRevealed) {
        setTimeout(() => {
          setSeatList((prev) =>
            prev.map((item) =>
              item.index === s.index ? { ...item, isRevealed: true } : item
            )
          );
        }, delay);
        delay += 35;
      }
    });

    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    }, delay + 50);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);

    try {
      const [{ PDFDocument, rgb }, fontkitModule] = await Promise.all([
        import('pdf-lib'),
        import('@pdf-lib/fontkit')
      ]);
      const fontkit = fontkitModule.default || fontkitModule;
      const fontResp = await fetch('/fonts/Paperlogy.ttf');
      if (!fontResp.ok) throw new Error('Paperlogy.ttf fetch failed');
      const fontBytes = await fontResp.arrayBuffer();

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const customFont = await pdfDoc.embedFont(fontBytes);

      // A4 Landscape: 841.89 x 595.28 pt
      const pageWidth = 841.89;
      const pageHeight = 595.28;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const cellWidth = 106;
      const cellHeight = 44;
      const blockGap = 44; // 여유 있는 분단 간격 (복도 통로)

      const blockWidth = cellWidth * 2;
      const totalTableWidth = blockWidth * 3 + blockGap * 2; // 724 pt
      const startX = (pageWidth - totalTableWidth) / 2;

      const mainTableTopY = 370;
      const standaloneY = mainTableTopY + cellHeight;

      // 1. 기간 헤더 [날짜]
      page.drawText(dateRange || '[8/24-9/18]', {
        x: startX,
        y: standaloneY + cellHeight + 15,
        size: 20,
        font: customFont,
        color: rgb(0, 0, 0),
      });

      // 좌석 셀 그리기 도우미 함수 (완벽한 테두리 & 중앙 정렬)
      const drawCell = (x, y, text) => {
        page.drawRectangle({
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });

        if (text) {
          const fontSize = 13.5;
          const textWidth = customFont.widthOfTextAtSize(text, fontSize);
          const textHeight = fontSize * 0.75;
          const textX = x + (cellWidth - textWidth) / 2;
          const textY = y + (cellHeight - textHeight) / 2;

          page.drawText(text, {
            x: textX,
            y: textY,
            size: fontSize,
            font: customFont,
            color: rgb(0, 0, 0),
          });
        }
      };

      // ─── 1분단 (좌측 분단) ───
      const block1X = startX;
      // 맨 앞 단독석 (1분단 우측 상단)
      const s0 = seatList[0]?.student;
      if (s0) {
        drawCell(block1X + cellWidth, standaloneY, `${s0.number}.${s0.name}`);
      }

      for (let r = 0; r < 4; r++) {
        const y = mainTableTopY - r * cellHeight;
        const st1 = seatList[1 + r * 2]?.student;
        const st2 = seatList[1 + r * 2 + 1]?.student;
        if (st1) drawCell(block1X, y, `${st1.number}.${st1.name}`);
        if (st2) drawCell(block1X + cellWidth, y, `${st2.number}.${st2.name}`);
      }

      // ─── 2분단 (중앙 분단) ───
      const block2X = block1X + blockWidth + blockGap;
      for (let r = 0; r < 4; r++) {
        const y = mainTableTopY - r * cellHeight;
        const st1 = seatList[9 + r * 2]?.student;
        const st2 = seatList[9 + r * 2 + 1]?.student;
        if (st1) drawCell(block2X, y, `${st1.number}.${st1.name}`);
        if (st2) drawCell(block2X + cellWidth, y, `${st2.number}.${st2.name}`);
      }

      // ─── 3분단 (우측 분단) ───
      const block3X = block2X + blockWidth + blockGap;
      for (let r = 0; r < 4; r++) {
        const y = mainTableTopY - r * cellHeight;
        const st1 = seatList[17 + r * 2]?.student;
        const st2 = seatList[17 + r * 2 + 1]?.student;
        if (st1) drawCell(block3X, y, `${st1.number}.${st1.name}`);
        if (st2) drawCell(block3X + cellWidth, y, `${st2.number}.${st2.name}`);
      }

      // ─── [ 교   탁 ] ───
      const deskWidth = 140;
      const deskHeight = 36;
      const deskX = (pageWidth - deskWidth) / 2;
      const deskY = mainTableTopY - 4 * cellHeight - 38;

      page.drawRectangle({
        x: deskX,
        y: deskY,
        width: deskWidth,
        height: deskHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(1, 1, 1),
      });

      const deskText = '교      탁';
      const deskFontSize = 13;
      const deskTextWidth = customFont.widthOfTextAtSize(deskText, deskFontSize);
      page.drawText(deskText, {
        x: deskX + (deskWidth - deskTextWidth) / 2,
        y: deskY + (deskHeight - deskFontSize * 0.75) / 2,
        size: deskFontSize,
        font: customFont,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const cleanDate = (dateRange || '201').replace(/[[\]/\s]/g, '_');
      link.download = `교실_좌석배치도_${cleanDate}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Vector PDF export failed:', err);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-semibold mb-1">
            <Trophy className="w-4 h-4 text-amber-200" />
            <span>부광고 2학년 1반 전용 도구</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            학급 스마트 뽑기 & 자리배치
          </h2>
          <p className="text-xs text-amber-100 mt-1">
            발표자/당번을 무작위 추첨하고, 교실 공식 좌석배치도를 원클릭으로 섞고 원본 서식 그대로 PDF로 출력하세요.
          </p>
        </div>

        {/* SubTab Toggle Switcher */}
        <div className="bg-black/20 p-1.5 rounded-2xl flex items-center gap-1 border border-white/20 backdrop-blur-sm self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('number')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === 'number'
                ? 'text-amber-900 font-extrabold shadow-sm'
                : 'text-white/90 hover:text-white'
            }`}
          >
            {activeSubTab === 'number' && (
              <motion.div
                layoutId="drawSubTabPill"
                className="absolute inset-0 bg-white rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Dices className="w-4 h-4 relative z-10" />
            <span className="relative z-10">번호 뽑기</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('seat')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === 'seat'
                ? 'text-amber-900 font-extrabold shadow-sm'
                : 'text-white/90 hover:text-white'
            }`}
          >
            {activeSubTab === 'seat' && (
              <motion.div
                layoutId="drawSubTabPill"
                className="absolute inset-0 bg-white rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Users className="w-4 h-4 relative z-10" />
            <span className="relative z-10">자리 뽑기</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. 번호 뽑기 뷰                                            */}
      {/* ======================================================== */}
      {activeSubTab === 'number' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col items-center justify-between space-y-6">
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
                  총 25명 등록됨
                </span>
                {!allowDuplicate && (
                  <span className="text-xs text-slate-500 font-medium">
                    (남은 추첨 대상: <strong className="text-amber-600 font-bold">{remainingPool.length}</strong>명)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* 추첨 연출 ON/OFF 토글 */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={isNumberAnimEnabled}
                    onChange={(e) => setIsNumberAnimEnabled(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    추첨 연출 {isNumberAnimEnabled ? 'ON' : 'OFF (즉시)'}
                  </span>
                </label>

                {/* 중복 추첨 허용 토글 */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(e) => setAllowDuplicate(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>중복 추첨 허용</span>
                </label>
              </div>
            </div>

            <div className="w-full py-10 px-6 rounded-3xl bg-gradient-to-b from-amber-50/70 via-orange-50/40 to-slate-50 border border-amber-200/80 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[290px] shadow-inner">
              {drawStage === 'idle' ? (
                <div className="space-y-3 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto shadow-inner text-2xl">
                    🎲
                  </div>
                  <p className="font-extrabold text-slate-600 text-base">
                    추첨하기 버튼을 눌러주세요
                  </p>
                  <p className="text-xs text-slate-400">
                    부광고 2학년 1반 25명 중 1명을 무작위로 추첨합니다.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 w-full">
                  {/* Number Badge with lock bounce */}
                  <motion.div
                    key={isNumberLocked ? `locked-${slotNumber}` : 'spinning-number'}
                    initial={{ scale: 0.8, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full font-black text-sm tracking-wide shadow-sm transition-all ${
                      isNumberLocked
                        ? 'bg-slate-900 text-amber-400 border border-amber-400/40 ring-2 ring-amber-400/30'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    <span>{slotNumber ? `${slotNumber}번` : '추첨 중...'}</span>
                    {isNumberLocked && <span className="text-[10px] text-amber-300">✓</span>}
                  </motion.div>

                  {/* Letter Cards Grid: 한글자씩 따다다다닫 & 락인 */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-2">
                    {slotChars.map((ch, idx) => {
                      const isLocked = lockedChars[idx];
                      return (
                        <motion.div
                          key={idx}
                          initial={false}
                          animate={
                            isLocked
                              ? {
                                  scale: [0.75, 1.18, 1],
                                  y: [8, -4, 0],
                                  rotate: [idx % 2 === 0 ? -3 : 3, 0],
                                  transition: { type: 'spring', stiffness: 450, damping: 18 }
                                }
                              : {
                                  scale: [0.96, 1.02, 0.96],
                                  transition: { repeat: Infinity, duration: 0.2 }
                                }
                          }
                          className={`w-16 h-22 sm:w-20 sm:h-26 rounded-2xl flex items-center justify-center select-none transition-all shadow-md ${
                            isLocked
                              ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-white border-2 border-amber-300 shadow-orange-300/60 ring-2 ring-orange-400/30'
                              : 'bg-white/95 text-slate-800 border-2 border-dashed border-amber-300 backdrop-blur-sm'
                          }`}
                        >
                          <span
                            className={`font-black text-3xl sm:text-5xl tracking-tight ${
                              !isLocked ? 'opacity-80 blur-[0.2px]' : 'drop-shadow-sm'
                            }`}
                          >
                            {ch || '?'}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Status / Celebration Banner */}
                  <div className="min-h-[28px] flex items-center justify-center">
                    {drawStage === 'done' && selectedWinner ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-4 py-1.5 rounded-full border border-emerald-300 inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>당첨 확정! 축하합니다 🎉</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-bold text-amber-600 bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {isNumberLocked
                            ? '이름 글자 추첨 중... (두구두구)'
                            : '행운의 번호 추첨 중...'}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full flex items-center justify-center gap-3 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartNumberDraw}
                disabled={isSpinning}
                className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-200/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Shuffle className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? '추첨 중...' : '번호 추첨하기'}</span>
              </motion.button>
            </div>
          </div>

          {/* Right Sidebar: Real-time Draw History Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  실시간 추첨 로그
                </h3>
              </div>
              {drawLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetLogs}
                  className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 font-bold transition-colors"
                  title="기록 지우기"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>초기화</span>
                </button>
              )}
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[340px] flex-1 pr-1">
              <AnimatePresence>
                {drawLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      index === 0
                        ? 'bg-amber-50/70 border-amber-200 shadow-sm'
                        : 'bg-slate-50/60 border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                        {drawLogs.length - index}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {log.number}번 {log.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.time}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {drawLogs.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-xs space-y-1">
                  <p>아직 추첨 기록이 없습니다.</p>
                  <p className="text-[11px] text-slate-400/80">
                    (새로고침 시 자동으로 초기화됩니다)
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-100">
              💡 실시간 로그는 창을 닫거나 새로고침하면 삭제됩니다.
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. 자리 뽑기 뷰                                            */}
      {/* ======================================================== */}
      {activeSubTab === 'seat' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>기간 설정:</span>
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  placeholder="[8/24-9/18]"
                  className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 자리뽑기 슬롯 연출 ON/OFF 토글 */}
              <label className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSeatAnimEnabled}
                  onChange={(e) => setIsSeatAnimEnabled(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  슬롯 연출 {isSeatAnimEnabled ? 'ON' : 'OFF (즉시)'}
                </span>
              </label>

              {isGameStarted && !allRevealed && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  남은 물음표: {seatList.filter((s) => !s.isRevealed).length}석
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleStartSeatGame}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" />
                <span>새 자리 뽑기 시작 (?)</span>
              </motion.button>

              {isGameStarted && !allRevealed && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRevealAllSeats}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>한 번에 모두 공개</span>
                </motion.button>
              )}

              {allRevealed && (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm shadow-emerald-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'PDF 생성 중...' : 'PDF로 출력 (원본 100% 일치)'}</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                    title="인쇄하기"
                  >
                    <Printer className="w-4 h-4" />
                    <span>인쇄</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Classroom Seating View - Clean Spaced Table Architecture */}
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200/90 shadow-sm overflow-x-auto flex flex-col items-center">
            
            <div
              className="bg-white p-4 sm:p-8 text-black select-none w-full max-w-3xl"
              style={{ fontFamily: 'Paperlogy, system-ui, sans-serif' }}
            >
              {/* Top Left Header Date Range */}
              <div className="text-left font-black text-xl text-black mb-8 pl-1">
                {dateRange}
              </div>

              {/* 3 Blocks Side-by-Side with Clear Classroom Aisles */}
              <div className="flex items-start justify-center gap-6 sm:gap-10 mx-auto">
                
                {/* ─── 【 1분단 (좌측) 】 ─── */}
                <div className="flex flex-col items-center w-40 sm:w-48">
                  {/* Standalone Top Row */}
                  <div className="grid grid-cols-2 w-full">
                    <div className="invisible h-10 sm:h-12" />
                    <div className="h-10 sm:h-12 border border-black border-b-0">
                      <SeatCell
                        seat={seatList[0]}
                        onReveal={(e) => handleRevealSeat(0, e)}
                      />
                    </div>
                  </div>

                  {/* 4 rows x 2 cols table */}
                  <table className="w-full border-collapse border border-black text-center">
                    <tbody>
                      {[0, 1, 2, 3].map((rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[1 + rowIdx * 2]}
                              onReveal={(e) => handleRevealSeat(1 + rowIdx * 2, e)}
                            />
                          </td>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[1 + rowIdx * 2 + 1]}
                              onReveal={(e) => handleRevealSeat(1 + rowIdx * 2 + 1, e)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ─── 【 2분단 (중앙) 】 ─── */}
                <div className="flex flex-col items-center w-40 sm:w-48">
                  {/* Standalone Height Spacer */}
                  <div className="h-10 sm:h-12 w-full invisible" />

                  {/* 4 rows x 2 cols table */}
                  <table className="w-full border-collapse border border-black text-center">
                    <tbody>
                      {[0, 1, 2, 3].map((rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[9 + rowIdx * 2]}
                              onReveal={(e) => handleRevealSeat(9 + rowIdx * 2, e)}
                            />
                          </td>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[9 + rowIdx * 2 + 1]}
                              onReveal={(e) => handleRevealSeat(9 + rowIdx * 2 + 1, e)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ─── 【 3분단 (우측) 】 ─── */}
                <div className="flex flex-col items-center w-40 sm:w-48">
                  {/* Standalone Height Spacer */}
                  <div className="h-10 sm:h-12 w-full invisible" />

                  {/* 4 rows x 2 cols table */}
                  <table className="w-full border-collapse border border-black text-center">
                    <tbody>
                      {[0, 1, 2, 3].map((rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[17 + rowIdx * 2]}
                              onReveal={(e) => handleRevealSeat(17 + rowIdx * 2, e)}
                            />
                          </td>
                          <td className="border border-black p-0 w-1/2 h-10 sm:h-12">
                            <SeatCell
                              seat={seatList[17 + rowIdx * 2 + 1]}
                              onReveal={(e) => handleRevealSeat(17 + rowIdx * 2 + 1, e)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Bottom Center [ 교  탁 ] Box */}
              <div className="pt-8 flex justify-center">
                <div className="w-32 py-1.5 border border-black text-center text-sm font-extrabold tracking-widest text-black bg-white shadow-sm">
                  교&nbsp;&nbsp;&nbsp;&nbsp;탁
                </div>
              </div>

            </div>

            <div className="mt-6 text-xs text-slate-400 text-center">
              💡 물음표(`?`)가 표시된 자리를 클릭하면 슬롯머신 연출과 함께 학생 이름이 공개됩니다.
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. 자리 뽑기 전체화면 블러 텍스트 추첨 연출                */}
      {/* ======================================================== */}
      <AnimatePresence>
        {seatModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => finalizeSeatModal(seatModalData.index)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-lg cursor-pointer select-none"
          >
            <div className="flex flex-col items-center justify-center text-center">
              {/* Rolling / Locked Huge White Typography */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    seatModalData.status === 'locked'
                      ? `locked-${seatModalData.currentDisplay?.number}`
                      : `rolling-${seatModalData.currentDisplay?.number}`
                  }
                  initial={
                    seatModalData.status === 'locked'
                      ? { scale: 0.7, opacity: 0, y: 20 }
                      : { y: 15, opacity: 0.8 }
                  }
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={
                    seatModalData.status === 'locked'
                      ? { type: 'spring', stiffness: 500, damping: 20 }
                      : { duration: 0.035 }
                  }
                  className="flex items-center justify-center"
                >
                  <span
                    className={`font-black tracking-tight text-white ${
                      seatModalData.status === 'locked'
                        ? 'text-6xl sm:text-8xl md:text-9xl drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]'
                        : 'text-5xl sm:text-7xl md:text-8xl opacity-90 blur-[0.3px] drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {seatModalData.currentDisplay?.number}.{seatModalData.currentDisplay?.name}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 개별 좌석 셀 컴포넌트
function SeatCell({ seat, onReveal }) {
  const { student, isRevealed, index } = seat;

  return (
    <motion.div
      whileHover={{ scale: isRevealed ? 1 : 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={onReveal}
      className={`w-full h-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors cursor-pointer select-none ${
        !isRevealed
          ? 'bg-amber-500 text-white font-black hover:bg-amber-600'
          : 'bg-white text-black'
      }`}
      title={isRevealed ? `${student.number}.${student.name}` : `자리 ${index + 1} (클릭하여 공개)`}
    >
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="hidden"
            initial={{ scale: 0.5, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, rotate: 30 }}
            className="flex items-center justify-center"
          >
            <span className="text-base sm:text-lg font-black text-white drop-shadow-sm">?</span>
          </motion.div>
        ) : (
          <motion.span
            key="revealed"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="whitespace-nowrap px-1 font-bold text-black"
          >
            {student.number}.{student.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
