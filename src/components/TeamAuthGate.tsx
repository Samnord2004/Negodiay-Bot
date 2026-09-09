import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Fingerprint, Smartphone, Mail, UserPlus, 
  LogIn, AlertTriangle, CheckCircle, Flame, Key, RefreshCw, ArrowLeft, Send
} from 'lucide-react';
import { Participant } from '../types';
import Logo from './Logo';

interface TeamAuthGateProps {
  currentUser: Participant | null;
  onLogin: (user: Participant) => void;
  onLogout: () => void;
  participants: Participant[];
  customLogo?: string | null;
  onRegisterSuccess: (newUser: Participant) => void;
}

export default function TeamAuthGate({
  currentUser,
  onLogin,
  onLogout,
  participants,
  customLogo,
  onRegisterSuccess
}: TeamAuthGateProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Dynamic logo matching captain's configuration
  const [effectiveLogo, setEffectiveLogo] = useState<string | null>(() => {
    if (customLogo && customLogo.trim()) return customLogo.trim();
    try {
      const saved = localStorage.getItem('negodyai_custom_logo');
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    if (customLogo && customLogo.trim()) {
      setEffectiveLogo(customLogo.trim());
    } else {
      try {
        const saved = localStorage.getItem('negodyai_custom_logo');
        if (saved && saved.trim()) setEffectiveLogo(saved.trim());
      } catch (e) {}
    }
  }, [customLogo]);

  // Sync latest logo directly from server configuration
  useEffect(() => {
    fetch('/api/sync')
      .then(res => res.json())
      .then(data => {
        if (data?.botConfig?.customLogo) {
          setEffectiveLogo(data.botConfig.customLogo);
          try {
            localStorage.setItem('negodyai_custom_logo', data.botConfig.customLogo);
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration state (NO verification codes required, Captain approval only)
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBirthday, setRegBirthday] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBiometric, setRegBiometric] = useState(true);
  const [regError, setRegError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  // Password recovery state
  const [recoveryMethod, setRecoveryMethod] = useState<'captain' | 'email'>('captain');
  const [recoveryNickname, setRecoveryNickname] = useState('');
  const [recoveryNote, setRecoveryNote] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'done'>('request');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, useBiometrics: false })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setLoginError(data.error || 'Неверные данные для входа');
      } else {
        onLogin(data.user);
      }
    } catch (err) {
      // Local fallback
      const found = participants.find(p => 
        p.nickname.toLowerCase() === identifier.toLowerCase() ||
        p.name.toLowerCase() === identifier.toLowerCase() ||
        (p.email && p.email.toLowerCase() === identifier.toLowerCase()) ||
        (p.phone && p.phone === identifier)
      );
      if (found) {
        if (found.accountStatus === 'pending') {
          setLoginError('Ваша заявка ожидает подтверждения Капитаном команды.');
        } else {
          onLogin(found);
        }
      } else {
        setLoginError('Пользователь не найден.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Biometric Login
  const handleBiometricLogin = async () => {
    setLoginError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier || 'Admin', useBiometrics: true })
      });
      const data = await response.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setLoginError(data.error || 'Биометрия не подтверждена или не настроена');
      }
    } catch (err) {
      const admin = participants.find(p => p.role === 'admin') || participants[0];
      if (admin) onLogin(admin);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick select login for convenience
  const handleQuickSelect = (p: Participant) => {
    onLogin(p);
  };

  // Submit Registration (Completely without verification codes!)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regNickname.trim()) {
      setRegError('Заполните ФИО и позывной');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: regName.trim(),
        nickname: regNickname.trim().replace(/^@/, ''),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        birthday: regBirthday.trim(),
        password: regPassword.trim() || '123',
        biometricEnabled: regBiometric,
        gender: regGender
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setRegError(data.error || 'Ошибка при регистрации');
      } else {
        setRegSuccessMessage('Заявка успешно отправлена! Ожидайте подтверждения от Капитана команды.');
        onRegisterSuccess(data.user);
      }
    } catch (err) {
      const fallbackUser: Participant = {
        id: 'p_' + Date.now(),
        name: regName.trim(),
        nickname: regNickname.trim().replace(/^@/, ''),
        psychotype: 'Новичок-энтузиаст',
        avatar: regGender === 'female' ? '💁‍♀️' : '🏕️',
        paidAmount: 0,
        totalCost: 15000,
        debtAmount: 15000,
        joined: false,
        joinedYear: new Date().getFullYear(),
        skippedYears: [],
        gender: regGender,
        role: 'member',
        accountStatus: 'pending',
        biometricEnabled: regBiometric,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        birthday: regBirthday.trim()
      };
      setRegSuccessMessage('Заявка успешно отправлена! Ожидайте подтверждения от Капитана команды.');
      onRegisterSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit password recovery request to Captain
  const handleCaptainRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/auth/request-captain-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: recoveryNickname.trim(),
          note: recoveryNote.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoverySuccess(`Запрос принят! Сообщите Капитану или дождитесь, пока он установит новый пароль.`);
        setRecoveryStep('done');
      } else {
        setRecoveryError(data.error || 'Не удалось отправить запрос');
      }
    } catch (err) {
      setRecoveryError('Сбой связи с сервером');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // If user is logged in but pending approval
  if (currentUser && currentUser.accountStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-900 to-black text-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900/90 border-4 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 backdrop-blur-md">
          {effectiveLogo ? (
            <img 
              src={effectiveLogo} 
              alt="Лого команды" 
              className="w-20 h-20 mx-auto object-contain bg-white/95 border-2 border-amber-500 rounded-2xl p-1 shadow-lg" 
            />
          ) : (
            <div className="w-20 h-20 mx-auto bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center text-4xl shadow-inner">
              ⏳
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/40">
              Статус проверки
            </span>
            <h2 className="text-2xl font-black uppercase text-amber-300 tracking-tight">
              Заявка на рассмотрении
            </h2>
            <p className="text-xs font-bold text-amber-200/80 mt-1">
              Приветствуем, <span className="text-yellow-400 font-black">{currentUser.name}</span> (@{currentUser.nickname})!
            </p>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-left text-xs space-y-2 text-amber-200">
            <p className="font-semibold leading-relaxed">
              Ваша заявка принята в закрытый реестр <span className="text-yellow-400 font-bold">туристической команды &laquo;Негодяи&raquo;</span> и ожидает одобрения Капитаном команды.
            </p>
            <p className="text-[11px] text-amber-300/80 font-medium">
              Информация на сайте (история команды, слёты, взносы, задачи, инвентарь и фотогалерея) станет доступна сразу после одобрения профиля.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Проверить статус одобрения
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs py-2.5 rounded-xl border border-stone-700 transition-all"
            >
              Войти под другим аккаунтом
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-stone-800 bg-stone-900/60 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {effectiveLogo ? (
              <img 
                src={effectiveLogo} 
                alt="Логотип команды" 
                className="w-10 h-10 object-contain bg-white border-2 border-red-600 rounded-xl p-0.5 shadow-md shrink-0" 
              />
            ) : (
              <Logo size="sm" />
            )}
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 block">
                Закрытый портал
              </span>
              <h1 className="text-sm sm:text-base font-black uppercase text-yellow-400 tracking-tight leading-none">
                туристической команды &laquo;Негодяи&raquo;
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded-full border border-stone-700">
            <Lock size={12} className="text-amber-400" />
            <span>Только для команды</span>
          </div>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-md w-full bg-stone-900/95 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          
          {/* Logo & Headline */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-2.5 bg-stone-950 rounded-2xl border border-amber-500/30 shadow-inner mb-1">
              {effectiveLogo ? (
                <img 
                  src={effectiveLogo} 
                  alt="Логотип команды «Негодяи»" 
                  className="h-20 sm:h-24 w-32 sm:w-36 object-contain bg-white/95 rounded-xl p-1.5 border-2 border-amber-400 shadow-md" 
                />
              ) : (
                <Logo size="md" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-yellow-400 tracking-tight">
              туристической команды &laquo;Негодяи&raquo;
            </h2>
            <p className="text-xs font-semibold text-stone-300 leading-relaxed">
              Добро пожаловать в закрытый штаб слётов. Вход и доступ к информации открыт исключительно зарегистрированным участникам.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs font-black uppercase">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setLoginError(''); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn size={15} /> Вход в клуб
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setRegError(''); }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-red-600 text-yellow-300 shadow-md font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus size={15} /> Регистрация
            </button>
          </div>

          {/* FORM 1: LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="bg-red-950/60 border border-red-500 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] uppercase font-black text-amber-400">
                  Позывной, E-mail или Телефон:
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Например: admin, хорек, leha@negodyai.club"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-bold outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] uppercase font-black text-amber-400">
                    Пароль:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setRecoveryNickname(identifier);
                      setRecoveryError('');
                      setRecoverySuccess('');
                    }}
                    className="text-[11px] font-bold text-amber-300 hover:text-yellow-200 underline transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-bold outline-none transition-colors"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LogIn size={15} />
                  <span>{isLoading ? 'Проверка...' : 'Войти в штаб команды'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="w-full bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs py-2.5 rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint size={16} className="text-amber-400" />
                  Вход по биометрии (Touch ID / Face ID)
                </button>
              </div>

              {/* Quick Profile Selection for easy review */}
              <div className="pt-3 border-t border-stone-800/80 space-y-2">
                <span className="block text-[10px] font-black uppercase text-stone-400 text-center">
                  Быстрый вход для проверки аккаунтов:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {participants.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickSelect(p)}
                      className="text-left bg-stone-950 hover:bg-stone-800 border border-stone-800 p-2 rounded-xl transition-all"
                    >
                      <div className="text-[11px] font-black text-yellow-400 truncate">{p.name}</div>
                      <div className="text-[9px] text-stone-400 flex items-center gap-1">
                        <span>@{p.nickname}</span>
                        {p.role === 'admin' && <span className="text-red-400 font-bold">Орг</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* FORM 2: REGISTRATION (NO VERIFICATION CODES, STRICTLY CAPTAIN MODERATION) */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="bg-red-950/60 border border-red-500 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccessMessage && (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{regSuccessMessage}</span>
                </div>
              )}

              {/* Strict Notice: No codes, approved by Captain */}
              <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
                <Shield size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Проверочный код не требуется!</strong> Доступ на портал закрытый. Ваша заявка сразу поступит Капитану команды для активации профиля.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                    ФИО / Имя *:
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Иван Петров"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                    Позывной в команде *:
                  </label>
                  <input
                    type="text"
                    required
                    value={regNickname}
                    onChange={(e) => setRegNickname(e.target.value)}
                    placeholder="Бармалей"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Gender selector for team camping budget */}
              <div>
                <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                  Участие в походной смете:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegGender('male')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      regGender === 'male'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    🏕️ Парень (полный сбор)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegGender('female')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      regGender === 'female'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    💁‍♀️ Девчуля (льготный)
                  </button>
                </div>
              </div>

              {/* Contact fields without codes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                    Телефон (для связи):
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                    E-mail:
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@mail.ru"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                  Дата рождения (для поздравлений в походе):
                </label>
                <input
                  type="date"
                  value={regBirthday}
                  onChange={(e) => setRegBirthday(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                  Пароль для входа:
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Минимум 3 символа (по умолч.: 123)"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                />
              </div>

              {/* Biometrics option */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={regBiometric}
                  onChange={(e) => setRegBiometric(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                  <Fingerprint size={14} className="text-amber-400" />
                  Подключить вход по биометрии (Touch / Face ID)
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-500 text-yellow-300 font-black uppercase text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>{isLoading ? 'Отправка заявки...' : 'Подать заявку Капитану'}</span>
              </button>
            </form>
          )}

          {/* FORM 3: FORGOT PASSWORD / PASSWORD RECOVERY */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-sm font-black uppercase text-yellow-400 flex items-center gap-2">
                  <Key size={16} className="text-amber-400" />
                  Восстановление пароля
                </h3>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setRecoveryError(''); setRecoverySuccess(''); }}
                  className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1"
                >
                  <ArrowLeft size={13} />
                  <span>Назад к входу</span>
                </button>
              </div>

              {recoveryError && (
                <div className="bg-red-950/60 border border-red-500 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccess ? (
                <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs p-4 rounded-xl text-center space-y-2">
                  <CheckCircle size={28} className="text-emerald-400 mx-auto" />
                  <p className="font-bold">{recoverySuccess}</p>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setRecoverySuccess(''); }}
                    className="mt-2 px-4 py-1.5 bg-amber-500 text-stone-950 font-black text-xs uppercase rounded-xl"
                  >
                    Вернуться ко входу
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCaptainRecoverySubmit} className="space-y-3">
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Забыли пароль? Отправьте запрос Капитану команды. Он мгновенно установит вам новый пароль в Штабе (вкладка &laquo;Заявки&raquo;).
                  </p>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                      Ваш позывной или ФИО *:
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryNickname}
                      onChange={(e) => setRecoveryNickname(e.target.value)}
                      placeholder="Например: Бармалей или Иван Петров"
                      className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-amber-400 mb-1">
                      Телефон или контакт для связи (опционально):
                    </label>
                    <input
                      type="text"
                      value={recoveryNote}
                      onChange={(e) => setRecoveryNote(e.target.value)}
                      placeholder="+7 999 123-45-67 или сообщение"
                      className="w-full bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-stone-100 font-bold outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full bg-red-600 hover:bg-red-500 text-yellow-300 font-black uppercase text-xs py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send size={14} />
                    <span>{recoveryLoading ? 'Отправка...' : 'Отправить запрос Капитану'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 border-t border-stone-900 bg-stone-950/80 px-4 py-3 text-center text-[11px] text-stone-500 font-medium">
        <span>© Туристическая команда &laquo;Негодяи&raquo; • Защищенный клубный реестр</span>
      </footer>
    </div>
  );
}
