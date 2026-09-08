import React, { useState } from 'react';
import { 
  X, Lock, Mail, Phone, Fingerprint, ShieldCheck, 
  UserCheck, AlertCircle, CheckCircle, Smartphone, Key
} from 'lucide-react';
import { Participant } from '../types';
import { getSafeAvatar } from '../utils/avatar';
import { formatBirthdayShort } from '../utils/dateUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Participant | null;
  onLoginSuccess: (user: Participant) => void;
  onLogout: () => void;
  onRegistered?: (participants: Participant[]) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onRegistered
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form (no verification code required, approval by Captain)
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBirthday, setRegBirthday] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regStep, setRegStep] = useState<'details' | 'pending'>('details');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Password recovery state
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'captain'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'done'>('request');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [simulatedResetNotice, setSimulatedResetNotice] = useState('');
  
  // Captain reset request state
  const [captainResetIdentifier, setCaptainResetIdentifier] = useState('');
  const [captainResetNote, setCaptainResetNote] = useState('');
  const [captainRequestSent, setCaptainRequestSent] = useState(false);

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

  // Direct registration submission: No verification code needed because Captain approves all accounts!
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regNickname.trim()) {
      setRegError('Укажите ФИО и позывной');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 3) {
      setRegError('Пароль должен содержать минимум 3 символа');
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          nickname: regNickname.trim().replace(/^@/, ''),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword.trim(),
          birthday: regBirthday.trim() ? formatBirthdayShort(regBirthday.trim()) : '',
          gender: regGender,
          biometricEnabled
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegStep('pending');
        setRegSuccess(data.message || 'Заявка принята!');
        if (data.participants && onRegistered) {
          onRegistered(data.participants);
        }
      } else {
        setRegError(data.error || 'Ошибка при отправке заявки');
      }
    } catch (err) {
      setRegError('Сбой отправки заявки на сервер');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Password Recovery: Step 1 - Send email reset code
  const handleRequestEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!forgotEmail.trim()) {
      setRecoveryError('Укажите e-mail или позывной');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrNickname: forgotEmail.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimulatedResetNotice(`Код для сброса пароля: ${data.resetCode} (отправлен на ${data.email})`);
        setForgotEmail(data.email || forgotEmail);
        setRecoveryStep('verify');
        setRecoverySuccess(data.message || 'Код отправлен на e-mail');
      } else {
        setRecoveryError(data.error || 'Не удалось отправить код восстановления');
      }
    } catch (err) {
      setRecoveryError('Сбой соединения с сервером');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Password Recovery: Step 2 - Verify code and set new password
  const handleResetPasswordWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setRecoveryError('Введите 6-значный проверочный код');
      return;
    }
    if (!forgotNewPassword.trim() || forgotNewPassword.trim().length < 3) {
      setRecoveryError('Пароль должен содержать минимум 3 символа');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          newPassword: forgotNewPassword.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveryStep('done');
        setRecoverySuccess(data.message || 'Пароль успешно обновлён!');
      } else {
        setRecoveryError(data.error || 'Неверный код восстановления');
      }
    } catch (err) {
      setRecoveryError('Сбой соединения с сервером');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Request password reset from Captain
  const handleRequestCaptainReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!captainResetIdentifier.trim()) {
      setRecoveryError('Укажите ваш позывной, имя или контакты');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/request-captain-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: captainResetIdentifier.trim(),
          note: captainResetNote.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCaptainRequestSent(true);
        setRecoverySuccess(data.message || 'Запрос успешно отправлен Капитану команды!');
      } else {
        setRecoveryError(data.error || 'Ошибка при отправке запроса Капитану');
      }
    } catch (err) {
      setRecoveryError('Сбой соединения с сервером');
    } finally {
      setRecoveryLoading(false);
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
                src={getSafeAvatar(currentUser.avatar, currentUser.gender)} 
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
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[11px] text-amber-700">
                      Для входа Капитаном команды: логин <span className="font-bold text-red-600">admin</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setRecoveryStep('request');
                        setRecoveryError('');
                        setRecoverySuccess('');
                        setSimulatedResetNotice('');
                        setCaptainRequestSent(false);
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  </div>
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

            {/* PASSWORD RECOVERY FORM */}
            {authMode === 'forgot' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <h4 className="font-black text-sm uppercase text-red-600 flex items-center gap-2">
                    <Key size={16} /> Восстановление пароля
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setRecoveryError('');
                    }}
                    className="text-xs font-bold text-amber-900 hover:text-red-600 underline"
                  >
                    ← Назад ко входу
                  </button>
                </div>

                {/* Sub-tabs: Email vs Captain */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-amber-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod('email');
                      setRecoveryError('');
                    }}
                    className={`py-2 px-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      recoveryMethod === 'email'
                        ? 'bg-red-600 text-yellow-300 shadow-sm'
                        : 'text-amber-950 hover:bg-amber-100'
                    }`}
                  >
                    <Mail size={14} /> Через E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMethod('captain');
                      setRecoveryError('');
                    }}
                    className={`py-2 px-2 text-xs font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      recoveryMethod === 'captain'
                        ? 'bg-red-600 text-yellow-300 shadow-sm'
                        : 'text-amber-950 hover:bg-amber-100'
                    }`}
                  >
                    <UserCheck size={14} /> Запрос у Капитана
                  </button>
                </div>

                {recoveryError && (
                  <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs text-red-800 font-bold flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                {/* Method 1: Email Recovery */}
                {recoveryMethod === 'email' && (
                  <div>
                    {recoveryStep === 'request' && (
                      <form onSubmit={handleRequestEmailReset} className="space-y-3">
                        <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                          Введите ваш зарегистрированный e-mail или позывной. Мы отправим 6-значный код для сброса пароля.
                        </p>
                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            E-mail или Позывной
                          </label>
                          <input
                            type="text"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="ivan@mail.ru или @Саня"
                            className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={recoveryLoading}
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black uppercase text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                        >
                          <Mail size={14} />
                          {recoveryLoading ? 'Отправка...' : 'Отправить код на e-mail'}
                        </button>
                      </form>
                    )}

                    {recoveryStep === 'verify' && (
                      <form onSubmit={handleResetPasswordWithCode} className="space-y-3">
                        {simulatedResetNotice && (
                          <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs text-emerald-950">
                            <p className="font-black">{simulatedResetNotice}</p>
                            <p className="text-[10px] text-emerald-700 mt-0.5">Код действителен в течение 15 минут</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            6-значный код из письма
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={forgotCode}
                            onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="w-full text-center tracking-widest text-lg font-black px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-amber-950"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            Новый пароль
                          </label>
                          <input
                            type="password"
                            required
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="Минимум 3 символа"
                            className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRecoveryStep('request')}
                            className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 font-black uppercase text-xs rounded-xl"
                          >
                            Назад
                          </button>
                          <button
                            type="submit"
                            disabled={recoveryLoading}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black uppercase text-xs rounded-xl shadow transition-all"
                          >
                            {recoveryLoading ? 'Сохранение...' : 'Установить новый пароль'}
                          </button>
                        </div>
                      </form>
                    )}

                    {recoveryStep === 'done' && (
                      <div className="text-center py-3 space-y-3">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                          <CheckCircle size={28} />
                        </div>
                        <h4 className="font-black text-sm text-emerald-900">{recoverySuccess}</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('login');
                            setLoginPassword('');
                          }}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
                        >
                          Войти с новым паролем
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Method 2: Request from Captain */}
                {recoveryMethod === 'captain' && (
                  <div>
                    {!captainRequestSent ? (
                      <form onSubmit={handleRequestCaptainReset} className="space-y-3">
                        <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-300 text-[11px] text-amber-950 font-semibold leading-relaxed">
                          <span className="font-bold text-red-600">👑 Капитан команды</span> имеет право сбросить пароль любому члену команды. Запрос сразу появится в панели управления Капитана.
                        </div>
                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            Ваш позывной или ФИО *
                          </label>
                          <input
                            type="text"
                            required
                            value={captainResetIdentifier}
                            onChange={(e) => setCaptainResetIdentifier(e.target.value)}
                            placeholder="Например: Саня Запевала или Иван Петров"
                            className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                            Комментарий или контакт для связи (необязательно)
                          </label>
                          <input
                            type="text"
                            value={captainResetNote}
                            onChange={(e) => setCaptainResetNote(e.target.value)}
                            placeholder="Например: номер в WhatsApp или телеграм"
                            className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={recoveryLoading}
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black uppercase text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                        >
                          <UserCheck size={14} />
                          {recoveryLoading ? 'Отправка...' : 'Отправить запрос Капитану команды'}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-3 space-y-3">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                          <CheckCircle size={28} />
                        </div>
                        <h4 className="font-black text-sm text-amber-950">Запрос Капитану передан!</h4>
                        <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                          Капитан команды получил запрос и сбросит ваш пароль в панели управления. Свяжитесь с Капитаном для получения нового пароля.
                        </p>
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
                        >
                          Вернуться ко входу
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* REGISTRATION FORM (NO VERIFICATION CODE, CAPTAIN APPROVAL) */}
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
                  <form onSubmit={handleSubmitRegister} className="space-y-3">
                    <div className="bg-amber-100 p-2.5 rounded-lg border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-red-600 shrink-0" />
                      <span>Внимание: Вход в команду закрытый! Аккаунт добавляется только с личного одобрения Капитана команды (проверочные коды не требуются).</span>
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
                        <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                          Дата рождения (ДД.ММ.ГГ)
                        </label>
                        <input
                          type="text"
                          value={regBirthday}
                          onChange={(e) => setRegBirthday(e.target.value)}
                          onBlur={() => {
                            if (regBirthday.trim()) {
                              setRegBirthday(formatBirthdayShort(regBirthday.trim()));
                            }
                          }}
                          placeholder="15.06.88"
                          className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900 outline-none transition-colors"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          E-mail (для восстановления пароля)
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="ivan@mail.ru"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                          Телефон для связи
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                        Придумайте пароль *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Минимум 3 знака"
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                      />
                    </div>

                    {/* Biometrics enrollment option */}
                    <div className="bg-emerald-50 border-2 border-emerald-400 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="text-emerald-700 w-5 h-5" />
                        <div>
                          <p className="text-xs font-black text-emerald-950">Включить биометрию (Touch/Face ID)</p>
                          <p className="text-[10px] text-emerald-700">Быстрый вход без ввода пароля</p>
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
                      disabled={submittingReg}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-2"
                    >
                      <UserCheck size={16} />
                      {submittingReg ? 'Отправка заявки...' : 'Подать заявку в команду Негодяев'}
                    </button>
                  </form>
                )}

                {/* Step 2: Pending Captain Approval */}
                {regStep === 'pending' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-yellow-300 text-red-700 rounded-full flex items-center justify-center mx-auto border-3 border-red-600 shadow-md">
                      <ShieldCheck size={36} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-amber-950">Заявка успешно принята!</h4>
                      <p className="text-xs text-amber-800 mt-2 leading-relaxed font-semibold">
                        Согласно правилам команды «Негодяи», только с одобрения Капитана член команды может быть добавлен на сайт. Проверочный код не требуется.
                      </p>
                      <p className="text-xs font-bold text-red-600 mt-2">
                        👑 Капитан команды получил уведомление и активирует ваш профиль в штабе управления.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setRegStep('details');
                      }}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow transition-all"
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
