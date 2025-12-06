import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserOrders } from '../services/geminiService';
import type { Order, OrderStatus } from '../types';

interface OrdersMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<OrderStatus, string> = {
  待確認: 'bg-amber-50 text-amber-700 border border-amber-200',
  已出貨: 'bg-green-50 text-green-700 border border-green-200',
  已取消: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const statusLabel: Record<OrderStatus, string> = {
  待確認: '待確認',
  已出貨: '已出貨',
  已取消: '已取消',
};

const OrdersMenu: React.FC<OrdersMenuProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.uid || !isOpen) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUserOrders(user.uid);
        setOrders(data);
      } catch (err) {
        console.error('Error loading user orders', err);
        setError('無法載入訂單，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isOpen, user?.uid]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
    }
  }, [user]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-TW', { hour12: false });
  };

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== '已取消'),
    [orders],
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={onClose} />
      <div className="fixed right-4 top-24 z-50 w-full max-w-md">
        <div
          ref={panelRef}
          className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200"
        >
          <div className="flex items-center justify-between px-5 py-4 bg-amber-500 text-white">
            <div>
              <p className="text-sm opacity-90">我的訂單</p>
              <h3 className="text-lg font-bold">查看進度與歷史紀錄</h3>
            </div>
            <button onClick={onClose} className="hover:text-amber-100 transition-colors" aria-label="關閉訂單列表">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {!user ? (
              <div className="text-center space-y-3">
                <p className="text-gray-600">登入後即可查看您的歷史訂單與處理進度。</p>
                <Link
                  to="/account"
                  className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                >
                  前往登入
                </Link>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : orders.length === 0 ? (
              <div className="text-center text-gray-600">目前沒有訂單紀錄。</div>
            ) : (
              <div className="space-y-4">
                {activeOrders.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">正在處理的訂單</p>
                    <p>我們會於完成揀貨與出貨後更新狀態，請隨時留意。</p>
                  </div>
                )}

                {orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const status = order.status ?? '待確認';

                  return (
                    <div key={order.orderId} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">訂單編號</p>
                          <p className="font-semibold text-zinc-900">{order.orderId}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.createdAt ?? order.timestamp)}</p>
                        </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
                        {statusLabel[status]}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-zinc-900">訂單內容</p>
                      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm text-gray-700">
                            <div>
                              <p className="font-medium text-zinc-900">{item.name}</p>
                              <p className="text-xs text-gray-500">數量 x {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">單價 NT$ {item.price}</p>
                              <p className="font-semibold text-amber-600">小計 NT$ {item.subtotal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <p className="font-medium text-zinc-900">訂單總額</p>
                      <p className="font-semibold text-amber-600">NT$ {order.total ?? 0}</p>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersMenu;