import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, X, Minimize2, 
  Maximize2, ArrowDown, Bot, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { ChatMessage, Participant, ROLE_DEFINITIONS } from '../types';

interface FloatingChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, imageUrl?: string) => void;
  currentUser: Participant | null;
  participants: Participant[];
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  prefillText?: string;
  onClearPrefill?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const QUICK_EMOJIS = ['🏕️', '🔥', '🍻', '🌲', '🏆', '🧭', '🍖', '🚩'];

// Quick commands for chat-bot Maximka
interface BotCommand {
  label: string;
  text: string;
  category: 'Девизы' | 'Слёт и этапы' | 'Быт и сборы';
  badge?: string;
}

const MAXIMKA_BOT_COMMANDS: BotCommand[] = [
  { label: 'Как гуляет Негодяй?', text: 'Как гуляет Негодяй?', category: 'Девизы', badge: '🔥 Фирменное' },
  { label: 'Кто с негодяем дрался', text: 'Кто с Негодяем дрался?', category: 'Девизы' },
  { label: 'Давай Негодяй!', text: 'Давай Негодяй!', category: 'Девизы' },
  { label: 'Тост (Запись дубля)', text: 'Запись дубля', category: 'Девизы', badge: '🍻 Тост' },
  { label: 'Записьдень!', text: 'Записьдень!', category: 'Девизы' },
  { label: 'Пизда на глаза', text: 'Пизда на глаза', category: 'Девизы' },
  { label: '🎉 Дни рождения', text: 'Максимка, кто именинник и у кого ближайшие дни рождения?', category: 'Быт и сборы', badge: '🎂 Днюхи' },
  { label: '💰 Долги и взносы', text: 'Максимка, кто должен по деньгам и взносам?', category: 'Быт и сборы', badge: '💵 Казна' },
  { label: '🍲 Меню и закупка', text: 'Максимка, что у нас по меню и еде на слёт?', category: 'Быт и сборы' },
  { label: '📋 Задачи слёта', text: 'Максимка, какие задачи и дежурства горят?', category: 'Быт и сборы' },
  { label: '🏕️ Инвентарь и снаряга', text: 'Максимка, что по инвентарю и палаткам?', category: 'Быт и сборы' },
  { label: '📜 Устав и документы', text: 'Максимка, покажи официальные документы и устав команды', category: 'Быт и сборы' },
  { label: '🪢 Схемы узлов', text: 'Максимка, покажи схемы вязки туристических узлов', category: 'Слёт и этапы', badge: 'Схемы' },
  { label: '🧭 Знаки ориентирования', text: 'Максимка, покажи условные знаки ориентирования и КП', category: 'Слёт и этапы', badge: 'Карты' },
  { label: '⏱️ График соревнований', text: 'Максимка, какое расписание соревнований и этапов?', category: 'Слёт и этапы' },
  { label: '🏆 Конкурсы команды', text: 'Максимка, какие конкурсы запланированы на слёте?', category: 'Слёт и этапы' },
];

export default function FloatingChat({
  messages,
  onSendMessage,
  currentUser,
  participants,
  isOpen: controlledIsOpen,
  onToggle,
  onClose,
  prefillText,
  onClearPrefill,
  onUnreadCountChange
}: FloatingChatProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const closeChat = () => {
    if (isControlled && onClose) {
      onClose();
    } else if (isControlled && onToggle && isOpen) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBotCommands, setShowBotCommands] = useState(false);
  const [selectedBotCategory, setSelectedBotCategory] = useState<'Все' | 'Девизы' | 'Слёт и этапы' | 'Быт и сборы'>('Все');

  // Sync prefillText if provided
  useEffect(() => {
    if (prefillText) {
      setInputText(prefillText);
      if (onClearPrefill) {
        onClearPrefill();
      }
    }
  }, [prefillText, onClearPrefill]);

  // Team chat includes real registered members and chat-bot Maximka (negodyai_bot); any other bots (like Leha/Irishka) are excluded
  const teamMessages = messages.filter(m => 
    !m.isBot || 
    m.senderNickname === 'negodyai_bot' || 
    m.senderName === 'Бот Максимка' ||
    m.senderName?.toLowerCase().includes('максимк')
  );

  // Scroll states to prevent auto-scrolling when reading previous messages
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = useRef(teamMessages.length);
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
      setTimeout(() => scrollToBottom(false), 50);
      setUnreadCount(0);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle new incoming messages
  useEffect(() => {
    const isNew = teamMessages.length > prevMessagesLenRef.current;
    prevMessagesLenRef.current = teamMessages.length;

    if (!isOpen) {
      if (isNew) {
        setUnreadCount(prev => prev + 1);
      }
      return;
    }

    setUnreadCount(0);
    if (isNew) {
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(true), 60);
      } else {
        setHasNewMessagesBelow(true);
      }
    }
  }, [teamMessages.length, isOpen, isAtBottom]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !imageUrl) return;

    onSendMessage(inputText.trim(), imageUrl || undefined);
    setInputText('');
    setImageUrl('');
    setShowPhotoInput(false);

    setTimeout(() => scrollToBottom(true), 80);
  };

  const handleExecuteCommand = (cmdText: string) => {
    onSendMessage(cmdText);
    setShowBotCommands(false);
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
    const p = participants.find(
      part => part.nickname?.toLowerCase() === msg.senderNickname?.toLowerCase() ||
              part.name?.toLowerCase() === msg.senderName?.toLowerCase()
    );
    return p?.role || 'member';
  };

  const filteredCommands = selectedBotCategory === 'Все'
    ? MAXIMKA_BOT_COMMANDS
    : MAXIMKA_BOT_COMMANDS.filter(c => c.category === selectedBotCategory);

  return (
    <>
      {/* OPEN CHAT WINDOW - ANCHORED FROM THE TOP UNDER THE HEADER BUTTON */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] pointer-events-none">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-stone-950/45 sm:bg-stone-950/25 backdrop-blur-2xs pointer-events-auto transition-opacity duration-150"
            onClick={closeChat}
          />

          {/* Chat Window Container anchored at top right (immediately under sticky header button) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`fixed top-16 sm:top-[68px] right-2 sm:right-6 lg:right-12 bg-stone-900 border-4 border-amber-500 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in-50 slide-in-from-top-4 origin-top-right pointer-events-auto z-[99999] ${
              isExpanded
                ? 'w-[calc(100vw-16px)] sm:w-[620px] max-w-[96vw] h-[calc(100vh-80px)] max-h-[840px]'
                : 'w-[calc(100vw-16px)] sm:w-[480px] max-w-[96vw] h-[calc(100vh-85px)] sm:h-[650px] max-h-[720px]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 p-3 sm:p-3.5 flex items-center justify-between text-yellow-300 border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-stone-900/70 border border-yellow-300 flex items-center justify-center text-base shadow-inner">
                  ⛺
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-white leading-tight flex items-center gap-1.5">
                    Чат команды &laquo;Негодяи&raquo;
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-200 font-semibold mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{participants.length} негодяев</span>
                    <span className="text-yellow-400/80">•</span>
                    <span className="text-yellow-300 flex items-center gap-0.5">
                      <Bot size={11} /> Бот Максимка online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-white">
                <button
                  type="button"
                  onClick={() => setShowBotCommands(prev => !prev)}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-black uppercase ${
                    showBotCommands 
                      ? 'bg-yellow-300 text-amber-950 shadow' 
                      : 'hover:bg-white/20 text-yellow-300'
                  }`}
                  title="Команды чат-бота Максимка"
                >
                  <Bot size={16} />
                  <span className="hidden sm:inline text-[11px]">Команды</span>
                </button>
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
                  onClick={closeChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Закрыть чат"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BOT COMMANDS DRAWER / QUICK BAR */}
            {showBotCommands && (
              <div className="bg-stone-900 border-b-2 border-amber-500/50 p-2.5 max-h-56 overflow-y-auto scrollbar-thin shrink-0 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300 uppercase tracking-tight">
                    <Sparkles size={14} className="text-yellow-400" />
                    Команды для бота Максимка
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBotCommands(false)}
                    className="text-[10px] text-stone-400 hover:text-white uppercase font-bold"
                  >
                    Скрыть
                  </button>
                </div>

                {/* Category filters */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-none pb-1">
                  {(['Все', 'Девизы', 'Слёт и этапы', 'Быт и сборы'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedBotCategory(cat)}
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full transition-all whitespace-nowrap ${
                        selectedBotCategory === cat
                          ? 'bg-red-600 text-yellow-300 shadow-sm'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Commands grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredCommands.map(cmd => (
                    <button
                      key={cmd.label}
                      type="button"
                      onClick={() => handleExecuteCommand(cmd.text)}
                      className="text-left p-2 rounded-xl bg-stone-950/80 hover:bg-red-950/40 border border-stone-800 hover:border-amber-400/80 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-amber-200 group-hover:text-yellow-300 truncate">
                          {cmd.label}
                        </div>
                        <div className="text-[9px] text-stone-400 truncate">
                          {cmd.text}
                        </div>
                      </div>
                      {cmd.badge ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
                          {cmd.badge}
                        </span>
                      ) : (
                        <Send size={11} className="text-stone-500 group-hover:text-yellow-300 transition-colors shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Feed Container with Floating Jump-to-Bottom Arrow */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-stone-950/95 text-stone-100 scrollbar-thin"
              >
                {teamMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
                    <div className="text-3xl">🏕️</div>
                    <p className="text-xs font-bold text-amber-300">Чат команды открыт!</p>
                    <p className="text-[11px] max-w-xs text-stone-300">
                      Здесь общаются соратники по слёту, обсуждают маршруты, костровое меню и подготовку к соревнованиям.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleExecuteCommand('Как гуляет Негодяй?')}
                      className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-yellow-300 font-black text-xs uppercase rounded-xl border border-yellow-300 shadow transition-all cursor-pointer"
                    >
                      🔥 Спросить: «Как гуляет Негодяй?»
                    </button>
                  </div>
                ) : (
                  teamMessages.map((msg) => {
                    const isSelf = currentUser && (
                      msg.senderNickname === currentUser.nickname ||
                      msg.senderName === currentUser.name
                    );

                    const isBot = Boolean(
                      msg.isBot || 
                      msg.senderNickname === 'negodyai_bot' || 
                      msg.senderName === 'Бот Максимка' ||
                      msg.senderName?.toLowerCase().includes('максимк')
                    );

                    const role = isBot ? 'admin' : getParticipantRole(msg);
                    const roleInfo = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS];

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 mt-0.5">
                          {isBot ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-red-600 p-0.5 shadow-md flex items-center justify-center text-sm font-black text-white border border-yellow-300">
                              🤖
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-600 overflow-hidden flex items-center justify-center text-xs font-bold text-yellow-400">
                              {msg.senderName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[82%] sm:max-w-[78%] rounded-2xl p-3 shadow-md flex flex-col gap-1 ${
                            isSelf
                              ? 'bg-gradient-to-br from-amber-600 to-red-600 text-white rounded-tr-none'
                              : isBot
                              ? 'bg-stone-800 border border-amber-500/80 text-stone-100 rounded-tl-none shadow-amber-500/10'
                              : 'bg-stone-900 border border-stone-800 text-stone-100 rounded-tl-none'
                          }`}
                        >
                          {/* Sender Info & Role Badge */}
                          <div className={`flex items-center gap-1.5 flex-wrap ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-bold text-xs text-yellow-300 leading-none">
                              {isBot ? '🤖 Бот Максимка' : msg.senderName}
                            </span>
                            {roleInfo && (
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${
                                  isBot 
                                    ? 'bg-yellow-400 text-stone-950 border-yellow-300' 
                                    : `${roleInfo.color} border-current`
                                }`}
                              >
                                {isBot ? 'ИИ-Негодяй' : roleInfo.badge}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 leading-none">
                              @{isBot ? 'negodyai_bot' : msg.senderNickname} • {msg.timestamp}
                            </span>
                          </div>

                          {/* Image Attachment in message */}
                          {msg.imageUrl && (
                            <div className="mt-1 rounded-xl overflow-hidden border border-stone-700 bg-stone-950">
                              <img
                                src={msg.imageUrl}
                                alt="Прикрепленное фото"
                                className="w-full max-h-56 object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}

                          {/* Attachments (e.g. diagrams or cards from Bot) */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1.5 space-y-1.5">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="bg-stone-950/80 border border-amber-500/40 rounded-xl p-2 flex flex-col gap-1.5"
                                >
                                  <div className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                                    <span>📎</span>
                                    <span>{att.title}</span>
                                  </div>
                                  {att.url && (
                                    <img
                                      src={att.url}
                                      alt={att.title}
                                      className="w-full max-h-48 object-contain rounded bg-stone-900 border border-stone-800"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text */}
                          {msg.text && (
                            <p className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                              {msg.text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* FLOATING JUMP-TO-BOTTOM ARROW BUTTON (Appears when scrolled up) */}
              {!isAtBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-3 right-3 z-30 p-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black rounded-full shadow-2xl border-2 border-stone-900 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center gap-1 group cursor-pointer"
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

            {/* Quick Bot Commands Bar + Emojis */}
            <div className="bg-stone-900 px-3 py-1.5 border-t border-stone-800 flex items-center justify-between gap-1.5 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setShowBotCommands(prev => !prev)}
                  className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-yellow-300 flex items-center gap-1 shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Bot size={12} />
                  <span>Команды Максимка</span>
                  {showBotCommands ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand('Как гуляет Негодяй?')}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-stone-800 hover:bg-amber-600/40 text-amber-200 border border-stone-700 whitespace-nowrap shrink-0 transition-colors"
                  title="Спросить у Максимки: Как гуляет Негодяй?"
                >
                  🔥 Как гуляет Негодяй?
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand('Кто с Негодяем дрался?')}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-stone-800 hover:bg-amber-600/40 text-amber-200 border border-stone-700 whitespace-nowrap shrink-0 transition-colors"
                  title="Спросить у Максимки: Кто с Негодяем дрался?"
                >
                  🌲 Кто дрался?
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand('Максимка, кто именинник и у кого ближайшие дни рождения?')}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-stone-800 hover:bg-amber-600/40 text-amber-200 border border-stone-700 whitespace-nowrap shrink-0 transition-colors"
                  title="Спросить у Максимки про дни рождения команды"
                >
                  🎂 Днюхи
                </button>
              </div>

              {/* Quick Emojis Bar */}
              <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-stone-700">
                {QUICK_EMOJIS.slice(0, 4).map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText(prev => prev + emoji)}
                    className="hover:scale-125 transition-transform text-xs p-0.5 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
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
                  className="text-stone-400 hover:text-red-400 text-xs font-bold cursor-pointer"
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
                placeholder="Написать негодяям или спросить у бота Максимки..."
                className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-400 text-stone-100 font-bold text-xs rounded-xl px-3 py-2 outline-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !imageUrl}
                className="p-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-yellow-300 rounded-xl transition-all shadow cursor-pointer active:scale-95"
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
