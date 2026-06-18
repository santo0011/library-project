import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <main className="auth-shell">
    <section className="auth-brand">
      <div className="mb-4">
        <span className="badge text-bg-light text-primary px-3 py-2">Admin Panel</span>
      </div>
      <h1 className="display-5 fw-bold">Exam Management System</h1>
      <p className="lead mt-3 mb-0 opacity-75">
        Create exams, manage questions, and track results from a single dashboard.
      </p>
    </section>
    <section className="auth-panel">
      <Outlet />
    </section>
  </main>
);