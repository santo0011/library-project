import { useEffect, useState } from 'react';
import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

export const AdminStudentDetailPage = ({ id: propId, onClose }) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/students/${id}/submissions`).catch(() => ({ data: { data: [] } })),
      api.get(`/fees/students/${id}`).catch(() => ({ data: { data: null } }))
    ])
      .then(([studentRes, submissionsRes, feeRes]) => {
        setStudent(studentRes.data.data);
        setResults(submissionsRes.data.data || []);
        setFee(feeRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load student details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: 48, height: 48 }} />
        <p className="text-secondary">Loading student details...</p>
      </div>
    </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!student) return <div className="alert alert-warning">Student not found.</div>;

  const stats = {
    totalExams: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    avgPercentage: results.length
      ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1)
      : '0',
    totalScore: results.reduce((s, r) => s + (r.score || 0), 0),
    bestScore: results.length ? Math.max(...results.map((r) => r.percentage || 0)) : 0
  };
  const money = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
  const assignedFees = [...(fee?.assignedFees || [])].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  const payments = [...(fee?.payments || [])].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/students');
    }
  };


  return (
    <div>
      {/* <button className="btn btn-outline-secondary btn-sm rounded-pill mb-3" onClick={handleBack}>
        <i className="bi bi-arrow-left me-1" /> {onClose ? 'Close' : 'Back to Students'}
      </button> */}

      {/* Student Profile Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fs-2 fw-bold"
              style={{ width: 80, height: 80, minWidth: 80 }}
            >
              {student.name?.charAt(0)?.toUpperCase() || 'S'}
            </div> */}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>{student.name}</h4>
                <span className={`badge ${student.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                  {student.status}
                </span>
                <span className="badge bg-secondary">{student.studentId || 'N/A'}</span>
              </div>
              <div className="d-flex gap-3 mt-1 flex-wrap" style={{ color: 'var(--app-muted)' }}>
                <span><i className="bi bi-envelope me-1" />{student.email}</span>
                <span><i className="bi bi-telephone me-1" />{student.mobile || 'N/A'}</span>
                <span><i className="bi bi-gender-ambiguous me-1" />{student.gender || 'N/A'}</span>
                <span><i className="bi bi-calendar me-1" />
                  Joined: {student.createdAt ? moment(student.createdAt).format('DD, MMM, YYYY') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Exams', value: stats.totalExams, color: 'primary', icon: 'bi-journal-text' },
          { label: 'Passed', value: stats.passed, color: 'success', icon: 'bi-check-circle' },
          { label: 'Failed', value: stats.failed, color: 'danger', icon: 'bi-x-circle' },
          { label: 'Avg Score', value: `${stats.avgPercentage}%`, color: 'info', icon: 'bi-award' },
          { label: 'Best Score', value: `${stats.bestScore}%`, color: 'warning', icon: 'bi-trophy' },
          { label: 'Total Marks', value: stats.totalScore, color: 'secondary', icon: 'bi-calculator' }
        ].map((s) => (
          <div className="col-sm-6 col-xl-4" key={s.label}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div
                  className={`bg-${s.color}-subtle rounded-3 d-flex align-items-center justify-content-center`}
                  style={{ width: 56, height: 56, minWidth: 56 }}
                >
                  <i className={`bi ${s.icon} text-${s.color} fs-4`} />
                </div>
                <div>
                  <div className="fs-3 fw-bold" style={{ color: 'var(--app-text)' }}>{s.value}</div>
                  <small style={{ color: 'var(--app-muted)' }}>{s.label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exam Results */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-0 pt-3 pb-0" style={{ background: 'transparent' }}>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>
            <i className="bi bi-cash-coin me-2 text-success" />Fees
          </h6>
        </div>
        <div className="card-body p-3">
          <div className="row g-3 mb-3">
            {[
              { label: 'Total Fee', value: money(fee?.totalFee), color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
              { label: 'Paid Amount', value: money(fee?.paidAmount), color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
              { label: 'Due Amount', value: money(fee?.dueAmount), color: '#c62828', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
              { label: 'Payment Status', value: fee?.paymentStatus || 'Unpaid', color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }
            ].map((item) => (
              <div className="col-sm-6 col-xl-3" key={item.label}>
                <div className="p-3 rounded-3 h-100" style={{ background: item.bg }}>
                  <small className="fw-semibold" style={{ color: item.color }}>{item.label}</small>
                  <div className="fs-5 fw-bold" style={{ color: item.color }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <h6 className="fw-bold mb-2">Fee History</h6>
          <div className="table-responsive mb-3">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Assigned</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {assignedFees.length === 0 ? (
                  <tr><td colSpan="4" className="text-center text-secondary">No fee assigned yet.</td></tr>
                ) : assignedFees.map((item) => (
                  <tr key={item._id}>
                    <td className="fw-semibold">{item.name}</td>
                    <td>{money(item.amount)}</td>
                    <td>{item.assignedAt ? moment(item.assignedAt).format('DD, MMM, YYYY') : '-'}</td>
                    <td>{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h6 className="fw-bold mb-2">Payment History</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Fee Type</th>
                  <th>Transaction</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-secondary">No payments recorded.</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.paymentDate ? moment(payment.paymentDate).format('DD, MMM, YYYY') : '-'}</td>
                    <td className="fw-semibold text-success">{money(payment.amount)}</td>
                    <td>{payment.paymentMode || '-'}</td>
                    <td>{payment.feeName || '-'}</td>
                    <td>{payment.transactionId || '-'}</td>
                    <td>{payment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header border-0 pt-3 pb-0" style={{ background: 'transparent' }}>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>
            <i className="bi bi-trophy me-2 text-warning" />Exam History & Results
          </h6>
        </div>
        <div className="card-body p-3">
          {results.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--app-muted)' }}>
              <i className="bi bi-journal-x fs-2 d-block mb-2" />
              <small>No exam results yet.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="">
                  <tr>
                    <th style={{ color: 'var(--app-text)' }}>Exam</th>
                    <th style={{ color: 'var(--app-text)' }}>Subject</th>
                    <th style={{ color: 'var(--app-text)' }}>Total Marks</th>
                    <th style={{ color: 'var(--app-text)' }}>Obtained</th>
                    <th style={{ color: 'var(--app-text)' }}>Percentage</th>
                    <th style={{ color: 'var(--app-text)' }}>Result</th>
                    <th style={{ color: 'var(--app-text)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id}>
                      <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.exam?.name || 'N/A'}</td>
                      <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r?.exam?.subject}</td>
                      <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.totalMarks}</td>
                      <td className="fw-semibold" style={{ color: 'var(--app-text)' }}>{r.score}</td>
                      <td>
                        <span className={`badge ${(r.percentage || 0) >= 40 ? 'bg-success' : 'bg-danger'}`}>
                          {r.percentage || 0}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'}`}>
                          {r.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--app-text)' }}>
                        {r.submittedAt ? moment(r.submittedAt).format('DD, MMM, YYYY') : '-'}
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
  );
};
