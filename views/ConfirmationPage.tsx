import React from 'react';
import { useParams, Link } from 'react-router-dom';

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <CheckCircleIcon className="mb-4" />
      <h1 className="text-4xl font-serif text-center mb-4 text-zinc-900">感謝您的訂購！</h1>
      <p className="text-gray-600 mb-2">我們已收到您的訂單，正在處理中。</p>
      <p className="text-lg text-zinc-800 mb-12">
        您的訂單編號是：<span className="font-mono bg-gray-200 text-amber-600 font-semibold py-1 px-3 rounded-md">{orderId}</span>
      </p>
      
      <Link to="/" className="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md">
        返回首頁
      </Link>
    </div>
  );
};

export default ConfirmationPage;