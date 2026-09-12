import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  Settings,
  ShieldCheck,
  RefreshCw,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Clock,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { getUpcomingExamDDay } from '../services/schoolService';

// 인천 부평구 좌표 (부광고등학교 위치)
const INCHEON_LAT = 37.507;
const INCHEON_LON = 126.722;

export default function Header({ isMonitor, onOpenPinModal, onOpenSettings, onRefresh }) {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temp: 23,
    code: 0,
    text: '맑음',
    icon: Sun,
    color: 'text-amber-500'
  });

  // Calculate upcoming exam D-Day (updates daily or when time state changes)
  const examDDay = useMemo(() => {
    return getUpcomingExamDDay(time);
  }, [time.getFullYear(), time.getMonth(), time.getDate()]);

  // 1초마다 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
    // 15분마다 날씨 갱신
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        
        {/* LEFT: Brand Logo & School Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-100 flex-shrink-0">
              <img
                src="/symbol.jpg"
                alt="부광스쿨 심볼"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span 
              className="font-extrabold font-nalsun text-slate-900 text-lg tracking-tight cursor-pointer select-none"
              onDoubleClick={onOpenPinModal}
              title="부광스쿨"
            >
              부광스쿨
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            인천 부광고 2학년 1반
          </span>
        </div>

        {/* CENTER: 실시간 날짜 · 디지털 시계 · 시험 D-Day · 날씨 위젯 */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/80 shadow-inner">
          {/* 📅 날짜 & ⏰ 실시간 시계 */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span className="text-slate-900 whitespace-nowrap">
              {month}월 {date}일 ({dayName})
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 font-mono text-blue-600 font-extrabold tracking-tight">
              <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>{hours}:{minutes}:{seconds}</span>
            </div>
          </div>

          {/* 📝 시험 디데이 (사용자 요청: 날짜와 시간 옆에 표시) */}
          {examDDay && (
            <>
              <span className="text-slate-300">|</span>
              <div
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs cursor-default select-none"
                title={`${examDDay.fullName} (${examDDay.startDateStr} ~ ${examDDay.endDateStr})`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="hidden sm:inline font-extrabold text-indigo-900">
                  {examDDay.name}
                </span>
                <span className="sm:hidden font-extrabold text-indigo-900">
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

          <span className="text-slate-300">|</span>

          {/* ☀️ 실시간 날씨 위젯 */}
          <div
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-default"
            title={`인천 부평구 날씨: ${weather.text} (${weather.temp}°C)`}
          >
            <WeatherIcon className={`w-4 h-4 ${weather.color} flex-shrink-0`} />
            <span className="font-extrabold text-slate-800">{weather.temp}°C</span>
            <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
              {weather.text}
            </span>
          </div>
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Refresh Button */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={onRefresh}
            title="새로고침"
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {/* Monitor Auth Status / Login Button */}
          {isMonitor && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenPinModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="hidden sm:inline">반장 모드</span>
              <span className="sm:hidden">반장</span>
            </motion.button>
          )}

          {/* Settings Button */}
          <motion.button
            whileTap={{ scale: 0.9, rotate: 45 }}
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="설정 및 동기화"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
