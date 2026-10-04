import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { directChatApi } from '../../services/feedbackCommunicationApi';
import type { DirectChatConversation, DirectChatMessage } from '../../types';
import { useToast } from '../ui/Toast';

export default function StudentChatTab() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramStudentId = searchParams.get('studentId');

  const [conversations, setConversations] = useState<DirectChatConversation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<DirectChatConversation | null>(null);
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickAdminReplies = [
    '👏 Great progress on your recent assessment!',
    '📚 Please check your assignments tab for new reading material.',
    '🎙️ We reviewed your voice recording. Try reading slightly slower next time.',
    '✅ I will update your reading level right away.'
  ];

  const quickEmojis = ['👍', '👏', '⭐', '📚', '🎯', '💡', '🎉', '💪', '🙏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load conversations list
  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingList(true);
      const data = await directChatApi.getAdminConversations();
      setConversations(data || []);

      // If URL has a studentId or none selected, pick it
      if (paramStudentId && !selectedStudent) {
        const found = data.find(c => c.studentId === paramStudentId);
        if (found) setSelectedStudent(found);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // 2. Load messages for selected student
  const loadMessages = async (studentId: string, isInitial = false) => {
    try {
      if (isInitial) setLoadingChat(true);
      const data = await directChatApi.getAdminMessages(studentId);
      setMessages(data || []);
      if (isInitial) setTimeout(scrollToBottom, 100);

      // Decrement/clear unread count locally for this student
      setConversations(prev =>
        prev.map(c => (c.studentId === studentId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err: any) {
      console.error('Failed to load messages for student:', err);
    } finally {
      if (isInitial) setLoadingChat(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // When selected student changes
  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.studentId, true);
    } else {
      setMessages([]);
    }
  }, [selectedStudent?.studentId]);

  // Polling every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations(true);
      if (selectedStudent) {
        loadMessages(selectedStudent.studentId, false);
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [selectedStudent?.studentId]);

  const handleSelectStudent = (student: DirectChatConversation) => {
    setSelectedStudent(student);
    setSearchParams(prev => {
      prev.set('studentId', student.studentId);
      return prev;
    });
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !selectedStudent || sending) return;

    try {
      setSending(true);
      setInputText('');
      setShowEmojis(false);

      const newMsg = await directChatApi.sendMessage({
        message: textToSend.trim(),
        studentId: selectedStudent.studentId
      });

      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);

      // Update conversations list last message preview
      setConversations(prev =>
        prev.map(c =>
          c.studentId === selectedStudent.studentId
            ? {
                ...c,
                lastMessage: {
                  id: newMsg.id,
                  message: newMsg.message,
                  senderRole: 'ADMIN',
                  createdAt: newMsg.createdAt,
                  isRead: false
                }
              }
            : c
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.grade.toLowerCase().includes(q) ||
      (c.lastMessage && c.lastMessage.message.toLowerCase().includes(q))
    );
  });

  // Group messages by date
  const groupMessages = (msgs: DirectChatMessage[]) => {
    const groups: { [key: string]: DirectChatMessage[] } = {};
    for (const m of msgs) {
      const date = new Date(m.createdAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    }
    return groups;
  };

  const grouped = groupMessages(messages);

  return (
    <div className="h-[calc(100dvh-160px)] md:h-[calc(100vh-140px)] min-h-[520px] bg-white rounded-3xl border border-gray-200/80 shadow-card flex overflow-hidden w-full">
      {/* ── LEFT PANEL: CONVERSATIONS LIST (Telegram Style) ── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex-col bg-gray-50/50 flex-shrink-0 ${
          selectedStudent ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search */}
        <div className="p-3.5 border-b border-gray-200/80 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3.5 py-2 bg-gray-100/80 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
            <span className="absolute left-3 top-2 text-gray-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loadingList ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-emerald-300 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading student directory...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No students found matching "{searchQuery}"
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedStudent?.studentId === conv.studentId;
              const hasUnread = conv.unreadCount > 0;
              const timeStr = conv.lastMessage
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '';

              return (
                <button
                  key={conv.studentId}
                  onClick={() => handleSelectStudent(conv)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-l-4 border-[#2d6a4f]'
                      : 'hover:bg-white bg-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3a2a] to-[#2d6a4f] text-[#d4a017] flex items-center justify-center font-bold text-sm shadow-2xs">
                      {conv.firstName[0]}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Info & Snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {conv.firstName} {conv.lastName}
                      </span>
                      {timeStr && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeStr}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-gray-200/70 text-gray-600 font-semibold">
                        Grade {conv.grade.replace('GRADE_', '')}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{conv.email}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.senderRole === 'ADMIN' && (
                              <span className="text-gray-400 font-medium">You: </span>
                            )}
                            {conv.lastMessage.message}
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No messages yet</span>
                        )}
                      </p>

                      {hasUnread && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: ACTIVE CHAT ROOM ── */}
      {selectedStudent ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Header */}
          <div className="px-3 sm:px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-2xs z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="md:hidden px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
              >
                ← Students
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#1a3a2a] to-[#2d6a4f] text-[#d4a017] flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs flex-shrink-0">
                {selectedStudent.firstName[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold whitespace-nowrap">
                    Grade {selectedStudent.grade.replace('GRADE_', '')}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                  {selectedStudent.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={`/admin/dashboard?tab=students`}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
              >
                👤 Student Record
              </a>
            </div>
          </div>

          {/* Messages Area (Telegram Style) */}
          <div
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4"
            style={{
              backgroundColor: '#f2f6f3',
              backgroundImage: 'radial-gradient(#2d6a4f0d 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          >
            {loadingChat ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-3 border-emerald-300 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading chat history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center space-y-2 max-w-sm mx-auto">
                <div className="text-4xl">💬</div>
                <h4 className="text-sm font-bold text-gray-700">No message history yet</h4>
                <p className="text-xs text-gray-400">
                  Type a message below to start a direct Telegram-style conversation with {selectedStudent.firstName}.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, dateMessages]) => (
                <div key={date} className="space-y-3">
                  {/* Date Divider */}
                  <div className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-gray-600 shadow-2xs border border-gray-200/50">
                      {date}
                    </span>
                  </div>

                  {dateMessages.map(msg => {
                    const isAdmin = msg.senderRole === 'ADMIN';
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-[#1a3a2a] text-[#d4a017] flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0 mb-1">
                            {selectedStudent.firstName[0]}
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-[#2d6a4f] text-white rounded-2xl rounded-br-xs'
                              : 'bg-white text-gray-800 rounded-2xl rounded-bl-xs border border-gray-200/70'
                          }`}
                        >
                          {!isAdmin && (
                            <p className="text-[10px] font-extrabold text-[#2d6a4f] mb-0.5">
                              {msg.senderName || selectedStudent.firstName}
                            </p>
                          )}

                          <p className="whitespace-pre-line break-words">{msg.message}</p>

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isAdmin ? 'text-emerald-100/70' : 'text-gray-400'
                            }`}
                          >
                            <span>{timeStr}</span>
                            {isAdmin && (
                              <span
                                className={`text-[11px] font-bold ${
                                  msg.isRead ? 'text-emerald-200' : 'text-emerald-100/50'
                                }`}
                                title={msg.isRead ? 'Read by Student' : 'Delivered'}
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

          {/* Quick Reply Suggestions */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">Quick:</span>
            {quickAdminReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => setInputText(reply)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white text-gray-600 hover:text-[#1a3a2a] border border-gray-200 whitespace-nowrap hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Quick Emojis Bar */}
          {showEmojis && (
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

          {/* Composer */}
          <form
            onSubmit={e => handleSendMessage(e)}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowEmojis(p => !p)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-lg transition-colors cursor-pointer"
              title="Add Emoji"
            >
              😊
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Reply to ${selectedStudent.firstName} as Admin...`}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#1a3a2a] hover:brightness-110 text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-all active:scale-90 cursor-pointer flex-shrink-0"
              title="Send Reply"
            >
              <span className="text-sm transform rotate-45 -translate-y-0.5 -translate-x-0.5">✈️</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-gray-50/30">
          <div className="w-16 h-16 rounded-3xl bg-white shadow-card flex items-center justify-center text-3xl mb-3 border border-gray-100">
            💬
          </div>
          <h3 className="font-bold text-gray-800 text-base">Select a Student Conversation</h3>
          <p className="text-xs text-gray-400 max-w-sm mt-1">
            Choose a student from the directory on the left to review message history, answer questions, and send real-time guidance.
          </p>
        </div>
      )}
    </div>
  );
}
