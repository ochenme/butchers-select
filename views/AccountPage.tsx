import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SevenElevenStoreAutocomplete from '../components/SevenElevenStoreAutocomplete';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    login,
    logout,
    completeRegistration,
    refreshProfile,
    updateProfile,
    authError,
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerBlackCatAddress, setRegisterBlackCatAddress] = useState('');
  const [registerSevenCity, setRegisterSevenCity] = useState('');
  const [registerSevenStore, setRegisterSevenStore] = useState('');
  const [registerFamilyCity, setRegisterFamilyCity] = useState('');
  const [registerFamilyStore, setRegisterFamilyStore] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(!user);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editBlackCatAddress, setEditBlackCatAddress] = useState('');
  const [editSevenCity, setEditSevenCity] = useState('');
  const [editSevenStore, setEditSevenStore] = useState('');
  const [editFamilyCity, setEditFamilyCity] = useState('');
  const [editFamilyStore, setEditFamilyStore] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const registerSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (user) {
        setEditPhone(user.phone || '');
        setEditBlackCatAddress(user.address || '');
        setEditSevenCity(user['7-11storeCity'] || '');
        setEditSevenStore(user['7-11storeName'] || '');
        setEditFamilyCity(user.familystoreCity || '');
        setEditFamilyStore(user.familystoreName || '');
    }
  }, [user]);

  const formatAuthError = useMemo(
    () => (error: unknown) => {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-api-key' || error.code === 'auth/invalid-configuration') {
          const host = typeof window !== 'undefined' ? window.location.host : '預覽網域';
          return `此預覽網域 (${host}) 未被 Firebase 授權，請改用正式網址 https://butchers-select.com 登入或在 Firebase 後台新增此網域。`;
        }

        if (error.code === 'auth/unauthorized-domain') {
          const host = typeof window !== 'undefined' ? window.location.host : '預覽網域';
          return `目前的預覽網域 (${host}) 未在 Firebase 授權網域清單內，無法使用登入/註冊。請改用正式網址或將該網域加入 Firebase。`;
        }

        if (error.code === 'auth/network-request-failed') {
          return '無法連線到登入服務，請檢查網路後再試。';
        }
      }

      return error instanceof Error ? error.message : '登入失敗，請稍後再試';
    },
    [],
  );

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authError) {
      setLoginError(authError);
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await login(loginEmail, loginPassword);
      await refreshProfile();
      navigate('/');
    } catch (error) {
      setLoginError(formatAuthError(error));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authError) {
      setRegisterError(authError);
      return;
    }
    setRegisterError(null);
    setRegisterSuccess(null);

    if (!registerEmail) {
      setRegisterError('請輸入 Email');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError('請輸入至少 6 碼的密碼');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setRegisterError('兩次輸入的密碼不一致');
      return;
    }

    if (!registerName || !registerPhone) {
      setRegisterError('請完整填寫姓名與電話');
      return;
    }

    const blackCatFilled = registerBlackCatAddress.trim().length > 0;
    const sevenCityFilled = registerSevenCity.trim().length > 0;
    const sevenStoreFilled = registerSevenStore.trim().length > 0;
    const familyCityFilled = registerFamilyCity.trim().length > 0;
    const familyStoreFilled = registerFamilyStore.trim().length > 0;

    if (sevenCityFilled !== sevenStoreFilled) {
      setRegisterError('請完整填寫 7-11 城市與門市');
      return;
    }

    if (familyCityFilled !== familyStoreFilled) {
      setRegisterError('請完整填寫全家城市與門市');
      return;
    }

    const hasSeven = sevenCityFilled && sevenStoreFilled;
    const hasFamily = familyCityFilled && familyStoreFilled;

    if (!blackCatFilled && !hasSeven && !hasFamily) {
      setRegisterError('請至少填寫一種配送方式資訊');
      return;
    }

    setIsRegistering(true);

    try {
      await completeRegistration(registerEmail, registerPassword, {
        name: registerName,
        phone: registerPhone,
        address: registerBlackCatAddress,
        ['7-11storeCity']: registerSevenCity,
        ['7-11storeName']: registerSevenStore,
        familystoreCity: registerFamilyCity,
        familystoreName: registerFamilyStore,
      });

      await login(registerEmail, registerPassword);
      await refreshProfile();

      setRegisterSuccess('註冊成功！已自動登入。');
      navigate('/');
    } catch (error) {
      setRegisterError(formatAuthError(error));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleScrollToRegister = () => {
    setShowRegister(true);
    setTimeout(() => {
      registerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditPhone(user?.phone || '');
      setEditBlackCatAddress(user?.address || '');
      setEditSevenCity(user?.['7-11storeCity'] || '');
      setEditSevenStore(user?.['7-11storeName'] || '');
      setEditFamilyCity(user?.familystoreCity || '');
      setEditFamilyStore(user?.familystoreName || '');
      setUpdateError(null);
  };

  const handleSaveProfile = async () => {
      if (!editPhone) {
          setUpdateError("電話不能為空");
          return;
      }

      const blackCatFilled = editBlackCatAddress.trim().length > 0;
      const sevenCityFilled = editSevenCity.trim().length > 0;
      const sevenStoreFilled = editSevenStore.trim().length > 0;
      const familyCityFilled = editFamilyCity.trim().length > 0;
      const familyStoreFilled = editFamilyStore.trim().length > 0;

      if (sevenCityFilled !== sevenStoreFilled) {
          setUpdateError('請完整填寫 7-11 城市與門市');
          return;
      }

      if (familyCityFilled !== familyStoreFilled) {
          setUpdateError('請完整填寫全家城市與門市');
          return;
      }

      const hasSeven = sevenCityFilled && sevenStoreFilled;
      const hasFamily = familyCityFilled && familyStoreFilled;

      if (!blackCatFilled && !hasSeven && !hasFamily) {
          setUpdateError('請至少保留一種配送方式資訊');
          return;
      }
      setIsUpdating(true);
      setUpdateError(null);
      setUpdateSuccess(null);
      try {
          await updateProfile({
            phone: editPhone,
            address: editBlackCatAddress,
            ['7-11storeCity']: editSevenCity,
            ['7-11storeName']: editSevenStore,
            familystoreCity: editFamilyCity,
            familystoreName: editFamilyStore,
          });
          setUpdateSuccess("資料已成功更新！");
          setIsEditing(false);
          setTimeout(() => setUpdateSuccess(null), 3000);
      } catch (error) {
          setUpdateError("更新失敗，請稍後再試。");
      } finally {
          setIsUpdating(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <section className="bg-white rounded-2xl shadow-xl p-10">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-serif text-zinc-900">會員登入</h1>
            <p className="mt-2 text-gray-500">使用註冊的 Email 與密碼登入會員帳號</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {user ? (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-6 text-sm leading-relaxed">
                  您已登入會員，可直接瀏覽最新優惠或前往購物車完成訂單。
                </div>

                {updateSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{updateSuccess}</div>}
                {updateError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{updateError}</div>}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-zinc-900 break-words">{user.email}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">姓名</p>
                    <p className="font-semibold text-zinc-900">{user.name || '尚未設定'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">聯絡電話</p>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-white border-b-2 border-amber-500 px-1 py-0.5 text-zinc-900 font-semibold focus:outline-none"
                        />
                    ) : (
                        <p className="font-semibold text-zinc-900">{user.phone || '尚未設定'}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">取貨方式（至少填一種）</p>
                    <span className="text-xs text-gray-500">可同時保留多種選項</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs text-gray-500 mb-2">黑貓宅急便</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editBlackCatAddress}
                          onChange={(e) => setEditBlackCatAddress(e.target.value)}
                          placeholder="請輸入完整收件地址"
                          className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      ) : (
                        <p className="font-semibold text-zinc-900 break-words min-h-[24px]">{user.address || '尚未設定'}</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-2">
                      <p className="text-xs text-gray-500">7-11 店到店</p>
                      <div className="grid grid-cols-1 gap-2">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editSevenCity}
                              onChange={(e) => {
                                setEditSevenCity(e.target.value);
                                setEditSevenStore('');
                              }}
                              placeholder="城市"
                              className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            {editSevenCity.trim() ? (
                              <SevenElevenStoreAutocomplete
                                city={editSevenCity}
                                value={editSevenStore}
                                onChange={setEditSevenStore}
                                onSelect={(store) => setEditSevenStore(store.name)}
                                inputClassName="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="門市"
                              />
                            ) : (
                              <input
                                type="text"
                                value={editSevenStore}
                                onChange={(e) => setEditSevenStore(e.target.value)}
                                placeholder="門市"
                                className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                disabled
                              />
                            )}
                          </>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-zinc-900 min-h-[24px]">{user['7-11storeCity'] || '城市未填寫'}</p>
                            <p className="font-semibold text-zinc-900 min-h-[24px]">{user['7-11storeName'] || '門市未填寫'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-2">
                      <p className="text-xs text-gray-500">全家 店到店</p>
                      <div className="grid grid-cols-1 gap-2">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editFamilyCity}
                              onChange={(e) => setEditFamilyCity(e.target.value)}
                              placeholder="城市"
                              className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              value={editFamilyStore}
                              onChange={(e) => setEditFamilyStore(e.target.value)}
                              placeholder="門市"
                              className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-zinc-900 min-h-[24px]">{user.familystoreCity || '城市未填寫'}</p>
                            <p className="font-semibold text-zinc-900 min-h-[24px]">{user.familystoreName || '門市未填寫'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isUpdating}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400"
                            >
                                {isUpdating ? '儲存中...' : '儲存變更'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/cart')}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-3 rounded-lg transition-colors"
                            >
                                前往購物車
                            </button>
                             <button
                                onClick={handleEditClick}
                                className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors"
                            >
                                編輯資料
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors"
                            >
                                登出
                            </button>
                        </>
                    )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                {authError ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                    {authError}
                  </div>
                ) : null}
                {loginError ? (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                ) : null}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-email">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    disabled={Boolean(authError)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="login-password">
                    密碼
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    disabled={Boolean(authError)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn || Boolean(authError)}
                  className="w-full bg-[#1f3c88] hover:bg-[#162d66] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {isLoggingIn ? '登入中…' : '立即登入'}
                </button>
              </form>
            )}
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50">
            <p className="text-sm text-gray-600 leading-relaxed">
              成為會員可保存常用收件資訊、快速完成訂單，並第一時間收到限定優惠與新品資訊。
            </p>
            <button
              type="button"
              onClick={handleScrollToRegister}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-3 rounded-lg transition-colors"
            >
              註冊會員
            </button>
          </div>
        </div>
      </section>

      <section
        ref={registerSectionRef}
        className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-700 ease-in-out ${
          showRegister ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!showRegister}
      >
        <div className="p-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-serif text-zinc-900">加入會員</h2>
              <p className="mt-2 text-gray-500">快速完成註冊並保存您的常用資訊</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRegister(false)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              收合註冊區塊
            </button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
            <form onSubmit={handleRegister} className="space-y-6">
              {authError ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              ) : null}
              {registerError ? (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {registerError}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  disabled={Boolean(authError)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-password">
                    設定密碼
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    disabled={Boolean(authError)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="至少 6 碼"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-password-confirm">
                    確認密碼
                  </label>
                  <input
                    id="register-password-confirm"
                    type="password"
                    value={registerPasswordConfirm}
                    onChange={(event) => setRegisterPasswordConfirm(event.target.value)}
                    disabled={Boolean(authError)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="再次輸入密碼"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-name">
                  姓名
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  disabled={Boolean(authError)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-phone">
                  聯絡電話
                </label>
                <input
                  id="register-phone"
                  type="tel"
                  value={registerPhone}
                  onChange={(event) => setRegisterPhone(event.target.value)}
                  disabled={Boolean(authError)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="請輸入聯絡電話"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">取貨方式（至少填一種）</p>
                  <span className="text-xs text-gray-500">可保留多種配送方式</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-500">黑貓宅急便</p>
                    <input
                      type="text"
                      value={registerBlackCatAddress}
                      onChange={(event) => setRegisterBlackCatAddress(event.target.value)}
                      disabled={Boolean(authError)}
                      className="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="請輸入收件地址"
                    />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-500">7-11 店到店</p>
                    <div className="grid gap-2">
                      <input
                        type="text"
                        value={registerSevenCity}
                        onChange={(event) => {
                          setRegisterSevenCity(event.target.value);
                          setRegisterSevenStore('');
                        }}
                        disabled={Boolean(authError)}
                        className="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="城市"
                      />
                      {registerSevenCity.trim() ? (
                        <SevenElevenStoreAutocomplete
                          city={registerSevenCity}
                          value={registerSevenStore}
                          onChange={setRegisterSevenStore}
                          onSelect={(store) => setRegisterSevenStore(store.name)}
                          inputClassName="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="門市"
                          disabled={Boolean(authError)}
                        />
                      ) : (
                        <input
                          type="text"
                          value={registerSevenStore}
                          onChange={(event) => setRegisterSevenStore(event.target.value)}
                          disabled
                          className="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="門市"
                        />
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-gray-500">全家 店到店</p>
                    <div className="grid gap-2">
                      <input
                        type="text"
                        value={registerFamilyCity}
                        onChange={(event) => setRegisterFamilyCity(event.target.value)}
                        disabled={Boolean(authError)}
                        className="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="城市"
                      />
                      <input
                        type="text"
                        value={registerFamilyStore}
                        onChange={(event) => setRegisterFamilyStore(event.target.value)}
                        disabled={Boolean(authError)}
                        className="w-full bg-gray-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="門市"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering || Boolean(authError)}
                className="w-full bg-[#1f3c88] hover:bg-[#162d66] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isRegistering ? '註冊中…' : '完成註冊'}
              </button>
              {registerSuccess ? (
                <p className="text-center text-green-600 text-sm">{registerSuccess}</p>
              ) : null}
            </form>
            <div className="rounded-xl bg-zinc-900 text-white p-6 text-sm leading-relaxed">
              <p className="font-semibold text-base">小提醒</p>
              <ul className="mt-3 space-y-2 list-disc list-inside text-white/80">
                <li>密碼需至少六碼，建議混合字母與數字。</li>
                <li>完成註冊後可於會員中心更新個人資料。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountPage;