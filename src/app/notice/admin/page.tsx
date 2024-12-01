'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice } from '@/types/notice';

const AdminPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '일반',
    keywords: '',
    isPinned: false,
    startDate: '',
    endDate: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== 'admin1234') {
      setAlertMessage('비밀번호가 올바르지 않습니다.');
      setShowAlert(true);
      return;
    }

    if (formData.startDate && formData.endDate && 
        new Date(formData.startDate) > new Date(formData.endDate)) {
      setAlertMessage('게시 종료일은 시작일보다 늦어야 합니다.');
      setShowAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      const newNotice: Partial<Notice> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        date: new Date().toISOString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        views: 0,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        searchText: `${formData.title} ${formData.content}`.toLowerCase(),
        isPinned: formData.isPinned,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      };

      await addDoc(collection(db, 'notices'), newNotice);
      
      setAlertMessage('공지사항이 등록되었습니다.');
      setShowAlert(true);
      
      // 폼 초기화
      setFormData({
        title: '',
        content: '',
        category: '일반',
        keywords: '',
        isPinned: false,
        startDate: '',
        endDate: '',
        password: ''
      });

      // 1.5초 후 목록 페이지로 이동
      setTimeout(() => {
        window.location.href = '/notice';
      }, 1500);

    } catch (error) {
      console.error('Error adding notice:', error);
      setAlertMessage('등록 중 오류가 발생했습니다.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">공지사항 등록</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">카테고리</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="일반">일반</option>
            <option value="중요">중요</option>
            <option value="이벤트">이벤트</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPinned"
            checked={formData.isPinned}
            onChange={(e) => handleChange('isPinned', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isPinned">상단 고정</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">게시 시작일</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">게시 종료일</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">내용</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full p-2 border rounded min-h-[200px]"
            required
          />
        </div>

        <div>
          <label className="block mb-1">검색 키워드 (쉼표로 구분)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => handleChange('keywords', e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="예: 공지, 중요, 이벤트"
          />
        </div>

        <div>
          <label className="block mb-1">관리자 비밀번호</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? '등록 중...' : '등록하기'}
        </button>
      </form>

      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4 text-lg text-center">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;