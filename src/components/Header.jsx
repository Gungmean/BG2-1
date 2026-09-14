import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  Settings,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Clock,
  MapPin,
  GraduationCap,
  Smartphone
} from 'lucide-react';
import { getUpcomingExamDDay } from '../services/schoolService';
import { useTheme } from '../context/ThemeContext';

// 인천 부평구 좌표 (부광고등학교 위치)
const INCHEON_LAT = 37.507;
const INCHEON_LON = 126.722;

export default function Header({ isMonitor, onOpenPinModal, onOpenSettings, onRefresh, onGoHome }) {
  const { isDark, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 23,
    code: 0,
    text: '맑음',
    icon: Sun,
    color: 'text-amber-500'
  });

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        '💡 [부광이일] 앱 설치 안내:\n\n' +
        '• 아이폰(Safari): 하단 [공유(네모+화살표)] 버튼을 누른 뒤 [홈 화면에 추가]를 눌러주세요.\n' +
        '• 안드로이드(Chrome): 우측 상단 메뉴(점 3개)를 누른 뒤 [앱 설치] 또는 [홈 화면에 추가]를 눌러주세요.'
      );
    }
  };

  // Calculate upcoming exam D-Day (updates daily or when time state changes)
  const examDDay = useMemo(() => {
    return getUpcomingExamDDay(time);
  }, [time.getFullYear(), time.getMonth(), time.getDate()]);

  // 실제 초 정각(000ms) 동기화 및 1초 주기 보정 타이머
  useEffect(() => {
    let timeoutId = null;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) return;
      setTime(new Date());

      const now = new Date();
      const delay = Math.max(10, 1000 - now.getMilliseconds());
      timeoutId = setTimeout(tick, delay);
    };

    const initialDelay = Math.max(10, 1000 - new Date().getMilliseconds());
    timeoutId = setTimeout(tick, initialDelay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTime(new Date());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 실시간 날씨 데이터 Fetch (Open-Meteo API)
  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${INCHEON_LAT}&longitude=${INCHEON_LON}&current_weather=true&timezone=Asia%2FSeoul`
        );
        const data = await res.json();
        if (data?.current_weather && isMounted) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          const info = parseWeatherCode(code);
          setWeather({ temp, code, ...info });
        }
      } catch (e) {
        console.warn('Weather fetch fallback', e);
      }
    }

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, []);

  function parseWeatherCode(code) {
    if (code === 0) return { text: '맑음', icon: Sun, color: 'text-amber-500' };
    if (code >= 1 && code <= 2) return { text: '구름조금', icon: CloudSun, color: 'text-sky-500' };
    if (code === 3) return { text: '흐림', icon: Cloud, color: 'text-slate-400' };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return { text: '비', icon: CloudRain, color: 'text-blue-500' };
    }
    if ([71, 73, 75, 85, 86].includes(code)) {
      return { text: '눈', icon: Snowflake, color: 'text-indigo-400' };
    }
    if (code >= 95) return { text: '뇌우', icon: CloudLightning, color: 'text-purple-500' };
    return { text: '맑음', icon: Sun, color: 'text-amber-500' };
  }

  // 날짜 포맷 (예: 9월 11일 금)
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[time.getDay()];

  // 시간 포맷 (예: 15:09:42)
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const WeatherIcon = weather.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 shadow-sm px-3 sm:px-4 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
        
        {/* LEFT: Brand Logo & School Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
            onClick={onGoHome}
            title="부광이일 메인 화면으로 이동"
          >
            <img
              src="/symbol.png"
              alt="부광이일 심볼"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span 
              className="font-extrabold font-nalsun text-slate-900 dark:text-slate-100 text-lg sm:text-xl tracking-tight"
            >
              부광이일
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            인천 부광고 2학년 1반
          </span>
        </div>

        {/* CENTER: 실시간 날짜 · 디지털 시계 · 시험 D-Day · 날씨 위젯 */}
        <div className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-inner overflow-x-auto scrollbar-none transition-colors">
          {/* 📅 날짜 & ⏰ 실시간 시계 */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            <span className="text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {month}월 {date}일 ({dayName})
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1 font-mono tabular-nums text-blue-600 dark:text-blue-400 font-extrabold tracking-tight">
              <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span className="tabular-nums tracking-normal">{hours}:{minutes}:{seconds}</span>
            </div>
          </div>

          {/* 📝 시험 디데이 */}
          {examDDay && (
            <>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <div
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/70 px-2 sm:px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-sm cursor-default select-none shrink-0"
                title={`${examDDay.fullName} (${examDDay.startDateStr} ~ ${examDDay.endDateStr})`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden sm:inline font-extrabold text-indigo-900 dark:text-indigo-200">
                  {examDDay.name}
                </span>
                <span className="sm:hidden font-extrabold text-indigo-900 dark:text-indigo-200">
                  중간고사
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black tracking-tight leading-none ${
                    examDDay.isOngoing
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : examDDay.daysLeft <= 7
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {examDDay.ddayText}
                </span>
              </div>
            </>
          )}

          <span className="text-slate-300 dark:text-slate-600">|</span>

          {/* ☀️ 실시간 날씨 위젯 */}
          <div
            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 cursor-default shrink-0"
            title={`인천 부평구 날씨: ${weather.text} (${weather.temp}°C)`}
          >
            <WeatherIcon className={`w-4 h-4 ${weather.color} flex-shrink-0`} />
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{weather.temp}°C</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden md:inline">
              {weather.text}
            </span>
          </div>
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Direct App Install Button (Only when not in standalone installed mode) */}
          {!isInstalled && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800 transition-all shadow-sm"
              title="스마트폰/PC에 부광이일 앱 설치"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">앱 설치</span>
            </motion.button>
          )}

          {/* Dark Mode Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 15 }}
            onClick={toggleTheme}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </motion.button>

          {/* Refresh Button */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={onRefresh}
            title="새로고침"
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {/* Monitor Auth Status / Login Button */}
          {isMonitor ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenPinModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="hidden sm:inline">반장 모드</span>
              <span className="sm:hidden">반장</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenPinModal}
              title="반장 인증 (PIN)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">반장 인증</span>
            </motion.button>
          )}

          {/* Settings Button */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 45 }}
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
