import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    login,
    logout,
    completeRegistration,
    refreshProfile,
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
  const [registerAddress, setRegisterAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(!user);

  const registerSectionRef = useRef<HTMLElement>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await login(loginEmail, loginPassword);
      await refreshProfile();
      navigate('/');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '登入失敗，請稍後再試';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
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

    if (!registerName || !registerPhone || !registerAddress) {
      setRegisterError('請完整填寫姓名、電話與收件地址');
      return;
    }

    setIsRegistering(true);

    try {
      await completeRegistration(registerEmail, registerPassword, {
        name: registerName,
        phone: registerPhone,
        address: registerAddress,
      });

      await login(registerEmail, registerPassword);
      await refreshProfile();

      setRegisterSuccess('註冊成功！已自動登入。');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : '註冊失敗，請稍後再試';
      setRegisterError(message);
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-zinc-900 break-words">{user.email}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">姓名</p>
                    <p className="font-semibold text-zinc-900">{user.name || '尚未設定'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">聯絡電話</p>
                    <p className="font-semibold text-zinc-900">{user.phone || '尚未設定'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">收件地址</p>
                    <p className="font-semibold text-zinc-900">{user.address || '尚未設定'}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold py-3 rounded-lg transition-colors"
                  >
                    前往購物車
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 font-semibold py-3 rounded-lg transition-colors"
                  >
                    登出
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
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
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
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
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="請輸入姓名"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-phone">
                    聯絡電話
                  </label>
                  <input
                    id="register-phone"
                    type="tel"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="請輸入聯絡電話"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="register-address">
                    收件地址
                  </label>
                  <input
                    id="register-address"
                    type="text"
                    value={registerAddress}
                    onChange={(event) => setRegisterAddress(event.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="請輸入收件地址"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
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