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
  const [formData, setFormData] = useState({
    title: editNoticeData?.title || '',
    content: editNoticeData?.content || '',
    dateType: editNoticeData?.dateType || (editNoticeData?.startDate && editNoticeData?.endDate && editNoticeData.startDate !== editNoticeData.endDate ? 'range' : 'single'),
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
        dateType: editNoticeData?.dateType || (editNoticeData?.startDate && editNoticeData?.endDate && editNoticeData.startDate !== editNoticeData.endDate ? 'range' : 'single'),
        date: editNoticeData?.date || getTodayDate(),
        startDate: editNoticeData?.startDate || editNoticeData?.date || getTodayDate(),
        endDate: editNoticeData?.endDate || editNoticeData?.date || getTodayDate(),
        category: editNoticeData?.category || '학사일정'
      });
      setSelectedImage(editNoticeData?.imageUrl || null);
    }
  }, [isOpen, editNoticeData, initialMode]);

  if (!isOpen) return null;

  function getTodayDate() {
    return getLocalDateString();
  }

  function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const base64 = await compressImage(file);
    if (!base64) return;

    setSelectedImage(base64);
    triggerAiAnalysis(base64, inlineApiKey, 'image/jpeg');
  };

  const triggerAiAnalysis = async (imageBase64, apiKeyToUse = '', mimeType = 'image/jpeg') => {
    setStep('analyzing');
    setIsAnalyzing(true);
    setApiErrorMessage('');

    const key = apiKeyToUse || getStoredApiKey();
    const result = await analyzeNoticeImage(imageBase64, key, mimeType);

    setIsAnalyzing(false);
    if (result.success) {
      setFormData((prev) => ({
        ...prev,
        title: result.data.title,
        content: result.data.content,
        date: result.data.date || getTodayDate(),
        category: result.data.category
      }));
      setAiAnalysisMode(result.mode);
      if (result.errorMsg) {
        setApiErrorMessage(result.errorMsg);
      }
      setStep('review');
    }
  };

  const handleApplyApiKey = (e) => {
    e.preventDefault();
    setStoredApiKey(inlineApiKey);
    if (selectedImage) {
      triggerAiAnalysis(selectedImage, inlineApiKey);
    }
    setShowApiKeyInput(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    let finalFormData = { ...formData };
    if (finalFormData.dateType === 'range') {
      let s = finalFormData.startDate || getTodayDate();
      let eDate = finalFormData.endDate || s;
      if (s > eDate) {
        const temp = s;
        s = eDate;
        eDate = temp;
      }
      finalFormData.startDate = s;
      finalFormData.endDate = eDate;
      finalFormData.date = eDate; // deadline is endDate
    }

    onSaveNotice({
      ...finalFormData,
      imageUrl: selectedImage,
      id: editNoticeData?.id || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
              {step === 'manual' ? <Edit3 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {isEdit
                  ? '📝 게시물 수정'
                  : step === 'manual'
                  ? '✏️ 직접 수동 게시물/일정 작성'
                  : '📸 AI 사진으로 게시물 등록'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'manual'
                  ? '안내문 내용과 일정을 직접 작성해 주세요.'
                  : '포스터나 안내문 사진을 올리면 AI가 알아서 제목과 일정을 정리해 줍니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs for new posts */}
        {!editNoticeData && (
          <div className="px-6 pt-3 bg-slate-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                step !== 'manual'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              📸 AI 사진으로 자동 등록
            </button>
            <button
              type="button"
              onClick={() => setStep('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                step === 'manual'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-8 text-center bg-slate-50 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      안내문/포스터 사진을 클릭하여 업로드하세요
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG, GIF 이미지 파일 지원 (스마트폰으로 촬영한 학급 공지 사진)
                    </p>
                  </div>
                </div>
              </div>

              {/* API Key Banner */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Google Gemini AI Vision API Key 설정 (선택 사항)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-blue-600 underline text-[11px]"
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
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg"
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
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  🤖 AI가 사진 내용을 읽고 분석 중입니다...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  제목, 마감일, 카테고리, 내용을 정리하고 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 & MANUAL: Form Editing */}
          {(step === 'review' || step === 'manual') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Preview & Upload Section */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>게시물 첨부 사진 (선택)</span>
                  </label>
                  {selectedImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                    >
                      <X className="w-3.5 h-3.5" /> 사진 삭제
                    </button>
                  )}
                </div>

                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 max-h-48 group">
                    <img
                      src={selectedImage}
                      alt="첨부 사진 미리보기"
                      className="w-full h-48 object-contain bg-slate-100"
                    />
                    <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1">
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
                  <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      클릭하여 사진/포스터 첨부
                    </span>
                    <span className="text-[11px] text-slate-400">
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
                  <label className="block text-xs font-bold text-slate-700">
                    게시물 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 국어 2학기 1차 수행평가 제출 안내"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Category & DateType Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-none cursor-pointer"
                    >
                      <option value="학사일정">📅 학사일정</option>
                      <option value="수행평가">📝 수행평가</option>
                      <option value="학교행사">🏫 학교행사</option>
                      <option value="외부활동">🏃 외부활동</option>
                      <option value="기타">📢 기타</option>
                    </select>
                  </div>

                  {/* Date Type Selector (하루 vs 기간) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      일정 지정 방식
                    </label>
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: 'single' })}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                          formData.dateType === 'single'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        📌 하루 (단일일자)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: 'range' })}
                        className={`flex-1 py-1.5 rounded-lg transition-all ${
                          formData.dateType === 'range'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        📅 기간 지정
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date Inputs based on dateType */}
                {formData.dateType === 'single' ? (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      마감일 / 일시 지정
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        시작일
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        종료일
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    상세 공지 내용
                  </label>
                  <textarea
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="공지할 핵심 내용, 준비물, 주의사항 등을 작성해 주세요."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow"
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
