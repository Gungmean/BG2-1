import React, { useState, useEffect } from 'react';
import { Camera, Upload, Sparkles, AlertCircle, CheckCircle2, RefreshCw, X, Key, Zap, Edit3, Calendar } from 'lucide-react';
import { analyzeNoticeImage } from '../services/aiService';
import { getLocalDateString, getStoredApiKey, setStoredApiKey } from '../services/storageService';

export default function AiUploadModal({
  isOpen,
  onClose,
  onSaveNotice,
  editNoticeData = null,
  initialMode = 'ai' // 'ai' | 'manual'
}) {
  const isEdit = Boolean(editNoticeData && editNoticeData.id);
  const [step, setStep] = useState(
    isEdit ? 'review' : initialMode === 'manual' ? 'manual' : 'upload'
  );
  const [selectedImage, setSelectedImage] = useState(editNoticeData?.imageUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState('');
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  const [inlineApiKey, setInlineApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Form Data State
  const getInitialDateType = (data) => {
    if (!data) return 'single';
    if (data.dateType) return data.dateType;
    if (data.startDate && data.endDate && data.startDate !== data.endDate) return 'range';
    if (!data.date && !data.startDate && !data.endDate) return 'none';
    return 'single';
  };

  const [formData, setFormData] = useState({
    title: editNoticeData?.title || '',
    content: editNoticeData?.content || '',
    dateType: getInitialDateType(editNoticeData),
    date: editNoticeData?.date || getTodayDate(),
    startDate: editNoticeData?.startDate || editNoticeData?.date || getTodayDate(),
    endDate: editNoticeData?.endDate || editNoticeData?.date || getTodayDate(),
    category: editNoticeData?.category || '학사일정'
  });

  useEffect(() => {
    if (isOpen) {
      setInlineApiKey(getStoredApiKey());
      setStep(isEdit ? 'review' : initialMode === 'manual' ? 'manual' : 'upload');
      setFormData({
        title: editNoticeData?.title || '',
        content: editNoticeData?.content || '',
        dateType: getInitialDateType(editNoticeData),
        date: editNoticeData?.date || getTodayDate(),
        startDate: editNoticeData?.startDate || editNoticeData?.date || getTodayDate(),
        endDate: editNoticeData?.endDate || editNoticeData?.date || getTodayDate(),
        category: editNoticeData?.category || '학사일정'
      });
      setSelectedImage(editNoticeData?.imageUrl || null);
      setApiErrorMessage('');
      setAiAnalysisMode('');
    }
  }, [isOpen, editNoticeData, initialMode]);

  function getTodayDate() {
    return getLocalDateString();
  }

  if (!isOpen) return null;

  const handleApplyApiKey = (e) => {
    e.preventDefault();
    setStoredApiKey(inlineApiKey);
    setShowApiKeyInput(false);
    alert('API Key가 저장되었습니다!');
  };

  // Image Upload and AI Analysis
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to Data URL for preview & processing
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setSelectedImage(dataUrl);
      startAiAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startAiAnalysis = async (imageDataUrl) => {
    setStep('analyzing');
    setIsAnalyzing(true);
    setApiErrorMessage('');

    try {
      const analysisResult = await analyzeNoticeImage(imageDataUrl);
      
      const inferredDateType =
        analysisResult.dateType ||
        (analysisResult.startDate && analysisResult.endDate && analysisResult.startDate !== analysisResult.endDate
          ? 'range'
          : !analysisResult.date && !analysisResult.startDate && !analysisResult.endDate
          ? 'none'
          : 'single');

      setFormData({
        title: analysisResult.title || '',
        content: analysisResult.content || '',
        dateType: inferredDateType,
        date: analysisResult.date || getTodayDate(),
        startDate: analysisResult.startDate || analysisResult.date || getTodayDate(),
        endDate: analysisResult.endDate || analysisResult.date || getTodayDate(),
        category: analysisResult.category || '학사일정'
      });

      setAiAnalysisMode(analysisResult.ocrMode || 'ai');
      setStep('review');
    } catch (err) {
      console.error(err);
      setApiErrorMessage('이미지 분석 중 오류가 발생했습니다. 직접 내용을 입력해주세요.');
      setStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }

    let finalDate = formData.date;
    let finalStartDate = formData.startDate;
    let finalEndDate = formData.endDate;

    if (formData.dateType === 'none') {
      finalDate = '';
      finalStartDate = '';
      finalEndDate = '';
    } else if (formData.dateType === 'single') {
      finalStartDate = formData.date;
      finalEndDate = formData.date;
    } else if (formData.dateType === 'range') {
      finalDate = formData.endDate || formData.startDate;
    }

    onSaveNotice({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      dateType: formData.dateType,
      date: finalDate,
      startDate: finalStartDate,
      endDate: finalEndDate,
      imageUrl: selectedImage,
      id: editNoticeData?.id || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold">
              {step === 'manual' ? <Edit3 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {isEdit
                  ? '📝 게시물 수정'
                  : step === 'manual'
                  ? '✏️ 직접 수동 게시물/일정 작성'
                  : '📸 AI 사진으로 게시물 등록'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'manual'
                  ? '안내문 내용과 일정을 직접 작성해 주세요.'
                  : '포스터나 안내문 사진을 올리면 AI가 알아서 제목과 일정을 정리해 줍니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs for new posts */}
        {!editNoticeData && (
          <div className="px-6 pt-3 bg-slate-50 dark:bg-slate-850 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                step !== 'manual'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              📸 AI 사진으로 자동 등록
            </button>
            <button
              type="button"
              onClick={() => setStep('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                step === 'manual'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              ✏️ 직접 수동 등록
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Upload Photo Dropzone */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-850 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      안내문/포스터 사진을 클릭하여 업로드하세요
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      JPG, PNG, GIF 이미지 파일 지원 (스마트폰으로 촬영한 학급 공지 사진)
                    </p>
                  </div>
                </div>
              </div>

              {/* API Key Banner */}
              <div className="p-3 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Google Gemini AI Vision API Key 설정 (선택 사항)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-blue-600 dark:text-blue-400 underline text-[11px]"
                  >
                    {showApiKeyInput ? '닫기' : 'API Key 설정'}
                  </button>
                </div>
                {showApiKeyInput && (
                  <form onSubmit={handleApplyApiKey} className="flex gap-2 pt-1">
                    <input
                      type="password"
                      value={inlineApiKey}
                      onChange={(e) => setInlineApiKey(e.target.value)}
                      placeholder="AIzaSy로 시작하는 키 입력"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 text-white font-bold text-xs rounded-lg"
                    >
                      적용
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Analyzing Spinner */}
          {step === 'analyzing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  🤖 AI가 사진 내용을 읽고 분석 중입니다...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  제목, 마감일, 카테고리, 내용을 정리하고 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 & MANUAL: Form Editing */}
          {(step === 'review' || step === 'manual') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Preview & Upload Section */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>게시물 첨부 사진 (선택)</span>
                  </label>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 hover:underline"
                    >
                      <X className="w-3.5 h-3.5" /> 사진 삭제
                    </button>
                  )}
                </div>

                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden bg-slate-900/5 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-48 group">
                    <img
                      src={selectedImage}
                      alt="첨부 사진 미리보기"
                      className="w-full h-48 object-contain bg-slate-100 dark:bg-slate-800"
                    />
                    <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 dark:bg-slate-800/90 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>사진 변경</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setSelectedImage(reader.result);
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      클릭하여 사진/포스터 첨부
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      JPG, PNG, GIF 이미지 파일 지원
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setSelectedImage(reader.result);
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Form Input Grid */}
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    게시물 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 국어 2학기 1차 수행평가 제출 안내"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Category & DateType Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none cursor-pointer"
                    >
                      <option value="학사일정">📅 학사일정</option>
                      <option value="수행평가">📝 수행평가</option>
                      <option value="학교행사">🏫 학교행사</option>
                      <option value="외부활동">🏃 외부활동</option>
                      <option value="기타">📢 기타</option>
                    </select>
                  </div>

                  {/* Date Type Selector */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      일정 지정 방식
                    </label>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: 'single' })}
                        className={`flex-1 py-1.5 rounded-lg transition-colors duration-75 ${
                          formData.dateType === 'single'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        📌 하루
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: 'range' })}
                        className={`flex-1 py-1.5 rounded-lg transition-colors duration-75 ${
                          formData.dateType === 'range'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        📅 기간
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: 'none' })}
                        className={`flex-1 py-1.5 rounded-lg transition-colors duration-75 ${
                          formData.dateType === 'none'
                            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm font-black'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        🚫 기한 없음
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date Inputs based on dateType */}
                {formData.dateType === 'none' ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
                      <span>🚫 마감 기한이 없는 상시 공지입니다</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      학급 달력 및 오늘 하루 리포트에는 표시되지 않으며, 기한 정렬 시 가장 아래에 배치됩니다.
                    </p>
                  </div>
                ) : formData.dateType === 'single' ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      마감일 / 일시 지정
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        시작일
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    상세 공지 내용
                  </label>
                  <textarea
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="공지할 핵심 내용, 준비물, 주의사항 등을 작성해 주세요."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:border-slate-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow"
                >
                  {editNoticeData ? '수정 완료' : '게시물 등록'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
