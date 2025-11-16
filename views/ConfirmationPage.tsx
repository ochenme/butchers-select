import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { saveOrderProof, uploadOrderProof } from '../services/geminiService';

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleUploadProof = async () => {
    if (!orderId) {
      setMessage('無法取得訂單編號，請重新進入此頁。');
      return;
    }

    if (!selectedFile) {
      setMessage('請先選擇要上傳的轉帳截圖。');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const url = await uploadOrderProof(selectedFile, orderId);
      await saveOrderProof(orderId, url);
      setProofUrl(url);
      setMessage('已成功上傳轉帳截圖，我們會盡快為您確認。');
    } catch (error) {
      console.error('Error uploading proof:', error);
      setMessage('上傳失敗，請稍後再試或聯繫客服。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
        <CheckCircleIcon className="mb-4" />
      <h1 className="text-4xl font-serif text-center mb-4 text-zinc-900">感謝您的訂購！</h1>
      <p className="text-gray-600 mb-2">我們已收到您的訂單，正在處理中。</p>
      <p className="text-lg text-zinc-800 mb-8">
        您的訂單編號是：<span className="font-mono bg-gray-200 text-amber-600 font-semibold py-1 px-3 rounded-md">{orderId}</span>
      </p>
      <div className="w-full max-w-xl bg-white border border-amber-100 rounded-2xl shadow-sm p-6 mb-6 text-left space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">上傳轉帳截圖</h2>
        <p className="text-sm font-semibold text-red-600">
          轉帳後務必將轉帳資訊截圖上傳，才代表完成訂單！
        </p>
        <p className="text-sm text-gray-600">
          您可以在此頁面直接上傳轉帳收據，或於稍早的匯款資訊視窗先選擇檔案後再提交訂單。若已完成上傳，系統會標記此訂單為已提供匯款證明。
        </p>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setMessage('');
            }}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
          {selectedFile && <p className="text-xs text-gray-500">已選擇：{selectedFile.name}</p>}
        </div>
        <button
          type="button"
          onClick={handleUploadProof}
          disabled={uploading}
          className="w-full bg-[#1f3c88] hover:bg-[#162d66] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? '上傳中…' : '上傳轉帳截圖'}
        </button>
        {message && <p className="text-sm text-center text-gray-700">{message}</p>}
        {proofUrl && (
          <div className="pt-2">
            <p className="text-sm text-gray-700 mb-2">已上傳的截圖：</p>
            <img src={proofUrl} alt="匯款證明" className="w-full max-h-96 object-contain rounded-lg border" />
          </div>
        )}
      </div>
      <Link to="/" className="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg transition-colors duration-300">
        返回首頁
      </Link>
    </div>
  );
};

export default ConfirmationPage;
