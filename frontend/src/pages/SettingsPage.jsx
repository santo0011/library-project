import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { authService } from '../services/authService.js';
import { useToast } from '../components/common/Toast.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { logout } from '../redux/slices/authSlice.js';

export const SettingsPage = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  // Change Email
  const [emailForm, setEmailForm] = useState({ newEmail: '' });
  const [emailErrors, setEmailErrors] = useState({});
  const [emailBusy, setEmailBusy] = useState(false);

  // Change Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailForm.newEmail.trim()) {
      errs.newEmail = 'Email is required';
    } else if (!emailRegex.test(emailForm.newEmail.trim())) {
      errs.newEmail = 'Invalid email format';
    } else if (emailForm.newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      errs.newEmail = 'This is already your current email';
    }
    setEmailErrors(errs);
    if (Object.keys(errs).length) return;

    setEmailBusy(true);
    try {
      await authService.changeEmail(emailForm.newEmail.trim());
      toast('Email Updated', 'Your email has been changed. Please log in again.', 'success');
      setEmailForm({ newEmail: '' });
      setTimeout(() => dispatch(logout()), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change email';
      setEmailErrors({ api: msg });
      toast('Error', msg, 'error');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errs.newPassword = 'New password is required';
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (!pwForm.confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwBusy(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast('Password Changed', 'Your password has been updated. Please log in again.', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => dispatch(logout()), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setPwErrors({ api: msg });
      toast('Error', msg, 'error');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and application preferences." />

      <div className="row g-4">
        {/* Account Settings */}
        <div className="col-lg-6">
          <div className="surface p-4 h-100">
            <h5 className="fw-bold mb-1" style={{ color: 'var(--app-text)' }}>
              <i className="bi bi-envelope me-2 text-primary" />Change Email
            </h5>
            <p className="small mb-3" style={{ color: 'var(--app-muted)' }}>
              Current email: <strong>{user?.email || 'N/A'}</strong>
            </p>
            <form onSubmit={handleChangeEmail}>
              {emailErrors.api && <div className="alert alert-danger py-2 small">{emailErrors.api}</div>}
              <div className="mb-3">
                <label className="form-label">New Email</label>
                <input
                  type="email"
                  className={`form-control ${emailErrors.newEmail ? 'is-invalid' : ''}`}
                  placeholder="Enter new email address"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                />
                {emailErrors.newEmail && <div className="invalid-feedback">{emailErrors.newEmail}</div>}
              </div>
              <button className="btn btn-primary w-100" type="submit" disabled={emailBusy}>
                {emailBusy ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="col-lg-6">
          <div className="surface p-4 h-100">
            <h5 className="fw-bold mb-1" style={{ color: 'var(--app-text)' }}>
              <i className="bi bi-shield-lock me-2 text-warning" />Change Password
            </h5>
            <p className="small mb-3" style={{ color: 'var(--app-muted)' }}>
              Use a strong password with at least 6 characters.
            </p>
            <form onSubmit={handleChangePassword}>
              {pwErrors.api && <div className="alert alert-danger py-2 small">{pwErrors.api}</div>}
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className={`form-control ${pwErrors.currentPassword ? 'is-invalid' : ''}`}
                  placeholder="Enter current password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                />
                {pwErrors.currentPassword && <div className="invalid-feedback">{pwErrors.currentPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className={`form-control ${pwErrors.newPassword ? 'is-invalid' : ''}`}
                  placeholder="Enter new password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
                {pwErrors.newPassword && <div className="invalid-feedback">{pwErrors.newPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className={`form-control ${pwErrors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Confirm new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
                {pwErrors.confirmPassword && <div className="invalid-feedback">{pwErrors.confirmPassword}</div>}
              </div>
              <button className="btn btn-warning w-100" type="submit" disabled={pwBusy}>
                {pwBusy ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};