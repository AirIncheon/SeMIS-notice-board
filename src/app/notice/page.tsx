'use client';

import { useState, useEffect } from 'react';
import { 
  query, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  collection as firestoreCollection 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice, Signature as SignatureType } from '@/types/notice';
import PasswordPrompt from '@/components/PasswordPrompt';
import Signature from '@/components/Signature';


const NoticePage = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ 
    type: 'edit' | 'delete'; 
    notice: Notice 
  } | null>(null);

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
      <div className="mb-6">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-0 bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-4 text-center text-gray-500">로딩 중...</div>
        ) : paginatedNotices.length === 0 ? (
          <div className="p-4 text-center text-gray-500">등록된 공지사항이 없습니다.</div>
        ) : (
          <div>
            {paginatedNotices.map((notice) => (
              <div 
                key={notice.id}
                onClick={() => handleNoticeClick(notice)}
                className="border-b border-gray-100 px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {notice.isPinned && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-900 text-white rounded">
                        고정
                      </span>
                    )}
                    <h2 className="text-base font-medium text-gray-900 flex-1">{notice.title}</h2>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{new Date(notice.date).toLocaleDateString()}</span>
                    <span>조회 {notice.views || 0}</span>
                  </div>
                </div>
              </div>
            ))}

<div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
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

          </div>
        )}
      </div>

{isModalOpen && selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
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
                <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                  {selectedNotice.category}
                </span>
                <span>•</span>
                <span>{new Date(selectedNotice.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>조회 {selectedNotice.views}</span>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="text-gray-800 whitespace-pre-wrap min-h-[250px]">
                {selectedNotice.content}
              </div>

              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <div className="mt-5 border-t pt-5">
                  <h3 className="font-medium mb-3">첨부파일</h3>
                  <ul className="space-y-2">
                    {selectedNotice.attachments.map((file, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
                          download
                        >
                          <span>{file.name}</span>
                          <span className="text-sm text-gray-500">
                            ({Math.round(file.size / 1024).toLocaleString()}KB)
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NoticePage;
