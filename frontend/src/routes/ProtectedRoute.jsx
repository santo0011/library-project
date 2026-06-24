import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { restoreSession } from '../redux/slices/authSlice.js';

export const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { accessToken, sessionChecked, status } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!accessToken && !sessionChecked && status !== 'loading') {
      dispatch(restoreSession());
    }
  }, [accessToken, dispatch, sessionChecked, status]);

  if (!sessionChecked || status === 'loading') {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div></div>;
  }

  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};
