import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { FeeSummaryCards } from '../components/common/FeeSummaryCards.jsx';
import { api } from '../services/api.js';
import { feeService } from '../services/feeService.js';

/* ─── Lazy Section: Performance Summary ─── */
const PerformanceSummary = ({ results }) => {
  const totalMarksObtained = useMemo(
    () => results.reduce((sum, r) => sum + (r.score || 0), 0),
    [results]
  );

  return (
    <div className="surface mt-4">
      <div className="p-3 pb-0">
        <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>
          <i className="bi bi-graph-up me-2 text-info" />Performance Summary
        </h6>
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
  );
};

/* ─── Available Exams Section ─── */
const AvailableExamsSection = ({ exams }) => {

  const navigate = useNavigate();

  const filteredExams = useMemo(() => {
    const now = new Date();
    return exams
      .filter((e) => !e.attempted)
      .slice(0, 5)
      .map((exam) => {
        const start = new Date(exam.startDate);
        const end = new Date(exam.endDate);
        return { ...exam, isAvailable: now >= start && now <= end };
      });
  }, [exams]);

  if (exams.filter((e) => !e.attempted).length === 0) {
    return (
      <div className="text-center py-4 text-secondary">
        <i className="bi bi-check-circle fs-2 d-block mb-2 text-success" />
        <small>All exams attempted!</small>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {filteredExams
        .filter((exam) => exam.isAvailable)
        .map((exam) => (
          <div
            key={exam._id}
            className="d-flex align-items-center justify-content-between p-3 rounded-3"
            style={{ background: 'var(--app-bg)' }}
          >
            <div>
              <div
                className="fw-semibold small"
                style={{ color: 'var(--app-text)', fontSize: "14px" }}
              >
                {exam.name}
              </div>
              <small style={{ color: 'var(--app-muted)' }}>
                {exam.subject} &bull; {exam.totalMarks} marks
              </small>
            </div>

            <button
              className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
              onClick={() => navigate('/student/exams')}
            >
              Start
            </button>
          </div>
        ))}
    </div>
  );
};

/* ─── Recent Results Section ─── */
const RecentResultsSection = ({ recentResults, results }) => {
  const navigate = useNavigate();
  const displayResults = useMemo(
    () => (recentResults.length > 0 ? recentResults : results.slice(0, 5)),
    [recentResults, results]
  );

  if (recentResults.length === 0 && results.length === 0) {
    return (
      <div className="text-center py-4 text-secondary">
        <i className="bi bi-journal-x fs-2 d-block mb-2" />
        <small>No results yet. Complete an exam to see your results.</small>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {displayResults.map((r) => (
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
  );
};

/* ─── Main Dashboard Component ─── */
export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (error) return <div className="alert alert-danger">{error}</div>;

  const exams = data?.exams || [];
  const dash = data?.dashboard || {};
  const results = data?.results || [];
  const recentResults = dash.recentResults || [];

  return (
    <div>
      <PageHeader title="Student Dashboard" subtitle="Your financial and exam overview" />

      {/* Fee Summary Cards */}
      {fee && <FeeSummaryCards fee={fee} />}

      {/* Content - shows loader while loading, data when ready */}
      {loading ? (
        <div className="surface p-4">
          <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      ) : (
        <>
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
                  <AvailableExamsSection exams={exams} />
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
                  <RecentResultsSection recentResults={recentResults} results={results} />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {results.length > 0 && <PerformanceSummary results={results} />}
        </>
      )}
    </div>
  );
};