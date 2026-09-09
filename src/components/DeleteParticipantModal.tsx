import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { Participant, ROLE_DEFINITIONS } from '../types';
import { getParticipantAvatar } from '../utils/avatar';

interface DeleteParticipantModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (participantId: string) => Promise<void> | void;
}

export default function DeleteParticipantModal({
  participant,
  isOpen,
  onClose,
  onConfirm
}: DeleteParticipantModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !participant) return null;

  const roleMeta = participant.role ? ROLE_DEFINITIONS[participant.role] : null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(participant.id);
      onClose();
    } catch (err) {
      console.error("Error during participant deletion:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div 
        className="bg-white border-2 border-red-500 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white border-b border-red-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-yellow-300 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-white leading-tight">
                Удаление члена команды
              </h3>
              <p className="text-[11px] text-yellow-200">
                Действие доступно только Капитану команды
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Main Control Question */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 text-red-600 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-black text-base sm:text-lg text-red-700 leading-snug">
              Вы действительно хотите удалить члена команды?
            </h4>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              При этом <strong className="text-red-700">полностью удаляется аккаунт</strong> из базы данных, аннулируются все доступы к сайту и слёту команды «Негодяи».
            </p>
          </div>

          {/* Member Card */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 flex items-center gap-3">
            <img 
              src={getParticipantAvatar(participant)} 
              alt={participant.name}
              className="w-12 h-12 rounded-full border border-stone-300 object-cover bg-white shrink-0 shadow-xs" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-stone-900 truncate">
                  {participant.name}
                </span>
                <span className="text-xs font-semibold text-red-600">
                  @{participant.nickname}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {roleMeta && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.color}`}>
                    {roleMeta.icon} {roleMeta.title}
                  </span>
                )}
                {participant.email && (
                  <span className="text-[11px] text-stone-500 truncate">
                    ✉️ {participant.email}
                  </span>
                )}
                {participant.phone && (
                  <span className="text-[11px] text-stone-500">
                    📞 {participant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Irreversible notice */}
          <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-amber-50/80 border border-amber-200 rounded-lg p-2.5">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Это действие необратимо. Чтобы снова получить доступ к сайту, участнику потребуется повторно проходить регистрацию и получать одобрение Капитана.
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 px-5 py-3.5 border-t border-stone-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 shadow-xs transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Удаление аккаунта...' : 'Да, удалить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
