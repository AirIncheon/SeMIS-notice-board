'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice } from '@/types/notice';
import { useRouter } from 'next/navigation';

const AdminPage = () => {
  const router = useRouter();
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const noticesRef = collection(db, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const noticeList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];

        setNotices(noticeList);
      } catch (error) {
        console.error('Error fetching notices:', error);
      }
    };

    fetchNotices();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getNoticeStatus = (notice: Notice) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = notice.startDate ? new Date(notice.startDate) : null;
    const endDate = notice.endDate ? new Date(notice.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    if (!startDate && !endDate) return '상시 게시';
    if (startDate && now < startDate) return '게시 예정';
    if (endDate && now > endDate) return '게시 종료';
    return '게시 중';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '게시 예정': return 'bg-blue-50 text-blue-600';
      case '게시 중': return 'bg-blue-600 text-white';
      case '게시 종료': return 'bg-gray-200 text-gray-600';
      default: return 'bg-blue-100 text-blue-800';
    }
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
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      await addDoc(collection(db, 'notices'), newNotice);
      
      setAlertMessage('공지사항이 등록되었습니다.');
      setShowAlert(true);
      
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

      window.location.reload();

    } catch (error) {
      console.error('Error adding notice:', error);
      setAlertMessage('등록 중 오류가 발생했습니다.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedNotices = notices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8 bg-white rounded-lg shadow p-6">
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
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">전체 공지사항 목록</h2>
        <div className="space-y-2">
          {paginatedNotices.map((notice) => (
            <div 
              key={notice.id}
              onClick={() => router.push(`/notice/admin/edit/${notice.id}`)}
              className="border p-4 rounded hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(getNoticeStatus(notice))}`}>
                    {getNoticeStatus(notice)}
                  </span>
                  <h3 className="font-semibold">{notice.title}</h3>
                </div>
                <div className="flex gap-2 text-sm text-gray-500">
                  <span>{notice.category}</span>
                  <span>•</span>
                  <span>조회 {notice.views || 0}</span>
                  {notice.startDate && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(notice.startDate).toLocaleDateString()} ~ 
                        {notice.endDate ? new Date(notice.endDate).toLocaleDateString() : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {notices.length > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2">
              {currentPage} / {Math.ceil(notices.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(notices.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(notices.length / itemsPerPage)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>

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