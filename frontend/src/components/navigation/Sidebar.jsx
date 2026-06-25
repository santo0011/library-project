import { useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../redux/slices/authSlice.js';
import { confirmLogout, showAuthToast } from '../../utils/authAlerts.js';

const items = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/students', icon: 'bi-people', label: 'Students' },
  { to: '/exams', icon: 'bi-journal-text', label: 'Exams' },
  { to: '/fee-types', icon: 'bi-tags', label: 'Fee Types' },
  { to: '/fees', icon: 'bi-cash-coin', label: 'Fee Management' },
  { to: '/settings', icon: 'bi-sliders', label: 'Settings' }
];

export const Sidebar = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await confirmLogout();
    if (!result.isConfirmed) return;

    await dispatch(logoutUser());
    onClose();
    showAuthToast('success', 'Logged out successfully.');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay - closes sidebar when tapped outside */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-shield-check" />
          </div>
          <div>
            <div className="sidebar-brand-text">Admin Panel</div>
            <div className="sidebar-brand-sub">Exam System</div>
          </div>
          <button className="btn btn-sm btn-outline-light mobile-menu ms-auto" type="button" onClick={onClose} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav>
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className="sidebar-link" onClick={onClose}>
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button className="sidebar-link sidebar-button" type="button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
