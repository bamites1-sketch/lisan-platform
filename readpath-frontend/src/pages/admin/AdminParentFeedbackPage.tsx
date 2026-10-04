import ParentFeedbackTab from '../../components/admin/ParentFeedbackTab';
import AdminLayout from '../../components/layout/AdminLayout';
import { ToastProvider } from '../../components/ui/Toast';

function AdminParentFeedbackPageInner() {
  return (
    <AdminLayout activeTab="parent-feedback" breadcrumb="Parent Feedback & Concerns">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
        <div className="border-b border-gray-200/80 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
            <span>👨‍👩‍👧</span> Parent Communication Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a3a2a] tracking-tight">
            Parent Feedback & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review submissions from parents regarding student progress, problem areas, and suggestions. Submit official administrative replies.
          </p>
        </div>

        <ParentFeedbackTab />
      </div>
    </AdminLayout>
  );
}

export default function AdminParentFeedbackPage() {
  return (
    <ToastProvider>
      <AdminParentFeedbackPageInner />
    </ToastProvider>
  );
}
