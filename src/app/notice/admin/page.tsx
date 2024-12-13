'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
    password: '',           // 쉼표 추가
    requireSignature: false // 새로 추가
});
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

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

  const getPostStatus = (notice: Notice) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = notice.startDate ? new Date(notice.startDate) : null;
    const endDate = notice.endDate ? new Date(notice.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    if (startDate && startDate > now) {
      return {
        text: '게시 예정',
        className: 'bg-sky-500 text-white'
      };
    } else if ((!startDate || startDate <= now) && (!endDate || now <= endDate)) {
      return {
        text: '게시 중',
        className: 'bg-blue-600 text-white'
      };
    } else {
      return {
        text: '게시 종료',
        className: 'bg-gray-400 text-white'
      };
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => file.size <= 30 * 1024 * 1024);
      
      if (validFiles.length !== newFiles.length) {
        setAlertMessage('30MB 이상의 파일은 제외되었습니다.');
        setShowAlert(true);
      }
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles = newFiles.filter(file => file.size <= 30 * 1024 * 1024);
      
      if (validFiles.length !== newFiles.length) {
        setAlertMessage('30MB 이상의 파일은 제외되었습니다.');
        setShowAlert(true);
      }
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const uploadFile = async (file: File) => {
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      name: file.name,
      url,
      type: file.type,
      size: file.size
    };
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
      // 파일 업로드
      const attachments = await Promise.all(files.map(file => uploadFile(file)));

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
        endDate: formData.endDate || null,
        attachments,
        requireSignature: formData.requireSignature,  // 추가
        signatures: []  // 추가: 빈 서명 배열로 초기화
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
        password: '',
        requireSignature: false  // 추가
      });
      setFiles([]);

      // 1.5초 후 목록 페이지로 이동
      setTimeout(() => {
        router.push('/notice');
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">공지사항 등록</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
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

        {/* 체크박스 그룹 추가 */}
        <div className="flex space-x-6">
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireSignature"
              checked={formData.requireSignature}
              onChange={(e) => handleChange('requireSignature', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="requireSignature">확인 서명 필요</label>
          </div>
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

        <div
          className={`border-2 border-dashed rounded-lg p-4 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <p className="mb-2">파일을 드래그하여 첨부하거나</p>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
            >
              파일 선택
            </label>
            <p className="mt-2 text-sm text-gray-500">최대 30MB</p>
          </div>
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">첨부된 파일:</h3>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">등록된 공지사항 목록</h2>
        <div className="space-y-2">
          {notices.map((notice) => {
            const status = getPostStatus(notice);
            return (
              <div key={notice.id} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${status.className}`}>
                      {status.text}
                    </span>
                    <h3 className="font-medium">{notice.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(notice.date).toLocaleDateString()}
                  </div>
                </div>
                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    첨부파일: {notice.attachments.length}개
                  </div>
                )}
              </div>
            );
          })}
        </div>
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