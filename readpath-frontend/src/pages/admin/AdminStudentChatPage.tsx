import StudentChatTab from '../../components/admin/StudentChatTab';
import AdminLayout from '../../components/layout/AdminLayout';
import { ToastProvider } from '../../components/ui/Toast';

function AdminStudentChatPageInner() {
  return (
    <AdminLayout activeTab="student-chat" breadcrumb="Student ↔ Admin Telegram Chat">
      <div className="p-3 sm:p-5 lg:p-6 flex-1 flex flex-col w-full">
        <StudentChatTab />
      </div>
    </AdminLayout>
  );
}

export default function AdminStudentChatPage() {
  return (
    <ToastProvider>
      <AdminStudentChatPageInner />
    </ToastProvider>
  );
}
