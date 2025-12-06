import React, { useState, useEffect, useRef } from "react";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  fetchProducts,
  uploadProductImages,
  fetchOrders,
  updateOrderStatus,
} from "../services/geminiService";
import { Order, OrderStatus, Product } from "../types";
import { useAnnouncement } from "../contexts/AnnouncementContext";

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("待確認");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const { announcement, updateAnnouncement } = useAnnouncement();
  const [announcementText, setAnnouncementText] = useState<string>('');

  const ORDERS_PER_PAGE = 8;

  // 商品表單初始值
  const initialFormData = {
    id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    imageUrls: [],
  };
  const [formData, setFormData] = useState(initialFormData);

  // 🔹 驗證登入狀態
  useEffect(() => {
    try {
      const sessionAuth = sessionStorage.getItem('isAdminAuthenticated');
      if (sessionAuth === 'true') setIsAuthenticated(true);
    } catch (e) {
      console.error("Could not access session storage:", e);
    }
  }, []);

  // 🔹 載入商品
  useEffect(() => {
    if (isAuthenticated) {
      const load = async () => {
        const productData = await fetchProducts();
        setProducts(productData);
        setIsLoadingOrders(true);
        try {
          const orderData = await fetchOrders();
          setOrders(orderData);
        } catch (fetchError) {
          console.error('Failed to load orders:', fetchError);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      load();
      setAnnouncementText(announcement);
    }
  }, [isAuthenticated, announcement]);

  const refreshOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const orderData = await fetchOrders();
      setOrders(orderData);
    } catch (fetchError) {
      console.error('Failed to refresh orders:', fetchError);
      alert('重新整理訂單時發生錯誤，請稍後再試。');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-TW', { hour12: false });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((order) => (order.orderId === orderId ? { ...order, status } : order)));
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('更新訂單狀態時發生錯誤，請稍後再試。');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredOrders = orders.filter((order) => (order.status ?? '待確認') === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (currentPageClamped - 1) * ORDERS_PER_PAGE,
    currentPageClamped * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // 🔹 登入
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'user0986500440') {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
      } catch (e) {
        console.error("Could not access session storage:", e);
      }
      setError('');
    } else {
      setError('密碼錯誤');
    }
  };

  // 🔹 輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 處理圖片選擇
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      
      // Fix: Explicitly type 'file' as File to resolve type inference issue.
      const filePromises = files.map((file: File) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newImageUrls => {
        setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));
      });
    }
  };

  // 🔹 上架新商品（新增 + 圖片上傳）
  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      alert("請至少輸入商品名稱與價格！");
      return;
    }

    const id = String(Date.now());
    let uploadedImageUrls: string[] = [];

    try {
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadProductImages(imageFiles, id);
      }

      const newProduct: Product = {
        ...formData,
        id,
        price: Number(formData.price),
        imageUrls: uploadedImageUrls,
      };
      delete (newProduct as any).imageUrl;

      await addProduct(newProduct);
      alert("✅ 商品已上架！");

      setFormData(initialFormData);
      setImageFiles([]);
      formRef.current?.reset();

      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error("新增商品失敗：", err);
      alert("新增商品時發生錯誤，請稍後再試。");
    }
  };

  // 🔹 編輯商品
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    const images = (product.imageUrls && product.imageUrls.length > 0) 
      ? product.imageUrls 
      : (product.imageUrl ? [product.imageUrl] : []);

    setFormData({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: String(product.price),
      imageUrls: images,
    });
    setImageFiles([]);
  };

  // 🔹 更新商品
  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      let finalImageUrls = formData.imageUrls;
      if (imageFiles.length > 0) {
        finalImageUrls = await uploadProductImages(imageFiles, editingId);
      }

      const updatedProduct: Product = {
        ...formData,
        id: editingId,
        price: Number(formData.price),
        imageUrls: finalImageUrls,
      };
      delete (updatedProduct as any).imageUrl;

      await updateProduct(updatedProduct);
      alert("✅ 商品已更新！");
      setEditingId(null);
      setFormData(initialFormData);
      setImageFiles([]);
      formRef.current?.reset();

      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error("更新商品失敗：", err);
      alert("更新商品時發生錯誤，請稍後再試。");
    }
  };

  // 🔹 刪除商品
  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除此商品嗎？")) return;
    try {
      await deleteProduct(id);
      alert("🗑️ 商品已刪除！");
      const updated = await fetchProducts();
      setProducts(updated);
    } catch (err) {
      console.error("刪除商品失敗：", err);
      alert("刪除商品時發生錯誤，請稍後再試。");
    }
  };

  // 🔹 取消編輯
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setImageFiles([]);
    formRef.current?.reset();
  };

  // 🔹 儲存公告
  const handleSaveAnnouncement = () => {
    updateAnnouncement(announcementText);
    alert("✅ 公告已更新！");
  };

  // 🔐 登入畫面
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center text-zinc-800">管理員登入</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 mt-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="請輸入密碼"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center font-semibold">{error}</p>}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center bg-amber-500 text-zinc-900 p-3 rounded-lg tracking-wide font-semibold hover:bg-amber-600 transition-colors"
              >
                登入
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ✅ 主畫面
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-yellow-600">後台管理系統</h1>

      {/* 訂單紀錄 */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">📑 訂單匯款紀錄</h2>
            <p className="text-sm text-red-600 mt-1">顯示目前使用者完成的訂單與匯款截圖。</p>
          </div>
          <button
            type="button"
            onClick={refreshOrders}
            disabled={isLoadingOrders}
            className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-900 font-semibold hover:bg-amber-600 disabled:bg-gray-300 disabled:text-gray-600"
          >
            {isLoadingOrders ? '讀取中…' : '重新整理訂單'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {["待確認", "已出貨", "已取消"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status as OrderStatus)}
              className={`px-3 py-1 rounded-full border text-sm font-semibold transition-colors bg-white text-gray-800 shadow-sm ${
                statusFilter === status
                  ? "border-amber-500 text-amber-700 ring-2 ring-amber-100"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              {status}
            </button>
          ))}
          <span className="text-xs text-gray-500 ml-auto">
            目前顯示：{filteredOrders.length} 筆 / 第 {currentPageClamped} 頁（共 {totalPages} 頁）
          </span>
        </div>

        {isLoadingOrders ? (
          <p className="text-gray-600">正在載入訂單...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">目前還沒有訂單紀錄。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-yellow-100 text-left">
                  <th className="p-2 border">訂單編號</th>
                  <th className="p-2 border">客戶</th>
                  <th className="p-2 border">下單時間</th>
                  <th className="p-2 border">金額</th>
                  <th className="p-2 border">狀態</th>
                  <th className="p-2 border">匯款截圖</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      沒有符合「{statusFilter}」狀態的訂單。
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50 align-top">
                      <td className="p-2 border font-mono text-xs">{order.orderId}</td>
                      <td className="p-2 border">
                        <p className="font-semibold text-zinc-900">{order.customerName}</p>
                        <p className="text-xs text-gray-600">{order.phone}</p>
                        <p className="text-xs text-gray-500">{order.address}</p>
                      </td>
                      <td className="p-2 border whitespace-nowrap">{formatDateTime(order.createdAt ?? order.timestamp)}</td>
                      <td className="p-2 border font-semibold text-amber-700">NT$ {order.total}</td>
                      <td className="p-2 border align-middle">
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <span className="text-xs text-gray-600">目前：{order.status ?? '待確認'}</span>
                          <select
                            value={order.status ?? '待確認'}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value as OrderStatus)}
                            disabled={updatingStatusId === order.orderId}
                            className="border rounded px-2 py-1 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="待確認">待確認</option>
                            <option value="已出貨">已出貨</option>
                            <option value="已取消">已取消</option>
                          </select>
                          {updatingStatusId === order.orderId && (
                            <span className="text-xs text-amber-600">更新中…</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border">
                        {order.remittanceProofUrl ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-1">
                              已上傳
                            </span>
                            <a
                              href={order.remittanceProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={order.remittanceProofUrl}
                                alt={`匯款截圖-${order.orderId}`}
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                            </a>
                            {order.proofUploadedAt && (
                              <p className="text-[11px] text-gray-500">上傳時間：{formatDateTime(order.proofUploadedAt)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1">
                            尚未上傳
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-3 mt-4 text-sm">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageClamped === 1}
                className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
              >
                上一頁
              </button>
              <span className="text-gray-700">
                第 {currentPageClamped} 頁 / 共 {totalPages} 頁
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageClamped === totalPages}
                className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 商品表單 */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "✏️ 編輯商品" : "🛒 上架新商品"}
        </h2>

        <form ref={formRef}>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="商品名稱"
              className="bg-white border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="分類（例如：頂級牛肉、嚴選豬肉）"
              className="bg-white border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="價格"
              className="bg-white border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片</label>
              <input
                type="file"
                name="imageUrl"
                accept="image/*"
                onChange={handleImageChange}
                multiple
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="商品描述"
              className="bg-white border border-gray-300 rounded p-2 col-span-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">圖片預覽:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.imageUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded-md border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* 按鈕列 */}
        <div className="mt-4 flex justify-end space-x-3">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                儲存修改
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              上架商品
            </button>
          )}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">📦 商品列表</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">目前沒有任何商品。</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-yellow-100 text-left">
                <th className="p-2 border">名稱</th>
                <th className="p-2 border">分類</th>
                <th className="p-2 border">價格</th>
                <th className="p-2 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.category}</td>
                  <td className="p-2 border">NT${p.price}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 公告管理 */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">📢 編輯網站公告</h2>
        <textarea
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          placeholder="輸入公告內容..."
          className="border rounded p-2 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAnnouncement}
            className="bg-amber-500 text-zinc-900 font-semibold px-4 py-2 rounded hover:bg-amber-600 transition-colors"
          >
            儲存公告
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;