import React, { useState, useEffect, useRef } from "react";
import { addProduct, updateProduct, deleteProduct, fetchProducts } from "../services/geminiService";
import { Product } from "../types";
import { useAnnouncement } from "../contexts/AnnouncementContext";

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { announcement, updateAnnouncement } = useAnnouncement();
  const [announcementText, setAnnouncementText] = useState<string>('');

  // 商品表單初始值
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    imageUrl: "",
  });

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
        const data = await fetchProducts();
        setProducts(data);
      };
      load();
      setAnnouncementText(announcement);
    }
  }, [isAuthenticated, announcement]);

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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 上架新商品（新增 + 圖片上傳）
  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      alert("請至少輸入商品名稱與價格！");
      return;
    }

    const id = String(Date.now());
    let imageUrls = "";

    try {
      // 若有上傳圖片（base64）
      if (formData.imageUrl && formData.imageUrl.startsWith("data:image")) {
        // ✅ 直接使用 Apps Script 的上傳端點
        const SHEET_API =
          "https://script.google.com/macros/s/AKfycbz-IFprQoGLeW-BQjaxHTSR-TZ0ZRKQo-CVxOtd78a4iL-5qte98gVR2Pc1NgP9Q-SN/exec";

        const uploadRes = await fetch(SHEET_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload_image",
            dataUrl: formData.imageUrl,
            filename: `${id}_${Date.now()}.png`,
          }),
        });

        const result = await uploadRes.json();
        if (result.ok) {
          imageUrls = Array.isArray(result.urls)
            ? result.urls.join(",")
            : result.url || result.urls?.[0] || "";
        } else {
          console.error("圖片上傳失敗：", result.error);
          alert("圖片上傳失敗，請稍後再試。");
        }
      }
    } catch (err) {
      console.error("圖片上傳錯誤：", err);
      alert("圖片上傳發生錯誤。");
    }

    // 建立商品物件（把圖片網址寫進去）
    const newProduct = {
      ...formData,
      id,
      price: Number(formData.price),
      imageUrl: imageUrls || formData.imageUrl, // 如果沒上傳新圖就保留原值
    };

    await addProduct(newProduct);
    alert("✅ 商品已上架！");

    // 重置表單
    setFormData({ id: "", name: "", category: "", description: "", price: "", imageUrl: "" });
    formRef.current?.reset();

    const updated = await fetchProducts();
    setProducts(updated);
  };

  // 🔹 編輯商品
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      ...product,
      price: String(product.price),
      imageUrl: product.imageUrl || "",
    });
  };

  // 🔹 更新商品
  const handleUpdate = async () => {
    if (!editingId) return;
    await updateProduct({ ...formData, price: Number(formData.price) });
    alert("✅ 商品已更新！");
    setEditingId(null);
    setFormData({ id: "", name: "", category: "", description: "", price: "", imageUrl: "" });
    formRef.current?.reset();

    const updated = await fetchProducts();
    setProducts(updated);
  };

  // 🔹 刪除商品
  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除此商品嗎？")) return;
    await deleteProduct(id);
    alert("🗑️ 商品已刪除！");
    const updated = await fetchProducts();
    setProducts(updated);
  };

  // 🔹 取消編輯
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ id: "", name: "", category: "", description: "", price: "", imageUrl: "" });
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
              className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="分類（例如：頂級牛肉、嚴選豬肉）"
              className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="價格"
              className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品圖片</label>
              <input
                type="file"
                name="imageUrl"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="商品描述"
              className="border border-gray-300 rounded p-2 col-span-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {formData.imageUrl && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">圖片預覽:</p>
                <img src={formData.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />
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
