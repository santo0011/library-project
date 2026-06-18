import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.jsx';

export const StudentExamsPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startModal, setStartModal] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get('/students/exams')
      .then((res) => setExams(res.data.data || []))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load exams';
        setError(msg);
        console.error('Exam load error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const startExam = async () => {
    setStarting(true);
    try {
      const { data } = await api.post(`/students/exams/${startModal._id}/start`);
      navigate(`/student/exams/${startModal._id}/take`, { state: { submission: data.data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam');
      setStarting(false);
      setStartModal(null);
    }
  };

  const getStatusColor = (exam) => {
    if (exam.attempted) return 'secondary';
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    if (now < start) return 'warning';
    if (now > end) return 'danger';
    return 'success';
  };

  const getStatusLabel = (exam) => {
    if (exam.attempted) return 'Attempted';
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    if (now < start) return 'Upcoming';
    if (now > end) return 'Expired';
    return 'Available';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: 48, height: 48 }} />
          <p className="text-secondary">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Available Exams" subtitle="Select an exam to begin." />
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}<button className="btn-close" onClick={() => setError('')} /></div>}

      <div className="row g-4">
        {exams.length === 0 ? (
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-5">
                <i className="bi bi-journal-x text-secondary fs-1 mb-3 d-block" />
                <h5 className="fw-bold mb-2">No Exams Available</h5>
                <p className="text-secondary mb-0">
                  There are no published exams available at this time. Check back later.
                </p>
              </div>
            </div>
          </div>
        ) : (
          exams.map((exam) => {
            const statusColor = getStatusColor(exam);
            const statusLabel = getStatusLabel(exam);
            const isWithinTime = statusLabel === "Available";

            return (
              <div className="col-md-6 col-xl-4" key={exam._id}>
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body d-flex flex-column p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-1">{exam.name}</h5>
                        <small className="text-secondary">{exam.subject}</small>
                      </div>

                      <span className={`badge bg-${statusColor} rounded-pill`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="small text-secondary mb-3">
                      {exam.description ||
                        `${exam.questions?.length || 0} questions`}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                      <small className="text-secondary">
                        {(() => {
                          const opts = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                          if (statusLabel === 'Upcoming') {
                            return <><i className="bi bi-calendar-event me-1" />Starts On: {new Date(exam.startDate).toLocaleDateString('en-US', opts)}</>;
                          } else if (statusLabel === 'Available') {
                            return <><i className="bi bi-clock-history me-1" />Available Until: {new Date(exam.endDate).toLocaleDateString('en-US', opts)}</>;
                          } else if (statusLabel === 'Expired') {
                            return <><i className="bi bi-clock-history me-1" />Expired On: {new Date(exam.endDate).toLocaleDateString('en-US', opts)}</>;
                          }
                          return null;
                        })()}
                      </small>
                    </div>

                    <div className="d-flex gap-3 mb-3">
                      <div
                        className="text-center flex-fill p-2 rounded-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                        }}
                      >
                        <div
                          className="fw-bold"
                          style={{ color: "#1565c0" }}
                        >
                          {exam.totalMarks}
                        </div>
                        <small
                          className="fw-medium"
                          style={{ color: "#1565c0" }}
                        >
                          Marks
                        </small>
                      </div>

                      <div
                        className="text-center flex-fill p-2 rounded-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
                        }}
                      >
                        <div
                          className="fw-bold"
                          style={{ color: "#2e7d32" }}
                        >
                          {exam.durationMinutes}
                        </div>
                        <small
                          className="fw-medium"
                          style={{ color: "#2e7d32" }}
                        >
                          Minutes
                        </small>
                      </div>

                      <div
                        className="text-center flex-fill p-2 rounded-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                        }}
                      >
                        <div
                          className="fw-bold"
                          style={{ color: "#e65100" }}
                        >
                          {exam.questions?.length || 0}
                        </div>
                        <small
                          className="fw-medium"
                          style={{ color: "#e65100" }}
                        >
                          Questions
                        </small>
                      </div>
                    </div>

                    {exam.attempted ? (
                      <div className="mt-auto">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <small className="text-secondary">
                            Your Score:
                          </small>

                          <span
                            className={`fw-bold ${exam.submission?.passed
                              ? "text-success"
                              : "text-danger"
                              }`}
                          >
                            {exam.submission?.score || 0}/{exam.totalMarks}
                          </span>
                        </div>

                        <button
                          className="btn btn-outline-info w-100 rounded-pill"
                          onClick={() =>
                            navigate(
                              `/student/results/${exam.submission?._id}`
                            )
                          }
                        >
                          <i className="bi bi-eye me-1" /> View Result
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary w-100 rounded-pill mt-auto shadow-sm"
                        onClick={() => setStartModal(exam)}
                        disabled={!isWithinTime}
                      >
                        {isWithinTime ? (
                          <>
                            <i className="bi bi-play-fill me-1" />
                            Start Exam
                          </>
                        ) : (
                          "Not Available"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start Confirmation Modal */}
      {startModal && (
        <Modal
          show={true}
          title="Start Exam"
          onClose={() => { setStartModal(null); setError(''); }}
          footer={
            <>
              <button className="btn btn-outline-secondary rounded-pill" onClick={() => setStartModal(null)}>Cancel</button>
              <button className="btn btn-primary rounded-pill shadow-sm" onClick={startExam} disabled={starting}>
                {starting ? <><span className="spinner-border spinner-border-sm me-1" />Starting...</> : 'Yes, Start Now'}
              </button>
            </>
          }
        >
          <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light rounded-3">
            <i className="bi bi-info-circle text-primary fs-3" />
            <div>
              <strong>Ready to begin?</strong>
              <div className="small text-secondary mt-1">
                Duration: {startModal.durationMinutes} min • Questions: {startModal.questions?.length || 0}
              </div>
            </div>
          </div>
          <p className="text-secondary mb-0">
            You will have <strong>{startModal.durationMinutes} minutes</strong> to complete this exam.
            Each question has a timer of <strong>{startModal.questionTimerSeconds || 30} seconds</strong>.
            Once started, the timer cannot be paused.
          </p>
        </Modal>
      )}
    </div>
  );
};