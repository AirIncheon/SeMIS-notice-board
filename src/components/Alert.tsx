interface AlertProps {
  message: string;
  onClose: () => void;
}

export const Alert = ({ message, onClose }: AlertProps) => (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <p className="mb-4 text-lg">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        확인
      </button>
    </div>
  </div>
);