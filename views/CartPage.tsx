import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { submitOrder } from '../services/geminiService';

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !address) {
        alert("請填寫姓名與地址");
        return;
    }

    setIsSubmitting(true);
    
    const orderId = `BS-${Date.now()}`;
    const orderData = {
        orderId,
        timestamp: new Date().toISOString(),
        customerName,
        address,
        total,
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
        })),
    };

    try {
        await submitOrder(orderData);
        clearCart();
        navigate(`/confirmation/${orderId}`);
    } catch (error) {
        console.error("Error submitting order:", error);
        alert("訂單提交失敗，請稍後再試。");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-4xl font-serif text-center mb-4 text-zinc-900">您的購物車是空的</h1>
        <p className="text-gray-600 mb-8">看起來您尚未加入任何商品。</p>
        <Link to="/" className="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-lg transition-colors duration-300">
          繼續選購
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-serif text-center mb-12 text-zinc-900">您的購物車</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900">商品列表</h2>
          <div className="space-y-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.name} className="w-20 h-20 rounded-md object-cover"/>
                  <div>
                    <p className="font-bold text-lg text-zinc-800">{item.name}</p>
                    <p className="text-sm text-gray-500">NT$ {item.price}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                   <div className="flex items-center border border-gray-300 rounded-md">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"><MinusIcon /></button>
                        <span className="px-4 py-1 text-zinc-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"><PlusIcon /></button>
                   </div>
                   <p className="font-semibold text-zinc-900 w-24 text-right">NT$ {item.price * item.quantity}</p>
                   <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors duration-200"><TrashIcon/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-xl h-fit">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900">訂單摘要</h2>
            <form onSubmit={handleCheckout}>
                <div className="mb-4">
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                    <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required/>
                </div>
                 <div className="mb-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                    <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required/>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-4">
                    <span className="text-zinc-800">總計</span>
                    <span className="text-amber-500">NT$ {total}</span>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? '處理中...' : '下訂單'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
