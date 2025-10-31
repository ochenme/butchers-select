import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  onImageClick: (images: string[], startIndex: number) => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ProductCard: React.FC<ProductCardProps> = ({ product, onImageClick }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  const hasImages = images.length > 0;
  const imageToShow = hasImages ? images[currentIndex] : `https://picsum.photos/seed/${product.id}/400/300`;

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
      <div 
        className="relative w-full h-56 group cursor-pointer"
        onClick={() => onImageClick(images, currentIndex)}
        role="button"
        aria-label={`View images for ${product.name}`}
      >
        <img className="w-full h-full object-cover" src={imageToShow} alt={product.name} />
        {hasImages && images.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60">
              <ChevronLeftIcon />
            </button>
            <button onClick={nextSlide} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60">
              <ChevronRightIcon />
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
                ></div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <span className="text-sm font-semibold text-amber-600 mb-1">{product.category}</span>
        <h3 className="text-xl font-bold text-zinc-800 mb-2 h-14">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-2xl font-bold text-zinc-900">NT$ {product.price}</span>
          <button
            onClick={handleAddToCart}
            disabled={added}
            className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
              added
                ? 'bg-green-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-zinc-900'
            }`}
          >
            {added ? <CheckIcon /> : <PlusIcon />}
            <span>{added ? '已加入' : '加入購物車'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
