import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { Topbar } from '../components/navigation/Topbar.jsx';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="admin-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <section className="main-panel">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <div className="content-wrap">
          <Outlet />
        </div>
      </section>
    </main>
  );
};
