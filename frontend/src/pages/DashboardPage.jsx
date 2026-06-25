import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
import { dashboardService } from '../services/dashboardService.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

export const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService
      .summary()
      .then(setSummary)
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;

  const cards = summary?.cards || {};
  const monthlyIncome = summary?.monthlyIncome || [];
  const recentPayments = summary?.recentPayments || [];
  const highestDue = summary?.highestDue || [];

  const incomeChartData = {
    labels: monthlyIncome.map((item) => moment(item.month, 'YYYY-MM').format('MMM YYYY')),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyIncome.map((item) => item.amount),
        backgroundColor: '#0f8b8d',
        borderRadius: 8,
        maxBarThickness: 42
      }
    ]
  };

  const incomeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => money(context.raw)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => money(value)
        }
      }
    }
  };

  const metrics = [
    { label: 'Total Students', value: cards.totalStudents || 0, icon: 'bi-people', borderClass: 'stat-card-blue', iconBg: '#eef2ff', iconColor: '#4f46e5' },
    { label: 'Total Revenue', value: money(cards.totalRevenue), icon: 'bi-currency-rupee', borderClass: 'stat-card-green', iconBg: '#ecfdf5', iconColor: '#059669' },
    { label: 'Total Due', value: money(cards.totalDue), icon: 'bi-exclamation-circle', borderClass: 'stat-card-red', iconBg: '#fef2f2', iconColor: '#dc2626' },
    { label: 'This Month Revenue', value: money(cards.thisMonthRevenue), icon: 'bi-calendar2-check', borderClass: 'stat-card-teal', iconBg: '#ecfeff', iconColor: '#0891b2' },
    { label: 'Published Exams', value: cards.publishedExams || cards.completedExams || 0, icon: 'bi-check-circle', borderClass: 'stat-card-purple', iconBg: '#f5f3ff', iconColor: '#7c3aed' },
    { label: 'Active Exams', value: cards.activeExams || cards.pendingExams || 0, icon: 'bi-play-circle', borderClass: 'stat-card-amber', iconBg: '#fffbeb', iconColor: '#d97706' }
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Financial and exam system overview." />

      {loading ? (
        <div className="surface p-4">
          <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {metrics.map((stat) => (
              <div className="col-sm-6 col-xl-4" key={stat.label}>
                <div className={`stat-card ${stat.borderClass}`}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="dashboard-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                      <i className={`bi ${stat.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="stat-value" style={{ color: stat.iconColor }}>{stat.value}</div>
                      <small className="stat-label">{stat.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-xl-8">
              <div className="surface p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div>
                    <h2 className="h6 fw-bold mb-1">Monthly Income</h2>
                    <small className="text-secondary">Revenue collected by payment month.</small>
                  </div>
                  <span className="badge bg-primary">{money(cards.totalRevenue)} collected</span>
                </div>
                <div style={{ height: 340 }}>
                  {monthlyIncome.length ? (
                    <Bar data={incomeChartData} options={incomeChartOptions} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-secondary">No revenue collected yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="surface p-3 h-100">
                <h2 className="h6 fw-bold mb-3">Top Due Students</h2>
                {highestDue.length ? (
                  <div className="d-flex flex-column gap-2">
                    {highestDue.map((item) => (
                      <div key={item._id} className="d-flex justify-content-between align-items-center p-2 rounded-3" style={{ background: 'var(--app-bg)' }}>
                        <div>
                          <div className="fw-semibold">{item.student?.name || 'Student'}</div>
                          <small className="text-secondary">{item.student?.studentId || '-'}</small>
                        </div>
                        <div className="fw-bold text-danger">{money(item.dueAmount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No pending dues.</div>
                )}
              </div>
            </div>

            <div className="col-12">
              <div className="surface p-3">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h2 className="h6 fw-bold mb-0">Recent Payments</h2>
                  <span className="small text-secondary">Last 5 payments by date & time</span>
                </div>
                <ResponsiveTable
                  columns={[
                    { key: 'studentName', label: 'Student', render: (p) => <span className="fw-semibold">{p.studentName}</span> },
                    { key: 'studentId', label: 'Student ID', render: (p) => <span className="badge text-bg-secondary">{p.studentId || '-'}</span> },
                    { key: 'amount', label: 'Amount', render: (p) => <span className="fw-semibold text-success">{money(p.amount)}</span> },
                    { key: 'feeName', label: 'Fee Type', render: (p) => <>{p.feeName || '-'}</> },
                    { key: 'paymentMode', label: 'Mode', render: (p) => <>{p.paymentMode || '-'}</> },
                    { key: 'paymentDate', label: 'Date & Time', render: (p) => <>{p.paymentDate ? moment(p.paymentDate).format('DD, MMM, YYYY') : '-'}</> },
                    { key: 'transactionId', label: 'Transaction', render: (p) => <span className="text-truncate d-inline-block" style={{ maxWidth: 120 }} title={p.transactionId || '-'}>{p.transactionId || '-'}</span> },
                  ]}
                  rows={recentPayments}
                  mobileSummary={['studentName', 'amount']}
                  emptyMessage="No payments recorded yet."
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};