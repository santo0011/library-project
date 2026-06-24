import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { FeeSummaryCards } from '../components/common/FeeSummaryCards.jsx';
import { api } from '../services/api.js';
import { feeService } from '../services/feeService.js';

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fee, setFee] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/students/exams'),
      api.get('/students/dashboard'),
      api.get('/students/results'),
      feeService.getMine()
    ])
      .then(([examsRes, dashRes, resultsRes, feeData]) => {
        setData({
          exams: examsRes.data.data || [],
          dashboard: dashRes.data.data || {},
          results: resultsRes.data.data || []
        });
        setFee(feeData);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div></div>;
  }

  if (error) return <div className="alert alert-danger">{error}</div>;

  const exams = data?.exams || [];
  const dash = data?.dashboard || {};
  const results = data?.results || [];

  const now = new Date();
  const availableExams = exams.filter((e) => {
    if (e.attempted) return false;
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return now >= start && now <= end;
  }).length;
  const attemptedExams = exams.filter((e) => e.attempted).length;
  const completedExams = dash.completedExams || results.filter((r) => r.status === 'submitted').length;
  const pendingExams = dash.pendingExams || results.filter((r) => r.status === 'in_progress').length;
  const totalMarksObtained = dash.totalMarksObtained || results.reduce((sum, r) => sum + (r.score || 0), 0);
  const avgPercentage = results.length
    ? (results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(1)
    : 0;
  const recentResults = dash.recentResults || [];

  return (
    <div>
      <PageHeader title="Student Dashboard" subtitle="Your financial and exam overview" />

      {/* Fee Summary Cards */}
      {fee && <FeeSummaryCards fee={fee} />}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Available Exams', value: availableExams, icon: 'bi-journal-text', borderClass: 'stat-card-blue', iconBg: '#eef2ff', iconColor: '#4f46e5' },
          { label: 'Attempted', value: attemptedExams, icon: 'bi-check-circle', borderClass: 'stat-card-green', iconBg: '#ecfdf5', iconColor: '#059669' },
          { label: 'Pending', value: pendingExams, icon: 'bi-hourglass', borderClass: 'stat-card-amber', iconBg: '#fffbeb', iconColor: '#d97706' },
          { label: 'Avg Score', value: `${avgPercentage}%`, icon: 'bi-award', borderClass: 'stat-card-purple', iconBg: '#f5f3ff', iconColor: '#7c3aed' }
        ].map((stat) => (
          <div className="col-sm-6 col-xl-3" key={stat.label}>
            <div className={`stat-card ${stat.borderClass}`}>
              <div className="d-flex align-items-center gap-3">
                <div className="dashboard-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                  <i className={`bi ${stat.icon}`} />
                </div>
                <div>
                  <div className="stat-value" style={{ color: stat.iconColor }}>{stat.value}</div>
                  <small className="stat-label">{stat.label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Available Exams and Recent Results */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="surface h-100">
            <div className="d-flex justify-content-between align-items-center p-3 pb-0">
              <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}><i className="bi bi-journal-text me-2 text-primary" />Available Exams</h6>
              <button className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={() => navigate('/student/exams')}>
                <i className="bi bi-arrow-right me-1" />View All
              </button>
            </div>
            <div className="p-3">
              {exams.filter((e) => !e.attempted).length === 0 ? (
                <div className="text-center py-4 text-secondary">
                  <i className="bi bi-check-circle fs-2 d-block mb-2 text-success" />
                  <small>All exams attempted!</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {(() => {
                    const now = new Date();
                    return exams.filter((e) => !e.attempted).slice(0, 5).map((exam) => {
                      const start = new Date(exam.startDate);
                      const end = new Date(exam.endDate);
                      const isAvailable = now >= start && now <= end;
                      return (
                        <div key={exam._id} className="d-flex align-items-center justify-content-between p-3 rounded-3"
                          style={{ background: 'var(--app-bg)' }}>
                          <div>
                            <div className="fw-semibold small" style={{ color: 'var(--app-text)', fontSize: "14px" }}>{exam.name}</div>
                            <small style={{ color: 'var(--app-muted)' }}>{exam.subject} &bull; {exam.totalMarks} marks</small>
                          </div>
                          {isAvailable ? (
                            <button className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                              onClick={() => navigate('/student/exams')}>
                              Start
                            </button>
                          ) : (
                            <span className="btn btn-sm btn-outline-secondary rounded-pill px-3" style={{ cursor: 'default' }}>
                              Not Available Yet
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="surface h-100">
            <div className="d-flex justify-content-between align-items-center p-3 pb-0">
              <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}><i className="bi bi-trophy me-2 text-warning" />Recent Results</h6>
              <button className="btn btn-sm btn-primary rounded-pill shadow-sm" onClick={() => navigate('/student/results')}>
                <i className="bi bi-arrow-right me-1" />View All
              </button>
            </div>
            <div className="p-3">
              {(recentResults.length === 0 && results.length === 0) ? (
                <div className="text-center py-4 text-secondary">
                  <i className="bi bi-journal-x fs-2 d-block mb-2" />
                  <small>No results yet. Complete an exam to see your results.</small>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {(recentResults.length > 0 ? recentResults : results.slice(0, 5)).map((r) => (
                    <div key={r._id} className="d-flex align-items-center justify-content-between p-3 rounded-3 cursor-pointer"
                      style={{ background: 'var(--app-bg)' }}
                      onClick={() => navigate(`/student/results/${r._id}`)}>
                      <div>
                        <div className="fw-semibold small" style={{ color: 'var(--app-text)', fontSize: "18px" }}>{r.exsam?.name || 'Exam'}</div>
                        <small style={{ color: 'var(--app-muted)' }}>
                          Score: {r.score}/{r.totalMarks} &bull; {r.percentage}%
                        </small>
                      </div>
                      <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {results.length > 0 && (
        <div className="surface mt-4">
          <div className="p-3 pb-0">
            <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}><i className="bi bi-graph-up me-2 text-info" />Performance Summary</h6>
          </div>
          <div className="p-3">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="p-3 rounded-3 text-center" style={{ background: 'var(--app-bg)' }}>
                  <div className="text-secondary small">Total Exams</div>
                  <div className="fs-3 fw-bold" style={{ color: '#4f46e5' }}>{results.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded-3 text-center" style={{ background: 'var(--app-bg)' }}>
                  <div className="text-secondary small">Passed</div>
                  <div className="fs-3 fw-bold" style={{ color: '#059669' }}>{results.filter((r) => r.passed).length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded-3 text-center" style={{ background: 'var(--app-bg)' }}>
                  <div className="text-secondary small">Failed</div>
                  <div className="fs-3 fw-bold" style={{ color: '#dc2626' }}>{results.filter((r) => !r.passed).length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded-3 text-center" style={{ background: 'var(--app-bg)' }}>
                  <div className="text-secondary small">Total Marks</div>
                  <div className="fs-3 fw-bold" style={{ color: '#d97706' }}>{totalMarksObtained}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};