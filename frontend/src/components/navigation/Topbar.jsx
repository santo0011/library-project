import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/slices/themeSlice.js';
import { useAuth } from '../../hooks/useAuth.js';

export const Topbar = ({ onMenu }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const mode = useSelector((state) => state.theme.mode);

  return (
    <header className="topbar d-flex align-items-center justify-content-between px-3 px-lg-4">
      <div className="d-flex align-items-center gap-3">
        <button className="btn btn-outline-secondary btn-icon mobile-menu" type="button" onClick={onMenu} aria-label="Open menu">
          <i className="bi bi-list" />
        </button>
        <div>
          <div className="fw-semibold">Control Center</div>
          <div className="small text-secondary">Signed in as {user?.role}</div>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-secondary btn-icon" type="button" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme">
          <i className={`bi ${mode === 'light' ? 'bi-moon' : 'bi-sun'}`} />
        </button>
        <div className="dropdown">
          <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            {user?.name || 'Account'}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><span className="dropdown-item-text small">{user?.email}</span></li>
          </ul>
        </div>
      </div>
    </header>
  );
};
