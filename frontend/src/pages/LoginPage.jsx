import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginUser, logout } from '../redux/slices/authSlice.js';
import { useToast } from '../components/common/Toast.jsx';

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, status } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '', portal: 'admin' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const toast = useToast();

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  if (accessToken) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    setApiError('');
    if (Object.keys(nextErrors).length) return;

    const redirectPath = form.portal === 'student' ? '/student/dashboard' : '/dashboard';
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(location.state?.from?.pathname || redirectPath, { replace: true });
    } else {
      setApiError(result.payload || 'Unable to login');
    }
  };

  return (
    <form className="w-100" onSubmit={submit}>
      <h2 className="fw-bold mb-2">Welcome back</h2>
      <p className="text-secondary mb-4">Sign in to the examination system.</p>
      {apiError && <div className="alert alert-danger">{apiError}</div>}
      <div className="btn-group w-100 mb-3" role="group">
        <input type="radio" className="btn-check" name="portal" id="adminPortal" checked={form.portal === 'admin'} onChange={() => setForm({ ...form, portal: 'admin' })} />
        <label className="btn btn-outline-primary" htmlFor="adminPortal">Admin</label>
        <input type="radio" className="btn-check" name="portal" id="studentPortal" checked={form.portal === 'student'} onChange={() => setForm({ ...form, portal: 'student' })} />
        <label className="btn btn-outline-primary" htmlFor="studentPortal">Student</label>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="email">{form.portal === 'student' ? 'Student ID or Email' : 'Email'}</label>
        <input id="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={form.portal === 'student' ? 'STD-1001 or email@example.com' : 'admin@example.com'} />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>
      <div className="mb-4">
        <label className="form-label" htmlFor="password">Password</label>
        <input id="password" type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
      </div>
      <button className="btn btn-primary w-100 py-2" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};