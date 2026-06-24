import { useEffect, useState } from 'react';
import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

export const StudentResultDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [id]);

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div></div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // List view
  if (!id && result?.results) {
    const results = result.results;
    return (
      <div>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--app-text)' }}>My Results</h4>
            <p className="text-secondary mb-0">View your exam performance history.</p>
          </div>
        </div>
        {results.length === 0 ? (
          <div className="card shadow border-0" style={{ borderRadius: 16 }}>
            <div className="card-body text-center py-5">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style={{ width: 72, height: 72 }}>
                <i className="bi bi-journal-x text-secondary fs-2" />
              </div>
              <p className="text-secondary mb-0">No results yet. Complete an exam to see your results.</p>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle rounded-3 shadow overflow-hidden">
              <thead className="text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <tr>
                  <th className="text-white">Exam Name</th>
                  <th className="text-white">Total Marks</th>
                  <th className="text-white">Obtained</th>
                  <th className="text-white">Percentage</th>
                  <th className="text-white">Result</th>
                  <th className="text-white">Date</th>
                  <th className="text-white text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id} className="cursor-pointer" onClick={() => navigate(`/student/results/${r._id}`)}>
                    <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.exam?.name || 'N/A'}</td>
                    <td style={{ color: 'var(--app-text)' }}>{r.totalMarks}</td>
                    <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.score}</td>
                    <td>
                      <span className={`badge ${(r.percentage || 0) >= 40 ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                        {r.percentage || 0}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'} rounded-pill`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--app-text)' }}>{r.submittedAt ? moment(r.submittedAt).format('DD, MMM, YYYY') : '-'}</td>
                    <td className="text-end">
                      <button className="btn btn-sm rounded-pill text-white px-3"
                        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/student/results/${r._id}`); }}>
                        <i className="bi bi-eye me-1" />View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Single result detail
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

      {/* Header Card with gradient */}
      <div className="card shadow border-0 mb-4 text-white" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">{r.exam?.name || 'Exam Result'}</h4>
              <p className="mb-0 opacity-75">{r.exam?.subject || ''}</p>
            </div>
            <div className={`px-4 py-2 rounded-3 ${r.passed ? 'bg-success' : 'bg-danger'}`}>
              <div className="fw-bold fs-3 text-center">
                {r.passed ? 'PASS' : 'FAIL'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
            <div className="card-body p-3 text-center">
              <small className="text-primary fw-medium">Total Marks</small>
              <div className="fs-2 fw-bold" style={{ color: '#1565c0' }}>{r.totalMarks}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
            <div className="card-body p-3 text-center">
              <small className="text-success fw-medium">Obtained</small>
              <div className="fs-2 fw-bold" style={{ color: '#2e7d32' }}>{r.score}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
            <div className="card-body p-3 text-center">
              <small className="text-warning fw-medium" style={{ color: '#e65100' }}>Percentage</small>
              <div className="fs-2 fw-bold" style={{ color: '#e65100' }}>{r.percentage}%</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
            <div className="card-body p-3 text-center">
              <small className="text-danger fw-medium">Date</small>
              <div className="fs-6 fw-bold" style={{ color: '#c62828' }}>{r.submittedAt ? moment(r.submittedAt).format('DD, MMM, YYYY') : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow border-0" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white" style={{ width: 48, height: 48, minWidth: 48 }}>
                <i className="bi bi-check-lg fs-5" />
              </div>
              <div>
                <div className="fs-4 fw-bold text-success">{correctCount}</div>
                <small className="text-success fw-medium">Correct</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow border-0" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger text-white" style={{ width: 48, height: 48, minWidth: 48 }}>
                <i className="bi bi-x-lg fs-5" />
              </div>
              <div>
                <div className="fs-4 fw-bold text-danger">{wrongCount}</div>
                <small className="text-danger fw-medium">Wrong</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow border-0" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle text-white" style={{ width: 48, height: 48, minWidth: 48, background: '#e65100' }}>
                <i className="bi bi-question-lg fs-5" />
              </div>
              <div>
                <div className="fs-4 fw-bold" style={{ color: '#e65100' }}>{unansweredCount}</div>
                <small className="fw-medium" style={{ color: '#e65100' }}>Unanswered</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="card shadow border-0 mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between mb-2">
            <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>Performance</h6>
            <span className={`fw-bold ${(r.percentage || 0) >= 70 ? 'text-success' : (r.percentage || 0) >= 40 ? 'text-warning' : 'text-danger'}`}>
              {r.percentage}%
            </span>
          </div>
          <div className="progress" style={{ height: 14, borderRadius: 7 }}>
            <div className={`progress-bar ${(r.percentage || 0) >= 70 ? 'bg-success' : (r.percentage || 0) >= 40 ? 'bg-warning' : 'bg-danger'}`}
              style={{ width: `${Math.min(r.percentage || 0, 100)}%`, borderRadius: 7, transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Question Review */}
      {r.resultItems?.length > 0 && (
        <div>
          <h5 className="fw-bold mb-3" style={{ color: 'var(--app-text)' }}>
            <i className="bi bi-list-check me-2 text-primary" />Answer Review
          </h5>
          <div className="d-flex flex-column gap-3">
            {r.resultItems.map((item, idx) => {
              const isCorrect = item.isCorrect;
              return (
                <div key={item.question?._id || idx} className="card shadow border-0" style={{ borderRadius: 12 }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="badge rounded-pill text-white px-3 py-1"
                        style={{ background: isCorrect ? 'linear-gradient(135deg, #43e97b, #38f9d7)' : 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                        Q{idx + 1}
                      </span>
                      <span className={`badge rounded-pill ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="small" style={{ color: 'var(--app-muted)' }}>{item.awardedMarks}/{item.marks} marks</span>
                    </div>

                    <p className="fw-medium mb-3" style={{ color: 'var(--app-text)' }}>{item.title}</p>

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