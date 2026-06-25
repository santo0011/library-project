import { useEffect } from 'react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/navigation/StudentSidebar.jsx';
import { Topbar } from '../components/navigation/Topbar.jsx';

export const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  return (
    <main className="admin-shell">
      <StudentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <section className="main-panel">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <div className="content-wrap">
          <Outlet />
        </div>
      </section>
    </main>
  );
};
