import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../redux/slices/authSlice.js';
import { useToast } from '../common/Toast.jsx';

const items = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/exams', icon: 'bi-journal-text', label: 'Exams' },
  { to: '/students', icon: 'bi-people', label: 'Students' },
  { to: '/settings', icon: 'bi-sliders', label: 'Settings' }
];

export const Sidebar = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setShowConfirm(false);
    await dispatch(logoutUser());
    onClose();
    toast('Success', 'Logged out successfully.', 'success');
    setTimeout(() => navigate('/login'), 300);
  };

  return (
    <>
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
          <button className="sidebar-link sidebar-button" type="button" onClick={() => setShowConfirm(true)}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <div className={`modal fade ${showConfirm ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showConfirm ? 'rgba(0,0,0,0.5)' : 'transparent' }} onClick={() => setShowConfirm(false)}>
        <div className="modal-dialog modal-dialog-centered modal-sm" onClick={(event) => event.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title">Confirm Logout</h5>
              <button type="button" className="btn-close" onClick={() => setShowConfirm(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};