import React, { useState } from 'react';
import { 
  FileText, Folder, BookOpen, Compass, Plus, 
  Trash2, Download, Eye, X, Search, ShieldAlert, Check 
} from 'lucide-react';
import { TeamDocument, TeamDocumentCategory, Participant } from '../types';

interface DocumentsTabProps {
  documents: TeamDocument[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onDocumentAdded: (doc: TeamDocument) => void;
  onDocumentDeleted: (id: string) => void;
}

export default function DocumentsTab({
  documents,
  currentUser,
  isAdmin,
  onDocumentAdded,
  onDocumentDeleted
}: DocumentsTabProps) {
  const [activeCategory, setActiveCategory] = useState<TeamDocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<TeamDocument | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TeamDocumentCategory>('rally');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [formError, setFormError] = useState('');

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: TeamDocumentCategory) => {
    switch (cat) {
      case 'rally': return 'Документы слёта';
      case 'statutory': return 'Уставные документы';
      case 'prep': return 'В помощь к подготовке и конкурсам';
    }
  };

  const getCategoryBadgeClass = (cat: TeamDocumentCategory) => {
    switch (cat) {
      case 'rally': return 'bg-red-100 text-red-800 border-red-300';
      case 'statutory': return 'bg-yellow-100 text-amber-900 border-yellow-400';
      case 'prep': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim() || !newDescription.trim()) {
      setFormError('Заполните название и описание документа');
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          title: newTitle,
          description: newDescription,
          content: newContent || newDescription,
          fileName: newFileName || `${newTitle}.txt`,
          fileType: 'guide',
          uploadedBy: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Администратор'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onDocumentAdded(data.document);
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewContent('');
        setNewFileName('');
      } else {
        setFormError(data.error || 'Ошибка при сохранении документа');
      }
    } catch (err) {
      setFormError('Сбой соединения с сервером');
    }
  };

  const handleDownloadDoc = (doc: TeamDocument) => {
    const textData = `=== ${doc.title} ===\nКатегория: ${getCategoryLabel(doc.category)}\nДата: ${doc.uploadedAt}\nАвтор: ${doc.uploadedBy}\n\nОписание:\n${doc.description}\n\nСодержание документа:\n${doc.content || doc.description}`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName || `${doc.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Category Tabs */}
      <div className="bg-yellow-400 border-4 border-red-600 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-7 h-7 text-red-700" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-red-700 tracking-tight">
                База документов команды Негодяи
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-red-950 mt-1">
              Регламенты турслётов, уставные положения команды и методические материалы к конкурсам
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={18} />
            Добавить документ
          </button>
        </div>

        {/* 3 Explicit Subsections required by user */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t-2 border-red-600/30">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            <Folder size={14} /> Все документы ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('rally')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeCategory === 'rally'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            <Compass size={14} /> Документы слёта ({documents.filter(d => d.category === 'rally').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('statutory')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeCategory === 'statutory'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            <BookOpen size={14} /> Уставные документы ({documents.filter(d => d.category === 'statutory').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('prep')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeCategory === 'prep'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            <FileText size={14} /> В помощь к подготовке и конкурсам ({documents.filter(d => d.category === 'prep').length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или тексту..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 shadow-inner"
          />
        </div>
        <p className="text-xs text-amber-800 font-bold hidden sm:block">
          Найдено: {filteredDocs.length} документов
        </p>
      </div>

      {/* Documents List / Cards */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 bg-white/70 border-3 border-dashed border-amber-300 rounded-2xl p-6">
          <FileText className="w-16 h-16 text-amber-400 mx-auto mb-3" />
          <h3 className="font-black text-lg text-amber-950 uppercase">В этом разделе пока нет документов</h3>
          <p className="text-xs text-amber-700 mt-1">
            Нажмите «Добавить документ», чтобы внести положение слёта или уставные правила.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-white border-3 border-amber-200 hover:border-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                    {getCategoryLabel(doc.category)}
                  </span>
                  <span className="text-[11px] text-amber-600 font-semibold">{doc.uploadedAt}</span>
                </div>

                <h4 className="font-black text-base text-amber-950 mb-1.5 flex items-center gap-1.5">
                  <FileText size={18} className="text-red-600 shrink-0" />
                  <span>{doc.title}</span>
                </h4>

                <p className="text-xs text-amber-800 line-clamp-3 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                <span className="text-[11px] text-amber-600 font-semibold">
                  Автор: {doc.uploadedBy}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview(doc)}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="Читать документ"
                  >
                    <Eye size={14} /> Читать
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    className="p-1.5 bg-yellow-300 hover:bg-yellow-400 text-amber-950 rounded-lg transition-colors"
                    title="Скачать документ"
                  >
                    <Download size={14} />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDocumentDeleted(doc.id)}
                      className="p-1.5 text-amber-400 hover:text-red-600 transition-colors"
                      title="Удалить документ (Админ)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD DOCUMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-6">
            
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-red-700 w-6 h-6" />
                <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                  Добавление документа команды
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
                  Подраздел документа *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TeamDocumentCategory)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                >
                  <option value="rally">Документы слёта</option>
                  <option value="statutory">Уставные документы</option>
                  <option value="prep">Документы в помощь к подготовке и конкурсам</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Название документа *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Положение турслёта 2026 или Кодекс кострового"
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Краткое описание *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="О чем документ, для кого предназначен..."
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Текст / Полное содержание документа
                </label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Вставьте полный текст регламента, правил или методички..."
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-mono text-amber-950"
                />
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
                  Сохранить в базу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-amber-50 border-4 border-red-600 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
            
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-red-700 w-6 h-6" />
                <div>
                  <span className="text-[10px] font-black uppercase bg-red-600 text-yellow-300 px-2 py-0.5 rounded">
                    {getCategoryLabel(activeDocPreview.category)}
                  </span>
                  <h3 className="font-black text-lg uppercase text-red-700 tracking-tight mt-0.5">
                    {activeDocPreview.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveDocPreview(null)}
                className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-300 text-xs text-amber-900 leading-relaxed font-semibold">
                {activeDocPreview.description}
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-amber-200 text-xs sm:text-sm font-mono whitespace-pre-wrap text-amber-950 leading-relaxed">
                {activeDocPreview.content || activeDocPreview.description}
              </div>

              <div className="text-[11px] text-amber-600 flex items-center justify-between pt-2">
                <span>Опубликовал: {activeDocPreview.uploadedBy}</span>
                <span>Дата: {activeDocPreview.uploadedAt}</span>
              </div>
            </div>

            <div className="bg-amber-100 border-t-2 border-amber-300 px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownloadDoc(activeDocPreview)}
                className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-amber-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} /> Скачать файл
              </button>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
