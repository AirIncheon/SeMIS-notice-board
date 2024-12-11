'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Notice } from '@/types/notice';

const EditNoticePage = ({ params }: { params: { id: string } }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const noticeRef = doc(db, 'notices', params.id);
        const noticeSnap = await getDoc(noticeRef);
        
        if (noticeSnap.exists()) {
          const notice = noticeSnap.data();
          setFormData({
            title: notice.title,
            content: notice.content,
            category: notice.category,
            keywords: notice.keywords?.join(', ') || '',
            isPinned: notice.isPinned || false,
            startDate: notice.startDate || '',
            endDate: notice.endDate || '',
            password: ''
          });
          if (notice.attachments) {
            setExistingFiles(notice.attachments);
          }
        }
      } catch (error) {
        console.error('Error fetching notice:', error);
        setAlertMessage('공지사항을 불러오는 중 오류가 발생했습니다.');
        setShowAlert(true);
      }
    };

    fetchNotice();
  }, [params.id]);

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

  const removeExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
      
      // 새로운 파일 업로드
      const newAttachments = await Promise.all(files.map(file => uploadFile(file)));
      
      // 기존 파일과 새 파일 합치기
      const allAttachments = [...existingFiles, ...newAttachments];

      const updatedNotice: Partial<Notice> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        updatedAt: Date.now(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        searchText: `${formData.title} ${formData.content}`.toLowerCase(),
        isPinned: formData.isPinned,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        attachments: allAttachments
      };

      await updateDoc(doc(db, 'notices', params.id), updatedNotice);
      
      setAlertMessage('공지사항이 수정되었습니다.');
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

          {existingFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">기존 첨부파일:</h3>
              <ul className="space-y-1">
                {existingFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">새로 첨부된 파일:</h3>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
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
          {isLoading ? '수정 중...' : '수정하기'}
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

export default EditNoticePage;