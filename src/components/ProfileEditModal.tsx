import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Calendar, Sparkles, Upload, 
  RefreshCw, CheckCircle, ShieldAlert, HeartHandshake, Smile, Camera,
  Check, Trash2, Eye, Award, CheckCircle2
} from 'lucide-react';
import { Participant, ROLE_DEFINITIONS, AvatarSource } from '../types';
import { PSYCHOTYPES } from '../mockData';
import { compressImage } from '../utils/imageCompressor';
import { formatBirthdayShort } from '../utils/dateUtils';
import { getSafeAvatar } from '../utils/avatar';

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
  const [joinedYear, setJoinedYear] = useState<number>(1993);
  const [skippedYears, setSkippedYears] = useState<number[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [psychotype, setPsychotype] = useState('');
  
  // Two photos in personal data
  const [photoFront, setPhotoFront] = useState('');
  const [photoProfile, setPhotoProfile] = useState('');
  // Which photo is chosen as active avatar: 'front' | 'profile'
  const [selectedAvatarSource, setSelectedAvatarSource] = useState<AvatarSource>('front');
  
  const [loading, setLoading] = useState(false);
  const [compressingSlot, setCompressingSlot] = useState<'front' | 'profile' | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Only initialize form fields when modal is opened to avoid background polling overwriting edits
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setNickname(currentUser.nickname || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setBirthday(currentUser.birthday ? formatBirthdayShort(currentUser.birthday) : '');
      setJoinedYear(currentUser.joinedYear || 1993);
      setSkippedYears(Array.isArray(currentUser.skippedYears) ? currentUser.skippedYears : []);
      setGender(currentUser.gender || 'male');
      setPsychotype(currentUser.psychotype || PSYCHOTYPES[0]?.name || 'Весельчак-балагур');

      const front = currentUser.photoFront || '';
      const profile = currentUser.photoProfile || '';
      const cleanAvatar = currentUser.avatar && currentUser.avatar.includes('dicebear.com/7.x/bottts') ? '' : (currentUser.avatar || '');

      // If no photoFront or photoProfile yet, pre-populate photoFront with existing clean avatar
      setPhotoFront(front || (!profile ? cleanAvatar : ''));
      setPhotoProfile(profile);

      if (currentUser.selectedAvatarSource) {
        setSelectedAvatarSource(currentUser.selectedAvatarSource);
      } else if (profile && !front) {
        setSelectedAvatarSource('profile');
      } else {
        setSelectedAvatarSource('front');
      }

      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentYear = new Date().getFullYear();
  const allYearsSince1993: number[] = [];
  for (let y = 1993; y <= currentYear; y++) {
    allYearsSince1993.push(y);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 'front' | 'profile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setCompressingSlot(slot);
    setError('');
    try {
      // Compress to 512px crisp high-quality JPEG
      const compressed = await compressImage(file, 512, 0.88);
      if (slot === 'front') {
        setPhotoFront(compressed);
        if (!photoProfile) {
          setSelectedAvatarSource('front');
        }
      } else {
        setPhotoProfile(compressed);
        if (!photoFront) {
          setSelectedAvatarSource('profile');
        }
      }
    } catch (err: any) {
      console.error('Avatar compression error:', err);
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const dataUrl = reader.result as string;
            if (slot === 'front') {
              setPhotoFront(dataUrl);
              if (!photoProfile) setSelectedAvatarSource('front');
            } else {
              setPhotoProfile(dataUrl);
              if (!photoFront) setSelectedAvatarSource('profile');
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (e2) {
        setError('Не удалось обработать изображение');
      }
    } finally {
      setCompressingSlot(null);
    }
  };

  // Active avatar image is strictly chosen by team member: either front or profile
  const activeAvatarImage = selectedAvatarSource === 'profile'
    ? (photoProfile.trim() || photoFront.trim())
    : (photoFront.trim() || photoProfile.trim());

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

    const normalizedBirthday = birthday.trim() ? formatBirthdayShort(birthday.trim()) : '';

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
          birthday: normalizedBirthday,
          joinedYear: Number(joinedYear) || 1993,
          skippedYears: skippedYears.filter(y => !isNaN(y)),
          gender,
          psychotype,
          photoFront: photoFront.trim(),
          photoProfile: photoProfile.trim(),
          selectedAvatarSource,
          avatar: activeAvatarImage.trim()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
              ✏️
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight text-stone-900 leading-tight">
                Редактирование личных данных
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Фотографии (анфас и профиль), выбор аватара и анкета соратника «Негодяев»
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto scrollbar-thin">
          
          {/* Status Banners */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-red-700">
              <ShieldAlert size={16} className="text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Role Notice */}
          {roleMeta && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{roleMeta.icon}</span>
                <div>
                  <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Роль в команде</div>
                  <div className="text-xs font-bold text-stone-900">{roleMeta.title}</div>
                </div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleMeta.color}`}>
                {roleMeta.badge}
              </span>
            </div>
          )}

          {/* TWO PHOTOS SECTION: АНФАС И ПРОФИЛЬ + ВЫБОР АВАТАРА */}
          <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider flex items-center gap-2">
                  <span>📸 Личные фотографии: Анфас и Профиль</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Загрузите обе фотографии. В качестве аватарки команды используется одно фото на ваш выбор.
                </p>
              </div>
            </div>

            {/* Grid of 2 Photo Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* SLOT 1: ФОТОГРАФИЯ «АНФАС» */}
              <div className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                selectedAvatarSource === 'front'
                  ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                      Фото «Анфас» (прямо)
                    </span>
                    {selectedAvatarSource === 'front' ? (
                      <span className="bg-amber-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                        <Check size={11} strokeWidth={3} />
                        Аватарка
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarSource('front')}
                        className="text-[10px] font-bold text-stone-600 hover:text-amber-900 bg-stone-100 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-stone-200 transition-colors"
                      >
                        Сделать аватаркой
                      </button>
                    )}
                  </div>

                  {/* Photo Preview Container */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center mb-2.5 shadow-2xs group">
                    {photoFront ? (
                      <img
                        src={photoFront}
                        alt="Анфас"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-stone-400">
                        <Camera size={26} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[11px] font-medium block">Фото анфас не загружено</span>
                        <span className="text-[10px] text-stone-400 block">(Прямой ракурс лица)</span>
                      </div>
                    )}
                    {compressingSlot === 'front' && (
                      <div className="absolute inset-0 bg-white/85 flex items-center justify-center text-xs font-bold text-stone-700">
                        Сжатие фото...
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions for Front Photo */}
                <div className="space-y-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer flex-1 py-1.5 px-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                      <Camera size={13} />
                      <span>{photoFront ? 'Заменить' : 'Загрузить анфас'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'front')}
                        className="hidden"
                      />
                    </label>
                    {photoFront && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFront('');
                          if (selectedAvatarSource === 'front' && photoProfile) {
                            setSelectedAvatarSource('profile');
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors"
                        title="Удалить фото анфас"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={photoFront}
                    onChange={(e) => setPhotoFront(e.target.value)}
                    placeholder="URL фото анфас..."
                    className="w-full text-[11px] px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg outline-none font-mono text-stone-800 focus:border-red-500"
                  />
                  {/* Select as Avatar button */}
                  <button
                    type="button"
                    onClick={() => setSelectedAvatarSource('front')}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedAvatarSource === 'front'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <CheckCircle2 size={13} className={selectedAvatarSource === 'front' ? 'text-yellow-300' : 'text-stone-400'} />
                    <span>{selectedAvatarSource === 'front' ? 'Выбрано для аватарки' : 'Использовать в аватарке'}</span>
                  </button>
                </div>
              </div>

              {/* SLOT 2: ФОТОГРАФИЯ «ПРОФИЛЬ» */}
              <div className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                selectedAvatarSource === 'profile'
                  ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                      Фото «Профиль» (сбоку)
                    </span>
                    {selectedAvatarSource === 'profile' ? (
                      <span className="bg-amber-500 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                        <Check size={11} strokeWidth={3} />
                        Аватарка
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarSource('profile')}
                        className="text-[10px] font-bold text-stone-600 hover:text-amber-900 bg-stone-100 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-stone-200 transition-colors"
                      >
                        Сделать аватаркой
                      </button>
                    )}
                  </div>

                  {/* Photo Preview Container */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center mb-2.5 shadow-2xs group">
                    {photoProfile ? (
                      <img
                        src={photoProfile}
                        alt="Профиль"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-stone-400">
                        <Camera size={26} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[11px] font-medium block">Фото профиль не загружено</span>
                        <span className="text-[10px] text-stone-400 block">(Вид сбоку 90° или полуоборот)</span>
                      </div>
                    )}
                    {compressingSlot === 'profile' && (
                      <div className="absolute inset-0 bg-white/85 flex items-center justify-center text-xs font-bold text-stone-700">
                        Сжатие фото...
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions for Profile Photo */}
                <div className="space-y-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer flex-1 py-1.5 px-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                      <Camera size={13} />
                      <span>{photoProfile ? 'Заменить' : 'Загрузить профиль'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'profile')}
                        className="hidden"
                      />
                    </label>
                    {photoProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoProfile('');
                          if (selectedAvatarSource === 'profile' && photoFront) {
                            setSelectedAvatarSource('front');
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-stone-200 transition-colors"
                        title="Удалить фото профиль"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={photoProfile}
                    onChange={(e) => setPhotoProfile(e.target.value)}
                    placeholder="URL фото профиль..."
                    className="w-full text-[11px] px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg outline-none font-mono text-stone-800 focus:border-red-500"
                  />
                  {/* Select as Avatar button */}
                  <button
                    type="button"
                    onClick={() => setSelectedAvatarSource('profile')}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      selectedAvatarSource === 'profile'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                    }`}
                  >
                    <CheckCircle2 size={13} className={selectedAvatarSource === 'profile' ? 'text-yellow-300' : 'text-stone-400'} />
                    <span>{selectedAvatarSource === 'profile' ? 'Выбрано для аватарки' : 'Использовать в аватарке'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Summary & Active Avatar Live Preview */}
            <div className="p-3 bg-white rounded-xl border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <img
                  src={getSafeAvatar(activeAvatarImage, gender)}
                  alt="Итоговая аватарка"
                  className="w-13 h-13 rounded-full border-2 border-amber-400 object-cover bg-amber-50 shadow-xs shrink-0"
                />
                <div>
                  <div className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                    Активная аватарка в команде
                  </div>
                  <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5 mt-0.5">
                    <span>Источник:</span>
                    <span className="text-red-700 uppercase font-black">
                      {selectedAvatarSource === 'profile' ? 'Фото «Профиль» (вид сбоку)' : 'Фото «Анфас» (прямой ракурс)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Отображается в чате, таблице слёта и поиске
                  </div>
                </div>
              </div>

              {/* Toggle Switcher */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-stretch sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAvatarSource('front')}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedAvatarSource === 'front'
                      ? 'bg-white text-stone-950 shadow-xs border border-stone-300'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Анфас
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAvatarSource('profile')}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedAvatarSource === 'profile'
                      ? 'bg-white text-stone-950 shadow-xs border border-stone-300'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Профиль
                </button>
              </div>
            </div>

          </div>

          {/* Name and Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Имя / Фамилия *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Алексей Самойлов"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
                />
                <User size={15} className="absolute left-2.5 top-2.5 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Позывной в команде *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-bold text-xs text-red-600">@</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Grizli"
                  required
                  className="w-full pl-7 pr-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@gmail.com"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
                />
                <Mail size={15} className="absolute left-2.5 top-2.5 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Телефон
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
                />
                <Phone size={15} className="absolute left-2.5 top-2.5 text-stone-400" />
              </div>
            </div>
          </div>

          {/* Birthday and Joined Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                🎂 День рождения (ДД.ММ.ГГ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  onBlur={() => {
                    if (birthday.trim()) {
                      setBirthday(formatBirthdayShort(birthday.trim()));
                    }
                  }}
                  placeholder="15.06.88"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
                />
                <Calendar size={15} className="absolute left-2.5 top-2.5 text-amber-600" />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">Формат: ДД.ММ.ГГ (например 15.06.88)</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Год вступления в команду
              </label>
              <input
                type="number"
                min="1993"
                max={new Date().getFullYear()}
                value={joinedYear}
                onChange={(e) => setJoinedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
              />
              <p className="text-[10px] text-stone-500 mt-1">Основание команды — 1993 г.</p>
            </div>
          </div>

          {/* Skipped Rally Years (Пропущенные года слёта с 1993 г.) */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-stone-800">
                Пропущенные слёты команды (с 1993 г.)
              </label>
              <span className="text-[11px] font-bold text-red-600">
                {skippedYears.length > 0 ? `Пропущено: ${skippedYears.length} г.` : 'Без пропусков (все слёты)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mb-2.5">
              Нажмите на год слёта, чтобы отметить пропуск. Влияет на расчёт непрерывного походного стажа.
            </p>
            <div className="max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200 flex flex-wrap gap-1.5 scrollbar-thin">
              {allYearsSince1993.map(year => {
                const isSkipped = skippedYears.includes(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      if (isSkipped) {
                        setSkippedYears(prev => prev.filter(y => y !== year));
                      } else {
                        setSkippedYears(prev => [...prev, year].sort((a, b) => a - b));
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                      isSkipped
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {year} {isSkipped ? '✕' : '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender and Psychotype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Пол
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    gender === 'male'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  🧑 Парень
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    gender === 'female'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  👩 Девушка
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Походный психотип
              </label>
              <select
                value={psychotype}
                onChange={(e) => setPsychotype(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 outline-none transition-colors"
              >
                {PSYCHOTYPES.map((pt) => (
                  <option key={pt.name} value={pt.name}>
                    {pt.emoji} {pt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || compressingSlot !== null}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-xs transition-colors"
            >
              {loading ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
