import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
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

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <PageHeader title="Fees" subtitle="View your fee summary and payment history." />

      {loading ? (
        <div className="surface p-4">
          <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      ) : (
        <>
          <FeeSummaryCards fee={fee} />

          <div className="surface p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="h6 fw-bold mb-0">Fee History</h2>
              <span className={`badge ${statusClass[fee.paymentStatus] || 'bg-secondary'}`}>{fee.paymentStatus}</span>
            </div>
            <ResponsiveTable
              columns={[
                { key: 'name', label: 'Fee Type', render: (item) => <span className="fw-semibold">{item.name}</span> },
                { key: 'amount', label: 'Total Fee', render: (item) => <>{money(item.amount)}</> },
                { key: 'paidAmount', label: 'Paid', render: (item) => <span className="text-success fw-semibold">{money(item.paidAmount)}</span> },
                { key: 'dueAmount', label: 'Due', render: (item) => <span className="text-danger fw-semibold">{money(item.dueAmount)}</span> },
                { key: 'assignedAt', label: 'Assigned', render: (item) => <>{item.assignedAt ? moment(item.assignedAt).format('DD, MMM, YYYY') : '-'}</> },
                { key: 'description', label: 'Description', render: (item) => <>{item.description || '-'}</> },
              ]}
              rows={assignedFees}
              mobileSummary={['name', 'dueAmount']}
              emptyMessage="No fee assigned yet."
            />
          </div>

          <div className="surface p-3 mt-4">
            <h2 className="h6 fw-bold mb-3">Payment History</h2>
            <ResponsiveTable
              columns={[
                { key: 'date', label: 'Date', render: (p) => <>{p.paymentDate ? moment(p.paymentDate).format('DD, MMM, YYYY') : '-'}</> },
                { key: 'amount', label: 'Amount', render: (p) => <span className="text-success fw-semibold">{money(p.amount)}</span> },
                { key: 'mode', label: 'Mode', render: (p) => <>{p.paymentMode || '-'}</> },
                { key: 'feeType', label: 'Fee Type', render: (p) => <>{p.feeName || '-'}</> },
                { key: 'transaction', label: 'Transaction', render: (p) => <>{p.transactionId || '-'}</> },
                { key: 'remarks', label: 'Remarks', render: (p) => <>{p.remarks || '-'}</> },
              ]}
              rows={[...payments].reverse()}
              mobileSummary={['date', 'amount']}
              emptyMessage="No payments recorded yet."
            />
          </div>
        </>
      )}
    </>
  );
};