import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../services/api.js';

export const StudentProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    api.get('/students/results')
      .then((res) => setResults(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingResults(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally { setBusy(false); }
  };

  const stats = {
    totalExams: results.length,
    completedExams: results.filter((r) => r.status === 'submitted').length,
    totalScore: results.reduce((sum, r) => sum + (r.score || 0), 0),
    avgPercentage: results.length
      ? (results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(1)
      : 0
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View your account information and performance." />

      <div className="row g-4">
        {/* Profile Info */}
        <div className="col-lg-5">
          <div className="card shadow border-0" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fs-3 fw-bold"
                  style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <h5 className="fw-bold mt-3 mb-1" style={{ color: 'var(--app-text)' }}>{user?.name}</h5>
                <span className={`badge ${user?.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                  {user?.status || 'N/A'}
                </span>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Student ID</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>{user?.studentId || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Email</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>{user?.email || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Mobile</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>{user?.mobile || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Gender</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>{user?.gender || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Date of Birth</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>
                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-secondary">Member Since</span>
                  <span className="fw-semibold" style={{ color: 'var(--app-text)' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card shadow border-0 mt-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3" style={{ color: 'var(--app-text)' }}><i className="bi bi-key me-2" />Change Password</h6>
              <form onSubmit={handleChangePassword}>
                {message && <div className="alert alert-success py-2 small">{message}</div>}
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                <div className="mb-2">
                  <input type="password" className="form-control form-control-sm" placeholder="Current Password"
                    value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <input type="password" className="form-control form-control-sm" placeholder="New Password"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="mb-3">
                  <input type="password" className="form-control form-control-sm" placeholder="Confirm New Password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn w-100 text-white" disabled={busy}
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 8 }}>
                  {busy ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Performance Stats & Results */}
        <div className="col-lg-7">
          {/* Performance Stats */}
          <div className="row g-3 mb-4">
            <div className="col-4">
              <div className="card shadow border-0 text-center p-3" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                <div className="fs-3 fw-bold" style={{ color: '#1565c0' }}>{stats.totalExams}</div>
                <small className="fw-medium" style={{ color: '#1565c0' }}>Total Exams</small>
              </div>
            </div>
            <div className="col-4">
              <div className="card shadow border-0 text-center p-3" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                <div className="fs-3 fw-bold" style={{ color: '#2e7d32' }}>{stats.completedExams}</div>
                <small className="fw-medium" style={{ color: '#2e7d32' }}>Completed</small>
              </div>
            </div>
            <div className="col-4">
              <div className="card shadow border-0 text-center p-3" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
                <div className="fs-3 fw-bold" style={{ color: '#e65100' }}>{stats.avgPercentage}%</div>
                <small className="fw-medium" style={{ color: '#e65100' }}>Avg Score</small>
              </div>
            </div>
          </div>

          {/* Results History */}
          <div className="card shadow border-0" style={{ borderRadius: 12 }}>
            <div className="card-header border-0 pt-3 pb-0 d-flex justify-content-between align-items-center"
              style={{ background: 'transparent', borderRadius: '12px 12px 0 0' }}>
              <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}><i className="bi bi-trophy me-2 text-warning" />Exam Results</h6>
              {results.length > 0 && (
                <button className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={() => navigate('/student/results')}>
                  <i className="bi bi-arrow-right me-1" />View All
                </button>
              )}
            </div>
            <div className="card-body p-3">
              {loadingResults ? (
                <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>
              ) : results.length === 0 ? (
                <div className="text-center py-4 text-secondary">
                  <i className="bi bi-journal-x fs-2 d-block mb-2" />
                  <small>No results yet. Complete an exam to see your results.</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                      <tr>
                        <th className="text-white">Exam</th>
                        <th className="text-white">Marks</th>
                        <th className="text-white">Percentage</th>
                        <th className="text-white">Result</th>
                        <th className="text-white">Date</th>
                        <th className="text-white"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 10).map((r) => (
                        <tr key={r._id} className="cursor-pointer" onClick={() => navigate(`/student/results/${r._id}`)}>
                          <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.exam?.name || 'N/A'}</td>
                          <td style={{ color: 'var(--app-text)' }}>{r.score}/{r.totalMarks}</td>
                          <td>
                            <span className={`badge ${(r.percentage || 0) >= 40 ? 'bg-success' : 'bg-danger'} rounded-pill`}>{r.percentage || 0}%</span>
                          </td>
                          <td>
                            <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                              {r.passed ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--app-text)' }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary rounded-pill px-2 py-0"
                              onClick={(e) => { e.stopPropagation(); navigate(`/student/results/${r._id}`); }}>
                              <i className="bi bi-eye" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};