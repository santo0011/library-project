import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { StudentLayout } from '../layouts/StudentLayout.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { ExamQuestionsPage } from '../pages/ExamQuestionsPage.jsx';
import { ExamsPage } from '../pages/ExamsPage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { SettingsPage } from '../pages/SettingsPage.jsx';
import { StudentDashboardPage } from '../pages/StudentDashboardPage.jsx';
import { StudentExamsPage } from '../pages/StudentExamsPage.jsx';
import { TakeExamPage } from '../pages/TakeExamPage.jsx';
import { StudentProfilePage } from '../pages/StudentProfilePage.jsx';
import { StudentResultDetailPage } from '../pages/StudentResultDetailPage.jsx';
import { AdminStudentsPage } from '../pages/AdminStudentsPage.jsx';
import { AdminStudentDetailPage } from '../pages/AdminStudentDetailPage.jsx';
import { AdminFeeManagementPage } from '../pages/AdminFeeManagementPage.jsx';
import { AdminFeeTypesPage } from '../pages/AdminFeeTypesPage.jsx';
import { StudentFeesPage } from '../pages/StudentFeesPage.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { RoleRoute } from './RoleRoute.jsx';

export const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>
    {/* Admin Routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/exams/:id/questions" element={<ExamQuestionsPage />} />
          <Route path="/students" element={<AdminStudentsPage />} />
          <Route path="/students/:id" element={<AdminStudentDetailPage />} />
          <Route path="/fees" element={<AdminFeeManagementPage />} />
          <Route path="/fee-types" element={<AdminFeeTypesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Route>
    {/* Student Routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/exams" element={<StudentExamsPage />} />
          <Route path="/student/exams/:id/take" element={<TakeExamPage />} />
          <Route path="/student/results" element={<StudentResultDetailPage />} />
          <Route path="/student/results/:id" element={<StudentResultDetailPage />} />
          <Route path="/student/fees" element={<StudentFeesPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>
    </Route>
  </Routes>
);
