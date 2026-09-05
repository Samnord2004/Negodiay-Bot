import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Plus, Trash2, Heart, Calendar, 
  Eye, X, Image as ImageIcon, Filter, Sparkles 
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

export default function GalleryTab({
  photos,
  currentUser,
  isAdmin,
  onPhotoAdded,
  onPhotoDeleted,
  onPhotoLiked
}: GalleryTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Upload modal state
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState<number>(currentYear);
  const [newDescription, setNewDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique years from photos
  const photoYears = Array.from(new Set(photos.map(p => p.year))).sort((a, b) => b - a);
  const availableYears = Array.from(new Set([currentYear, currentYear - 1, currentYear - 2, ...photoYears])).sort((a, b) => b - a);

  const filteredPhotos = photos.filter(p => selectedYear === 'all' || p.year === selectedYear);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lossless FileReader: no file size limit restriction imposed on users!
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!newTitle.trim()) {
      setUploadError('Введите название фотографии или архива');
      return;
    }
    if (!previewImage) {
      setUploadError('Выберите или перетащите фотографию');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: newYear,
          title: newTitle,
          description: newDescription,
          imageUrl: previewImage,
          uploadedBy: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Негодяй'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onPhotoAdded(data.photo);
        setShowUploadModal(false);
        setNewTitle('');
        setNewDescription('');
        setPreviewImage(null);
      } else {
        setUploadError(data.error || 'Ошибка при загрузке фото');
      }
    } catch (err) {
      setUploadError('Сбой загрузки на сервер');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Year Filters */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-7 h-7 text-red-700" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-red-700 tracking-tight">
                Фотогалерея и Архивы слётов Негодяев
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1">
              Хроники походов по годам без ограничений по размеру файлов. Память о кострах, сплавах и победах!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2"
          >
            <Upload size={18} />
            Загрузить фото в архив
          </button>
        </div>

        {/* Year Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t-2 border-red-600/30">
          <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1 mr-1">
            <Filter size={14} /> Архивы по годам:
          </span>
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
              selectedYear === 'all'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            Все годы ({photos.length})
          </button>
          {availableYears.map(yr => {
            const countInYear = photos.filter(p => p.year === yr).length;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  selectedYear === yr
                    ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                    : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
                }`}
              >
                {yr} г. ({countInYear})
              </button>
            );
          })}
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white/70 border-3 border-dashed border-amber-300 rounded-2xl p-6">
          <ImageIcon className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <h3 className="font-black text-lg text-amber-950 uppercase">В этом архиве пока нет фотографий</h3>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            Будьте первым, кто добавит памятные кадры слёта Негодяев!
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
          >
            Добавить первое фото
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPhotos.map(photo => {
            const isLiked = currentUser && photo.likedUserIds?.includes(currentUser.id);
            return (
              <div 
                key={photo.id}
                className="bg-white border-3 border-amber-200 hover:border-red-500 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col group"
              >
                {/* Image Container */}
                <div 
                  className="relative aspect-video bg-amber-950/10 cursor-pointer overflow-hidden"
                  onClick={() => setActiveLightboxPhoto(photo)}
                >
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-yellow-300 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow">
                    {photo.year} год
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-yellow-400 text-amber-950 text-xs font-black uppercase px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                      <Eye size={16} /> Просмотр
                    </span>
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-base text-amber-950 line-clamp-1">{photo.title}</h4>
                    {photo.description && (
                      <p className="text-xs text-amber-800 mt-1 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                    <div className="text-[11px] text-amber-700">
                      <span className="font-bold">{photo.uploadedBy}</span>
                      <span className="block text-[10px] text-amber-500">{photo.uploadedAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPhotoLiked(photo.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                          isLiked 
                            ? 'bg-red-100 text-red-600 border border-red-300' 
                            : 'bg-amber-100 text-amber-800 hover:bg-red-50 hover:text-red-600'
                        }`}
                        title="Поставить лайк"
                      >
                        <Heart size={14} className={isLiked ? 'fill-red-600 text-red-600' : ''} />
                        <span>{photo.likes || 0}</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onPhotoDeleted(photo.id)}
                          className="p-1.5 text-amber-400 hover:text-red-600 transition-colors"
                          title="Удалить фото (Админ)"
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

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-6">
            
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="text-red-700 w-6 h-6" />
                <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                  Добавление фото в архив команды
                </h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs text-red-800 font-bold">
                  {uploadError}
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Фотография (без ограничения по размеру) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-3 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
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
                        className="max-h-48 mx-auto rounded-lg object-contain border border-emerald-400 shadow-sm" 
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
                        Поддерживаются любые форматы: JPG, PNG, WEBP, SVG
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                    Название / Место кадра *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Плов на Киржаче или Байдарочный штурм"
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                    Год слёта *
                  </label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                  >
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr} год</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Описание или забавная история кадра
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Кто на фото, что случилось, кто спалил сосиски..."
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold uppercase text-xs rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  {isUploading ? 'Загрузка...' : 'Опубликовать фото'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <button 
            onClick={() => setActiveLightboxPhoto(null)}
            className="absolute top-4 right-4 text-yellow-300 hover:text-white bg-black/50 p-2 rounded-full z-10 transition-colors"
          >
            <X size={28} />
          </button>

          <div 
            className="max-w-4xl w-full bg-amber-950 rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black flex items-center justify-center max-h-[70vh]">
              <img 
                src={activeLightboxPhoto.imageUrl} 
                alt={activeLightboxPhoto.title} 
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            
            <div className="p-4 bg-amber-900 text-yellow-100 flex items-center justify-between">
              <div>
                <span className="inline-block bg-red-600 text-yellow-300 text-[10px] font-black px-2 py-0.5 rounded uppercase mb-1">
                  Архив {activeLightboxPhoto.year} года
                </span>
                <h3 className="font-black text-lg text-yellow-300">{activeLightboxPhoto.title}</h3>
                {activeLightboxPhoto.description && (
                  <p className="text-xs text-amber-200 mt-1 max-w-xl">{activeLightboxPhoto.description}</p>
                )}
                <p className="text-[11px] text-amber-400 mt-2">
                  Автор: {activeLightboxPhoto.uploadedBy} • {activeLightboxPhoto.uploadedAt}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPhotoLiked(activeLightboxPhoto.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Heart size={16} className="fill-yellow-300" />
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
