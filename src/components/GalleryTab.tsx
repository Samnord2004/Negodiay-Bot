import React, { useState, useRef, useMemo } from 'react';
import { 
  Camera, Upload, Trash2, Heart, Calendar, 
  Eye, X, Image as ImageIcon, Filter, Sparkles,
  Cloud, ExternalLink, Copy, Check, FolderArchive, 
  HardDrive, Link as LinkIcon, Search, Info
} from 'lucide-react';
import { GalleryPhoto, Participant } from '../types';

interface GalleryTabProps {
  photos: GalleryPhoto[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onPhotoAdded: (photo: GalleryPhoto) => void;
  onPhotoDeleted: (id: string) => void;
  onPhotoLiked: (id: string) => void;
}

// Foundation year of the team
const FOUNDING_YEAR = 1993;

// Helper to detect cloud service
function detectCloudInfo(url?: string): { 
  name: string; 
  type: 'yandex' | 'google' | 'mailru' | 'dropbox' | 'other';
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  btnBg: string;
  btnHover: string;
} {
  if (!url) {
    return {
      name: 'Облачный архив',
      type: 'other',
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-700',
      borderColor: 'border-stone-200',
      btnBg: 'bg-stone-800',
      btnHover: 'hover:bg-stone-900'
    };
  }
  const lower = url.toLowerCase();
  if (lower.includes('disk.yandex') || lower.includes('yadi.sk') || lower.includes('ya.ru')) {
    return {
      name: 'Яндекс Диск',
      type: 'yandex',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      borderColor: 'border-red-300',
      btnBg: 'bg-red-600',
      btnHover: 'hover:bg-red-700'
    };
  }
  if (lower.includes('drive.google') || lower.includes('docs.google')) {
    return {
      name: 'Google Диск',
      type: 'google',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      borderColor: 'border-blue-300',
      btnBg: 'bg-blue-600',
      btnHover: 'hover:bg-blue-700'
    };
  }
  if (lower.includes('cloud.mail.ru') || lower.includes('mail.ru')) {
    return {
      name: 'Облако Mail.ru',
      type: 'mailru',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-700',
      borderColor: 'border-sky-300',
      btnBg: 'bg-sky-600',
      btnHover: 'hover:bg-sky-700'
    };
  }
  if (lower.includes('dropbox')) {
    return {
      name: 'Dropbox',
      type: 'dropbox',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-700',
      borderColor: 'border-indigo-300',
      btnBg: 'bg-indigo-600',
      btnHover: 'hover:bg-indigo-700'
    };
  }
  return {
    name: 'Облачное хранилище',
    type: 'other',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    btnBg: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700'
  };
}

export default function GalleryTab({
  photos,
  currentUser,
  isAdmin,
  onPhotoAdded,
  onPhotoDeleted,
  onPhotoLiked
}: GalleryTabProps) {
  const currentYear = new Date().getFullYear();

  // Generate complete list of all years from founding year (1993) to current year (2026)
  const allHistoricalYears = useMemo(() => {
    const list: number[] = [];
    for (let yr = currentYear; yr >= FOUNDING_YEAR; yr--) {
      list.push(yr);
    }
    return list;
  }, [currentYear]);

  // Filtering states
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'cloud' | 'photo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<'all' | '2020s' | '2010s' | '2000s' | '1990s'>('all');

  // Copy link feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal and Lightbox states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'cloud' | 'photo'>('cloud');
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Upload modal state
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState<number>(currentYear);
  const [newDescription, setNewDescription] = useState('');
  const [newCloudUrl, setNewCloudUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Years with available items
  const yearsWithPhotos = useMemo(() => {
    const set = new Set(photos.map(p => p.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [photos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      // Year filter
      if (selectedYear !== 'all' && p.year !== selectedYear) return false;

      // Decade filter
      if (selectedDecade !== 'all') {
        if (selectedDecade === '2020s' && (p.year < 2020 || p.year > 2029)) return false;
        if (selectedDecade === '2010s' && (p.year < 2010 || p.year > 2019)) return false;
        if (selectedDecade === '2000s' && (p.year < 2000 || p.year > 2009)) return false;
        if (selectedDecade === '1990s' && (p.year < 1990 || p.year > 1999)) return false;
      }

      // Type filter
      const isCloud = p.itemType === 'cloud_album' || Boolean(p.cloudUrl && !p.imageUrl);
      if (selectedTypeFilter === 'cloud' && !p.cloudUrl) return false;
      if (selectedTypeFilter === 'photo' && !p.imageUrl) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const matchAuthor = p.uploadedBy ? p.uploadedBy.toLowerCase().includes(q) : false;
        const matchYear = String(p.year).includes(q);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchYear) return false;
      }

      return true;
    });
  }, [photos, selectedYear, selectedDecade, selectedTypeFilter, searchQuery]);

  // Counts
  const cloudAlbumsCount = photos.filter(p => Boolean(p.cloudUrl)).length;
  const directPhotosCount = photos.filter(p => Boolean(p.imageUrl)).length;

  const handleCopyLink = (id: string, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openUploadModal = (mode: 'cloud' | 'photo' = 'cloud') => {
    setUploadMode(mode);
    setUploadError('');
    setNewTitle('');
    setNewCloudUrl('');
    setNewDescription('');
    setPreviewImage(null);
    setNewYear(selectedYear === 'all' ? currentYear : selectedYear);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!newTitle.trim()) {
      setUploadError('Введите название альбома или фотографии');
      return;
    }

    if (uploadMode === 'cloud' && !newCloudUrl.trim()) {
      setUploadError('Укажите ссылку на облачное хранилище (например, Яндекс Диск: https://disk.yandex.ru/...)');
      return;
    }

    if (uploadMode === 'photo' && !previewImage && !newCloudUrl.trim()) {
      setUploadError('Выберите фотографию для загрузки или укажите ссылку на облачный диск');
      return;
    }

    // Format URL with https:// if user omitted protocol
    let formattedCloudUrl = newCloudUrl.trim();
    if (formattedCloudUrl && !formattedCloudUrl.startsWith('http://') && !formattedCloudUrl.startsWith('https://')) {
      formattedCloudUrl = 'https://' + formattedCloudUrl;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: newYear,
          title: newTitle.trim(),
          description: newDescription.trim(),
          imageUrl: previewImage || '',
          cloudUrl: formattedCloudUrl,
          itemType: uploadMode === 'cloud' ? 'cloud_album' : (formattedCloudUrl && !previewImage ? 'cloud_album' : 'photo'),
          uploadedBy: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Негодяй'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onPhotoAdded(data.photo);
        setShowUploadModal(false);
        setNewTitle('');
        setNewCloudUrl('');
        setNewDescription('');
        setPreviewImage(null);
      } else {
        setUploadError(data.error || 'Ошибка при сохранении в архив');
      }
    } catch (err) {
      setUploadError('Сбой загрузки на сервер. Проверьте соединение.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner with Full History & Action Buttons */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-red-600 text-yellow-300 text-[11px] font-black uppercase px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                <Calendar size={13} />
                Архив за весь период: 1993 – {currentYear} ({allHistoricalYears.length} года истории)
              </span>
              <span className="bg-white/90 text-stone-800 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <HardDrive size={12} className="text-red-600" />
                Яндекс.Диск + Фото
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-red-700 tracking-tight leading-tight">
              Фотогалерея и Облачные архивы Негодяев
            </h2>
            
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1.5 leading-relaxed">
              Храните фотографии прямо на сайте или прикрепляйте ссылки на папки Яндекс Диска и Google Диске. 
              Вся история походов, стоянок и побед с первого слёта 1993 года без ограничений по объему!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => openUploadModal('cloud')}
              className="flex-1 sm:flex-none px-4 py-3 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border-2 border-red-700"
              title="Добавить ссылку на архив в Яндекс Диске или облаке"
            >
              <HardDrive size={18} className="text-yellow-300" />
              <span>Добавить Яндекс.Диск</span>
            </button>

            <button
              type="button"
              onClick={() => openUploadModal('photo')}
              className="flex-1 sm:flex-none px-4 py-3 bg-amber-900 hover:bg-black text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              title="Загрузить фотографию напрямую"
            >
              <Camera size={18} className="text-yellow-300" />
              <span>Загрузить фото</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-5 pt-4 border-t-2 border-red-600/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Format / Type filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-black uppercase">
            <span className="text-amber-950 flex items-center gap-1 text-[11px] mr-1">
              <Filter size={13} /> Формат:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedTypeFilter === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow-xs'
                  : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
              }`}
            >
              Все ({photos.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('cloud')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                selectedTypeFilter === 'cloud'
                  ? 'bg-red-600 text-yellow-300 shadow-xs'
                  : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
              }`}
            >
              <HardDrive size={13} />
              Яндекс.Диск ({cloudAlbumsCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTypeFilter('photo')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                selectedTypeFilter === 'photo'
                  ? 'bg-red-600 text-yellow-300 shadow-xs'
                  : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
              }`}
            >
              <Camera size={13} />
              Фото ({directPhotosCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-900/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск архива или кадра..."
              className="w-full pl-9 pr-8 py-1.5 bg-white/95 focus:bg-white text-stone-900 border-2 border-red-500/40 focus:border-red-600 rounded-xl text-xs font-semibold placeholder:text-stone-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Year Navigator: 1993 - 2026 */}
        <div className="mt-3.5 pt-3 border-t border-red-600/20">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1">
                <Calendar size={14} /> Архив по годам:
              </span>

              {/* Decade Selector */}
              <div className="flex items-center gap-1 bg-yellow-300/80 p-0.5 rounded-lg text-[10px] font-black uppercase">
                <button
                  type="button"
                  onClick={() => setSelectedDecade('all')}
                  className={`px-2 py-0.5 rounded ${selectedDecade === 'all' ? 'bg-red-600 text-white' : 'text-amber-950 hover:bg-yellow-200'}`}
                >
                  Все
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDecade('2020s')}
                  className={`px-2 py-0.5 rounded ${selectedDecade === '2020s' ? 'bg-red-600 text-white' : 'text-amber-950 hover:bg-yellow-200'}`}
                >
                  2020-е
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDecade('2010s')}
                  className={`px-2 py-0.5 rounded ${selectedDecade === '2010s' ? 'bg-red-600 text-white' : 'text-amber-950 hover:bg-yellow-200'}`}
                >
                  2010-е
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDecade('2000s')}
                  className={`px-2 py-0.5 rounded ${selectedDecade === '2000s' ? 'bg-red-600 text-white' : 'text-amber-950 hover:bg-yellow-200'}`}
                >
                  2000-е
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDecade('1990s')}
                  className={`px-2 py-0.5 rounded ${selectedDecade === '1990s' ? 'bg-red-600 text-white' : 'text-amber-950 hover:bg-yellow-200'}`}
                >
                  1990-е (1993+)
                </button>
              </div>
            </div>

            {/* Direct Year Selector dropdown for fast jumps */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-950">Выбрать конкретный год:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-white text-stone-900 border-2 border-red-500/50 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                <option value="all">Все годы существования (1993–{currentYear})</option>
                {allHistoricalYears.map(yr => {
                  const count = photos.filter(p => p.year === yr).length;
                  return (
                    <option key={yr} value={yr}>
                      {yr} год {count > 0 ? `(${count} материалов)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Year Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase whitespace-nowrap transition-all shrink-0 ${
                selectedYear === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow-xs scale-105'
                  : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
              }`}
            >
              Все ({photos.length})
            </button>

            {allHistoricalYears
              .filter(yr => {
                if (selectedDecade === '2020s') return yr >= 2020 && yr <= 2029;
                if (selectedDecade === '2010s') return yr >= 2010 && yr <= 2019;
                if (selectedDecade === '2000s') return yr >= 2000 && yr <= 2009;
                if (selectedDecade === '1990s') return yr >= 1990 && yr <= 1999;
                // In 'all' mode, show years that have photos OR top recent 6 years
                return yearsWithPhotos.includes(yr) || yr >= currentYear - 4;
              })
              .map(yr => {
                const countInYear = photos.filter(p => p.year === yr).length;
                const isSelected = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-red-600 text-yellow-300 shadow-xs scale-105'
                        : countInYear > 0
                          ? 'bg-yellow-200/90 text-amber-950 hover:bg-yellow-300'
                          : 'bg-yellow-100/60 text-amber-900/70 hover:bg-yellow-200/70'
                    }`}
                  >
                    <span>{yr} г.</span>
                    {countInYear > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-yellow-300 text-red-700' : 'bg-red-600 text-white'
                      }`}>
                        {countInYear}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* GALLERY GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-stone-300 rounded-3xl p-6 shadow-xs">
          <FolderArchive className="w-16 h-16 text-amber-500/70 mx-auto mb-3" />
          <h3 className="font-black text-lg text-stone-900 uppercase">
            {selectedYear !== 'all' 
              ? `В архиве ${selectedYear} года пока нет материалов` 
              : 'По вашему запросу ничего не найдено'}
          </h3>
          <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
            Вы можете добавить ссылку на папку Яндекс Диска за этот год или загрузить фотографии напрямую на сайт!
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openUploadModal('cloud')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-xs flex items-center gap-2"
            >
              <HardDrive size={15} />
              Добавить ссылку на Яндекс.Диск ({selectedYear !== 'all' ? selectedYear : currentYear})
            </button>
            <button
              type="button"
              onClick={() => openUploadModal('photo')}
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-xs flex items-center gap-2"
            >
              <Camera size={15} />
              Загрузить фото
            </button>
            {selectedYear !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase text-xs rounded-xl"
              >
                Показать все годы
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map(item => {
            const isLiked = currentUser && item.likedUserIds?.includes(currentUser.id);
            const hasCloudUrl = Boolean(item.cloudUrl && item.cloudUrl.trim());
            const hasImage = Boolean(item.imageUrl && item.imageUrl.trim());
            const cloudInfo = detectCloudInfo(item.cloudUrl);
            const isCopied = copiedId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-white border-2 border-stone-200 hover:border-red-500 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group relative"
              >
                {/* Header or Image Preview */}
                {hasImage ? (
                  <div 
                    className="relative aspect-video bg-stone-900 cursor-pointer overflow-hidden"
                    onClick={() => setActiveLightboxPhoto(item)}
                  >
                    <img 
                      src={item.imageUrl!.trim()} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Year badge */}
                    <div className="absolute top-2.5 left-2.5 bg-red-600 text-yellow-300 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      {item.year} год
                    </div>

                    {/* Cloud storage badge if attached */}
                    {hasCloudUrl && (
                      <div className="absolute top-2.5 right-2.5 bg-yellow-400 text-stone-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <HardDrive size={11} className="text-red-700" />
                        <span>{cloudInfo.name}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-yellow-400 text-stone-900 text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                        <Eye size={15} /> Просмотр
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Dedicated Cloud Album Card Banner (if no cover photo uploaded) */
                  <div 
                    className="relative aspect-video bg-gradient-to-br from-amber-500/10 via-amber-100/50 to-red-100/30 border-b border-stone-200 p-5 flex flex-col justify-between overflow-hidden cursor-pointer"
                    onClick={() => {
                      if (hasCloudUrl) {
                        window.open(item.cloudUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {/* Background graphic motif */}
                    <div className="absolute -right-6 -bottom-6 text-amber-500/10 pointer-events-none">
                      <HardDrive size={160} />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                      <span className="bg-red-600 text-yellow-300 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                        {item.year} год
                      </span>
                      <span className={`${cloudInfo.badgeBg} ${cloudInfo.badgeText} border ${cloudInfo.borderColor} text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1`}>
                        <HardDrive size={11} />
                        <span>{cloudInfo.name}</span>
                      </span>
                    </div>

                    <div className="relative z-10 my-auto py-2">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-transform">
                        <FolderArchive size={24} />
                      </div>
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Облачный фотоархив слёта
                      </p>
                      <h4 className="text-base font-black text-stone-900 uppercase leading-snug line-clamp-2 mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-red-700">
                      <span className="flex items-center gap-1 group-hover:underline">
                        <span>Открыть в хранилище</span>
                        <ExternalLink size={12} />
                      </span>
                      <span className="text-[10px] text-stone-500 font-normal">Оригинальное качество</span>
                    </div>
                  </div>
                )}

                {/* Card Body and Meta */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {hasImage && (
                      <h4 className="font-black text-base text-stone-900 leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                    )}
                    
                    {item.description && (
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Dedicated Cloud Link Row if attached */}
                    {hasCloudUrl && (
                      <div className="mt-3 p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${cloudInfo.badgeBg} ${cloudInfo.badgeText}`}>
                            <HardDrive size={14} />
                          </span>
                          <div className="overflow-hidden">
                            <span className="block text-[10px] font-black uppercase text-stone-500">
                              {cloudInfo.name}
                            </span>
                            <a
                              href={item.cloudUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-red-600 hover:text-red-700 truncate block hover:underline"
                              title={item.cloudUrl}
                            >
                              Перейти к полному архиву ↗
                            </a>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.id, item.cloudUrl!)}
                          className={`p-1.5 rounded-xl border text-xs transition-colors shrink-0 ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                          title="Скопировать ссылку на облако"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Author and Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="text-[11px] text-stone-500 leading-tight">
                      <span className="font-bold text-stone-800 block truncate max-w-[150px]">{item.uploadedBy}</span>
                      <span className="text-[10px] text-stone-400">{item.uploadedAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Open cloud link directly button */}
                      {hasCloudUrl && (
                        <a
                          href={item.cloudUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 rounded-xl transition-colors"
                          title={`Открыть в ${cloudInfo.name}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}

                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => onPhotoLiked(item.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isLiked 
                            ? 'bg-red-50 text-red-600 border border-red-200' 
                            : 'bg-stone-100 text-stone-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Поставить лайк"
                      >
                        <Heart size={14} className={isLiked ? 'fill-red-600 text-red-600' : ''} />
                        <span>{item.likes || 0}</span>
                      </button>

                      {/* Delete button (Admin or author) */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onPhotoDeleted(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                          title="Удалить из архива (Администратор)"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD / ADD ARCHIVE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-amber-50 border-4 border-red-600 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  {uploadMode === 'cloud' ? (
                    <HardDrive className="text-red-700 w-6 h-6" />
                  ) : (
                    <Camera className="text-red-700 w-6 h-6" />
                  )}
                  <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                    {uploadMode === 'cloud' ? 'Добавить облачный архив (Яндекс.Диск)' : 'Загрузить фото в архив'}
                  </h3>
                </div>
                <p className="text-xs font-bold text-red-950 mt-0.5">
                  Организация фотоархива Негодяев с 1993 по {currentYear} год
                </p>
              </div>

              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="bg-amber-100/80 border-b border-amber-300 px-6 py-2 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('cloud')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                  uploadMode === 'cloud'
                    ? 'bg-red-600 text-yellow-300 shadow-xs'
                    : 'bg-white/80 text-amber-900 hover:bg-white'
                }`}
              >
                <HardDrive size={15} />
                <span>Ссылка на Яндекс.Диск / Облако</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('photo')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${
                  uploadMode === 'photo'
                    ? 'bg-red-600 text-yellow-300 shadow-xs'
                    : 'bg-white/80 text-amber-900 hover:bg-white'
                }`}
              >
                <Camera size={15} />
                <span>Файл фотографии</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {uploadError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-2xl text-xs text-red-800 font-bold">
                  {uploadError}
                </div>
              )}

              {/* CLOUD ARCHIVE MODE */}
              {uploadMode === 'cloud' && (
                <div className="space-y-4">
                  <div className="bg-amber-100/60 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                    <Info size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase block">Как работает облачный архив:</span>
                      Загрузите все фотографии и видео слёта в папку на <strong>Яндекс.Диске</strong> (или Google Диске) и скопируйте публичную ссылку. На сайте появится стильный блок с названием и кнопкой прямого перехода, что сохранит оригинальное качество файлов!
                    </div>
                  </div>

                  {/* Cloud URL */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Ссылка на облачное хранилище (Яндекс Диск, Google Drive, Mail.ru) *
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        required
                        value={newCloudUrl}
                        onChange={(e) => setNewCloudUrl(e.target.value)}
                        placeholder="https://disk.yandex.ru/d/... или https://drive.google.com/..."
                        className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400"
                      />
                      <HardDrive size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700" />
                    </div>
                    {newCloudUrl && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="text-stone-500">Определен сервис:</span>
                        <span className={`${detectCloudInfo(newCloudUrl).badgeBg} ${detectCloudInfo(newCloudUrl).badgeText} px-2 py-0.2 rounded-md uppercase text-[10px]`}>
                          {detectCloudInfo(newCloudUrl).name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title and Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                        Название альбома / архива *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Например: Полный архив слёта 2024 на Киржаче (1200 фото и видео)"
                        className="w-full px-3 py-2.5 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                        Год слёта (1993–{currentYear}) *
                      </label>
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2.5 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-bold text-stone-900"
                      >
                        {allHistoricalYears.map(yr => (
                          <option key={yr} value={yr}>{yr} год</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Cover Image */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Обложка альбома (необязательно, можно оставить пустой)
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-3 text-center cursor-pointer transition-all ${
                        previewImage 
                          ? 'border-emerald-500 bg-emerald-50/40' 
                          : 'border-amber-300 bg-white hover:border-red-500'
                      }`}
                    >
                      {previewImage ? (
                        <div className="space-y-1.5">
                          <img 
                            src={previewImage} 
                            alt="Обложка" 
                            className="max-h-36 mx-auto rounded-lg object-contain border border-emerald-400 shadow-xs" 
                          />
                          <p className="text-[11px] font-bold text-emerald-700">Нажмите, чтобы заменить обложку</p>
                        </div>
                      ) : (
                        <div className="py-2 space-y-1">
                          <ImageIcon className="w-8 h-8 text-amber-400 mx-auto" />
                          <p className="text-xs font-bold text-amber-900">
                            Нажмите, чтобы прикрепить обложку альбома
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Если не загружать, будет отображаться стильный брендированный блок облачного диска
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Описание архива
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Количество фото, видеоматериалы, авторы съёмки, яркие моменты..."
                      className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* DIRECT PHOTO MODE */}
              {uploadMode === 'photo' && (
                <div className="space-y-4">
                  {/* Photo Dropzone */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Фотография (без ограничений по размеру файла) *
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-3 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                        previewImage 
                          ? 'border-emerald-500 bg-emerald-50/40' 
                          : 'border-amber-400 bg-white hover:border-red-500'
                      }`}
                    >
                      {previewImage ? (
                        <div className="space-y-2">
                          <img 
                            src={previewImage} 
                            alt="Предпросмотр" 
                            className="max-h-48 mx-auto rounded-lg object-contain border border-emerald-400 shadow-xs" 
                          />
                          <p className="text-xs font-bold text-emerald-700">Нажмите, чтобы заменить файл</p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Camera className="w-10 h-10 text-amber-400 mx-auto" />
                          <p className="text-xs font-black uppercase text-amber-900">
                            Нажмите для выбора или перетащите фото сюда
                          </p>
                          <p className="text-[11px] text-amber-600">
                            Поддерживаются JPG, PNG, WEBP, SVG любого размера
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Title and Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                        Название кадра / Место *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Например: Плов на Киржаче или Байдарочный штурм"
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                        Год слёта *
                      </label>
                      <select
                        value={newYear}
                        onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-bold text-stone-900"
                      >
                        {allHistoricalYears.map(yr => (
                          <option key={yr} value={yr}>{yr} год</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Cloud link for this photo */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Ссылка на полный облачный архив (Яндекс Диск, если есть)
                    </label>
                    <input
                      type="url"
                      value={newCloudUrl}
                      onChange={(e) => setNewCloudUrl(e.target.value)}
                      placeholder="https://disk.yandex.ru/d/... (необязательно)"
                      className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                      Описание или история кадра
                    </label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Кто на фото, что случилось, воспоминания..."
                      className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold uppercase text-xs rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {uploadMode === 'cloud' ? <HardDrive size={15} /> : <Upload size={15} />}
                  {isUploading ? 'Сохранение...' : (uploadMode === 'cloud' ? 'Опубликовать архив в галерее' : 'Опубликовать фото')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <button 
            onClick={() => setActiveLightboxPhoto(null)}
            className="absolute top-4 right-4 text-yellow-300 hover:text-white bg-black/60 p-2.5 rounded-full z-10 transition-colors"
          >
            <X size={26} />
          </button>

          <div 
            className="max-w-4xl w-full bg-amber-950 rounded-3xl overflow-hidden border-2 border-yellow-400 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black flex items-center justify-center max-h-[70vh] min-h-[250px]">
              {activeLightboxPhoto.imageUrl && activeLightboxPhoto.imageUrl.trim() ? (
                <img 
                  src={activeLightboxPhoto.imageUrl.trim()} 
                  alt={activeLightboxPhoto.title} 
                  className="max-h-[70vh] w-auto object-contain"
                />
              ) : (
                <div className="p-8 text-center text-yellow-300 space-y-3">
                  <FolderArchive size={48} className="mx-auto text-yellow-400" />
                  <h3 className="text-xl font-black uppercase">{activeLightboxPhoto.title}</h3>
                  <p className="text-xs text-amber-200">Облачный архив на Яндекс.Диске</p>
                </div>
              )}
            </div>
            
            <div className="p-5 bg-amber-900 text-yellow-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block bg-red-600 text-yellow-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    Архив {activeLightboxPhoto.year} года
                  </span>
                  {activeLightboxPhoto.cloudUrl && (
                    <span className="bg-yellow-400 text-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <HardDrive size={10} />
                      {detectCloudInfo(activeLightboxPhoto.cloudUrl).name}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-lg text-yellow-300">{activeLightboxPhoto.title}</h3>
                {activeLightboxPhoto.description && (
                  <p className="text-xs text-amber-200 mt-1 max-w-xl leading-relaxed">{activeLightboxPhoto.description}</p>
                )}
                <p className="text-[11px] text-amber-400 mt-2">
                  Добавил: {activeLightboxPhoto.uploadedBy} • {activeLightboxPhoto.uploadedAt}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeLightboxPhoto.cloudUrl && (
                  <a
                    href={activeLightboxPhoto.cloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <ExternalLink size={14} />
                    <span>Открыть на Яндекс Диске</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => onPhotoLiked(activeLightboxPhoto.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Heart size={15} className="fill-yellow-300" />
                  <span>{activeLightboxPhoto.likes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
