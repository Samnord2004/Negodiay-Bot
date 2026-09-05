import React, { useState } from 'react';
import { 
  Flame, Tent, Trophy, Award, Compass, Plus, Trash, Edit, 
  Image as ImageIcon, Video, Eye, Calendar, User, X, ChevronRight,
  Upload, Sparkles, Filter, ExternalLink, Play
} from 'lucide-react';
import { TeamStory, StoryCategory, Participant } from '../types';

interface TeamHistoryTabProps {
  stories: TeamStory[];
  onAddStory: (story: TeamStory) => void;
  onUpdateStory: (id: string, updates: Partial<TeamStory>) => void;
  onDeleteStory: (id: string) => void;
  currentUser: Participant | null;
  isAdmin: boolean;
}

const CATEGORY_MAP: Record<StoryCategory, { label: string; icon: React.FC<{ size?: number; className?: string }>; color: string }> = {
  logo: { label: 'История создания логотипа', icon: Flame, color: 'from-red-600 to-amber-600' },
  origin: { label: 'История образования команды', icon: Tent, color: 'from-amber-600 to-yellow-600' },
  sports: { label: 'Спортивные достижения команды', icon: Trophy, color: 'from-yellow-600 to-emerald-600' },
  heroes: { label: 'Особо отличившиеся негодяи', icon: Award, color: 'from-purple-600 to-red-600' },
  traditions: { label: 'Традиции и ритуалы', icon: Compass, color: 'from-blue-600 to-indigo-600' },
  custom: { label: 'Командные истории', icon: Sparkles, color: 'from-stone-700 to-stone-900' }
};

export default function TeamHistoryTab({
  stories,
  onAddStory,
  onUpdateStory,
  onDeleteStory,
  currentUser,
  isAdmin
}: TeamHistoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState<TeamStory | null>(null);

  // Lightbox & Video Player Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Add / Edit form state
  const [formCategory, setFormCategory] = useState<StoryCategory>('custom');
  const [formCategoryTitle, setFormCategoryTitle] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formContent, setFormContent] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formVideos, setFormVideos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingStory(null);
    setFormCategory('custom');
    setFormCategoryTitle('История команды');
    setFormTitle('');
    setFormYear(new Date().getFullYear());
    setFormContent('');
    setFormPhotos([]);
    setFormVideos([]);
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (story: TeamStory) => {
    setEditingStory(story);
    setFormCategory(story.category);
    setFormCategoryTitle(story.categoryTitle);
    setFormTitle(story.title);
    setFormYear(story.year || 2018);
    setFormContent(story.content);
    setFormPhotos([...story.photos]);
    setFormVideos([...story.videos]);
    setShowAddModal(true);
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setFormPhotos(prev => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  // Handle Video File Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setFormVideos(prev => [...prev, loadEvt.target!.result as string]);
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  // Save story
  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    if (editingStory) {
      onUpdateStory(editingStory.id, {
        category: formCategory,
        categoryTitle: formCategoryTitle || CATEGORY_MAP[formCategory]?.label || 'История команды',
        title: formTitle.trim(),
        year: Number(formYear),
        content: formContent.trim(),
        photos: formPhotos,
        videos: formVideos
      });
    } else {
      const newStory: TeamStory = {
        id: 'story_' + Date.now(),
        category: formCategory,
        categoryTitle: formCategoryTitle || CATEGORY_MAP[formCategory]?.label || 'История команды',
        title: formTitle.trim(),
        year: Number(formYear),
        content: formContent.trim(),
        photos: formPhotos,
        videos: formVideos,
        authorName: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Команда Негодяев',
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddStory(newStory);
    }

    setShowAddModal(false);
  };

  // Filtering
  const filteredStories = stories.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categoryTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Overview with specific requested wording */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-red-600 text-yellow-300 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-950 shadow inline-block">
              🏕️ Стартовая страница • Летопись с 2018 года
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-red-700 uppercase tracking-tight leading-tight">
              туристической команды "Негодяи"
            </h2>
            <p className="text-xs sm:text-sm font-bold text-amber-950 max-w-2xl leading-relaxed">
              Официальная история и зал славы команды: как зарождалась команда, рождение легендарного логотипа, громкие спортивные победы и летопись наших главных соратников с возможностью пополнения фото и видео архивов.
            </p>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase text-xs sm:text-sm px-5 py-3 rounded-2xl border-2 border-amber-950 shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} /> Добавить блок истории
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Categories Bar */}
      <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Categories Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-yellow-300 shadow'
                  : 'bg-white text-amber-950 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              Все истории ({stories.length})
            </button>
            {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
              const Icon = catMeta.icon;
              const count = stories.filter(s => s.category === catKey).length;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    selectedCategory === catKey
                      ? 'bg-red-600 text-yellow-300 shadow'
                      : 'bg-white text-amber-950 hover:bg-amber-200 border border-amber-300'
                  }`}
                >
                  <Icon size={14} />
                  <span>{catMeta.label}</span>
                  {count > 0 && <span className="text-[10px] opacity-80">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по историям..."
              className="w-full px-3.5 py-1.5 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-950 outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Stories Blocks Grid / List */}
      <div className="space-y-6">
        {filteredStories.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-dashed border-amber-300 rounded-2xl p-10 text-center space-y-3">
            <div className="text-4xl">🏕️</div>
            <h3 className="text-base font-black text-amber-950 uppercase">В этой категории пока нет записей</h3>
            <p className="text-xs font-semibold text-amber-800 max-w-sm mx-auto">
              Нажмите кнопку «Добавить блок истории», чтобы записать новый рассказ о команде, прикрепить фото или видео!
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-red-600 text-yellow-300 text-xs font-black uppercase px-4 py-2 rounded-xl shadow"
            >
              + Добавить историю
            </button>
          </div>
        ) : (
          filteredStories.map((story) => {
            const catMeta = CATEGORY_MAP[story.category] || CATEGORY_MAP.custom;
            const CatIcon = catMeta.icon;

            return (
              <article
                key={story.id}
                className="bg-white border-3 border-amber-300 hover:border-red-500 rounded-3xl p-5 sm:p-7 shadow-lg transition-all space-y-5 relative overflow-hidden"
              >
                {/* Header of Story Block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-100 text-red-700 font-black text-[11px] uppercase px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-sm">
                        <CatIcon size={13} className="text-red-600" />
                        {story.categoryTitle || catMeta.label}
                      </span>
                      {story.year && (
                        <span className="bg-stone-900 text-yellow-400 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                          {story.year} год
                        </span>
                      )}
                      {story.authorName && (
                        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                          <User size={12} /> {story.authorName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight leading-snug pt-1">
                      {story.title}
                    </h3>
                  </div>

                  {/* Actions for member / admin */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(story)}
                      title="Редактировать историю"
                      className="p-2 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded-xl transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    {(isAdmin || currentUser) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Удалить блок "${story.title}"?`)) {
                            onDeleteStory(story.id);
                          }
                        }}
                        title="Удалить историю"
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Narrative Content */}
                <div className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed space-y-2 whitespace-pre-line">
                  {story.content}
                </div>

                {/* Photo Gallery Grid (if photos present) */}
                {story.photos && story.photos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-red-600" />
                      Фотоархив к истории ({story.photos.length}):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {story.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setLightboxImage(photo)}
                          className="group relative h-28 sm:h-36 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm cursor-pointer hover:border-red-500 transition-all"
                        >
                          <img
                            src={photo}
                            alt={`${story.title} фото ${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye size={16} /> Увеличить
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Gallery / Player (if videos present) */}
                {story.videos && story.videos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                      <Video size={14} className="text-red-600" />
                      Видеоматериалы ({story.videos.length}):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {story.videos.map((videoUrl, vIdx) => {
                        const isEmbed = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vk.com') || videoUrl.includes('rutube.ru');
                        return (
                          <div key={vIdx} className="rounded-2xl overflow-hidden border-2 border-amber-400 bg-stone-950 shadow-md">
                            {isEmbed ? (
                              <div className="aspect-video w-full">
                                <iframe
                                  src={videoUrl}
                                  title={`Видео ${vIdx + 1} - ${story.title}`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <div className="aspect-video w-full flex items-center justify-center bg-black">
                                <video
                                  src={videoUrl}
                                  controls
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </article>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT STORY BLOCK */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-yellow-50 border-4 border-red-600 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b-2 border-amber-300 pb-3">
              <h3 className="text-lg sm:text-xl font-black uppercase text-red-600 flex items-center gap-2">
                <Sparkles size={20} />
                {editingStory ? 'Редактировать блок истории' : 'Добавить блок истории команды'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-amber-900 hover:text-red-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="space-y-4 text-xs font-bold text-amber-950">
              
              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-black mb-1">
                    Категория истории:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as StoryCategory;
                      setFormCategory(cat);
                      setFormCategoryTitle(CATEGORY_MAP[cat]?.label || '');
                    }}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-bold text-amber-950 outline-none"
                  >
                    <option value="logo">История создания логотипа</option>
                    <option value="origin">История образования команды</option>
                    <option value="sports">Спортивные достижения команды</option>
                    <option value="heroes">Особо отличившиеся негодяи</option>
                    <option value="traditions">Традиции и ритуалы</option>
                    <option value="custom">Свой блок / Летопись</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-black mb-1">
                    Год события:
                  </label>
                  <input
                    type="number"
                    min="2010"
                    max={new Date().getFullYear()}
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-bold text-amber-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-black mb-1">
                  Название раздела (подзаголовок блока):
                </label>
                <input
                  type="text"
                  required
                  value={formCategoryTitle}
                  onChange={(e) => setFormCategoryTitle(e.target.value)}
                  placeholder="Например: История создания логотипа"
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-bold text-amber-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-black mb-1">
                  Заголовок истории:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Как родился символ Негодяев..."
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-bold text-amber-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-black mb-1">
                  Текст рассказа / хроника:
                </label>
                <textarea
                  required
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Опишите подробности событий, участников, забавные походные случаи, победы и воспоминания..."
                  className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-semibold text-amber-950 outline-none leading-relaxed"
                />
              </div>

              {/* Photos Section */}
              <div className="bg-amber-100/70 p-3.5 rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-black flex items-center gap-1">
                    <ImageIcon size={14} className="text-red-600" /> Прикрепление фотографий:
                  </label>
                  <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-yellow-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow">
                    Загрузить фото
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Или вставьте прямую ссылку на фото (URL)"
                    className="flex-1 bg-white border border-amber-400 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPhotoUrl.trim()) {
                        setFormPhotos(prev => [...prev, newPhotoUrl.trim()]);
                        setNewPhotoUrl('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-300 text-amber-950 rounded-xl text-xs font-bold"
                  >
                    + Добавить
                  </button>
                </div>

                {formPhotos.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                    {formPhotos.map((p, idx) => (
                      <div key={idx} className="relative h-16 rounded-xl overflow-hidden border border-amber-400 group">
                        <img src={p} alt="thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormPhotos(formPhotos.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Section */}
              <div className="bg-amber-100/70 p-3.5 rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-black flex items-center gap-1">
                    <Video size={14} className="text-red-600" /> Видеоматериалы (YouTube, Rutube, VK Video, MP4):
                  </label>
                  <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-yellow-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow">
                    Загрузить видео
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="flex-1 bg-white border border-amber-400 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newVideoUrl.trim()) {
                        let finalUrl = newVideoUrl.trim();
                        // Format standard youtube links into embed links
                        if (finalUrl.includes('watch?v=')) {
                          finalUrl = finalUrl.replace('watch?v=', 'embed/');
                        } else if (finalUrl.includes('youtu.be/')) {
                          finalUrl = finalUrl.replace('youtu.be/', 'www.youtube.com/embed/');
                        }
                        setFormVideos(prev => [...prev, finalUrl]);
                        setNewVideoUrl('');
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-300 text-amber-950 rounded-xl text-xs font-bold"
                  >
                    + Добавить
                  </button>
                </div>

                {formVideos.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {formVideos.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 text-[11px]">
                        <span className="truncate max-w-sm text-stone-800">{v}</span>
                        <button
                          type="button"
                          onClick={() => setFormVideos(formVideos.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-amber-400 bg-amber-200 text-amber-950 font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-yellow-300 font-black uppercase shadow-md"
                >
                  Сохранить блок истории
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-stone-800 text-white p-2.5 rounded-full hover:bg-red-600 transition-all"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged"
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border-2 border-amber-400"
          />
        </div>
      )}

    </div>
  );
}
