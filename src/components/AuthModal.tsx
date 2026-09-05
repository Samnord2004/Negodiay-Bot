import React, { useState } from 'react';
import { 
  X, Lock, Mail, Phone, Fingerprint, ShieldCheck, 
  UserCheck, AlertCircle, CheckCircle, Smartphone, Key
} from 'lucide-react';
import { Participant } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Participant | null;
  onLoginSuccess: (user: Participant) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBirthday, setRegBirthday] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('sms');
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  
  // Verification code step
  const [regStep, setRegStep] = useState<'details' | 'code' | 'pending'>('details');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
          useBiometrics: false
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setLoginError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setLoginError('Сбой соединения с сервером');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoginError('');
    setLoginLoading(true);
    try {
      // Simulate biometric sensor prompt (e.g. WebAuthn FaceID / TouchID)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier || 'Admin',
          useBiometrics: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setLoginError(data.error || 'Биометрическая аутентификация не удалась');
      }
    } catch (err) {
      setLoginError('Сбой биометрии');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSendVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regNickname.trim()) {
      setRegError('Укажите ФИО и позывной');
      return;
    }
    if (verificationMethod === 'email' && !regEmail.includes('@')) {
      setRegError('Укажите корректный e-mail');
      return;
    }
    if (verificationMethod === 'sms' && !regPhone.trim()) {
      setRegError('Укажите номер мобильного телефона');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      setRegError('Пароль должен содержать минимум 4 символа');
      return;
    }

    // Generate code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setRegStep('code');
  };

  const handleVerifyAndSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (verificationCode !== generatedCode && verificationCode !== '1234') {
      setRegError(`Неверный код! (Демо-код: ${generatedCode})`);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          nickname: regNickname,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          birthday: regBirthday,
          gender: regGender,
          verificationMethod,
          verificationCode,
          biometricEnabled
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegStep('pending');
        setRegSuccess(data.message);
      } else {
        setRegError(data.error || 'Ошибка при регистрации');
      }
    } catch (err) {
      setRegError('Сбой отправки заявки на сервер');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-red-600 w-6 h-6" />
            <h3 className="font-black text-lg sm:text-xl uppercase text-red-700 tracking-tight">
              {currentUser ? 'Профиль участника' : authMode === 'login' ? 'Вход на портал' : 'Регистрация Негодяя'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Logged in state */}
        {currentUser ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-amber-300 shadow-sm">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-16 h-16 rounded-full border-2 border-red-500 bg-amber-100 object-cover" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg text-amber-950">{currentUser.name}</h4>
                  <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    currentUser.role === 'admin' ? 'bg-red-600 text-white border-red-700' :
                    currentUser.role === 'treasurer' ? 'bg-emerald-600 text-white border-emerald-700' :
                    'bg-amber-200 text-amber-900 border-amber-400'
                  }`}>
                    {currentUser.role === 'admin' ? 'Капитан команды' : currentUser.role === 'treasurer' ? 'Казначей фонда' : 'Участник'}
                  </span>
                </div>
                <p className="text-sm font-bold text-red-600">@{currentUser.nickname}</p>
                <p className="text-xs text-amber-700 mt-1">
                  Статус аккаунта: <span className="font-bold text-emerald-700">Одобрен Капитаном команды ✓</span>
                </p>
                {currentUser.biometricEnabled && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-bold mt-0.5">
                    <Fingerprint size={13} /> Биометрия (Touch/Face ID) активна
                  </p>
                )}
              </div>
            </div>

            <div className="bg-amber-100 p-4 rounded-xl border border-amber-300 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-amber-800">Email:</span>
                <span className="font-bold text-amber-950">{currentUser.email || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Телефон:</span>
                <span className="font-bold text-amber-950">{currentUser.phone || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">День рождения:</span>
                <span className="font-bold text-amber-950">{currentUser.birthday || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">В команде с:</span>
                <span className="font-bold text-amber-950">{currentUser.joinedYear} года</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-amber-200 hover:bg-amber-300 font-bold text-amber-900 rounded-lg text-sm transition-colors"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow transition-colors"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-amber-200 p-1 mb-6 border border-amber-300">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2 text-sm font-black uppercase rounded-lg transition-all ${
                  authMode === 'login' 
                    ? 'bg-red-600 text-yellow-300 shadow-md' 
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                Вход в аккаунт
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setRegStep('details');
                  setRegError('');
                }}
                className={`flex-1 py-2 text-sm font-black uppercase rounded-lg transition-all ${
                  authMode === 'register' 
                    ? 'bg-red-600 text-yellow-300 shadow-md' 
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs sm:text-sm text-red-800 font-bold flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                    Позывной / E-mail / Телефон
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Например: Саня Запевала или admin"
                      className="w-full px-3 py-2.5 bg-white border-2 border-amber-300 focus:border-red-500 focus:outline-none rounded-xl text-sm font-semibold text-amber-950 shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-white border-2 border-amber-300 focus:border-red-500 focus:outline-none rounded-xl text-sm font-semibold text-amber-950 shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Для входа Капитаном команды: логин <span className="font-bold text-red-600">admin</span> (пароль по умолчанию: <span className="font-bold text-red-600">admin</span>)
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Key size={16} />
                    {loginLoading ? 'Проверка...' : 'Войти в клуб'}
                  </button>

                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={loginLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Fingerprint size={16} />
                    Войти по биометрии (Touch ID / Face ID)
                  </button>
                </div>
              </form>
            )}

            {/* REGISTRATION FORM */}
            {authMode === 'register' && (
              <div>
                {regError && (
                  <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs sm:text-sm text-red-800 font-bold flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Step 1: Details */}
                {regStep === 'details' && (
                  <form onSubmit={handleSendVerificationCode} className="space-y-3">
                    <div className="bg-amber-100 p-2.5 rounded-lg border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-red-600 shrink-0" />
                      <span>Внимание: Все новые аккаунты проходят обязательное подтверждение Капитаном команды!</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Имя и Фамилия *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Иван Петров"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Позывной в команде *
                        </label>
                        <input
                          type="text"
                          required
                          value={regNickname}
                          onChange={(e) => setRegNickname(e.target.value)}
                          placeholder="Ванька Костровой"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Дата рождения
                        </label>
                        <input
                          type="date"
                          value={regBirthday}
                          onChange={(e) => setRegBirthday(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Пол
                        </label>
                        <select
                          value={regGender}
                          onChange={(e) => setRegGender(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        >
                          <option value="male">Мужской (Парень)</option>
                          <option value="female">Женский (Девушка)</option>
                        </select>
                      </div>
                    </div>

                    {/* Verification Method Chooser */}
                    <div>
                      <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                        Способ подтверждения *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setVerificationMethod('sms')}
                          className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 ${
                            verificationMethod === 'sms'
                              ? 'border-red-600 bg-red-100 text-red-900'
                              : 'border-amber-300 bg-white text-amber-800'
                          }`}
                        >
                          <Smartphone size={14} /> SMS на телефон
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationMethod('email')}
                          className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 ${
                            verificationMethod === 'email'
                              ? 'border-red-600 bg-red-100 text-red-900'
                              : 'border-amber-300 bg-white text-amber-800'
                          }`}
                        >
                          <Mail size={14} /> Подтверждение по E-mail
                        </button>
                      </div>
                    </div>

                    {verificationMethod === 'sms' ? (
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Номер телефона для SMS *
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          E-mail для ссылки подтверждения *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="ivan@mail.ru"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                        Придумайте пароль *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Минимум 4 знака"
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                      />
                    </div>

                    {/* Biometrics enrollment option */}
                    <div className="bg-emerald-50 border-2 border-emerald-400 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="text-emerald-700 w-5 h-5" />
                        <div>
                          <p className="text-xs font-black text-emerald-950">Включить биометрию (Touch/Face ID)</p>
                          <p className="text-[10px] text-emerald-700">Быстрый и защищенный вход без ввода пароля</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={biometricEnabled}
                        onChange={(e) => setBiometricEnabled(e.target.checked)}
                        className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md transition-all mt-2"
                    >
                      Получить код подтверждения ({verificationMethod === 'sms' ? 'SMS' : 'E-mail'})
                    </button>
                  </form>
                )}

                {/* Step 2: Code verification */}
                {regStep === 'code' && (
                  <form onSubmit={handleVerifyAndSubmitRegister} className="space-y-4">
                    <div className="text-center p-3 bg-yellow-100 border border-yellow-400 rounded-xl">
                      <p className="text-xs font-bold text-amber-950">
                        Код отправлен на {verificationMethod === 'sms' ? regPhone : regEmail}
                      </p>
                      <p className="text-xs text-red-600 font-black mt-1">
                        (Для тестирования введите код: <span className="underline">{generatedCode}</span> или 1234)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-amber-900 mb-1 text-center">
                        Введите 4-значный код
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="••••"
                        className="w-48 mx-auto block text-center tracking-widest text-2xl font-black py-2 bg-white border-3 border-amber-300 focus:border-red-500 rounded-xl text-amber-950"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRegStep('details')}
                        className="flex-1 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-black uppercase text-xs rounded-xl"
                      >
                        Назад
                      </button>
                      <button
                        type="submit"
                        className="flex-2 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md"
                      >
                        Подтвердить и отправить заявку
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Pending Admin Approval */}
                {regStep === 'pending' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-yellow-300 text-red-700 rounded-full flex items-center justify-center mx-auto border-3 border-red-600 shadow-md">
                      <ShieldCheck size={36} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-amber-950">Заявка успешно принята!</h4>
                      <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                        Согласно правилам команды Негодяев, вход на закрытый сайт разрешен только после одобрения аккаунта Администратором.
                      </p>
                      <p className="text-xs font-bold text-red-600 mt-1">
                        Администратор получил уведомление в панели модерации.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setRegStep('details');
                      }}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
                    >
                      Вернуться ко входу
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
