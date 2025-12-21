import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getAccountHref, goToAccountPage } from '../services/accountNavigation';
import OrdersMenu from './OrdersMenu';

const ShoppingCartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accountHref = getAccountHref();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountActivate = (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    goToAccountPage();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="text-3xl font-serif font-bold text-amber-500 tracking-wider">
              豐鈺食品
            </Link>
            <nav className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-zinc-800 font-semibold hover:bg-gray-50 transition-colors"
                aria-expanded={isMenuOpen}
              >
                <MenuIcon />
                <span>會員選單</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50"> 
                  <button
                    onClick={() => {
                      setIsShippingModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-amber-50 transition-colors font-medium"
                  >
                    運費資訊
                  </button>
                  <a
                    href={accountHref}
                    onClick={handleAccountActivate}
                    onTouchStart={handleAccountActivate}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-amber-50 transition-colors font-medium"
                  >
                    {user ? `您好，${user.name || user.email}` : '會員登入'}
                  </a>
                  <a
                    href={accountHref}
                    onClick={(event) => {
                      event.preventDefault();
                      setIsOrdersMenuOpen((prev) => !prev);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-amber-50 transition-colors font-medium"
                  >
                    我的訂單
                  </a>
                  <Link
                    to="/cart"
                    className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-amber-50 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                    title="Shopping Cart"
                  >
                    <span>購物車</span>
                    <div className="relative text-gray-600">
                      <ShoppingCartIcon />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {isShippingModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsShippingModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-amber-500 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">運費資訊</h3>
              <button onClick={() => setIsShippingModalOpen(false)} className="text-white hover:text-amber-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 text-zinc-800 text-base">
              <div>
                <h4 className="font-bold text-lg text-amber-600 mb-2">全家便利商店冷凍店到店</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>重量10公斤以內 箱子總長105公分</li>
                  <li>本島運費180元 紙箱25元</li>
                </ul>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-lg text-amber-600 mb-2">7-11便利商店冷凍店到店</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                   <li>重量10公斤以內 箱子總長105公分</li>
                   <li>本島運費200元 紙箱25元</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                 <p className="font-bold text-lg text-zinc-900">滿2500元 店到店免運費</p>
                 <p className="text-sm text-gray-600 mt-1">未滿需自付運費 運費如上</p>
                 <p className="text-sm text-gray-600 mt-2">滿5000元 黑貓宅急便免運</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => setIsShippingModalOpen(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-zinc-800 font-semibold py-3 rounded-lg transition-colors"
                >
                    關閉
                </button>
            </div>
          </div>
        </div>
      )}

      <OrdersMenu isOpen={isOrdersMenuOpen} onClose={() => setIsOrdersMenuOpen(false)} />
    </>
  );
};

export default Header;