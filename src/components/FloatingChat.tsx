import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Image as ImageIcon, X, Minimize2, 
  Maximize2, ChevronDown, ArrowDown, Bot, Sparkles, Award, 
  CheckSquare, Coffee, Coins, Cake, Compass
} from 'lucide-react';
import { ChatMessage, Participant, ROLE_DEFINITIONS } from '../types';

interface FloatingChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  currentUser: Participant | null;
  participants: Participant[];
}

const QUICK_EMOJIS = ['🏕️', '🔥', '🍻', '🌲', '🏆', '🧭', '🍖', '🚩'];

const BOT_PROMPTS = [
  { label: '🎂 Дни рождения', prompt: 'Бот, кто у нас именинник и у кого ближайшие дни рождения?' },
  { label: '📋 Задачи слёта', prompt: 'Бот, огласи список горящих задач по слёту и ответственных!' },
  { label: '🍲 Меню слёта', prompt: 'Бот, какое у нас меню на слёте и что осталось докупить?' },
  { label: '🏆 Конкурсы', prompt: 'Бот, расскажи про конкурсы слёта и пришли схемы!' },
  { label: '💰 Должники', prompt: 'Бот, огласи список должников по сборам слёта!' },
  { label: '🌲 Как гуляет негодяй?', prompt: 'Как гуляет негодяй?' },
];

export default function FloatingChat({
  messages,
  onSendMessage,
  currentUser,
  participants
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll states to prevent auto-scrolling when reading previous messages
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = useRef(messages.length);
  const prevOpenRef = useRef(isOpen);

  // Smooth or instant scroll to bottom of the chat container ONLY (never whole window)
  const scrollToBottom = (smooth = true) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setIsAtBottom(true);
    setHasNewMessagesBelow(false);
  };

  // Check scroll position inside chat container
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setHasNewMessagesBelow(false);
    }
  };

  // Handle open/close scroll
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Just opened: instantly jump to bottom of chat
      setTimeout(() => scrollToBottom(false), 50);
      setUnreadCount(0);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle new incoming messages
  useEffect(() => {
    const isNew = messages.length > prevMessagesLenRef.current;
    prevMessagesLenRef.current = messages.length;

    if (!isOpen) {
      if (isNew) {
        setUnreadCount(prev => prev + 1);
      }
      return;
    }

    // Chat is currently open
    setUnreadCount(0);
    if (isNew) {
      if (isAtBottom) {
        // User is at bottom: keep following along
        setTimeout(() => scrollToBottom(true), 60);
      } else {
        // User is looking at older messages: DO NOT SCROLL!
        setHasNewMessagesBelow(true);
      }
    }
  }, [messages.length, isOpen, isAtBottom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageUrl) return;

    onSendMessage(inputText.trim(), imageUrl || undefined);
    setInputText('');
    setImageUrl('');
    setShowPhotoInput(false);

    // After sending own message, always slide down to bottom
    setTimeout(() => scrollToBottom(true), 80);
  };

  const handleSendBotPrompt = (prompt: string) => {
    onSendMessage(prompt);
    setTimeout(() => scrollToBottom(true), 80);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        if (uploadEvt.target?.result) {
          setImageUrl(uploadEvt.target.result as string);
          setShowPhotoInput(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to find member role
  const getParticipantRole = (msg: ChatMessage) => {
    if (msg.isBot || msg.senderNickname === 'negodyai_bot') return null;
    const p = participants.find(
      part => part.nickname.toLowerCase() === msg.senderNickname?.toLowerCase() ||
              part.name.toLowerCase() === msg.senderName?.toLowerCase()
    );
    return p?.role || 'member';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      
      {/* OPEN CHAT WINDOW */}
      {isOpen && (
        <div
          className={`pointer-events-auto bg-stone-900 border-4 border-amber-500 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3 transition-all duration-200 ${
            isExpanded
              ? 'w-[94vw] sm:w-[540px] h-[84vh] max-h-[780px]'
              : 'w-[92vw] sm:w-[410px] h-[550px] max-h-[72vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 p-3.5 flex items-center justify-between text-yellow-300 border-b-2 border-amber-400 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-stone-900/60 border border-yellow-300 flex items-center justify-center text-base shadow-inner">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-white leading-tight">
                    Чат &laquo;Негодяи&raquo;
                  </h3>
                  <span className="bg-yellow-400 text-stone-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase">
                    + Бот Максимка
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-200 font-semibold mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{participants.length} негодяев • Бот на страже слёта</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors hidden sm:block"
                title={isExpanded ? 'Обычный размер' : 'Развернуть'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Свернуть чат"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Feed Container with Floating Jump-to-Bottom Arrow */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-stone-950/95 text-stone-100 scrollbar-thin"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
                  <div className="text-3xl">🏕️</div>
                  <p className="text-xs font-bold text-amber-300">Чат команды открыт!</p>
                  <p className="text-[11px] max-w-xs">
                    Задайте вопрос соратникам или обратитесь к боту Максимке по задачам, меню и днюхам!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isBotMsg = msg.isBot || msg.senderNickname === 'negodyai_bot';
                  const isMe = !isBotMsg && currentUser && (
                    msg.senderNickname?.toLowerCase() === currentUser.nickname?.toLowerCase() ||
                    msg.senderName?.toLowerCase() === currentUser.name?.toLowerCase()
                  );

                  const userRole = getParticipantRole(msg);
                  const roleMeta = userRole ? ROLE_DEFINITIONS[userRole] : null;

                  // BOT MESSAGE RENDERING
                  if (isBotMsg) {
                    return (
                      <div key={msg.id} className="flex flex-col items-start max-w-[92%]">
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-xs">🤖</span>
                          <span className="text-[11px] font-black text-amber-400 uppercase tracking-tight">
                            Бот Максимка
                          </span>
                          <span className="bg-amber-500/20 text-yellow-300 border border-amber-500/40 font-bold text-[9px] px-1.5 py-0.2 rounded-full">
                            ИИ Главный Негодяй
                          </span>
                          <span className="text-[9px] text-stone-500">{msg.timestamp}</span>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900 via-amber-950/50 to-stone-900 text-amber-50 border-2 border-amber-500/80 rounded-2xl rounded-tl-none p-3 shadow-lg space-y-2">
                          {msg.text && (
                            <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          )}

                          {/* Bot Style or Psychotype Meta */}
                          {(msg.adapterStyleUsed || msg.detectedPsychotypeExplanation) && (
                            <div className="pt-1.5 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5 text-[9px] text-amber-300/80 font-mono">
                              {msg.adapterStyleUsed && (
                                <span className="bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-600/30">
                                  ⚡ {msg.adapterStyleUsed}
                                </span>
                              )}
                              {msg.detectedPsychotypeExplanation && (
                                <span className="text-stone-400 italic">
                                  {msg.detectedPsychotypeExplanation}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Image Attachment */}
                          {msg.imageUrl && (
                            <div className="rounded-xl overflow-hidden border-2 border-amber-500/50 max-h-56 bg-stone-950">
                              <img
                                src={msg.imageUrl}
                                alt="Вложение бота"
                                className="w-full h-full object-contain p-1"
                              />
                            </div>
                          )}

                          {/* Other Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {msg.attachments.map(att => (
                                <div
                                  key={att.id}
                                  className="bg-stone-950/80 p-2 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2 text-[11px]"
                                >
                                  <span className="font-bold text-yellow-300 truncate">
                                    📎 {att.title}
                                  </span>
                                  {att.url && (
                                    <a
                                      href={att.url}
                                      download={`${att.title}.svg`}
                                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-[9px] uppercase rounded"
                                    >
                                      Открыть
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // HUMAN PARTICIPANT MESSAGE RENDERING
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-baseline gap-1.5 mb-0.5 px-1 flex-wrap">
                        <span className={`text-[10px] font-black uppercase ${isMe ? 'text-amber-400' : 'text-yellow-400'}`}>
                          {msg.senderName}
                        </span>

                        {/* Role badge if member has a designated role */}
                        {roleMeta && roleMeta.role !== 'member' && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border leading-none ${roleMeta.color}`}>
                            {roleMeta.icon} {roleMeta.badge}
                          </span>
                        )}

                        <span className="text-[9px] text-stone-400">
                          @{msg.senderNickname} • {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs font-semibold leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-amber-600 text-yellow-50 rounded-tr-none border border-amber-400'
                            : 'bg-stone-800 text-stone-100 rounded-tl-none border border-stone-700'
                        }`}
                      >
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {msg.imageUrl && (
                          <div className="mt-1.5 rounded-xl overflow-hidden border border-stone-600 max-h-48">
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* FLOATING JUMP-TO-BOTTOM ARROW BUTTON (Appears when scrolled up) */}
            {!isAtBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-3 right-3 z-30 p-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black rounded-full shadow-2xl border-2 border-stone-900 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center gap-1 group"
                title="Перейти к последнему сообщению"
              >
                <ArrowDown size={17} className="group-hover:translate-y-0.5 transition-transform" />
                {hasNewMessagesBelow && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping absolute -top-1 -right-1" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute -top-1 -right-1" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Bot Actions Toolbar */}
          <div className="bg-stone-900/95 px-2.5 py-1.5 border-t border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-black text-amber-400 uppercase shrink-0 flex items-center gap-1">
              <span>🤖</span> Запрос боту:
            </span>
            {BOT_PROMPTS.map(bp => (
              <button
                key={bp.label}
                type="button"
                onClick={() => handleSendBotPrompt(bp.prompt)}
                className="whitespace-nowrap px-2 py-0.5 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-amber-200 text-[10px] font-bold rounded-lg border border-amber-600/30 transition-all shrink-0 active:scale-95"
              >
                {bp.label}
              </button>
            ))}
          </div>

          {/* Quick Emojis Bar */}
          <div className="bg-stone-900 px-3 py-1 border-t border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText(prev => prev + emoji)}
                className="hover:scale-125 transition-transform text-sm p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Photo Attachment Drawer */}
          {showPhotoInput && (
            <div className="bg-stone-800 p-2 border-t border-stone-700 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10px] font-bold text-amber-300 truncate">
                📷 Фото прикреплено к сообщению
              </span>
              <button
                type="button"
                onClick={() => { setImageUrl(''); setShowPhotoInput(false); }}
                className="text-stone-400 hover:text-red-400 text-xs font-bold"
              >
                Удалить
              </button>
            </div>
          )}

          {/* Input Footer Form */}
          <form onSubmit={handleSend} className="bg-stone-900 p-2.5 border-t-2 border-amber-500/40 flex items-center gap-2 shrink-0">
            <label className="p-2 text-stone-400 hover:text-yellow-400 cursor-pointer rounded-xl hover:bg-stone-800 transition-colors">
              <ImageIcon size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Сообщение в чат или вопрос боту Максимке..."
              className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-400 text-stone-100 font-bold text-xs rounded-xl px-3 py-2 outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !imageUrl}
              className="p-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-yellow-300 rounded-xl transition-all shadow"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto group relative flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-yellow-300 px-4 py-3 rounded-full shadow-2xl border-2 border-yellow-300 transition-all active:scale-95"
      >
        <div className="relative">
          <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow animate-bounce">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="font-black text-xs uppercase tracking-tight text-white pr-1">
          {isOpen ? 'Свернуть чат' : 'Чат команды'}
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      </button>

    </div>
  );
}
