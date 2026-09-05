import React, { useState, useRef } from 'react';
import { 
  Palette, Sparkles, Tent, Shirt, Gift, Trophy, 
  Plus, ThumbsUp, MessageSquare, Tag, X, Image as ImageIcon, CheckCircle, Send
} from 'lucide-react';
import { CreativityIdea, CreativityCategory, Participant } from '../types';

interface CreativityTabProps {
  ideas: CreativityIdea[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onIdeaAdded: (idea: CreativityIdea) => void;
  onIdeaVoted: (ideaId: string) => void;
  onCommentAdded: (ideaId: string, text: string) => void;
  onStatusChanged: (ideaId: string, status: CreativityIdea['status']) => void;
}

const CATEGORIES: { key: CreativityCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'camp_design', label: 'Оформление лагеря', icon: <Tent size={14} />, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'carnival_costumes', label: 'Наряды к карнавалу', icon: <Sparkles size={14} />, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { key: 'camp_contests', label: 'Конкурсы в лагере', icon: <Trophy size={14} />, color: 'bg-yellow-100 text-amber-900 border-yellow-400' },
  { key: 'posm_merch', label: 'Раздатка POSm & мерч', icon: <Gift size={14} />, color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { key: 'team_clothing', label: 'Командная одежда', icon: <Shirt size={14} />, color: 'bg-blue-100 text-blue-800 border-blue-300' },
];

const STATUS_LABELS: Record<CreativityIdea['status'], { label: string; color: string }> = {
  idea: { label: 'Идея', color: 'bg-gray-100 text-gray-700' },
  discussing: { label: 'Обсуждение', color: 'bg-yellow-100 text-amber-800' },
  approved: { label: 'Одобрено командой', color: 'bg-emerald-100 text-emerald-800 font-bold' },
  in_progress: { label: 'В производстве', color: 'bg-blue-100 text-blue-800 font-bold' },
  done: { label: 'Готово к слёту', color: 'bg-red-600 text-yellow-300 font-black' },
};

export default function CreativityTab({
  ideas,
  currentUser,
  isAdmin,
  onIdeaAdded,
  onIdeaVoted,
  onCommentAdded,
  onStatusChanged
}: CreativityTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<CreativityCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CreativityCategory>('camp_design');
  const [description, setDescription] = useState('');
  const [materialsBudget, setMaterialsBudget] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredIdeas = ideas.filter(idea => 
    selectedCategory === 'all' || idea.category === selectedCategory
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim()) {
      setFormError('Заполните название и описание идеи');
      return;
    }

    try {
      const res = await fetch('/api/creativity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          authorId: currentUser?.id || 'anon',
          authorName: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Негодяй',
          imageUrl: previewImage || undefined,
          materialsBudget: materialsBudget || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onIdeaAdded(data.idea);
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        setMaterialsBudget('');
        setPreviewImage(null);
      } else {
        setFormError(data.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setFormError('Сбой обращения к серверу');
    }
  };

  const handleSendComment = async (ideaId: string) => {
    const text = commentInput[ideaId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/creativity/${ideaId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Негодяй',
          text
        })
      });
      if (res.ok) {
        onCommentAdded(ideaId, text);
        setCommentInput(prev => ({ ...prev, [ideaId]: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (ideaId: string) => {
    try {
      const res = await fetch(`/api/creativity/${ideaId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest_user'
        })
      });
      if (res.ok) {
        onIdeaVoted(ideaId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-8 h-8 text-red-700" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-red-700 tracking-tight">
                Творчество и Идеи команды Негодяи
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1">
              Оформление лагеря, наряды для карнавала, конкурсы, мерч и фирменная командная одежда
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={18} />
            Предложить новую идею
          </button>
        </div>

        {/* 5 Required Subcategories */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t-2 border-red-600/30">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            Все идеи ({ideas.length})
          </button>

          {CATEGORIES.map(cat => {
            const count = ideas.filter(i => i.category === cat.key).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.key
                    ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                    : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
                }`}
              >
                {cat.icon}
                <span>{cat.label} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-16 bg-white/70 border-3 border-dashed border-amber-300 rounded-2xl p-6">
          <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <h3 className="font-black text-lg text-amber-950 uppercase">В этой категории пока нет идей</h3>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            Предложите оформление, идею костюма или дизайн командной одежды!
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
          >
            Создать первую идею
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIdeas.map(idea => {
            const catInfo = CATEGORIES.find(c => c.key === idea.category);
            const statusInfo = STATUS_LABELS[idea.status] || STATUS_LABELS.idea;
            const isVoted = currentUser && idea.votedUserIds?.includes(currentUser.id);
            const isCommentsOpen = expandedCommentsId === idea.id;

            return (
              <div 
                key={idea.id}
                className="bg-white border-3 border-amber-200 hover:border-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category and Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catInfo?.color || ''}`}>
                      {catInfo?.label}
                    </span>
                    
                    {/* Status badge with change dropdown for Admin */}
                    {isAdmin ? (
                      <select
                        value={idea.status}
                        onChange={(e) => onStatusChanged(idea.id, e.target.value as any)}
                        className="text-[11px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900"
                      >
                        <option value="idea">Идея</option>
                        <option value="discussing">Обсуждение</option>
                        <option value="approved">Одобрено</option>
                        <option value="in_progress">В производстве</option>
                        <option value="done">Готово</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-black text-lg text-amber-950 mb-2">{idea.title}</h4>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line mb-3">
                    {idea.description}
                  </p>

                  {/* Optional Image */}
                  {idea.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border-2 border-amber-200 aspect-video bg-amber-50">
                      <img src={idea.imageUrl} alt={idea.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Materials & Budget estimation */}
                  {idea.materialsBudget && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-xs text-amber-950 mb-3">
                      <span className="font-black text-red-700 block text-[11px] uppercase">
                        Материалы и бюджет:
                      </span>
                      {idea.materialsBudget}
                    </div>
                  )}
                </div>

                <div>
                  {/* Author and Actions */}
                  <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-amber-600 font-semibold">
                      Автор: {idea.authorName}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Vote Button */}
                      <button
                        type="button"
                        onClick={() => handleVote(idea.id)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                          isVoted
                            ? 'bg-red-600 text-yellow-300 shadow-sm'
                            : 'bg-amber-100 text-amber-900 hover:bg-red-100 hover:text-red-700'
                        }`}
                      >
                        <ThumbsUp size={14} className={isVoted ? 'fill-yellow-300' : ''} />
                        <span>Голосов: {idea.votes || 0}</span>
                      </button>

                      {/* Comments toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedCommentsId(isCommentsOpen ? null : idea.id)}
                        className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-amber-950 font-black text-xs rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare size={14} />
                        <span>{idea.comments?.length || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Box */}
                  {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t-2 border-amber-200 space-y-2 bg-amber-50/50 p-3 rounded-xl">
                      <h5 className="font-black text-xs uppercase text-amber-950">Обсуждение идеи:</h5>
                      
                      {idea.comments && idea.comments.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {idea.comments.map(c => (
                            <div key={c.id} className="bg-white p-2 rounded-lg border border-amber-200 text-xs">
                              <span className="font-bold text-red-700">{c.authorName}: </span>
                              <span className="text-amber-950">{c.text}</span>
                              <span className="block text-[10px] text-amber-400 mt-0.5">{c.createdAt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-600 italic">Пока нет комментариев. Напишите первым!</p>
                      )}

                      {/* Add comment input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInput[idea.id] || ''}
                          onChange={(e) => setCommentInput(prev => ({ ...prev, [idea.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendComment(idea.id);
                          }}
                          placeholder="Ваше мнение или совет..."
                          className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-950 focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendComment(idea.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-lg text-xs font-black shadow"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ADD IDEA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-6">
            
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="text-red-700 w-6 h-6" />
                <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                  Новая творческая идея
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs text-red-800 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Категория *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CreativityCategory)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Название идеи *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Негодяйские неоновые ворота лагеря"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Описание замысла и детали реализации *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите концепцию, фишки, почему это порвет всех на слёте..."
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Необходимые материалы и ориентировочный бюджет (₽)
                </label>
                <input
                  type="text"
                  value={materialsBudget}
                  onChange={(e) => setMaterialsBudget(e.target.value)}
                  placeholder="Например: 10 метров ткани, гирлянда, фанера ~ 3 500 ₽"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              {/* Optional Photo / Sketch */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Эскиз или пример фото (необязательно)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-400 hover:border-red-500 rounded-xl p-3 text-center cursor-pointer bg-white"
                >
                  {previewImage ? (
                    <div className="space-y-1">
                      <img src={previewImage} alt="Эскиз" className="max-h-32 mx-auto rounded object-contain" />
                      <p className="text-[11px] font-bold text-emerald-700">Нажмите для замены</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2 text-amber-800 text-xs font-bold">
                      <ImageIcon size={16} /> Прикрепить эскиз / фото
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold uppercase text-xs rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Опубликовать идею
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
