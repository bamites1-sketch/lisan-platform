import AssessmentFeedbackTab from '../../components/admin/AssessmentFeedbackTab';
import AdminLayout from '../../components/layout/AdminLayout';
import { ToastProvider } from '../../components/ui/Toast';

function AdminAssessmentFeedbackPageInner() {
  return (
    <AdminLayout activeTab="assessment-feedback" breadcrumb="Assessment Feedback & Recommendations">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
        <AssessmentFeedbackTab />
      </div>
    </AdminLayout>
  );
}

export default function AdminAssessmentFeedbackPage() {
  return (
    <ToastProvider>
      <AdminAssessmentFeedbackPageInner />
    </ToastProvider>
  );
}
