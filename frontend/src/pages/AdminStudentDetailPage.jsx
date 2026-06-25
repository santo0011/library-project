import { useEffect, useState } from 'react';
import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
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
  const [activeTab, setActiveTab] = useState('exam');

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

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div></div>;

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
  const allPayments = [...(fee?.payments || [])].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  const assignedFees = [...(fee?.assignedFees || [])].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)).map((item) => {
    const paid = allPayments
      .filter((p) => p.feeType?.toString() === item.feeType?.toString())
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      ...item,
      paidAmount: paid,
      dueAmount: Math.max(Number(item.amount || 0) - paid, 0)
    };
  });
  const payments = allPayments;

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/students');
    }
  };

  return (
    <div className="compact-drawer">
      {/* Student Profile Card - compact */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--app-text)', fontSize: '1rem' }}>{student.name}</h5>
                <span className={`badge ${student.status === 'active' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{student.status === 'active' ? 'Active' : 'Inactive'}</span>
                <span className="badge bg-secondary" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{student.studentId || 'N/A'}</span>
              </div>
              <div className="d-flex gap-3 mt-1 flex-wrap" style={{ color: 'var(--app-muted)', fontSize: '0.75rem' }}>
                <span><i className="bi bi-envelope me-1" style={{ fontSize: '0.7rem' }} />{student.email}</span>
                <span><i className="bi bi-telephone me-1" style={{ fontSize: '0.7rem' }} />{student.mobile || 'N/A'}</span>
                <span><i className="bi bi-gender-ambiguous me-1" style={{ fontSize: '0.7rem' }} />{student.gender || 'N/A'}</span>
                <span><i className="bi bi-calendar me-1" style={{ fontSize: '0.7rem' }} />
                  Joined: {student.createdAt ? moment(student.createdAt).format('DD, MMM, YYYY') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - compact */}
      <ul className="nav nav-tabs mb-3" style={{ fontSize: '0.8rem' }}>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'exam' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('exam')}
            style={{ padding: '6px 12px' }}
          >
            <i className="bi bi-trophy me-1 text-warning" />Exam Details
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'fee' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveTab('fee')}
            style={{ padding: '6px 12px' }}
          >
            <i className="bi bi-cash-coin me-1 text-success" />Fee Details
          </button>
        </li>
      </ul>

      {activeTab === 'exam' && (
        <>
          {/* Stats Cards - compact */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Exams', value: stats.totalExams, icon: 'bi-journal-text', borderClass: 'stat-card-blue', iconBg: '#eef2ff', iconColor: '#4f46e5' },
              { label: 'Passed', value: stats.passed, icon: 'bi-check-circle', borderClass: 'stat-card-green', iconBg: '#ecfdf5', iconColor: '#059669' },
              { label: 'Failed', value: stats.failed, icon: 'bi-x-circle', borderClass: 'stat-card-red', iconBg: '#fef2f2', iconColor: '#dc2626' },
              { label: 'Avg Score', value: `${stats.avgPercentage}%`, icon: 'bi-award', borderClass: 'stat-card-teal', iconBg: '#ecfeff', iconColor: '#0891b2' },
              { label: 'Best Score', value: `${stats.bestScore}%`, icon: 'bi-trophy', borderClass: 'stat-card-amber', iconBg: '#fffbeb', iconColor: '#d97706' },
              { label: 'Total Marks', value: stats.totalScore, icon: 'bi-calculator', borderClass: 'stat-card-purple', iconBg: '#f5f3ff', iconColor: '#7c3aed' }
            ].map((s) => (
              <div className="col-sm-6 col-xl-4" key={s.label}>
                <div className={`stat-card ${s.borderClass}`} style={{ padding: '12px 14px' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="dashboard-stat-icon" style={{ width: 36, height: 36, minWidth: 36, fontSize: 15, borderRadius: 9, background: s.iconBg, color: s.iconColor }}>
                      <i className={`bi ${s.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="stat-value" style={{ fontSize: '1.15rem', color: s.iconColor }}>{s.value}</div>
                      <small className="stat-label" style={{ fontSize: '0.7rem' }}>{s.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Exam History & Results - compact */}
          <div className="card shadow-sm border mb-3" style={{ borderRadius: 10 }}>
            <div className="card-header border-0 pt-2 pb-0 px-3" style={{ background: 'transparent' }}>
              <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)', fontSize: '0.82rem' }}>
                <i className="bi bi-trophy me-1 text-warning" />Exam History & Results
              </h6>
            </div>
            <div className="card-body px-3 py-3">
              {results.length === 0 ? (
                <div className="text-center py-3" style={{ color: 'var(--app-muted)' }}>
                  <i className="bi bi-journal-x fs-4 d-block mb-1" />
                  <small style={{ fontSize: '0.75rem' }}>No exam results yet.</small>
                </div>
              ) : (
                <ResponsiveTable
                  columns={[
                    { key: 'exam', label: 'Exam', render: (r) => <span className="fw-semibold">{r.exam?.name || 'N/A'}</span> },
                    { key: 'subject', label: 'Subject', render: (r) => <>{r?.exam?.subject}</> },
                    { key: 'totalMarks', label: 'Total', render: (r) => <>{r.totalMarks}</> },
                    { key: 'score', label: 'Obtained', render: (r) => <>{r.score}</> },
                    {
                      key: 'percentage',
                      label: '%',
                      render: (r) => <span className={`badge ${(r.percentage || 0) >= 40 ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{(r.percentage || 0).toFixed(1)}%</span>
                    },
                    {
                      key: 'passed',
                      label: 'Result',
                      render: (r) => <span className={`badge ${r.passed ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{r.passed ? 'Passed' : 'Failed'}</span>
                    },
                    { key: 'submittedAt', label: 'Date', render: (r) => <>{r.submittedAt ? moment(r.submittedAt).format('DD/MM/YY') : '-'}</> },
                  ]}
                  rows={results}
                  mobileSummary={['exam', 'percentage']}
                  emptyMessage="No exam results yet."
                />
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'fee' && (
        <>
          {/* Fee Summary - compact gradient cards replaced with stat-card style */}
          <div className="row g-3 mb-3">
            {[
              { label: 'Total Fee', value: money(fee?.totalFee), borderClass: 'stat-card-blue', iconBg: '#eef2ff', iconColor: '#4f46e5' },
              { label: 'Paid Amount', value: money(fee?.paidAmount), borderClass: 'stat-card-green', iconBg: '#ecfdf5', iconColor: '#059669' },
              { label: 'Due Amount', value: money(fee?.dueAmount), borderClass: 'stat-card-red', iconBg: '#fef2f2', iconColor: '#dc2626' },
              { label: 'Status', value: fee?.paymentStatus || 'Unpaid', borderClass: 'stat-card-amber', iconBg: '#fffbeb', iconColor: '#d97706' }
            ].map((item) => (
              <div className="col-6 col-xl-3" key={item.label}>
                <div className={`stat-card ${item.borderClass}`} style={{ padding: '12px 14px' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="dashboard-stat-icon" style={{ width: 36, height: 36, minWidth: 36, fontSize: 15, borderRadius: 9, background: item.iconBg, color: item.iconColor }}>
                      <i className={`bi ${item.label === 'Total Fee' ? 'bi-wallet2' : item.label === 'Paid Amount' ? 'bi-check-circle' : item.label === 'Due Amount' ? 'bi-exclamation-circle' : 'bi-receipt'}`} />
                    </div>
                    <div>
                      <div className="stat-value" style={{ fontSize: '1.15rem', color: item.iconColor }}>{item.value}</div>
                      <small className="stat-label" style={{ fontSize: '0.7rem' }}>{item.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fee History - compact table */}
          <div className="card shadow-sm border mb-3" style={{ borderRadius: 10 }}>
            <div className="card-body px-3 py-2">
              <h6 className="fw-bold mb-2" style={{ fontSize: '0.82rem' }}>Fee History</h6>
              <ResponsiveTable
                columns={[
                  { key: 'name', label: 'Fee Type', render: (item) => <span className="fw-semibold">{item.name}</span> },
                  { key: 'amount', label: 'Total', render: (item) => <>{money(item.amount)}</> },
                  { key: 'paidAmount', label: 'Paid', render: (item) => <span className="text-success fw-semibold">{money(item.paidAmount)}</span> },
                  { key: 'dueAmount', label: 'Due', render: (item) => <span className="text-danger fw-semibold">{money(item.dueAmount)}</span> },
                  { key: 'assignedAt', label: 'Assigned', render: (item) => <>{item.assignedAt ? moment(item.assignedAt).format('DD/MM/YY') : '-'}</> },
                  { key: 'description', label: 'Description', render: (item) => <>{item.description || '-'}</> },
                ]}
                rows={assignedFees}
                mobileSummary={['name', 'amount']}
                emptyMessage="No fee assigned yet."
              />
            </div>
          </div>

          {/* Payment History - compact table */}
          <div className="card shadow-sm border mb-3" style={{ borderRadius: 10 }}>
            <div className="card-body px-3 py-2">
              <h6 className="fw-bold mb-2" style={{ fontSize: '0.82rem' }}>Payment History</h6>
              <ResponsiveTable
                columns={[
                  { key: 'paymentDate', label: 'Date', render: (p) => <>{p.paymentDate ? moment(p.paymentDate).format('DD/MM/YY') : '-'}</> },
                  { key: 'amount', label: 'Amount', render: (p) => <span className="fw-semibold text-success">{money(p.amount)}</span> },
                  { key: 'paymentMode', label: 'Mode', render: (p) => <>{p.paymentMode || '-'}</> },
                  { key: 'feeName', label: 'Fee Type', render: (p) => <>{p.feeName || '-'}</> },
                  { key: 'transactionId', label: 'Transaction', render: (p) => <>{p.transactionId || '-'}</> },
                  { key: 'remarks', label: 'Remarks', render: (p) => <>{p.remarks || '-'}</> },
                ]}
                rows={payments}
                mobileSummary={['paymentDate', 'amount']}
                emptyMessage="No payments recorded."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};