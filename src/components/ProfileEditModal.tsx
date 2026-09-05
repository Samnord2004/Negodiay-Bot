import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Calendar, Sparkles, Upload, 
  RefreshCw, CheckCircle, ShieldAlert, HeartHandshake, Smile
} from 'lucide-react';
import { Participant, ROLE_DEFINITIONS } from '../types';
import { PSYCHOTYPES } from '../mockData';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Participant | null;
  onProfileUpdated: (updatedUser: Participant) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}: ProfileEditModalProps) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [joinedYear, setJoinedYear] = useState<number>(2018);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [psychotype, setPsychotype] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setNickname(currentUser.nickname || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setBirthday(currentUser.birthday || '');
      setJoinedYear(currentUser.joinedYear || 2018);
      setGender(currentUser.gender || 'male');
      setPsychotype(currentUser.psychotype || PSYCHOTYPES[0]?.name || 'Весельчак-балагур');
      // Purge any legacy dicebear bot avatar
      const cleanAvatar = currentUser.avatar && currentUser.avatar.includes('dicebear.com/7.x/bottts') ? '' : (currentUser.avatar || '');
      setAvatar(cleanAvatar);
      setError('');
      setSuccessMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 2.5 МБ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatar(reader.result as string);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Пожалуйста, укажите имя');
      return;
    }
    if (!nickname.trim()) {
      setError('Пожалуйста, укажите позывной');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: name.trim(),
          nickname: nickname.trim().replace(/^@/, ''),
          email: email.trim(),
          phone: phone.trim(),
          birthday: birthday.trim(),
          joinedYear: Number(joinedYear) || 2018,
          gender,
          psychotype,
          avatar
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка обновления профиля');
      }

      onProfileUpdated(data.user);
      setSuccessMsg('Личные данные успешно сохранены!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Сбой при сохранении личных данных');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = currentUser.role ? ROLE_DEFINITIONS[currentUser.role] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-amber-50 border-4 border-amber-600 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-4 flex items-center justify-between text-yellow-300 border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-950/50 border border-yellow-300 flex items-center justify-center text-lg shadow-inner">
              ✏️
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight text-white leading-tight">
                Редактирование профиля
              </h3>
              <p className="text-[11px] text-yellow-200 font-bold">
                Личные данные соратника команды «Негодяи»
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white hover:text-yellow-300 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
          
          {/* Status Banners */}
          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-500 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-800">
              <ShieldAlert size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Role Notice */}
          {roleMeta && (
            <div className="p-3 bg-white border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{roleMeta.icon}</span>
                <div>
                  <div className="text-[11px] text-stone-500 font-bold uppercase">Назначенная роль в команде</div>
                  <div className="text-xs font-black text-amber-950">{roleMeta.title}</div>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${roleMeta.color}`}>
                {roleMeta.badge}
              </span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 space-y-3 shadow-xs">
            <label className="block text-xs font-black uppercase text-amber-950">
              Аватарка / Фото профиля
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative shrink-0">
                {avatar && (avatar.startsWith('http') || avatar.startsWith('data:image/')) && !avatar.includes('dicebear.com/7.x/bottts') ? (
                  <img
                    src={avatar}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-2xl border-2 border-amber-500 object-cover bg-amber-100 shadow"
                    onError={() => setAvatar('')}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-amber-500 bg-amber-200 flex flex-col items-center justify-center text-amber-950 font-black shadow text-2xl">
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : <User size={32} className="text-amber-800" />}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-xl text-xs font-black text-amber-950 uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                    <Upload size={14} />
                    <span>Загрузить фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {avatar ? (
                    <button
                      type="button"
                      onClick={() => setAvatar('')}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 border border-stone-400 rounded-xl text-xs font-black text-stone-700 uppercase flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      title="Удалить аватар"
                    >
                      <X size={14} />
                      <span>Удалить</span>
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Или вставьте прямую ссылку на фото..."
                  className="w-full text-[11px] px-2.5 py-1.5 bg-amber-50/70 border border-amber-300 rounded-lg outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Name and Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Имя / Фамилия *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Алексей Самойлов"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
                />
                <User size={15} className="absolute left-2.5 top-2.5 text-amber-700" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Позывной в команде *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-black text-xs text-red-600">@</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Grizli"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@gmail.com"
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
                />
                <Mail size={15} className="absolute left-2.5 top-2.5 text-amber-700" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Телефон
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
                />
                <Phone size={15} className="absolute left-2.5 top-2.5 text-amber-700" />
              </div>
            </div>
          </div>

          {/* Birthday and Joined Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                🎂 День рождения (Днюха)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="15 июля (или 1985-07-15)"
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
                />
                <Calendar size={15} className="absolute left-2.5 top-2.5 text-amber-700" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Год вступления в команду
              </label>
              <input
                type="number"
                min="2010"
                max={new Date().getFullYear()}
                value={joinedYear}
                onChange={(e) => setJoinedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none"
              />
            </div>
          </div>

          {/* Gender and Psychotype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Пол
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${
                    gender === 'male'
                      ? 'bg-blue-600 text-white border-blue-900 shadow-sm'
                      : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  🧑 Парень
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${
                    gender === 'female'
                      ? 'bg-pink-600 text-white border-pink-900 shadow-sm'
                      : 'bg-white text-stone-700 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  👩 Девушка
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                Походный психотип
              </label>
              <select
                value={psychotype}
                onChange={(e) => setPsychotype(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border-2 border-amber-300 focus:border-red-600 rounded-xl text-xs font-bold text-amber-950 outline-none cursor-pointer"
              >
                {PSYCHOTYPES.map((pt) => (
                  <option key={pt.name} value={pt.name}>
                    {pt.emoji} {pt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-amber-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black text-xs uppercase rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 border-2 border-amber-950 font-black text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Сохраняем...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Сохранить изменения</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
