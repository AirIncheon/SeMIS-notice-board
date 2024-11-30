'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice } from '@/types/notice';

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
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

  useEffect(() => {
    let isMounted = true;

    const fetchNotice = async () => {
      const id = String(params?.id);
      console.log("Fetching notice with ID:", id);

      try {
        setIsLoading(true);
        const noticeRef = doc(db, 'notices', id);
        const noticeSnap = await getDoc(noticeRef);
        
        if (!isMounted) return;

        if (noticeSnap.exists()) {
          const noticeData = noticeSnap.data();
          console.log("Fetched notice data:", noticeData);
          
          setFormData({
            title: noticeData.title || '',
            content: noticeData.content || '',
            category: noticeData.category || '일반',
            keywords: (noticeData.keywords || []).join(', '),
            isPinned: noticeData.isPinned || false,
            startDate: noticeData.startDate ? new Date(noticeData.startDate).toISOString().slice(0, 10) : '',
            endDate: noticeData.endDate ? new Date(noticeData.endDate).toISOString().slice(0, 10) : '',
            password: ''
          });
        } else {
          setAlertMessage('공지사항을 찾을 수 없습니다.');
          setShowAlert(true);
          setTimeout(() => router.push('/notice'), 1500);
        }
      } catch (error) {
        console.error('Error fetching notice:', error);
        setAlertMessage('공지사항을 불러오는데 실패했습니다.');
        setShowAlert(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchNotice();

    return () => {
      isMounted = false;
    };
  }, [params?.id, router]);

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
      const id = String(params?.id);
      const noticeRef = doc(db, 'notices', id);
      
      const updatedData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        isPinned: formData.isPinned,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        searchText: `${formData.title} ${formData.content}`.toLowerCase(),
        updatedAt: Date.now()
      };

      console.log("Updating notice with data:", updatedData);
      await updateDoc(noticeRef, updatedData);

      setAlertMessage('수정이 완료되었습니다.');
      setShowAlert(true);

      setTimeout(() => {
        router.push('/notice');
      }, 1500);
    } catch (error) {
      console.error('Error updating notice:', error);
      setAlertMessage('수정 중 오류가 발생했습니다.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">공지사항 수정</h1>
      
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

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? '수정 중...' : '수정하기'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/notice')}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
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
}