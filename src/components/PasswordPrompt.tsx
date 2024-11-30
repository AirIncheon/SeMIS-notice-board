import { useState } from 'react';

interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export const PasswordPrompt = ({ onSubmit, onCancel }: PasswordPromptProps) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-semibold mb-4">관리자 확인</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full p-2 border rounded mb-4"
            autoFocus
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;