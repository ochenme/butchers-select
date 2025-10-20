import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import Header from './components/Header';
import HomePage from './views/HomePage';
import CartPage from './views/CartPage';
import ConfirmationPage from './views/ConfirmationPage';
import AdminPage from './views/AdminPage';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';

function App() {
  return (
    <AnnouncementProvider>
      <ProductProvider>
        <CartProvider>
          <HashRouter>
            <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
              <AnnouncementBar />
              <Header />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </HashRouter>
        </CartProvider>
      </ProductProvider>
    </AnnouncementProvider>
  );
}

export default App;