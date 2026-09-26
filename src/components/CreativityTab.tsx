import React, { useState, useRef } from 'react';
import { 
  Palette, Sparkles, Tent, Shirt, Gift, Trophy, 
  Plus, ThumbsUp, MessageSquare, Tag, X, Image as ImageIcon, CheckCircle, Send,
  Archive, ArchiveRestore, Pencil, Trash2, Check, RefreshCw, Shield
} from 'lucide-react';
import { CreativityIdea, CreativityCategory, Participant } from '../types';

interface CreativityTabProps {
  ideas: CreativityIdea[];
  currentUser: Participant | null;
  isAdmin: boolean;
  onIdeaAdded: (idea: CreativityIdea) => void;
  onIdeaUpdated?: (idea: CreativityIdea) => void;
  onIdeaArchived?: (ideaId: string, archive: boolean) => void;
  onIdeaDeleted?: (ideaId: string) => void;
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
  archived: { label: 'В архиве', color: 'bg-stone-200 text-stone-700 font-bold' }
};

export default function CreativityTab({
  ideas,
  currentUser,
  isAdmin,
  onIdeaAdded,
  onIdeaUpdated,
  onIdeaArchived,
  onIdeaDeleted,
  onIdeaVoted,
  onCommentAdded,
  onStatusChanged
}: CreativityTabProps) {
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [selectedCategory, setSelectedCategory] = useState<CreativityCategory | 'all'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAnchorPos, setAddAnchorPos] = useState<{ top: number; right: number } | null>(null);
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  // Add form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CreativityCategory>('camp_design');
  const [description, setDescription] = useState('');
  const [materialsBudget, setMaterialsBudget] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form states
  const [editingIdea, setEditingIdea] = useState<CreativityIdea | null>(null);
  const [editAnchorPos, setEditAnchorPos] = useState<{ top: number; right: number } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CreativityCategory>('camp_design');
  const [editDescription, setEditDescription] = useState('');
  const [editMaterialsBudget, setEditMaterialsBudget] = useState('');
  const [editStatus, setEditStatus] = useState<CreativityIdea['status']>('idea');
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null);
  const [editCaptainApproval, setEditCaptainApproval] = useState<'approved' | 'rejected' | null>(null);
  const [editFormError, setEditFormError] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [archiveNotice, setArchiveNotice] = useState<{ id: string; title: string } | null>(null);

  const isCaptain = Boolean(
    isAdmin || 
    currentUser?.role === 'admin' ||
    (currentUser?.nickname || '').toLowerCase().replace(/^@/, '') === 'ковбой' ||
    (currentUser?.nickname || '').toLowerCase().replace(/^@/, '') === 'cowboy' ||
    (currentUser?.email || '').toLowerCase() === 'asamoilov81@gmail.com' ||
    (currentUser?.name || '').toLowerCase().includes('самойлов')
  );

  const isDesigner = Boolean(
    currentUser?.role === 'designer' ||
    (currentUser?.role as string) === 'designer' ||
    (currentUser?.role as string) === 'дизайнер' ||
    ((currentUser as any)?.specialty || '').toLowerCase().includes('дизайн') ||
    (currentUser?.nickname || '').toLowerCase().includes('дизайн') ||
    (currentUser?.name || '').toLowerCase().includes('дизайн')
  );

  const isAuthor = (idea: CreativityIdea) => {
    return Boolean(currentUser?.id && idea.authorId === currentUser.id);
  };

  // Captain: full access. Designer: can edit ANY idea. Others: only their own ideas.
  const canEditIdea = (idea: CreativityIdea) => {
    if (isCaptain) return true;
    if (isDesigner) return true;
    if (isAuthor(idea)) return true;
    return false;
  };

  // Only Designer and Captain can change statuses of ideas; regular participants can only view status.
  const canChangeStatus = isCaptain || isDesigner;

  // Captain has full access (can delete any); others can delete only their own ideas.
  const canDeleteIdea = (idea: CreativityIdea) => {
    if (isCaptain) return true;
    if (isAuthor(idea)) return true;
    return false;
  };

  // Captain and Designer can archive any; Author can archive their own idea.
  const canArchiveIdea = (idea: CreativityIdea) => {
    if (isCaptain) return true;
    if (isDesigner) return true;
    if (isAuthor(idea)) return true;
    return false;
  };

  const isIdeaArchived = (idea: CreativityIdea) => {
    return Boolean(idea.isArchived || idea.status === 'archived');
  };

  const activeIdeas = ideas.filter(idea => !isIdeaArchived(idea));
  const archivedIdeas = ideas.filter(idea => isIdeaArchived(idea));

  const currentList = viewMode === 'active' ? activeIdeas : archivedIdeas;

  const filteredIdeas = currentList.filter(idea => {
    const matchesCategory = selectedCategory === 'all' || idea.category === selectedCategory;
    const matchesApproval = 
      approvalFilter === 'all' ||
      (approvalFilter === 'approved' && idea.captainApproval === 'approved') ||
      (approvalFilter === 'rejected' && idea.captainApproval === 'rejected') ||
      (approvalFilter === 'pending' && !idea.captainApproval);
    return matchesCategory && matchesApproval;
  });

  const handleCaptainApproval = async (ideaId: string, approval: 'approved' | 'rejected' | null) => {
    if (!isCaptain) return;

    const currentIdea = ideas.find(i => i.id === ideaId);
    if (!currentIdea) return;

    const shouldAutoArchive = (approval === 'approved' && currentIdea.status === 'done');

    const updatedIdea: CreativityIdea = {
      ...currentIdea,
      captainApproval: approval,
      captainApprovedAt: approval ? new Date().toISOString() : undefined,
      status: approval === 'approved' && currentIdea.status === 'idea' ? 'approved' : currentIdea.status,
      ...(shouldAutoArchive ? {
        isArchived: true,
        archivedAt: currentIdea.archivedAt || new Date().toISOString()
      } : {})
    };

    if (onIdeaUpdated) {
      onIdeaUpdated(updatedIdea);
    }
    if (shouldAutoArchive && onIdeaArchived) {
      onIdeaArchived(ideaId, true);
      setArchiveNotice({ id: currentIdea.id, title: currentIdea.title });
    }

    try {
      await fetch(`/api/creativity/${ideaId}/captain-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval })
      });
    } catch (err) {
      console.error('Failed to sync captain approval:', err);
    }
  };

  const handleStatusChange = async (idea: CreativityIdea, newStatus: CreativityIdea['status']) => {
    const shouldAutoArchive = (newStatus === 'done' && idea.captainApproval === 'approved');

    const updatedIdea: CreativityIdea = {
      ...idea,
      status: newStatus,
      ...(shouldAutoArchive ? {
        isArchived: true,
        archivedAt: idea.archivedAt || new Date().toISOString()
      } : {})
    };

    if (onIdeaUpdated) {
      onIdeaUpdated(updatedIdea);
    }
    if (onStatusChanged) {
      onStatusChanged(idea.id, newStatus);
    }
    if (shouldAutoArchive && onIdeaArchived) {
      onIdeaArchived(idea.id, true);
      setArchiveNotice({ id: idea.id, title: idea.title });
    }

    try {
      await fetch(`/api/creativity/${idea.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to sync status:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditPreviewImage(reader.result as string);
      } else {
        setPreviewImage(reader.result as string);
      }
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

  const handleOpenEdit = (idea: CreativityIdea, e?: React.MouseEvent) => {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setEditAnchorPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right)
      });
    }
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditCategory(idea.category);
    setEditDescription(idea.description);
    setEditMaterialsBudget(idea.materialsBudget || '');
    setEditStatus(idea.status);
    setEditPreviewImage(idea.imageUrl || null);
    setEditCaptainApproval(idea.captainApproval || null);
    setEditFormError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea) return;
    if (!canEditIdea(editingIdea)) {
      setEditFormError('У вас нет прав на редактирование этой идеи');
      return;
    }
    if (!editTitle.trim() || !editDescription.trim()) {
      setEditFormError('Заполните название и описание идеи');
      return;
    }

    const finalStatus = canChangeStatus ? editStatus : editingIdea.status;
    const effectiveApproval = isCaptain ? editCaptainApproval : editingIdea.captainApproval;
    const shouldAutoArchive = (finalStatus === 'done' && effectiveApproval === 'approved');
    const finalArchived = shouldAutoArchive ? true : (editingIdea.isArchived || finalStatus === 'archived');

    const updated: CreativityIdea = {
      ...editingIdea,
      title: editTitle.trim(),
      category: editCategory,
      description: editDescription.trim(),
      materialsBudget: editMaterialsBudget.trim() || undefined,
      status: finalStatus,
      imageUrl: editPreviewImage || undefined,
      isArchived: finalArchived,
      archivedAt: finalArchived ? (editingIdea.archivedAt || new Date().toISOString()) : undefined,
      ...(isCaptain ? { 
        captainApproval: editCaptainApproval,
        captainApprovedAt: editCaptainApproval ? (editingIdea.captainApprovedAt || new Date().toISOString()) : undefined
      } : {})
    };

    try {
      const res = await fetch(`/api/creativity/${editingIdea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updated.title,
          category: updated.category,
          description: updated.description,
          materialsBudget: updated.materialsBudget,
          status: updated.status,
          imageUrl: updated.imageUrl,
          isArchived: updated.isArchived,
          captainApproval: updated.captainApproval,
          captainApprovedAt: updated.captainApprovedAt
        })
      });
      if (res.ok) {
        if (onIdeaUpdated) onIdeaUpdated(updated);
        if (shouldAutoArchive && onIdeaArchived) {
          onIdeaArchived(editingIdea.id, true);
          setArchiveNotice({ id: editingIdea.id, title: updated.title });
        }
        setEditingIdea(null);
      } else {
        setEditFormError('Ошибка при сохранении изменений');
      }
    } catch (err) {
      setEditFormError('Сбой обращения к серверу');
    }
  };

  const handleToggleArchive = async (idea: CreativityIdea) => {
    if (!canArchiveIdea(idea)) {
      alert('У вас нет прав на управление архивом этой идеи.');
      return;
    }
    const willArchive = !isIdeaArchived(idea);
    const confirmMessage = willArchive
      ? `Отправить творческую идею «${idea.title}» в архив?`
      : `Восстановить идею «${idea.title}» из архива в активные?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/creativity/${idea.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: willArchive })
      });
      if (res.ok) {
        const updated: CreativityIdea = {
          ...idea,
          isArchived: willArchive,
          status: willArchive ? 'archived' : (idea.status === 'archived' ? 'idea' : idea.status),
          archivedAt: willArchive ? new Date().toISOString() : undefined
        };
        if (onIdeaUpdated) onIdeaUpdated(updated);
        if (onIdeaArchived) onIdeaArchived(idea.id, willArchive);
      }
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  const handleDeleteIdea = async (idea: CreativityIdea) => {
    if (!canDeleteIdea(idea)) {
      alert('Участники могут удалять только те идеи, которые создали они сами.');
      return;
    }
    if (!confirm(`Удалить идею «${idea.title}» навсегда? Это действие необратимо.`)) return;

    try {
      const res = await fetch(`/api/creativity/${idea.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (onIdeaDeleted) onIdeaDeleted(idea.id);
      }
    } catch (err) {
      console.error('Failed to delete idea:', err);
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
      console.error('Error adding comment:', err);
    }
  };

  const handleVote = async (ideaId: string) => {
    if (!currentUser) {
      alert('Войдите под своим именем, чтобы голосовать за идеи!');
      return;
    }
    try {
      const res = await fetch(`/api/creativity/${ideaId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onIdeaVoted(ideaId);
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 border-4 border-red-600 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-red-600 text-yellow-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                Арт-Цех & Творчество
              </span>
              {isCaptain ? (
                <span className="bg-red-700 text-white font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5 border border-yellow-300/40">
                  <Shield size={13} className="text-yellow-300" /> Капитан (Полный доступ & Резолюция)
                </span>
              ) : isDesigner ? (
                <span className="bg-purple-700 text-white font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5 border border-purple-300/40">
                  <Palette size={13} className="text-yellow-300" /> Дизайнер (Управление идеями и статусами)
                </span>
              ) : (
                <span className="bg-amber-900/90 text-amber-100 font-bold text-[11px] px-3 py-1 rounded-full tracking-wide shadow flex items-center gap-1">
                  Участник команды (Свои идеи, голосование и чат)
                </span>
              )}
              {viewMode === 'archived' && (
                <span className="bg-stone-800 text-amber-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
                  <Archive size={12} /> Архив
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-red-700 uppercase tracking-tight">
              Творческие Идеи к Слёту
            </h2>
            <p className="text-xs sm:text-sm font-bold text-amber-950 max-w-2xl mt-1">
              {isCaptain
                ? 'Полный доступ Капитана: окончательная резолюция («ОДОБРЕНО» / «НЕ ОДОБРЕНО»), редактирование любых идей, смена статусов и удаление.'
                : isDesigner
                ? 'Панель Дизайнера: управление разделом — создание, редактирование любых идей команды и управление статусами реализации.'
                : 'Предлагайте идеи, редактируйте и удаляйте свои задумки, голосуйте и участвуйте в обсуждении любых идей в чате!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-yellow-200/90 p-1 rounded-2xl border-2 border-amber-400 flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('active')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  viewMode === 'active'
                    ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                    : 'text-amber-950 hover:bg-yellow-300/80'
                }`}
              >
                <Sparkles size={14} />
                <span>Идеи ({activeIdeas.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('archived')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                  viewMode === 'archived'
                    ? 'bg-stone-800 text-amber-300 shadow-md scale-105'
                    : 'text-amber-950 hover:bg-yellow-300/80'
                }`}
              >
                <Archive size={14} />
                <span>Архив ({archivedIdeas.length})</span>
              </button>
            </div>

            {/* Propose idea button */}
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setAddAnchorPos({
                  top: rect.bottom + 8,
                  right: Math.max(12, window.innerWidth - rect.right)
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs sm:text-sm rounded-2xl shadow-md transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Предложить идею</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t-2 border-red-600/30">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-yellow-300 shadow-md scale-105'
                : 'bg-yellow-200 text-amber-950 hover:bg-yellow-300'
            }`}
          >
            Все ({currentList.length})
          </button>

          {CATEGORIES.map(cat => {
            const count = currentList.filter(i => i.category === cat.key).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
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

        {/* Captain Approval Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-red-600/20 text-xs">
          <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1 mr-1">
            <Shield size={13} className="text-red-700" /> Печать Капитана:
          </span>
          <button
            type="button"
            onClick={() => setApprovalFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition-all ${
              approvalFilter === 'all'
                ? 'bg-amber-950 text-yellow-300 shadow-xs'
                : 'bg-yellow-100/90 text-amber-950 hover:bg-yellow-200'
            }`}
          >
            Все ({currentList.length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('approved')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              approvalFilter === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs scale-105'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
            }`}
          >
            <Check size={12} className="stroke-[3]" />
            Одобрено ({currentList.filter(i => i.captainApproval === 'approved').length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('rejected')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              approvalFilter === 'rejected'
                ? 'bg-red-700 text-yellow-300 shadow-xs scale-105'
                : 'bg-red-100 text-red-900 hover:bg-red-200 border border-red-300'
            }`}
          >
            <X size={12} className="stroke-[3]" />
            Не одобрено ({currentList.filter(i => i.captainApproval === 'rejected').length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('pending')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition-all ${
              approvalFilter === 'pending'
                ? 'bg-amber-800 text-yellow-200 shadow-xs scale-105'
                : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
            }`}
          >
            На рассмотрении ({currentList.filter(i => !i.captainApproval).length})
          </button>
        </div>
      </div>

      {/* Auto-archive banner notice */}
      {archiveNotice && (
        <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Archive size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                <span>★</span> Идея «{archiveNotice.title}» утверждена и готова к слёту!
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Идея с печатью Капитана и статусом «Готово к слёту» автоматически перенесена в Архив.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode('archived');
                setArchiveNotice(null);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Archive size={13} />
              Открыть в Архиве
            </button>
            <button
              type="button"
              onClick={() => setArchiveNotice(null)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-emerald-100 rounded-xl cursor-pointer"
              title="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-16 bg-white/80 border-3 border-dashed border-amber-300 rounded-3xl p-6 shadow-sm">
          {viewMode === 'active' ? (
            <>
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-3" />
              <h3 className="font-black text-lg text-amber-950 uppercase">В этой категории пока нет идей</h3>
              <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                Предложите оформление, идею костюма или дизайн командной одежды!
              </p>
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setAddAnchorPos({
                    top: rect.bottom + 8,
                    right: Math.max(12, window.innerWidth - rect.right)
                  });
                  setShowAddModal(true);
                }}
                className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow cursor-pointer"
              >
                Создать первую идею
              </button>
            </>
          ) : (
            <>
              <Archive className="w-16 h-16 text-stone-400 mx-auto mb-3" />
              <h3 className="font-black text-lg text-stone-800 uppercase">Архив идей пуст</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                Здесь сохраняются реализованные или отправленные в архив идеи прошлых слётов.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIdeas.map(idea => {
            const catInfo = CATEGORIES.find(c => c.key === idea.category);
            const statusInfo = STATUS_LABELS[idea.status] || STATUS_LABELS.idea;
            const isVoted = currentUser && idea.votedUserIds?.includes(currentUser.id);
            const isCommentsOpen = expandedCommentsId === idea.id;
            const archived = isIdeaArchived(idea);
            const ideaIsAuthor = isAuthor(idea);
            const ideaCanEdit = canEditIdea(idea);
            const ideaCanDelete = canDeleteIdea(idea);
            const ideaCanArchive = canArchiveIdea(idea);

            return (
              <div 
                key={idea.id}
                className={`bg-white border-3 ${
                  archived 
                    ? 'border-stone-300 bg-stone-50/70' 
                    : idea.captainApproval === 'approved'
                    ? 'border-emerald-300 hover:border-emerald-500 shadow-sm'
                    : idea.captainApproval === 'rejected'
                    ? 'border-red-300 hover:border-red-500 shadow-sm'
                    : 'border-amber-200 hover:border-red-500'
                } rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
              >
                {/* LARGE RUBBER STAMP: ОДОБРЕНО */}
                {idea.captainApproval === 'approved' && (
                  <div 
                    className="absolute top-12 right-3 sm:right-6 pointer-events-none select-none z-20 transform -rotate-12 transition-all duration-300 animate-in zoom-in-75"
                    aria-label="Печать: Одобрено Капитаном"
                  >
                    <div className="border-[3.5px] border-dashed border-emerald-600 bg-emerald-50/90 backdrop-blur-xs text-emerald-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-xl ring-2 ring-emerald-600/40 text-center uppercase tracking-widest font-black">
                      <div className="text-[9px] sm:text-[10px] font-mono tracking-widest text-emerald-800 flex items-center justify-center gap-1 border-b border-emerald-600/40 pb-1">
                        <span>★</span> ШТАБ КАПИТАНА НЕГОДЯЕВ <span>★</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono tracking-widest text-emerald-700 py-1 font-black drop-shadow-xs">
                        ОДОБРЕНО
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-emerald-800/90 border-t border-emerald-600/40 pt-0.5 flex items-center justify-center gap-1">
                        <span>✓</span> К СЛЁТУ УТВЕРЖДЕНО <span>✓</span>
                        {idea.captainApprovedAt && (
                          <span className="opacity-75 ml-1">
                            ({new Date(idea.captainApprovedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* LARGE RUBBER STAMP: НЕ ОДОБРЕНО */}
                {idea.captainApproval === 'rejected' && (
                  <div 
                    className="absolute top-12 right-3 sm:right-6 pointer-events-none select-none z-20 transform rotate-12 transition-all duration-300 animate-in zoom-in-75"
                    aria-label="Печать: Не одобрено Капитаном"
                  >
                    <div className="border-[3.5px] border-dashed border-red-600 bg-red-50/90 backdrop-blur-xs text-red-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-xl ring-2 ring-red-600/40 text-center uppercase tracking-widest font-black">
                      <div className="text-[9px] sm:text-[10px] font-mono tracking-widest text-red-700 flex items-center justify-center gap-1 border-b border-red-600/40 pb-1">
                        <span>✖</span> ШТАБ КАПИТАНА НЕГОДЯЕВ <span>✖</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono tracking-widest text-red-600 py-1 font-black drop-shadow-xs">
                        НЕ ОДОБРЕНО
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-mono tracking-wider text-red-700/90 border-t border-red-600/40 pt-0.5 flex items-center justify-center gap-1">
                        <span>✕</span> ОТКЛОНЕНО КАПИТАНОМ <span>✕</span>
                        {idea.captainApprovedAt && (
                          <span className="opacity-75 ml-1">
                            ({new Date(idea.captainApprovedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  {/* Category and Status Badge + Manage Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catInfo?.color || ''}`}>
                        {catInfo?.label}
                      </span>
                      {ideaIsAuthor && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400">
                          Моя идея
                        </span>
                      )}
                      {archived ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 flex items-center gap-1">
                            <Archive size={11} /> В архиве
                          </span>
                          {idea.status === 'done' && (
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-700 text-white flex items-center gap-1 shadow-2xs">
                              <Check size={11} className="stroke-[3]" /> Готово к слёту
                            </span>
                          )}
                        </div>
                      ) : (
                        canChangeStatus ? (
                          <select
                            value={idea.status}
                            onChange={(e) => handleStatusChange(idea, e.target.value as any)}
                            className="text-[11px] font-black uppercase px-2.5 py-1 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-950 cursor-pointer hover:bg-yellow-100 hover:border-red-400 transition-all outline-none"
                            title={idea.captainApproval === 'approved' ? 'При выборе «Готово к слёту» идея автоматически перенесётся в архив' : 'Изменить статус идеи (Дизайнер / Капитан)'}
                          >
                            <option value="idea">Идея</option>
                            <option value="discussing">Обсуждение</option>
                            <option value="approved">Одобрено командой</option>
                            <option value="in_progress">В производстве</option>
                            <option value="done">
                              Готово к слёту {idea.captainApproval === 'approved' ? '➔ в Архив' : ''}
                            </option>
                          </select>
                        ) : (
                          <span 
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}
                            title="Статус устанавливают Дизайнер или Капитан"
                          >
                            {statusInfo.label}
                          </span>
                        )
                      )}
                    </div>

                    {/* Action buttons: Edit, Archive/Restore, Delete */}
                    <div className="flex items-center gap-1">
                      {ideaCanEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(idea, e)}
                          className="p-1.5 text-amber-800 hover:text-red-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          title={ideaIsAuthor && !isCaptain && !isDesigner ? 'Редактировать свою идею' : 'Редактировать идею'}
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {ideaCanArchive && (
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(idea)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            archived
                              ? 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900'
                              : 'text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                          }`}
                          title={archived ? 'Восстановить из архива' : 'Отправить в архив'}
                        >
                          {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </button>
                      )}

                      {ideaCanDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(idea)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={isCaptain ? 'Удалить идею (полный доступ Капитана)' : 'Удалить свою идею'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-black text-lg text-amber-950 mb-2 leading-snug">{idea.title}</h4>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line mb-3">
                    {idea.description}
                  </p>

                  {/* Optional Image */}
                  {idea.imageUrl && idea.imageUrl.trim() ? (
                    <div className="mb-3 rounded-2xl overflow-hidden border-2 border-amber-200 aspect-video bg-amber-50">
                      <img src={idea.imageUrl.trim()} alt={idea.title} className="w-full h-full object-cover" />
                    </div>
                  ) : null}

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

                {/* Captain Approval Resolution Action Bar */}
                <div className="my-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield size={16} className="text-red-600 shrink-0" />
                    <span className="text-[11px] font-black uppercase text-amber-950">
                      Резолюция Капитана:
                    </span>
                    {idea.captainApproval === 'approved' ? (
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border-2 border-emerald-400 flex items-center gap-1 shadow-2xs">
                        <Check size={13} className="stroke-[3]" /> Одобрено
                      </span>
                    ) : idea.captainApproval === 'rejected' ? (
                      <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-red-100 text-red-800 border-2 border-red-400 flex items-center gap-1 shadow-2xs">
                        <X size={13} className="stroke-[3]" /> Не одобрено
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-500 font-semibold italic bg-amber-100/60 px-2 py-0.5 rounded-lg">
                        Ожидает решения
                      </span>
                    )}
                  </div>

                  {isCaptain ? (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleCaptainApproval(idea.id, 'approved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                          idea.captainApproval === 'approved'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md scale-105'
                            : 'bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-400'
                        }`}
                        title="Поставить печать: ОДОБРЕНО"
                      >
                        <Check size={14} className="stroke-[3]" /> Одобрить
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCaptainApproval(idea.id, 'rejected')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                          idea.captainApproval === 'rejected'
                            ? 'bg-red-600 text-yellow-300 ring-2 ring-red-400 shadow-md scale-105'
                            : 'bg-white hover:bg-red-50 text-red-700 border-2 border-red-400'
                        }`}
                        title="Поставить печать: НЕ ОДОБРЕНО"
                      >
                        <X size={14} className="stroke-[3]" /> Отклонить
                      </button>

                      {idea.captainApproval && (
                        <button
                          type="button"
                          onClick={() => handleCaptainApproval(idea.id, null)}
                          className="text-stone-500 hover:text-red-700 hover:bg-stone-200/80 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                          title="Снять резолюцию"
                        >
                          Сброс
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-500 italic ml-auto">
                      Право резолюции у Капитана
                    </span>
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
                        disabled={archived}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all ${
                          isVoted
                            ? 'bg-red-600 text-yellow-300 shadow-sm'
                            : 'bg-amber-100 text-amber-900 hover:bg-red-100 hover:text-red-700'
                        } ${archived ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                  {/* Comments accordion */}
                  {isCommentsOpen && (
                    <div className="mt-4 pt-3 border-t border-amber-200 space-y-3">
                      <h5 className="font-black text-xs uppercase text-amber-900 flex items-center gap-1">
                        <MessageSquare size={12} />
                        Обсуждение идеи:
                      </h5>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {idea.comments && idea.comments.length > 0 ? (
                          idea.comments.map(c => (
                            <div key={c.id} className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold mb-1">
                                <span>{c.authorName}</span>
                                <span>{c.createdAt}</span>
                              </div>
                              <p className="text-amber-950 font-medium">{c.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-amber-600 italic">Пока нет комментариев. Напишите первым!</p>
                        )}
                      </div>

                      {/* Add comment box */}
                      {!archived && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={commentInput[idea.id] || ''}
                            onChange={(e) => setCommentInput(prev => ({ ...prev, [idea.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendComment(idea.id);
                            }}
                            placeholder="Написать замечание или совет..."
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:border-red-500 outline-none text-amber-950 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendComment(idea.id)}
                            className="p-2 bg-red-600 text-yellow-300 rounded-xl hover:bg-red-700 transition-colors"
                            title="Отправить"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW CREATIVITY IDEA */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Новая творческая идея"
            onClick={(e) => e.stopPropagation()}
            className="bg-amber-50 border-4 border-red-600 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto"
          >
            <div className="bg-yellow-400 border-b-4 border-red-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="text-red-700 w-6 h-6" />
                <h3 className="font-black text-lg uppercase text-red-700 tracking-tight">
                  Новая творческая идея
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-red-700 hover:text-red-900 bg-yellow-300 hover:bg-yellow-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
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
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
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
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
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
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
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
                  {previewImage && previewImage.trim() ? (
                    <div className="space-y-1">
                      <img src={previewImage.trim()} alt="Эскиз" className="max-h-32 mx-auto rounded object-contain" />
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
                    onChange={(e) => handleFileChange(e, false)}
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

      {/* MODAL: EDIT CREATIVITY IDEA */}
      {editingIdea && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setEditingIdea(null)} 
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Редактировать идею"
            onClick={(e) => e.stopPropagation()}
            className="bg-amber-50 border-4 border-amber-600 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto"
          >
            <div className="bg-amber-400 border-b-4 border-amber-600 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="text-amber-950 w-5 h-5" />
                <h3 className="font-black text-lg uppercase text-amber-950 tracking-tight">
                  Редактировать идею
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingIdea(null)}
                className="text-amber-900 hover:text-red-900 bg-amber-300 hover:bg-amber-200 rounded-full p-1.5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editFormError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs text-red-800 font-bold">
                  {editFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Категория
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CreativityCategory)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Статус реализации
                </label>
                {canChangeStatus ? (
                  <>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as CreativityIdea['status'])}
                      className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                    >
                      <option value="idea">Идея</option>
                      <option value="discussing">Обсуждение</option>
                      <option value="approved">Одобрено командой</option>
                      <option value="in_progress">В производстве</option>
                      <option value="done">
                        Готово к слёту {(editCaptainApproval === 'approved' || (!isCaptain && editingIdea?.captainApproval === 'approved')) ? '➔ Авто-перенос в Архив' : ''}
                      </option>
                      <option value="archived">В архиве</option>
                    </select>
                    {((editCaptainApproval === 'approved' || (!isCaptain && editingIdea?.captainApproval === 'approved')) && editStatus === 'done') && (
                      <p className="mt-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                        <Archive size={13} className="shrink-0" /> При сохранении с одобрением Капитана идея будет автоматически отправлена в архив.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-100/60 rounded-xl border border-amber-300">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_LABELS[editingIdea?.status || 'idea']?.color || ''}`}>
                      {STATUS_LABELS[editingIdea?.status || 'idea']?.label || editingIdea?.status}
                    </span>
                    <span className="text-[11px] text-amber-900 font-semibold italic">
                      (Статусы устанавливают Дизайнер и Капитан)
                    </span>
                  </div>
                )}
              </div>

              {isCaptain && (
                <div className="bg-amber-100/70 p-3 rounded-2xl border-2 border-amber-300">
                  <label className="block text-xs font-black uppercase text-amber-950 mb-1 flex items-center gap-1.5">
                    <Shield size={14} className="text-red-600" />
                    Резолюция Капитана (Печать)
                  </label>
                  <select
                    value={editCaptainApproval || ''}
                    onChange={(e) => setEditCaptainApproval((e.target.value as any) || null)}
                    className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-black text-amber-950 outline-none"
                  >
                    <option value="">Без резолюции (Ожидает решения)</option>
                    <option value="approved">ОДОБРЕНО (Печать «ОДОБРЕНО»)</option>
                    <option value="rejected">НЕ ОДОБРЕНО (Печать «НЕ ОДОБРЕНО»)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Название идеи *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Описание замысла и детали *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Необходимые материалы и бюджет
                </label>
                <input
                  type="text"
                  value={editMaterialsBudget}
                  onChange={(e) => setEditMaterialsBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs font-semibold text-amber-950 outline-none"
                />
              </div>

              {/* Optional Photo / Sketch */}
              <div>
                <label className="block text-xs font-black uppercase text-amber-900 mb-1">
                  Эскиз или пример фото
                </label>
                <div 
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-400 hover:border-red-500 rounded-xl p-3 text-center cursor-pointer bg-white"
                >
                  {editPreviewImage && editPreviewImage.trim() ? (
                    <div className="space-y-1">
                      <img src={editPreviewImage.trim()} alt="Эскиз" className="max-h-32 mx-auto rounded object-contain" />
                      <p className="text-[11px] font-bold text-emerald-700">Нажмите для замены фото</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2 text-amber-800 text-xs font-bold">
                      <ImageIcon size={16} /> Прикрепить эскиз / фото
                    </div>
                  )}
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, true)}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold uppercase text-xs rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
