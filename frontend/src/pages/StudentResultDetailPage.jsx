import { useEffect, useState } from 'react';
import moment from 'moment';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
import { api } from '../services/api.js';

export const StudentResultDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state on every navigation — this fires BEFORE the next render
    // when location.pathname changes (list vs detail are different paths)
    setLoading(true);
    setResult(null);
    setError('');

    if (!id) {
      api.get('/students/results')
        .then((res) => setResult({ results: res.data.data || [] }))
        .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/students/results/${id}`)
        .then((res) => setResult(res.data.data))
        .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id, location.pathname]);

  // List view — header shows immediately, loader for content
  if (!id) {
    // Defensive guard: if result is still a detail object (stale data from navigation),
    // show loading instead of crashing on result.results being undefined
    const isStaleDetail = result && !Array.isArray(result.results);
    return (
      <div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--app-text)' }}>My Results</h4>
            <p className="text-secondary mb-0">View your exam performance history.</p>
          </div>
        </div>
        {loading || isStaleDetail ? (
          <div className="surface p-4">
            <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : result?.results?.length === 0 ? (
          <div className="card shadow border-0" style={{ borderRadius: 16 }}>
            <div className="card-body text-center py-5">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style={{ width: 72, height: 72 }}>
                <i className="bi bi-journal-x text-secondary fs-2" />
              </div>
              <p className="text-secondary mb-0">No results yet. Complete an exam to see your results.</p>
            </div>
          </div>
        ) : (
          <ResponsiveTable
            columns={[
              { key: 'examName', label: 'Exam Name', render: (r) => <span className="fw-semibold">{r.exam?.name || 'N/A'}</span> },
              { key: 'totalMarks', label: 'Total Marks', render: (r) => <>{r.totalMarks}</> },
              { key: 'score', label: 'Obtained', render: (r) => <span className="fw-semibold">{r.score}</span> },
              { key: 'percentage', label: 'Percentage', render: (r) => <span className={`badge ${(r.percentage || 0) >= 40 ? 'bg-success' : 'bg-danger'} rounded-pill`}>{r.percentage || 0}%</span> },
              { key: 'result', label: 'Result', render: (r) => <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'} rounded-pill`}>{r.passed ? 'Pass' : 'Fail'}</span> },
              { key: 'date', label: 'Date', render: (r) => <>{r.submittedAt ? moment(r.submittedAt).format('DD, MMM, YYYY') : '-'}</> },
              {
                key: 'action', label: 'Action', render: (r) => (
                  <button className="btn btn-sm rounded-pill text-white px-3"
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/student/results/${r._id}`); }}>
                    <i className="bi bi-eye me-1" />View
                  </button>
                )
              },
            ]}
            rows={result.results}
            mobileSummary={['examName', 'percentage']}
            onRowClick={(r) => navigate(`/student/results/${r._id}`)}
            emptyMessage="No results yet. Complete an exam to see your results."
          />
        )}
      </div>
    );
  }

  // Detail view (single result) — loading state
  if (loading) {
    return (
      <div>
        <button className="btn btn-outline-secondary btn-sm rounded-pill mb-3" onClick={() => navigate('/student/results')}>
          <i className="bi bi-arrow-left me-1" /> Back to Results
        </button>
        <div className="surface p-4">
          <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-4">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle flex-shrink-0" />
          <span>{error || 'Result not found'}</span>
        </div>
      </div>
    );
  }

  const r = result;
  const totalQuestions = r.resultItems?.length || 0;
  const correctCount = r.resultItems?.filter((item) => item.isCorrect).length || 0;
  const unansweredCount = r.resultItems?.filter((item) => item.selectedOption === null || item.selectedOption === undefined).length || 0;
  const wrongCount = totalQuestions - correctCount - unansweredCount;

  return (
    <div>
      <button className="btn btn-outline-secondary btn-sm rounded-pill mb-3" onClick={() => navigate('/student/results')}>
        <i className="bi bi-arrow-left me-1" /> Back to Results
      </button>

      <div className="card shadow border-0 mb-4 text-white" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body px-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">{r.exam?.name || 'Exam Result'}</h4>
              <p className="mb-0 opacity-75">{r.exam?.subject || ''}</p>
              <small className="opacity-60 d-block mt-1">
                <i className="bi bi-calendar3 me-1" />
                {r.submittedAt ? moment(r.submittedAt).format('DD, MMM, YYYY') : '-'}
              </small>
            </div>
            <div className={`px-4 py-2 rounded-3 ${r.passed ? 'bg-success' : 'bg-danger'}`}>
              <div className="fw-bold fs-5 text-center">
                {r.passed ? 'PASS' : 'FAIL'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result summary stats — 6 cards in 3x2 grid on desktop, 2 per row on mobile */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-blue">
            <div className="text-center">
              <div className="stat-value" style={{ color: '#4f46e5' }}>{r.totalMarks}</div>
              <small className="stat-label">Total Marks</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-green">
            <div className="text-center">
              <div className="stat-value" style={{ color: '#059669' }}>{r.score}</div>
              <small className="stat-label">Obtained</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-amber">
            <div className="text-center">
              <div className="stat-value" style={{ color: '#d97706' }}>{r.percentage}%</div>
              <small className="stat-label">Percentage</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-green">
            <div className="d-flex align-items-center gap-3">
              <div className="dashboard-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <i className="bi bi-check-lg" />
              </div>
              <div>
                <div className="stat-value" style={{ color: '#059669' }}>{correctCount}</div>
                <small className="stat-label">Correct</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-red">
            <div className="d-flex align-items-center gap-3">
              <div className="dashboard-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <i className="bi bi-x-lg" />
              </div>
              <div>
                <div className="stat-value" style={{ color: '#dc2626' }}>{wrongCount}</div>
                <small className="stat-label">Wrong</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="stat-card stat-card-amber">
            <div className="d-flex align-items-center gap-3">
              <div className="dashboard-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                <i className="bi bi-question-lg" />
              </div>
              <div>
                <div className="stat-value" style={{ color: '#d97706' }}>{unansweredCount}</div>
                <small className="stat-label">Unanswered</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow border-0 mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between mb-2">
            <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>Performance</h6>
            <span className={`fw-bold ${(r.percentage || 0) >= 70 ? 'text-success' : (r.percentage || 0) >= 40 ? 'text-warning' : 'text-danger'}`}>
              {r.percentage}%
            </span>
          </div>
          <div className="progress" style={{ height: 7, borderRadius: 7 }}>
            <div className={`progress-bar ${(r.percentage || 0) >= 70 ? 'bg-success' : (r.percentage || 0) >= 40 ? 'bg-warning' : 'bg-danger'}`}
              style={{ width: `${Math.min(r.percentage || 0, 100)}%`, borderRadius: 7, transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {r.resultItems?.length > 0 && (
        <div>
          <h5 className="fw-bold mb-2" style={{ color: 'var(--app-text)' }}>
            <i className="bi bi-list-check me-2 text-primary" />Answer Review
          </h5>
          <div className="d-flex flex-column gap-2">
            {r.resultItems.map((item, idx) => {
              const isCorrect = item.isCorrect;
              return (
                <div key={item.question?._id || idx} className="card shadow-sm border-0" style={{ borderRadius: 10 }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge rounded-pill text-white px-2 py-1"
                        style={{ background: isCorrect ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'linear-gradient(135deg, #f093fb, #f5576c)', fontSize: 11 }}>
                        Q{idx + 1}
                      </span>
                      <span className={`badge rounded-pill ${isCorrect ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: 11 }}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="small" style={{ color: 'var(--app-muted)' }}>{item.awardedMarks}/{item.marks}</span>
                    </div>

                    <p className="fw-medium mb-2" style={{ color: 'var(--app-text)', fontSize: 14 }}>{item.title}</p>

                    <div className="d-flex flex-column gap-1">
                      {(item.options || []).map((opt, i) => {
                        const isSelected = item.selectedOption === i;
                        const optIsCorrect = item.correctOption === i;
                        let bgColor = 'transparent';
                        let borderColor = '#dee2e6';
                        let textColor = 'var(--app-text)';
                        let icon = null;

                        if (optIsCorrect) {
                          bgColor = '#e8f5e9';
                          borderColor = '#4caf50';
                          textColor = '#2e7d32';
                          icon = <i className="bi bi-check-circle-fill text-success ms-auto" />;
                        } else if (isSelected && !optIsCorrect) {
                          bgColor = '#fce4ec';
                          borderColor = '#ef5350';
                          textColor = '#c62828';
                          icon = <i className="bi bi-x-circle-fill text-danger ms-auto" />;
                        }

                        return (
                          <div key={i} className="p-2 rounded-2 d-flex align-items-center gap-2 border"
                            style={{ background: bgColor, borderColor: borderColor, color: textColor }}>
                            <span className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold small ${optIsCorrect ? 'bg-success text-white' : isSelected && !optIsCorrect ? 'bg-danger text-white' : 'bg-light'}`}
                              style={{ width: 28, height: 28, minWidth: 28, fontSize: 11, color: "#000" }}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="small">{opt.text}</span>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div className="mt-2 p-2 rounded-2" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                        <small style={{ color: 'var(--app-text)' }}><strong>Explanation:</strong> {item.explanation}</small>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};