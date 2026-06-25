import { useState } from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  const [portal, setPortal] = useState('admin');

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="mb-2">
          <span className="badge text-bg-light text-primary px-3 py-2">
            {portal === 'admin' ? 'Admin Panel' : 'Student Panel'}
          </span>
        </div>
        <h1 className="display-5 fw-bold">Library Management System</h1>
        <p className="lead mt-3 mb-0 opacity-75">
          {portal === 'admin'
            ? 'Create exams, manage questions, and track results from a single dashboard.'
            : 'Take exams, view results, and track your academic progress.'}
        </p>
      </section>
      <section className="auth-panel">
        <Outlet context={{ portal, setPortal }} />
      </section>
    </main>
  );
};
