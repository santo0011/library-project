import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { FeeSummaryCards } from '../components/common/FeeSummaryCards.jsx';
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
    () => [...(fee?.payments || [])].sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)),
    [fee]
  );
  const assignedFees = useMemo(() => {
    const items = [...(fee?.assignedFees || [])].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    const allPayments = fee?.payments || [];

    return items.map((item) => {
      const paid = allPayments
        .filter((p) => p.feeType?.toString() === item.feeType?.toString())
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return {
        ...item,
        paidAmount: paid,
        dueAmount: Math.max(Number(item.amount || 0) - paid, 0)
      };
    });
  }, [fee]);

  if (loading) return <div className="surface p-4">Loading fee details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <PageHeader title="Fees" subtitle="View your fee summary and payment history." />

      <FeeSummaryCards fee={fee} />

      <div className="surface p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h2 className="h6 fw-bold mb-0">Fee History</h2>
          <span className={`badge ${statusClass[fee.paymentStatus] || 'bg-secondary'}`}>{fee.paymentStatus}</span>
        </div>
        <div className="table-responsive" style={{ maxHeight: 310, overflowY: 'auto' }}>
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Total Fee</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Assigned</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {assignedFees.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-secondary">No fee assigned yet.</td></tr>
              ) : assignedFees.map((item) => (
                <tr key={item._id}>
                  <td className="fw-semibold">{item.name}</td>
                  <td>{money(item.amount)}</td>
                  <td className="text-success fw-semibold">{money(item.paidAmount)}</td>
                  <td className="text-danger fw-semibold">{money(item.dueAmount)}</td>
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
        <div className="table-responsive" style={{ maxHeight: 310, overflowY: 'auto' }}>
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
                <tr>
                  <td colSpan="6" className="text-center text-secondary">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                [...payments].reverse().map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      {payment.paymentDate
                        ? moment(payment.paymentDate).format("DD, MMM, YYYY")
                        : "-"}
                    </td>
                    <td className="fw-semibold text-success">
                      {money(payment.amount)}
                    </td>
                    <td>{payment.paymentMode || "-"}</td>
                    <td>{payment.feeName || "-"}</td>
                    <td>{payment.transactionId || "-"}</td>
                    <td>{payment.remarks || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </>
  );
};
