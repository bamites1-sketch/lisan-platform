import { useState, useEffect } from 'react';
import { parentFeedbackApi } from '../../services/feedbackCommunicationApi';
import type { ParentFeedback } from '../../types';
import { useToast } from '../ui/Toast';

export default function ParentFeedbackTab() {
  const { showToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Response modal state
  const [activeFeedback, setActiveFeedback] = useState<ParentFeedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('REVIEWED');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, [statusFilter, categoryFilter]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await parentFeedbackApi.getAdminFeedbacks({
        status: statusFilter,
        category: categoryFilter,
        search
      });
      setFeedbacks(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load parent feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeedbacks();
  };

  const openResponseModal = (feedback: ParentFeedback) => {
    setActiveFeedback(feedback);
    setResponseText(feedback.adminResponse || '');
    setResponseStatus(feedback.status === 'RESOLVED' ? 'RESOLVED' : 'REVIEWED');
  };

  const handleSendResponse = async () => {
    if (!activeFeedback) return;
    if (!responseText.trim()) {
      showToast('Please type an administrative response', 'warning');
      return;
    }

    try {
      setSending(true);
      await parentFeedbackApi.respond(activeFeedback.id, {
        adminResponse: responseText.trim(),
        status: responseStatus
      });
      showToast('Response sent and parent notified successfully!', 'success');
      setActiveFeedback(null);
      loadFeedbacks();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit response', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parent feedback?')) return;
    try {
      await parentFeedbackApi.delete(id);
      showToast('Feedback deleted', 'info');
      loadFeedbacks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  // Quick reply templates
  const quickTemplates = [
    'Thank you for bringing this to our attention. Our academic team has noted this and is adjusting your child’s weekly reading assignments accordingly.',
    'We are delighted to hear about the positive progress! Keep encouraging 15 minutes of daily reading at home.',
    'We have reviewed the problem area you reported and have scheduled targeted phonics reinforcement lessons.',
    'Thank you for the excellent recommendation. We are incorporating more bilingual story materials in the upcoming module.'
  ];

  // Overview stats
  const total = feedbacks.length;
  const pendingCount = feedbacks.filter(f => f.status === 'PENDING').length;
  const reviewedCount = feedbacks.filter(f => f.status === 'REVIEWED' || f.status === 'RESOLVED').length;
  const ratings = feedbacks.map(f => f.rating).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      {/* ── METRICS SUMMARY ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Feedbacks</p>
          <p className="text-2xl sm:text-3xl font-black text-[#1a3a2a] mt-1">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-card">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Awaiting Response</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-card">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Responded</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{reviewedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Experience</p>
          <p className="text-2xl sm:text-3xl font-black text-[#d4a017] mt-1">★ {avgRating}</p>
        </div>
      </div>

      {/* ── CONTROLS & FILTERS ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parent name, student, or keyword..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Response</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="PROGRESS">Progress Feedback</option>
            <option value="CONCERN">Problem / Concern</option>
            <option value="SUGGESTION">Future Suggestion</option>
            <option value="GENERAL">General</option>
          </select>

          <button
            onClick={loadFeedbacks}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── FEEDBACKS LIST ── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading parent feedback records...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-card">
          <p className="text-4xl mb-2">💬</p>
          <h3 className="text-sm font-bold text-gray-800">No Parent Feedbacks Found</h3>
          <p className="text-xs text-gray-400 mt-1">
            Feedbacks submitted by parents will appear here for review and response.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(f => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 hover:border-gray-300 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1a3a2a]">
                      {f.parent?.firstName} {f.parent?.lastName}
                    </span>
                    {f.parent?.user?.email && (
                      <span className="text-xs text-gray-400">({f.parent.user.email})</span>
                    )}
                    {f.student && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                        👶 Student: {f.student.firstName} {f.student.lastName} (Grade {f.student.grade?.replace('GRADE_', '')})
                      </span>
                    )}
                    {f.rating && (
                      <span className="text-amber-400 text-xs font-bold">
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>Category: <strong className="text-gray-600">{f.category}</strong></span>
                    <span>•</span>
                    <span>Submitted: {new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    f.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : f.status === 'RESOLVED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {f.status}
                  </span>

                  <button
                    onClick={() => openResponseModal(f)}
                    className="px-3 py-1.5 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> {f.adminResponse ? 'Edit Response' : 'Respond'}
                  </button>

                  <button
                    onClick={() => handleDelete(f.id)}
                    className="px-2.5 py-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                    title="Delete feedback"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subject */}
              {f.title && (
                <p className="text-xs font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                  📌 {f.title}
                </p>
              )}

              {/* Feedback Content Grid */}
              <div className="grid gap-3 sm:grid-cols-3">
                {f.progressNotes && (
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-emerald-900 mb-1">📈 Student Progress</p>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{f.progressNotes}</p>
                  </div>
                )}
                {f.areasOfConcern && (
                  <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-rose-900 mb-1">⚠️ Areas of Concern / Problems</p>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{f.areasOfConcern}</p>
                  </div>
                )}
                {f.suggestions && (
                  <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-blue-900 mb-1">💡 Future Suggestions</p>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{f.suggestions}</p>
                  </div>
                )}
              </div>

              {/* Existing Response Display */}
              {f.adminResponse && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>🛡️</span> Response from {f.respondedBy || 'Admin'}
                    </span>
                    {f.respondedAt && (
                      <span className="text-gray-400 font-normal">
                        {new Date(f.respondedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line pl-5 border-l-2 border-emerald-300">
                    {f.adminResponse}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── RESPONSE MODAL ── */}
      {activeFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a3a2a] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Reply to Parent Feedback</h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Parent: {activeFeedback.parent?.firstName} {activeFeedback.parent?.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedback(null)}
                className="text-white/70 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Quick Summary of what parent wrote */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 max-h-32 overflow-y-auto space-y-1">
                {activeFeedback.areasOfConcern && (
                  <p><strong className="text-rose-700">Concern:</strong> {activeFeedback.areasOfConcern}</p>
                )}
                {activeFeedback.progressNotes && (
                  <p><strong className="text-emerald-700">Progress:</strong> {activeFeedback.progressNotes}</p>
                )}
                {activeFeedback.suggestions && (
                  <p><strong className="text-blue-700">Suggestion:</strong> {activeFeedback.suggestions}</p>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status after responding</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResponseStatus('REVIEWED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      responseStatus === 'REVIEWED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Mark as Reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseStatus('RESOLVED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      responseStatus === 'RESOLVED'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🌟 Mark as Resolved
                  </button>
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-1.5">Quick Response Templates:</p>
                <div className="space-y-1">
                  {quickTemplates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setResponseText(t)}
                      className="block w-full text-left text-[11px] text-gray-600 hover:text-emerald-900 bg-gray-50 hover:bg-emerald-50/60 p-2 rounded-lg transition-colors border border-gray-100"
                    >
                      "{t}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Response Message
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Write clear, supportive feedback to the parent..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveFeedback(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleSendResponse}
                  className="px-5 py-2 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {sending ? 'Sending...' : '📨 Send Official Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
