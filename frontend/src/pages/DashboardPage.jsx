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

  if (loading) return <div className="surface p-4">Loading dashboard...</div>;
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
    { label: 'Total Students', value: cards.totalStudents || 0, icon: 'bi-people', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', color: '#1565c0' },
    { label: 'Total Revenue', value: money(cards.totalRevenue), icon: 'bi-currency-rupee', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' },
    { label: 'Total Due', value: money(cards.totalDue), icon: 'bi-exclamation-circle', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', color: '#c62828' },
    { label: 'This Month Revenue', value: money(cards.thisMonthRevenue), icon: 'bi-calendar2-check', bg: 'linear-gradient(135deg, #ecfeff, #cffafe)', color: '#0891b2' },
    { label: 'Published Exams', value: cards.publishedExams || cards.completedExams || 0, icon: 'bi-check-circle', bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', color: '#7b1fa2' },
    { label: 'Active Exams', value: cards.activeExams || cards.pendingExams || 0, icon: 'bi-play-circle', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', color: '#e65100' }
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Financial and exam system overview." />

      {/* Welcome Card */}
      {/* <div
        className="card shadow border-0 mb-4 text-white"
        style={{
          borderRadius: 12,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="card-body py-3 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="fw-bold mb-1">Welcome Back!</h4>
              <small className="opacity-75">
                Track your exams and results.
              </small>
            </div>

            <div className="text-end">
              <h3 className="fw-bold mb-0">#</h3>
              <small className="opacity-75">Available</small>
            </div>
          </div>
        </div>
      </div> */}

      <div className="row g-3 mb-4">
        {metrics.map((stat) => (
          <div className="col-sm-6 col-xl-4" key={stat.label}>
            <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: stat.bg }}>
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm" style={{ width: 56, height: 56, minWidth: 56 }}>
                  <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 24 }} />
                </div>
                <div className="min-w-0">
                  <div className="fs-3 fw-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <small className="fw-medium" style={{ color: stat.color }}>{stat.label}</small>
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
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Amount</th>
                    <th>Fee Type</th>
                    <th>Mode</th>
                    <th>Date & Time</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.length === 0 ? (
                    <tr><td colSpan="7" className="text-center text-secondary">No payments recorded yet.</td></tr>
                  ) : recentPayments.map((payment, index) => (
                    <tr key={`${payment.studentId}-${payment.paymentDate}-${payment.amount}-${index}`}>
                      <td className="fw-semibold">{payment.studentName}</td>
                      <td><span className="badge text-bg-secondary">{payment.studentId || '-'}</span></td>
                      <td className="fw-semibold text-success">{money(payment.amount)}</td>
                      <td>{payment.feeName || '-'}</td>
                      <td>{payment.paymentMode || '-'}</td>
                      <td>{payment.paymentDate ? moment(payment.paymentDate).format('DD, MMM, YYYY') : '-'}</td>
                      <td className="text-truncate" style={{ maxWidth: 120 }} title={payment.transactionId || '-'}>{payment.transactionId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
