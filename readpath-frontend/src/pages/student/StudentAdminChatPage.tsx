import { useState, useEffect, useRef } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { directChatApi } from '../../services/feedbackCommunicationApi';
import type { DirectChatMessage } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentAdminChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    '👋 Hello Admin! I have a question about my reading assessment.',
    '📖 Can you please recommend a lesson for my grade?',
    '🎙️ My microphone had an issue during the assessment.',
    '🌟 Thank you for reviewing my latest reading test!'
  ];

  const quickEmojis = ['👍', '👏', '❤️', '📚', '⭐', '❓', '💡', '🔥', '🙏', '😊'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await directChatApi.getStudentMessages();
      setMessages(data || []);
      if (isInitial) {
        setTimeout(scrollToBottom, 150);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMessages(true);
  }, []);

  // Real-time polling every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages(false);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || sending) return;

    try {
      setSending(true);
      setInputText('');
      setShowEmojiPicker(false);

      const newMsg = await directChatApi.sendMessage({ message: textToSend.trim() });
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(textToSend); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: DirectChatMessage[]) => {
    const groups: { [key: string]: DirectChatMessage[] } = {};
    for (const msg of msgs) {
      const date = new Date(msg.createdAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    }
    return groups;
  };

  const grouped = groupMessagesByDate(messages);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto h-[calc(100dvh-140px)] md:h-[calc(100vh-100px)] min-h-[480px] flex flex-col w-full">
        {/* ── TELEGRAM STYLE WINDOW ── */}
        <div className="flex-1 bg-white rounded-3xl shadow-card border border-gray-200/80 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a3a2a] via-[#234e38] to-[#12281d] px-5 py-3.5 text-white flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a017] to-[#b88912] text-[#1a3a2a] flex items-center justify-center font-black text-base shadow-xs">
                  🛡️
                </div>
                {/* Telegram online indicator dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#1a3a2a] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold tracking-wide">LiSAN Administration & Support</h2>
                  <span className="text-[10px] bg-[#d4a017] text-[#1a3a2a] font-black px-1.5 py-0.2 rounded-full">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online · Directly connected with academic team
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-emerald-200/60 block">Student ↔ Admin Secure Line</span>
              <span className="text-[10px] text-[#d4a017] font-semibold">Strictly Confidential</span>
            </div>
          </div>

          {/* ── CHAT MESSAGES THREAD (Telegram Aesthetics) ── */}
          <div
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4"
            style={{
              backgroundColor: '#eef3ef',
              backgroundImage: 'radial-gradient(#2d6a4f0d 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          >
            {loading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-emerald-300 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Opening secure chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center text-3xl mx-auto">
                  💬
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Direct Chat with Administration</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Have questions about assessments, reading scores, or need guidance? Send a message anytime and the admin team will reply directly here.
                  </p>
                </div>

                {/* Quick starter chips */}
                <div className="space-y-1.5 pt-2 text-left">
                  <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-wider">
                    Quick suggestions to get started:
                  </p>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(undefined, prompt)}
                      className="w-full text-left text-xs bg-white/90 hover:bg-white text-gray-700 hover:text-[#1a3a2a] p-2.5 rounded-xl border border-gray-200/60 shadow-2xs transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([date, dateMessages]) => (
                <div key={date} className="space-y-3">
                  {/* Telegram Date Divider */}
                  <div className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/80 text-gray-600 shadow-2xs border border-gray-200/50 backdrop-blur-xs">
                      {date}
                    </span>
                  </div>

                  {dateMessages.map(msg => {
                    const isStudent = msg.senderRole === 'STUDENT';
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isStudent ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Admin Avatar */}
                        {!isStudent && (
                          <div className="w-7 h-7 rounded-full bg-[#1a3a2a] text-[#d4a017] flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0 mb-1">
                            🛡️
                          </div>
                        )}

                        {/* Telegram Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                            isStudent
                              ? 'bg-[#2d6a4f] text-white rounded-2xl rounded-br-xs'
                              : 'bg-white text-gray-800 rounded-2xl rounded-bl-xs border border-gray-200/60'
                          }`}
                        >
                          {!isStudent && (
                            <p className="text-[10px] font-extrabold text-[#2d6a4f] mb-0.5 tracking-wide">
                              {msg.senderName || 'Lisan Administrator'}
                            </p>
                          )}

                          <p className="whitespace-pre-line break-words">{msg.message}</p>

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isStudent ? 'text-emerald-100/70' : 'text-gray-400'
                            }`}
                          >
                            <span>{timeStr}</span>
                            {isStudent && (
                              <span
                                className={`text-[11px] font-bold ${
                                  msg.isRead ? 'text-emerald-200' : 'text-emerald-100/50'
                                }`}
                                title={msg.isRead ? 'Read by Admin' : 'Delivered'}
                              >
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Drawer (when conversation exists) */}
          {messages.length > 0 && (
            <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">Suggested:</span>
              {quickPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white text-gray-600 hover:text-[#1a3a2a] border border-gray-200/80 whitespace-nowrap hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {prompt.length > 35 ? prompt.slice(0, 35) + '…' : prompt}
                </button>
              ))}
            </div>
          )}

          {/* Quick Emojis Bar (expandable) */}
          {showEmojiPicker && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText(prev => prev + emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ── TELEGRAM STYLE INPUT COMPOSER ── */}
          <form
            onSubmit={e => handleSendMessage(e)}
            className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-lg transition-colors cursor-pointer"
              title="Add Emoji"
            >
              😊
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Write a message to Admin..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1a3a2a] hover:brightness-110 text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-all active:scale-90 cursor-pointer flex-shrink-0"
              title="Send Message"
            >
              <span className="text-sm transform rotate-45 -translate-y-0.5 -translate-x-0.5">✈️</span>
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
}
