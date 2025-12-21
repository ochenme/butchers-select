import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { fetchShippingSettings, saveOrderProof, submitOrder, uploadOrderProof } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { goToAccountPage } from '../services/accountNavigation';
import SevenElevenStoreAutocomplete from '../components/SevenElevenStoreAutocomplete';

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
      clipRule="evenodd"
    />
  </svg>
);

const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);


const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  // Fix: The `useAuth` hook returns `user`, not `member`.
  const { user } = useAuth();
  const navigate = useNavigate();
  const shippingOptions = {
    blackCat: { label: '黑貓宅急便', fee: 290, helper: '宅配到府，請提供完整收件地址' },
    sevenEleven: { label: '7-11 店到店', fee: 225, helper: '請填寫取件門市名稱或門市代碼' },
    familyMart: { label: '全家 店到店', fee: 205, helper: '請填寫取件門市名稱或門市代碼' },
  } as const;
  const BLACK_CAT_FREE_SHIPPING_THRESHOLD = 5000;
  
  type ShippingMethod = keyof typeof shippingOptions;

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('blackCat');
  const [customerName, setCustomerName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [sevenCity, setSevenCity] = useState(user?.['7-11storeCity'] ?? '');
  const [sevenStore, setSevenStore] = useState(user?.['7-11storeName'] ?? '');
  const [familyCity, setFamilyCity] = useState(user?.familystoreCity ?? '');
  const [familyStore, setFamilyStore] = useState(user?.familystoreName ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofName, setPaymentProofName] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
 const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null);

  const checkoutSteps = useMemo(
    () => [
      { title: '購物車', description: '確認購買商品' },
      { title: '填寫資料', description: '輸入收件資訊' },
      { title: '確認訂單', description: '核對金額與內容' },
      { title: '完成', description: '等待出貨通知' },
    ],
    [],
  );

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setPhone(user.phone);
      setAddress(user.address);
      setSevenCity(user['7-11storeCity'] ?? '');
      setSevenStore(user['7-11storeName'] ?? '');
      setFamilyCity(user.familystoreCity ?? '');
      setFamilyStore(user.familystoreName ?? '');
    } else {
      setCustomerName('');
      setPhone('');
      setAddress('');
      setSevenCity('');
      setSevenStore('');
      setFamilyCity('');
      setFamilyStore('');
    }
  }, [user]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchShippingSettings();
        if (settings?.freeShippingThreshold !== undefined) {
          setFreeShippingThreshold(settings.freeShippingThreshold);
        }
      } catch (error) {
        console.error('Failed to load shipping settings', error);
      }
    };

    loadSettings();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isStoreToStore = shippingMethod === 'sevenEleven' || shippingMethod === 'familyMart';
  const hasItemFreeShipping = isStoreToStore
    ? cartItems.some((item) => {
      const threshold = item.freeShippingQuantity ?? item.freeamount ?? 0;
      return threshold > 0 && item.quantity >= threshold;
    })
    : false;

  const meetsAmountFreeShipping =
    isStoreToStore && freeShippingThreshold !== null && subtotal >= freeShippingThreshold;
  const meetsBlackCatFreeShipping =
    shippingMethod === 'blackCat' && subtotal >= BLACK_CAT_FREE_SHIPPING_THRESHOLD;
  const isFreeShipping = isStoreToStore
    ? hasItemFreeShipping || meetsAmountFreeShipping
    : meetsBlackCatFreeShipping;
  const shippingFee = isFreeShipping ? 0 : shippingOptions[shippingMethod].fee;
  const finalTotal = subtotal + shippingFee;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-10 text-center space-y-6">
        <h1 className="text-3xl font-serif text-zinc-900">此服務僅限會員使用</h1>
        <p className="text-gray-600">
          請先登入或註冊會員帳號後再繼續選購商品，我們將為您保留完整的購物流程。
        </p>
        <button
          type="button"
          onClick={goToAccountPage}
          className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          前往會員登入 / 註冊
        </button>
      </div>
    );
  }

  const handleCheckout = (event: React.FormEvent) => {
    event.preventDefault();

    if (!customerName || !phone) {
      alert('請完整填寫姓名與電話');
      return;
    }

    if (shippingMethod === 'blackCat') {
      if (!address) {
        alert('請完整填寫收件地址');
        return;
      }
    } else if (shippingMethod === 'sevenEleven') {
      if (!sevenCity || !sevenStore) {
        alert('請完整填寫 7-11 的城市與門市');
        return;
      }
    } else if (shippingMethod === 'familyMart') {
      if (!familyCity || !familyStore) {
        alert('請完整填寫全家的城市與門市');
        return;
      }
    }
    
    setIsModalOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('複製失敗，請手動複製。');
    });
  };

  const handleConfirmOrder = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);

    const orderId = `BS-${Date.now()}`;
    let proofUrl: string | undefined;

    if (paymentProofFile) {
      try {
        proofUrl = await uploadOrderProof(paymentProofFile, orderId);
      } catch (error) {
        console.error('Error uploading payment proof:', error);
        alert('上傳轉帳截圖時發生錯誤，請稍後再試。');
        setIsSubmitting(false);
        return;
      }
    }

    const storeCity =
      shippingMethod === 'sevenEleven' ? sevenCity : shippingMethod === 'familyMart' ? familyCity : '';
    const storeName =
      shippingMethod === 'sevenEleven' ? sevenStore : shippingMethod === 'familyMart' ? familyStore : '';
    const shippingDetail =
      shippingMethod === 'blackCat'
        ? address
        : [storeCity, storeName].filter(Boolean).join(' / ');

    const orderData = {
      orderId,
      timestamp: new Date().toISOString(),
      customerName,
      phone,
      address,
      shippingMethod,
      shippingMethodLabel: shippingOptions[shippingMethod].label,
      shippingDetail,
      storeCity,
      storeName,
      shippingFee,
      total: finalTotal,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      remittanceSubmitted: Boolean(proofUrl),
      remittanceProofUrl: proofUrl,
      ...(user?.uid ? { userId: user.uid } : {}),
      status: '待確認' as const,
    };

    try {
      await submitOrder(orderData);
      if (proofUrl) {
        await saveOrderProof(orderId, proofUrl);
      }
      clearCart();
      navigate(`/confirmation/${orderId}`);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('訂單提交失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (cartItems.length === 0) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-serif text-zinc-900">您的購物車是空的</h1>
        <p className="text-gray-600">看起來您尚未加入任何商品。</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-[#1f3c88] hover:bg-[#162d66] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          繼續選購
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-zinc-900">購物流程</h1>
        <p className="text-gray-500">填寫資料即可完成下單，會員資料會自動套用。</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <ol className="grid gap-6 md:grid-cols-4">
          {checkoutSteps.map(({ title, description }, index) => (
            <li key={title} className="flex flex-col items-center text-center">
              <div
                className={`flex items-center justify-center h-12 w-12 rounded-full border-2 text-sm font-semibold ${
                  index === 0 ? 'bg-amber-500 border-amber-500 text-zinc-900' : 'border-gray-200 text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              <p className="mt-4 text-base font-semibold text-zinc-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
              {index < checkoutSteps.length - 1 ? (
                <div className="hidden md:block w-full h-px bg-gradient-to-r from-amber-200 via-gray-200 to-amber-200 mt-4" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">購物車商品</h2>
              <p className="text-sm text-gray-500">共 {cartItems.length} 項商品</p>
            </div>
            <div className="space-y-6">
              {cartItems.map((item) => {
                const imageUrl =
                  item.imageUrls && item.imageUrls.length > 0
                    ? item.imageUrls[0]
                    : item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <img src={imageUrl} alt={item.name} className="w-24 h-24 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-lg text-zinc-900">{item.name}</p>
                        <p className="text-sm text-gray-500">NT$ {item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                          aria-label="減少數量"
                        >
                          <MinusIcon />
                        </button>
                        <span className="px-4 py-2 text-zinc-900 font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                          aria-label="增加數量"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <p className="font-semibold text-zinc-900 w-24 text-right">NT$ {item.price * item.quantity}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors duration-200"
                        aria-label="移除商品"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold text-zinc-900 mb-6">訂單備註</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              商品出貨時間依供應及物流狀況為準，如有特殊需求請於結帳後聯繫客服協助處理。
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl h-fit">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900">訂單資訊</h2>
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-4 text-sm leading-relaxed">
            已套用會員資料，如需更新請前往{' '}
            <Link to="/account" className="font-semibold underline">
              會員中心
            </Link>
            。
          </div>
          <form onSubmit={handleCheckout} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                收件人姓名
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                聯絡電話
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div className="space-y-2">
              <p className="block text-sm font-medium text-gray-700">配送方式</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(shippingOptions) as ShippingMethod[]).map((methodKey) => {
                  const option = shippingOptions[methodKey];
                  const isActive = shippingMethod === methodKey;

                  return (
                    <button
                      key={methodKey}
                      type="button"
                      onClick={() => setShippingMethod(methodKey)}
                      className={`text-left border rounded-lg p-4 transition-all ${
                        isActive
                          ? 'border-amber-500 bg-amber-50 shadow-sm'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-zinc-900">{option.label}</span>
                        <span className="text-sm font-bold text-amber-600">NT$ {option.fee}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{option.helper}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {shippingMethod === 'blackCat' ? (
              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  收件地址
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="請填寫完整收件地址"
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required={shippingMethod === 'blackCat'}
                />
                <p className="text-xs text-gray-500">會員資料中的地址會自動帶入，可依配送需求調整。</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="block text-sm font-medium text-gray-700">取件門市資訊</p>
                {shippingMethod === 'sevenEleven' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="sevenCity" className="sr-only">
                        城市
                      </label>
                      <input
                        type="text"
                        id="sevenCity"
                        value={sevenCity}
                        onChange={(event) => {
                          setSevenCity(event.target.value);
                          setSevenStore('');
                        }}
                        placeholder="城市"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="sevenStore" className="sr-only">
                        門市
                      </label>
                      {sevenCity.trim() ? (
                        <SevenElevenStoreAutocomplete
                          city={sevenCity}
                          value={sevenStore}
                          onChange={setSevenStore}
                          onSelect={(store) => setSevenStore(store.name)}
                          inputClassName="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="門市"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          id="sevenStore"
                          value={sevenStore}
                          onChange={(event) => setSevenStore(event.target.value)}
                          placeholder="門市"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          disabled
                          required
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="familyCity" className="sr-only">
                        城市
                      </label>
                      <input
                        type="text"
                        id="familyCity"
                        value={familyCity}
                        onChange={(event) => setFamilyCity(event.target.value)}
                        placeholder="城市"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="familyStore" className="sr-only">
                        門市
                      </label>
                      <input
                        type="text"
                        id="familyStore"
                        value={familyStore}
                        onChange={(event) => setFamilyStore(event.target.value)}
                        placeholder="門市"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">會員資料中的超商取件城市與門市會自動帶入，可依需求調整。</p>
              </div>
            )}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>商品金額</span>
              <span>NT$ {subtotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                運費
                <span className="ml-2 text-xs text-gray-500">{shippingOptions[shippingMethod].label}</span>
              </span>
              <span className={isFreeShipping ? 'text-green-600 font-semibold' : ''}>
                {isFreeShipping ? '免運' : `NT$ ${shippingFee}`}
              </span>
            </div>
            {isFreeShipping && (
              <p className="text-xs text-green-600">
                {isStoreToStore
                  ? hasItemFreeShipping
                    ? '已達單品免運門檻'
                    : meetsAmountFreeShipping
                      ? `已達滿額 NT$${freeShippingThreshold} 免運`
                      : null
                  : `已達滿額 NT$${BLACK_CAT_FREE_SHIPPING_THRESHOLD} 黑貓宅急便免運`}
              </p>
            )}
            {!isFreeShipping && isStoreToStore && freeShippingThreshold !== null && (
              <p className="text-xs text-gray-500">
                滿 NT${freeShippingThreshold} 享免運，或指定商品達到免運數量。
              </p>
            )}
            {!isFreeShipping && !isStoreToStore && (
              <p className="text-xs text-gray-500">
                滿 NT${BLACK_CAT_FREE_SHIPPING_THRESHOLD} 黑貓宅急便免運。
              </p>
            )}
            <div className="flex items-center justify-between text-lg font-bold text-zinc-900">
              <span>應付總額</span>
              <span className="text-amber-500">NT$ {finalTotal}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1f3c88] hover:bg-[#162d66] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中…' : '送出訂單'}
          </button>
        </form>
      </div>
    </div>
    {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 space-y-6">
                <h2 className="text-2xl font-bold text-center text-zinc-900">匯款資訊</h2>
                <div className="space-y-4 text-left p-6 bg-gray-50 rounded-lg border">
                    <p className="text-lg">
                        <span className="font-semibold text-gray-600">銀行代碼：</span>
                        <span className="font-mono text-xl text-zinc-800">808</span> (玉山銀行)
                    </p>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-lg">
                            <span className="font-semibold text-gray-600">銀行帳戶：</span>
                            <span className="font-mono text-xl text-zinc-800">1045940043005</span>
                        </p>
                        <button
                            type="button"
                            onClick={() => handleCopy('1045940043005')}
                            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                              isCopied
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {isCopied ? <CheckIcon /> : <CopyIcon />}
                            <span>{isCopied ? '已複製' : '複製'}</span>
                        </button>
                    </div>
                    <p className="text-lg">
                        <span className="font-semibold text-gray-600">匯款金額：</span>
                        <span className="font-mono text-2xl text-red-600 font-bold">NT$ {finalTotal}</span>
                    </p>
                </div>
                <p className="text-sm text-center text-gray-500">
                    請於完成匯款後，聯繫客服告知您的訂單編號及帳號後五碼，以便我們為您確認款項並安排出貨。
                </p>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">上傳轉帳截圖（可先準備檔案）</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setPaymentProofFile(file);
                      setPaymentProofName(file?.name ?? '');
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {paymentProofName && <p className="text-xs text-gray-500">已選擇：{paymentProofName}</p>}
                  <p className="text-sm font-semibold text-red-600 text-center">
                    轉帳後務必將轉帳資訊截圖上傳，才代表完成訂單！
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleConfirmOrder}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-3 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '處理中...' : '我已了解，確認送出'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    )}
  </div>
  );
};

export default CartPage;