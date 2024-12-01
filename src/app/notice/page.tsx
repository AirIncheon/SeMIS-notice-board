'use client';

import { useState, useEffect } from 'react';
import { query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { collection as firestoreCollection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice } from '@/types/notice';
import PasswordPrompt from '@/components/PasswordPrompt';

const NoticePage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete'; notice: Notice } | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const noticesRef = firestoreCollection(db, 'notices');
        const q = query(noticesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const noticeList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];

        setNotices(noticeList);
      } catch (error) {
        console.error('Error fetching notices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handlePasswordSubmit = async (password: string) => {
    if (password === 'admin1234') {
      if (pendingAction?.type === 'edit') {
        window.location.href = `/notice/admin/edit/${pendingAction.notice.id}`;
      } else if (pendingAction?.type === 'delete') {
        try {
          await deleteDoc(doc(db, 'notices', pendingAction.notice.id));
          setIsModalOpen(false);
          window.location.reload();
        } catch (error) {
          console.error('Error deleting notice:', error);
          alert('삭제 중 오류가 발생했습니다.');
        }
      }
    } else {
      alert('관리자 비밀번호가 올바르지 않습니다.');
    }
    setShowPasswordPrompt(false);
    setPendingAction(null);
  };

  const handleEdit = (notice: Notice) => {
    setPendingAction({ type: 'edit', notice });
    setShowPasswordPrompt(true);
  };

  const handleDelete = (notice: Notice) => {
    setPendingAction({ type: 'delete', notice });
    setShowPasswordPrompt(true);
  };

  const handleNoticeClick = async (notice: Notice) => {
    try {
      const noticeRef = doc(db, 'notices', notice.id);
      await updateDoc(noticeRef, {
        views: (notice.views || 0) + 1
      });

      setSelectedNotice({
        ...notice,
        views: (notice.views || 0) + 1
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const hasPrevNotice = (currentNotice: Notice) => {
    const currentIndex = notices.findIndex(notice => notice.id === currentNotice.id);
    return currentIndex < notices.length - 1;
  };

  const hasNextNotice = (currentNotice: Notice) => {
    const currentIndex = notices.findIndex(notice => notice.id === currentNotice.id);
    return currentIndex > 0;
  };

  const handlePrevNotice = (currentNotice: Notice) => {
    const currentIndex = notices.findIndex(notice => notice.id === currentNotice.id);
    if (currentIndex < notices.length - 1) {
      handleNoticeClick(notices[currentIndex + 1]);
    }
  };

  const handleNextNotice = (currentNotice: Notice) => {
    const currentIndex = notices.findIndex(notice => notice.id === currentNotice.id);
    if (currentIndex > 0) {
      handleNoticeClick(notices[currentIndex - 1]);
    }
  };

  const filteredNotices = notices.filter(notice => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = notice.startDate ? new Date(notice.startDate) : null;
    const endDate = notice.endDate ? new Date(notice.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    const isWithinPeriod = (!startDate && !endDate) || 
                          (startDate && !endDate && startDate <= now) ||
                          (!startDate && endDate && now <= endDate) ||
                          (startDate && endDate && startDate <= now && now <= endDate);

    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return isWithinPeriod && matchesSearch;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-0">
        {loading ? (
          <div>로딩 중...</div>
        ) : paginatedNotices.length === 0 ? (
          <div>등록된 공지사항이 없습니다.</div>
        ) : (
          <>
            {paginatedNotices.map((notice) => (
              <div 
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                className="border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    {notice.isPinned && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-gray-900 text-white rounded">
                        고정
                      </span>
                    )}
                    <h2 className="text-base font-medium text-gray-900">{notice.title}</h2>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded">
                      {notice.category}
                    </span>
                    <span>•</span>
                    <span>{new Date(notice.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>조회 {notice.views || 0}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {currentPage} / {Math.ceil(filteredNotices.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredNotices.length / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(filteredNotices.length / itemsPerPage)}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
            <div className="sticky top-0 bg-white border-b pb-4 mb-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-medium text-gray-900">{selectedNotice.title}</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2 text-sm text-gray-500 mt-2">
                <span className="inline-block px-2 py-0.5 bg-gray-100 rounded">
                  {selectedNotice.category}
                </span>
                <span>•</span>
                <span>{new Date(selectedNotice.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>조회 {selectedNotice.views}</span>
                {selectedNotice.startDate && (
                  <>
                    <span>•</span>
                    <span>게시기간: {new Date(selectedNotice.startDate).toLocaleDateString()}
                      {selectedNotice.endDate && ` ~ ${new Date(selectedNotice.endDate).toLocaleDateString()}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-gray-800 whitespace-pre-wrap mb-4 min-h-[200px]">
              {selectedNotice.content}
            </div>

            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(selectedNotice);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                수정
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(selectedNotice);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </div>

            <div className="sticky bottom-0 bg-white border-t pt-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handlePrevNotice(selectedNotice)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  disabled={!hasPrevNotice(selectedNotice)}
                >
                  이전
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => handleNextNotice(selectedNotice)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  disabled={!hasNextNotice(selectedNotice)}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordPrompt && (
        <PasswordPrompt
          onSubmit={handlePasswordSubmit}
          onCancel={() => {
            setShowPasswordPrompt(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
};

export default NoticePage;