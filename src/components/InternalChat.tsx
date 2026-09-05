import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, MessageSquare, Paperclip, Image as ImageIcon, 
  Search, Users, Smile, ArrowDown, Shield, Award, CheckCheck, X
} from 'lucide-react';
import { ChatMessage, Participant } from '../types';

interface InternalChatProps {
  messages: ChatMessage[];
  participants: Participant[];
  currentUser: Participant | null;
  onSendMessage: (text: string, imageUrl?: string) => void;
  onOpenAuth: () => void;
}

export default function InternalChat({
  messages,
  participants,
  currentUser,
  onSendMessage,
  onOpenAuth
}: InternalChatProps) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter out any bot messages strictly: only real registered members!
  const realMessages = messages.filter(m => !m.isBot);

  const filteredMessages = realMessages.filter(m => 
    m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderNickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = (smooth = true) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom(true);
    }
  }, [realMessages.length, autoScroll]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isAtBottom);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !previewImage) return;

    onSendMessage(inputText.trim(), previewImage || undefined);
    setInputText('');
    setPreviewImage(null);
    setAutoScroll(true);
  };

  const getParticipantRoleBadge = (nickname: string, name: string) => {
    const p = participants.find(part => part.nickname === nickname || part.name === name);
    if (p?.role === 'admin') return <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">Админ</span>;
    if (p?.role === 'treasurer') return <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">Казначей</span>;
    return null;
  };

  return (
    <div className="bg-white border-4 border-red-600 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[750px] relative">
      
      {/* Chat Top Bar */}
      <div className="bg-yellow-400 border-b-4 border-red-600 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-red-600 text-yellow-300 flex items-center justify-center font-black border-2 border-amber-900 shadow">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-black text-base uppercase text-red-700 leading-tight">
              Внутренний командный чат Негодяев
            </h3>
            <p className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Только зарегистрированные участники ({participants.length}) • Боты отключены
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-700" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск сообщений..."
              className="pl-8 pr-3 py-1 bg-yellow-200 focus:bg-white border border-amber-400 rounded-lg text-xs font-semibold text-amber-950 placeholder-amber-700 focus:outline-none"
            />
          </div>

          {/* Members list toggle */}
          <button
            type="button"
            onClick={() => setShowMembersList(!showMembersList)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 shadow transition-colors"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Участники</span> ({participants.length})
          </button>
        </div>
      </div>

      {/* Chat Body + Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Messages Feed */}
        <div className="flex-1 flex flex-col bg-amber-50/40 relative">
          
          {/* Visible Scrollbar Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-scroll p-4 space-y-3 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-amber-100"
            style={{ scrollbarGutter: 'stable' }}
          >
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 text-amber-800">
                <MessageSquare className="w-12 h-12 text-amber-400 mx-auto mb-2 opacity-60" />
                <p className="font-black text-sm uppercase">Сообщений пока нет</p>
                <p className="text-xs text-amber-600 mt-1">
                  Напишите первое сообщение соратникам по походу!
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = currentUser && (currentUser.nickname === msg.senderNickname || currentUser.name === msg.senderName);
                const roleBadge = getParticipantRoleBadge(msg.senderNickname, msg.senderName);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                      isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full border-2 border-amber-300 bg-white overflow-hidden shrink-0 shadow-sm">
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderNickname}`} 
                        alt={msg.senderName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm border-2 text-xs sm:text-sm ${
                        isMe
                          ? 'bg-red-600 text-yellow-100 border-red-700 rounded-tr-none'
                          : 'bg-white text-amber-950 border-amber-200 rounded-tl-none'
                      }`}
                    >
                      {/* Sender Meta */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`font-black text-xs ${isMe ? 'text-yellow-300' : 'text-amber-950'}`}>
                          {msg.senderName}
                        </span>
                        <span className={`text-[10px] font-bold ${isMe ? 'text-yellow-200/80' : 'text-red-600'}`}>
                          @{msg.senderNickname}
                        </span>
                        {roleBadge}
                      </div>

                      {/* Text */}
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.text}
                      </p>

                      {/* Optional Attached Image */}
                      {msg.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-amber-300 max-h-60">
                          <img src={msg.imageUrl} alt="Вложение" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className={`mt-1.5 text-[10px] flex items-center justify-end gap-1 ${
                        isMe ? 'text-yellow-300/70' : 'text-amber-400'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Jump to Bottom Button */}
          {!autoScroll && (
            <button
              type="button"
              onClick={() => {
                scrollToBottom();
                setAutoScroll(true);
              }}
              className="absolute bottom-20 right-6 bg-red-600 hover:bg-red-700 text-yellow-300 p-2.5 rounded-full shadow-lg border-2 border-yellow-300 transition-all z-20 flex items-center gap-1 text-xs font-black uppercase"
            >
              <ArrowDown size={16} />
              <span>Вниз</span>
            </button>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t-2 border-amber-300 shrink-0">
            {previewImage && (
              <div className="mb-2 p-1.5 bg-amber-100 rounded-lg border border-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={previewImage} alt="Вложение" className="w-10 h-10 object-cover rounded" />
                  <span className="text-xs font-bold text-amber-900">Изображение прикреплено</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPreviewImage(null)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {currentUser ? (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-amber-700 hover:text-red-600 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors shrink-0"
                  title="Прикрепить фото или схему"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Сообщение от ${currentUser.name}...`}
                  className="flex-1 px-4 py-2.5 bg-amber-50 border-2 border-amber-300 focus:border-red-500 rounded-xl text-xs sm:text-sm font-medium text-amber-950 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !previewImage}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 rounded-xl font-black uppercase text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Отправить</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-2 flex items-center justify-center gap-3">
                <p className="text-xs font-bold text-amber-900">
                  Для отправки сообщений в закрытый чат необходимо войти в аккаунт:
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-black uppercase text-xs rounded-xl shadow"
                >
                  Войти
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real Members Sidebar (Desktop or Toggled Mobile) */}
        {showMembersList && (
          <div className="w-64 border-l-2 border-amber-300 bg-white flex flex-col shrink-0">
            <div className="p-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
              <span className="font-black text-xs uppercase text-amber-950 flex items-center gap-1.5">
                <Users size={14} className="text-red-600" />
                В сети ({participants.length})
              </span>
              <button
                type="button"
                onClick={() => setShowMembersList(false)}
                className="text-amber-800 hover:text-red-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-amber-100">
              {participants.map(p => (
                <div key={p.id} className="pt-1.5 pb-1 px-2 flex items-center gap-2 hover:bg-amber-50 rounded-lg">
                  <div className="relative">
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full border border-amber-300 object-cover" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 right-0 border border-white"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-xs text-amber-950 truncate">{p.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-red-600 font-bold truncate">@{p.nickname}</span>
                      {p.role === 'admin' && <span className="text-[9px] bg-red-600 text-white font-black px-1 rounded">Админ</span>}
                      {p.role === 'treasurer' && <span className="text-[9px] bg-emerald-600 text-white font-black px-1 rounded">Казначей</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
