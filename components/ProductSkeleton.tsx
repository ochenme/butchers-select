import React from 'react';

const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg animate-pulse">
      <div className="w-full h-56 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-2/5"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;