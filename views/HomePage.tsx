import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { useProducts } from '../contexts/ProductContext';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const HomePage: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('所有類別');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const categories = useMemo(() => {
    if (products.length === 0) return [];
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return ['所有類別', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => 
        selectedCategory === '所有類別' || product.category === selectedCategory
      )
      .filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [products, selectedCategory, searchQuery]);

  if (error) {
    return <div className="text-center text-red-500 text-xl">{error}</div>;
  }

  return (
    <div>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-bold text-zinc-800">商品分類</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-800">
                <XIcon />
            </button>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
                {loading ? (
                     Array.from({ length: 4 }).map((_, index) => (
                        <li key={index} className="h-10 bg-gray-200 rounded animate-pulse"></li>
                     ))
                ) : (
                    categories.map(category => (
                        <li key={category}>
                            <button
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setIsSidebarOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 rounded-md transition-colors duration-200 ${
                                selectedCategory === category
                                    ? 'bg-amber-500 text-white font-semibold'
                                    : 'text-gray-600 hover:bg-amber-100'
                                }`}
                            >
                                {category}
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
      </aside>

      <h1 className="text-4xl font-serif text-center mb-12 text-zinc-900">精選肉品</h1>
      
      {/* Main Content */}
      <main className="w-full">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button onClick={() => setIsSidebarOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-zinc-800 font-semibold hover:bg-gray-50 transition-colors">
                <MenuIcon />
                <span>商品分類</span>
            </button>
            <div className="relative flex-grow">
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋肉品..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-gray-400" />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {loading ? (
                  Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)
              ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => <ProductCard key={product.id} product={product} />)
              ) : (
                  <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16">
                      <p className="text-gray-500 text-lg">找不到符合條件的商品。</p>
                  </div>
              )}
          </div>
      </main>
    </div>
  );
};

export default HomePage;