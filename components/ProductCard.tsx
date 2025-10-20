
import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
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


const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 flex flex-col">
      <img className="w-full h-56 object-cover" src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} />
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
