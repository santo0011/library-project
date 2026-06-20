import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { feeService } from '../services/feeService.js';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const statusClass = {
  Paid: 'bg-success',
  Partial: 'bg-warning',
  Unpaid: 'bg-danger'
};

export const StudentFeesPage = () => {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    feeService
      .getMine()
      .then(setFee)
      .catch((err) => setError(err.response?.data?.message || 'Unable to load fee details'))
      .finally(() => setLoading(false));
  }, []);

  const payments = useMemo(
    () => [...(fee?.payments || [])].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    [fee]
  );
  const assignedFees = useMemo(
    () => [...(fee?.assignedFees || [])].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)),
    [fee]
  );

  if (loading) return <div className="surface p-4">Loading fee details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <PageHeader title="Fees" subtitle="View your fee summary and payment history." />

      <div className="row g-3 mb-4">
        {[
          { label: 'Total Fee', value: money(fee.totalFee), icon: 'bi-wallet2', color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
          { label: 'Paid Amount', value: money(fee.paidAmount), icon: 'bi-check-circle', color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
          { label: 'Due Amount', value: money(fee.dueAmount), icon: 'bi-exclamation-circle', color: '#c62828', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
          { label: 'Payment Status', value: fee.paymentStatus, icon: 'bi-receipt', color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }
        ].map((stat) => (
          <div className="col-sm-6 col-xl-3" key={stat.label}>
            <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: stat.bg }}>
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm" style={{ width: 56, height: 56, minWidth: 56 }}>
                  <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 24 }} />
                </div>
                <div>
                  <div className="fs-4 fw-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <small className="fw-medium" style={{ color: stat.color }}>{stat.label}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="surface p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="h6 fw-bold mb-0">Fee History</h2>
          <span className={`badge ${statusClass[fee.paymentStatus] || 'bg-secondary'}`}>{fee.paymentStatus}</span>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
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
      </div>

      <div className="surface p-3 mt-4">
        <h2 className="h6 fw-bold mb-3">Payment History</h2>
        <div className="table-responsive">
          <table className="table align-middle">
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
                <tr><td colSpan="6" className="text-center text-secondary">No payments recorded yet.</td></tr>
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
    </>
  );
};
