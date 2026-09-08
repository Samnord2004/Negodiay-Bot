import React, { useState, useRef } from 'react';
import { 
  FileText, Plus, Download, Trash2, Eye, Folder, BookOpen, 
  Compass, Search, X, Upload, Image as ImageIcon, FileCheck, ZoomIn
} from 'lucide-react';
import { TeamDocument, TeamDocumentCategory, Participant } from '../types';
import { compressImage } from '../utils/imageCompressor';

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
  const [activeCategory, setActiveCategory] = useState<'all' | TeamDocumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<TeamDocument | null>(null);
  const [activeImageLightbox, setActiveImageLightbox] = useState<{ url: string; title: string } | null>(null);

  // Add document form states
  const [newCategory, setNewCategory] = useState<TeamDocumentCategory>('rally');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // File upload state
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileType, setUploadedFileType] = useState<'pdf' | 'doc' | 'image' | 'guide'>('guide');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()));
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
      case 'rally': return 'bg-red-50 text-red-700 border-red-200';
      case 'statutory': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'prep': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Handle file / photo selection
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setFormError('');

    const formattedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} МБ` 
      : `${Math.round(file.size / 1024)} КБ`;
    setUploadedFileSize(formattedSize);
    setUploadedFileName(file.name);

    // Auto-fill title if empty
    if (!newTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setNewTitle(cleanName);
    }

    try {
      if (file.type.startsWith('image/')) {
        // Image file / photo of document: compress for crisp fast viewing
        const compressed = await compressImage(file, 1800, 0.88);
        setUploadedFileUrl(compressed);
        setUploadedFileType('image');
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF document: read as Data URL
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedFileUrl(reader.result as string);
          setUploadedFileType('pdf');
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        // Text file: read content into text field
        const reader = new FileReader();
        reader.onload = () => {
          setNewContent(reader.result as string);
          setUploadedFileType('guide');
        };
        reader.readAsText(file);
      } else {
        // Other office / binary files (.doc, .docx, .xls)
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedFileUrl(reader.result as string);
          setUploadedFileType('doc');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File process error:', err);
      setFormError('Не удалось обработать файл. Попробуйте другой формат.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewContent('');
    setUploadedFileUrl(null);
    setUploadedFileName('');
    setUploadedFileType('guide');
    setUploadedFileSize('');
    setFormError('');
    setShowAddModal(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim() || !newDescription.trim()) {
      setFormError('Заполните название и краткое описание документа');
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          title: newTitle.trim(),
          description: newDescription.trim(),
          content: newContent || (uploadedFileUrl ? `Прикреплен файл документа: ${uploadedFileName}` : newDescription.trim()),
          fileUrl: uploadedFileUrl || undefined,
          fileName: uploadedFileName || `${newTitle.trim()}.${uploadedFileType === 'image' ? 'jpg' : 'pdf'}`,
          fileType: uploadedFileType,
          uploadedBy: currentUser ? `${currentUser.name} (@${currentUser.nickname})` : 'Капитан команды'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onDocumentAdded(data.document);
        resetForm();
      } else {
        setFormError(data.error || 'Ошибка при сохранении документа');
      }
    } catch (err) {
      setFormError('Сбой соединения с сервером');
    }
  };

  const handleDownloadDoc = (doc: TeamDocument) => {
    if (doc.fileUrl) {
      // Download binary file / image
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName || `${doc.title}.${doc.fileType === 'image' ? 'jpg' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate clean text file
      const textData = `=== ${doc.title} ===\nКатегория: ${getCategoryLabel(doc.category)}\nДата: ${doc.uploadedAt}\nАвтор: ${doc.uploadedBy}\n\nОписание:\n${doc.description}\n\nСодержание документа:\n${doc.content || doc.description}`;
      const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName || `${doc.title}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Light & Airy Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1.5">
              📁 Документы Негодяев
            </span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Всего: {documents.length} шт.
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 uppercase tracking-tight">
            База документов и положений
          </h2>
          <p className="text-xs sm:text-sm font-medium text-stone-500">
            Регламенты турслётов, уставные правила команды, фото и скан-копии документов
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold uppercase text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Добавить документ или фото
        </button>
      </div>

      {/* 3 Explicit Subsections required by user */}
      <div className="bg-stone-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-stone-200">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeCategory === 'all'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Folder size={14} className={activeCategory === 'all' ? 'text-red-600' : 'text-stone-400'} />
          Все документы ({documents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('rally')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeCategory === 'rally'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass size={14} className={activeCategory === 'rally' ? 'text-red-600' : 'text-stone-400'} />
          Документы слёта ({documents.filter(d => d.category === 'rally').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('statutory')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeCategory === 'statutory'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BookOpen size={14} className={activeCategory === 'statutory' ? 'text-red-600' : 'text-stone-400'} />
          Уставные документы ({documents.filter(d => d.category === 'statutory').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('prep')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
            activeCategory === 'prep'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <FileText size={14} className={activeCategory === 'prep' ? 'text-red-600' : 'text-stone-400'} />
          В помощь к подготовке ({documents.filter(d => d.category === 'prep').length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск документа по названию или тексту..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 focus:border-red-500 rounded-xl text-xs sm:text-sm font-medium text-stone-900 focus:outline-hidden shadow-xs transition-colors"
          />
        </div>
        <p className="text-xs text-stone-500 font-semibold hidden sm:block">
          Найдено: {filteredDocs.length}
        </p>
      </div>

      {/* Documents List / Cards */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-stone-300 rounded-2xl p-6">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-2" />
          <h3 className="font-bold text-base text-stone-900">В этом разделе пока нет документов</h3>
          <p className="text-xs text-stone-500 mt-1">
            Нажмите «Добавить документ или фото», чтобы загрузить положение, файл или фотокопию.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map(doc => {
            const isPhotoDoc = doc.fileType === 'image' || (doc.fileUrl && (doc.fileUrl.startsWith('data:image/') || doc.fileUrl.endsWith('.jpg') || doc.fileUrl.endsWith('.png')));

            return (
              <div
                key={doc.id}
                className="bg-white border border-stone-200 hover:border-amber-300 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(doc.category)}`}>
                      {getCategoryLabel(doc.category)}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">{doc.uploadedAt}</span>
                  </div>

                  {/* Photo Thumbnail if document is an image/photo scan */}
                  {isPhotoDoc && doc.fileUrl && (
                    <div 
                      onClick={() => setActiveImageLightbox({ url: doc.fileUrl!, title: doc.title })}
                      className="relative h-40 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer group/img"
                    >
                      <img 
                        src={doc.fileUrl} 
                        alt={doc.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-2xs">
                        <ZoomIn size={16} /> Смотреть фото документа
                      </div>
                      <span className="absolute bottom-2 left-2 bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ImageIcon size={11} /> Фотокопия
                      </span>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-base text-stone-900 mb-1 flex items-center gap-2">
                      {isPhotoDoc ? (
                        <ImageIcon size={17} className="text-amber-600 shrink-0" />
                      ) : (
                        <FileText size={17} className="text-red-600 shrink-0" />
                      )}
                      <span>{doc.title}</span>
                    </h4>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  {doc.fileName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200 w-fit">
                      <FileCheck size={13} className="text-emerald-600" />
                      <span className="truncate max-w-[200px]">{doc.fileName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-stone-400 font-medium">
                    {doc.uploadedBy}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPhotoDoc && doc.fileUrl ? (
                      <button
                        type="button"
                        onClick={() => setActiveImageLightbox({ url: doc.fileUrl!, title: doc.title })}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
                        title="Открыть фото документа"
                      >
                        <Eye size={13} /> Фото
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveDocPreview(doc)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        title="Читать содержание документа"
                      >
                        <Eye size={13} /> Читать
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(doc)}
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg transition-colors"
                      title="Скачать файл / фото документа"
                    >
                      <Download size={14} />
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDocumentDeleted(doc.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Удалить документ (Капитан)"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD DOCUMENT / PHOTO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden my-6 animate-in fade-in">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-red-600 w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900">
                  Добавление документа или фотокопии
                </h3>
              </div>
              <button 
                onClick={resetForm}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              {/* Upload File / Photo Dropzone */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1.5">
                  Прикрепить файл или фото документа:
                </label>

                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                />

                {!uploadedFileUrl && !uploadedFileName ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-2xl p-5 text-center cursor-pointer bg-stone-50/70 hover:bg-stone-50 transition-all group"
                  >
                    <Upload className="w-8 h-8 text-stone-400 group-hover:text-red-600 mx-auto mb-2 transition-colors" />
                    <p className="text-xs font-bold text-stone-800">
                      Нажмите для выбора файла или перетащите сюда
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Поддерживаются фото (JPG, PNG), PDF, Word (DOCX) и текстовые файлы
                    </p>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {uploadedFileType === 'image' && uploadedFileUrl ? (
                        <img 
                          src={uploadedFileUrl} 
                          alt="preview" 
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                          <FileText size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-stone-900 truncate max-w-[220px]">
                          {uploadedFileName}
                        </p>
                        <p className="text-[10px] text-stone-500 font-medium">
                          {uploadedFileType === 'image' ? 'Фото документа' : 'Файл'} • {uploadedFileSize}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileUrl(null);
                        setUploadedFileName('');
                        setUploadedFileSize('');
                        setUploadedFileType('guide');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg"
                      title="Удалить файл"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                  Подраздел документа *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TeamDocumentCategory)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden"
                >
                  <option value="rally">Документы слёта</option>
                  <option value="statutory">Уставные документы</option>
                  <option value="prep">Документы в помощь к подготовке и конкурсам</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                  Название документа *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Положение турслёта 2026 или Кодекс кострового"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                  Краткое описание *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="О чем документ, для кого предназначен, ключевые правила..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                  Текст / Полное содержание (по желанию):
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Вставьте полный текст регламента или заметок..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-red-500 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isProcessingFile}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Plus size={14} />
                  Сохранить документ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden my-6 animate-in fade-in">
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="text-red-600 w-5 h-5" />
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(activeDocPreview.category)}`}>
                    {getCategoryLabel(activeDocPreview.category)}
                  </span>
                  <h3 className="font-bold text-base text-stone-900 mt-0.5">
                    {activeDocPreview.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveDocPreview(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 leading-relaxed font-medium">
                {activeDocPreview.description}
              </div>

              {/* If preview has photo attachment */}
              {activeDocPreview.fileUrl && (activeDocPreview.fileType === 'image' || activeDocPreview.fileUrl.startsWith('data:image/')) && (
                <div className="rounded-xl overflow-hidden border border-stone-200">
                  <img 
                    src={activeDocPreview.fileUrl} 
                    alt={activeDocPreview.title} 
                    className="w-full max-h-96 object-contain bg-stone-900"
                  />
                </div>
              )}

              {activeDocPreview.content && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs sm:text-sm font-mono whitespace-pre-wrap text-stone-800 leading-relaxed">
                  {activeDocPreview.content}
                </div>
              )}

              <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1 font-medium">
                <span>Опубликовал: {activeDocPreview.uploadedBy}</span>
                <span>Дата: {activeDocPreview.uploadedAt}</span>
              </div>
            </div>

            <div className="bg-stone-50 border-t border-stone-100 px-6 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDownloadDoc(activeDocPreview)}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download size={14} /> Скачать документ
              </button>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-xl shadow-xs transition-colors"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX FOR PHOTO DOCUMENTS */}
      {activeImageLightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setActiveImageLightbox(null)}
        >
          <div 
            className="max-w-4xl max-h-[90vh] flex flex-col bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-amber-400" />
                <span className="text-xs font-bold truncate max-w-[300px]">{activeImageLightbox.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeImageLightbox.url}
                  download={`${activeImageLightbox.title}.jpg`}
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Download size={13} /> Скачать
                </a>
                <button
                  onClick={() => setActiveImageLightbox(null)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img 
                src={activeImageLightbox.url} 
                alt={activeImageLightbox.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
