'use client';

import { useState, useRef, useEffect } from 'react';

interface SignatureProps {
  onSave: (signature: { type: 'text' | 'draw', value: string }) => void;
  allowDrawing?: boolean;
  required?: boolean;
}

const Signature = ({ onSave, allowDrawing = true, required = false }: SignatureProps) => {
  const [signatureType, setSignatureType] = useState<'text' | 'draw'>('text');
  const [textSignature, setTextSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (signatureType === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        contextRef.current = context;
      }
    }
  }, [signatureType]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const handleSave = () => {
    if (signatureType === 'text') {
      if (required && !textSignature.trim()) {
        alert('서명을 입력해주세요.');
        return;
      }
      onSave({ type: 'text', value: textSignature });
    } else {
      if (canvasRef.current) {
        const signature = canvasRef.current.toDataURL();
        onSave({ type: 'draw', value: signature });
      }
    }
  };

  const clearSignature = () => {
    if (signatureType === 'text') {
      setTextSignature('');
    } else if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setSignatureType('text')}
          className={`px-4 py-2 rounded ${
            signatureType === 'text' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200'
          }`}
        >
          텍스트 서명
        </button>
        {allowDrawing && (
          <button
            type="button"
            onClick={() => setSignatureType('draw')}
            className={`px-4 py-2 rounded ${
              signatureType === 'draw' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            마우스 서명
          </button>
        )}
      </div>

      {signatureType === 'text' ? (
        <input
          type="text"
          value={textSignature}
          onChange={(e) => setTextSignature(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full p-2 border rounded"
          required={required}
        />
      ) : (
        <div className="border rounded p-2">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            className="w-full h-40 border rounded cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          지우기
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          서명 완료
        </button>
      </div>
    </div>
  );
};

export default Signature;