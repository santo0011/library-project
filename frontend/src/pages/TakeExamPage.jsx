import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

const QUESTION_TIMER = 30;
const REVIEW_TIMER = 60;

export const TakeExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('loading'); // loading | exam | review
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.post(`/students/exams/${id}/start`)
      .then((res) => {
        const sub = res.data.data;
        setExam(sub.exam);
        const qs = sub.exam.questions || [];
        setQuestions(qs);
        setCurrentIdx(sub.currentQuestionIndex || 0);
        const saved = {};
        (sub.answers || []).forEach((a) => { saved[a.question] = a.selectedOption; });
        setAnswers(saved);
        setTimeLeft(sub.exam.questionTimerSeconds || QUESTION_TIMER);
        setLoading(false);
        setPhase('exam');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to start exam');
        setLoading(false);
      });
  }, [id]);

  const submitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    try {
      await api.post(`/students/exams/${id}/submit`);
      navigate('/student/exams', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
      setSubmitting(false);
    }
  }, [id, navigate, submitting]);

  // Question timer - auto-advance or go to review
  useEffect(() => {
    if (phase !== 'exam' || loading || submitting || timeLeft <= 0 || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (currentIdx < questions.length - 1) {
            // Move to next question
            const nextIdx = currentIdx + 1;
            setCurrentIdx(nextIdx);
            return exam?.questionTimerSeconds || QUESTION_TIMER;
          } else {
            // Last question - go to review screen
            setPhase('review');
            return REVIEW_TIMER;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, loading, submitting, questions.length, exam?.questionTimerSeconds]);

  // Review timer - auto-submit
  useEffect(() => {
    if (phase !== 'review' || loading || submitting || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, loading, submitting, submitExam, timeLeft]);

  const handleSelectOption = async (questionId, optionIndex) => {
    const newAns = { ...answers, [questionId]: optionIndex };
    setAnswers(newAns);
    try {
      await api.post(`/students/exams/${id}/answer`, { questionId, selectedOption: optionIndex });
    } catch (e) { /* silently save */ }
  };

  const goToQuestion = (idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentIdx(idx);
    setTimeLeft(exam?.questionTimerSeconds || QUESTION_TIMER);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-center text-white">
          <div className="spinner-border mb-3" role="status" style={{ width: 56, height: 56, color: '#fff' }} />
          <h5 className="fw-bold">Preparing your exam...</h5>
          <p className="opacity-75">Loading questions and timer</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg border-0" style={{ maxWidth: 480, width: '100%', borderRadius: 16 }}>
          <div className="card-body text-center p-5">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mb-3" style={{ width: 72, height: 72 }}>
              <i className="bi bi-exclamation-triangle text-danger fs-2" />
            </div>
            <h5 className="fw-bold mb-2">Unable to Start Exam</h5>
            <p className="text-secondary mb-4">{error}</p>
            <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/student/exams')}>Back to Exams</button>
          </div>
        </div>
      </div>
    );
  }

  // No questions screen
  if (!questions.length) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card shadow-lg border-0" style={{ maxWidth: 480, width: '100%', borderRadius: 16 }}>
          <div className="card-body text-center p-5">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 mb-3" style={{ width: 72, height: 72 }}>
              <i className="bi bi-journal-x text-warning fs-2" />
            </div>
            <h5 className="fw-bold mb-2">No Questions Found</h5>
            <p className="text-secondary mb-4">This exam has no questions configured.</p>
            <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/student/exams')}>Back to Exams</button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  // ============================
  // REVIEW & SUBMIT SCREEN
  // ============================
  if (phase === 'review') {
    const unansweredCount = questions.length - answeredCount;
    return (
      <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="px-3 px-lg-4 py-3 d-flex align-items-center justify-content-between text-white">
          <div>
            <h5 className="fw-bold mb-0">{exam?.name}</h5>
            <small className="opacity-75">Review & Submit</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white bg-opacity-20">
              <i className={`bi ${timeLeft <= 10 ? 'bi-clock text-warning' : 'bi-clock'}`} />
              <span className={`fw-bold ${timeLeft <= 10 ? 'text-warning' : ''}`}>{timeLeft}s</span>
            </div>
            <small className="opacity-75">Auto-submits when timer expires</small>
          </div>
        </div>

        <div className="flex-grow-1 d-flex align-items-start justify-content-center p-3 p-lg-4 overflow-auto">
          <div className="w-100" style={{ maxWidth: 720 }}>
            <div className="card shadow-lg border-0" style={{ borderRadius: 16 }}>
              <div className="card-body p-4 p-lg-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3" style={{ width: 72, height: 72 }}>
                    <i className="bi bi-check2-circle text-primary fs-2" />
                  </div>
                  <h4 className="fw-bold">Review Your Answers</h4>
                  <p className="text-secondary">Please review before submitting. Unanswered questions will be marked as incorrect.</p>
                </div>

                {/* Summary cards */}
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                      <div className="fs-2 fw-bold text-success">{answeredCount}</div>
                      <small className="text-success fw-medium">Answered</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
                      <div className="fs-2 fw-bold text-danger">{unansweredCount}</div>
                      <small className="text-danger fw-medium">Unanswered</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 rounded-3 text-center" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                      <div className="fs-2 fw-bold text-primary">{questions.length}</div>
                      <small className="text-primary fw-medium">Total</small>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="text-secondary">Completion</span>
                    <span className="fw-medium">{Math.round((answeredCount / questions.length) * 100)}%</span>
                  </div>
                  <div className="progress" style={{ height: 10, borderRadius: 5 }}>
                    <div className="progress-bar bg-success" style={{ width: `${(answeredCount / questions.length) * 100}%`, borderRadius: 5, transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                {/* Question review dots */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {questions.map((q, i) => {
                    const isAnswered = answers[q._id] !== undefined;
                    return (
                      <span
                        key={q._id}
                        className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold small ${isAnswered ? 'bg-success text-white' : 'bg-light text-secondary border'}`}
                        style={{ width: 36, height: 36, cursor: 'default' }}
                        title={`Q${i + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                      >
                        {i + 1}
                      </span>
                    );
                  })}
                </div>

                {/* Unanswered warning */}
                {unansweredCount > 0 && (
                  <div className="alert alert-warning d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle flex-shrink-0" />
                    <small><strong>{unansweredCount} question(s)</strong> are unanswered. Unanswered questions receive zero marks.</small>
                  </div>
                )}

                {/* Submit button */}
                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => { setPhase('exam'); setTimeLeft(exam?.questionTimerSeconds || QUESTION_TIMER); }}>
                    <i className="bi bi-arrow-left me-1" /> Back to Exam
                  </button>
                  <button className="btn btn-primary rounded-pill px-5 shadow" onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                    <i className="bi bi-check2 ms-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit confirmation */}
        {showSubmitConfirm && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: 16 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Confirm Submission</h5>
                  <button type="button" className="btn-close" onClick={() => setShowSubmitConfirm(false)} />
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                    <i className="bi bi-info-circle text-primary fs-3" />
                    <div>
                      <strong>Submission Summary</strong>
                      <div className="small text-secondary">
                        {answeredCount} of {questions.length} answered
                        {unansweredCount > 0 ? ` (${unansweredCount} unanswered)` : ''}
                      </div>
                    </div>
                  </div>
                  <p className="mb-0 text-secondary">Once submitted, you cannot change your answers. Are you sure you want to submit?</p>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowSubmitConfirm(false)}>Review Again</button>
                  <button className="btn btn-primary rounded-pill px-4 shadow" onClick={submitExam} disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-1" />Submitting...</> : 'Yes, Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================
  // EXAM SCREEN
  // ============================
  const currentQuestion = questions[currentIdx];
  const progressPct = Math.round((answeredCount / questions.length) * 100);
  const timerPct = (timeLeft / (exam?.questionTimerSeconds || QUESTION_TIMER)) * 100;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Top Bar */}
      <div className="bg-white shadow-sm px-3 px-lg-4 py-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0">{exam?.name}</h5>
            <small className="text-secondary">Question {currentIdx + 1} of {questions.length}</small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle text-success" />
              <span className="small fw-medium">{answeredCount}/{questions.length}</span>
            </div>
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border" style={{ minWidth: 80 }}>
              <i className={`bi ${timeLeft <= 5 ? 'bi-clock text-danger' : 'bi-clock text-primary'}`} />
              <span className={`fw-bold ${timeLeft <= 5 ? 'text-danger' : 'text-primary'}`}>{timeLeft}s</span>
            </div>
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => { setPhase('review'); setTimeLeft(REVIEW_TIMER); }}>
              <i className="bi bi-eye me-1" /> Review All
            </button>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="progress rounded-0" style={{ height: 4 }}>
        <div className={`progress-bar ${timeLeft <= 5 ? 'bg-danger' : 'bg-primary'}`}
          role="progressbar" style={{ width: `${timerPct}%`, transition: 'width 1s linear' }} />
      </div>

      {/* Overall Progress */}
      <div className="bg-white border-bottom px-3 px-lg-4 py-2">
        <div className="d-flex align-items-center gap-2">
          <small className="text-secondary fw-medium">Progress:</small>
          <div className="flex-grow-1 progress" style={{ height: 8, borderRadius: 4 }}>
            <div className="progress-bar bg-success" style={{ width: `${progressPct}%`, borderRadius: 4, transition: 'width 0.3s ease' }} />
          </div>
          <small className="text-secondary fw-medium">{progressPct}%</small>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white border-bottom px-3 px-lg-4 py-2 overflow-auto">
        <div className="d-flex gap-1" style={{ minWidth: 'max-content' }}>
          {questions.map((q, i) => (
            <button key={q._id} onClick={() => goToQuestion(i)}
              className={`btn btn-sm rounded-circle d-inline-flex align-items-center justify-content-center ${i === currentIdx ? 'btn-primary' : answers[q._id] !== undefined ? 'btn-success' : 'btn-outline-secondary'}`}
              style={{ width: 32, height: 32, fontSize: 12, padding: 0 }}
              title={`Q${i + 1}: ${answers[q._id] !== undefined ? 'Answered' : 'Unanswered'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-grow-1 d-flex align-items-start justify-content-center p-3 p-lg-4 overflow-auto">
        <div className="w-100" style={{ maxWidth: 800 }}>
          <div className="card shadow-lg border-0" style={{ borderRadius: 16 }}>
            <div className="card-body p-4 p-lg-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge bg-gradient d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  Q{currentIdx + 1}
                </span>
                <small className="text-secondary">{currentQuestion.marks || 1} mark(s)</small>
              </div>
              <h4 className="fw-bold mb-4 lh-base">{currentQuestion.title}</h4>

              <div className="d-flex flex-column gap-2">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = answers[currentQuestion._id] === i;
                  return (
                    <button key={i} onClick={() => handleSelectOption(currentQuestion._id, i)}
                      className={`btn text-start p-3 rounded-3 d-flex align-items-center gap-3 border ${isSelected
                        ? 'text-white shadow-sm' : 'btn-light text-dark border-secondary-subtle'}`}
                      style={isSelected ? { background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' } : { transition: 'all 0.2s ease' }}>
                      <span className={`d-inline-flex align-items-center justify-content-center rounded-circle fw-bold ${isSelected ? 'bg-white text-primary' : 'bg-light text-secondary'}`}
                        style={{ width: 36, height: 36, fontSize: 14, minWidth: 36 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="fw-medium">{opt.text}</span>
                      {isSelected && <i className="bi bi-check-circle-fill ms-auto fs-5" />}
                    </button>
                  );
                })}
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                <button className="btn btn-outline-secondary rounded-pill px-4" disabled={currentIdx === 0} onClick={() => goToQuestion(currentIdx - 1)}>
                  <i className="bi bi-chevron-left me-1" /> Previous
                </button>
                <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => goToQuestion(currentIdx + 1)}>
                  {currentIdx < questions.length - 1 ? 'Next' : 'Finish'}
                  <i className="bi bi-chevron-right ms-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};