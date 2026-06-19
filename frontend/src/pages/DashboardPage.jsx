import { useEffect, useState } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { dashboardService } from '../services/dashboardService.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

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

  const cards = summary?.cards || {};
  const examStatus = summary?.examsByStatus || [];
  const passFail = summary?.passFail || [];

  // Gender Distribution Chart (counts)
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [cards.maleCount || 0, cards.femaleCount || 0],
        backgroundColor: ['#465b96', '#0f8b8d'],
        borderWidth: 0
      }
    ]
  };
  const genderChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = cards.maleCount + cards.femaleCount;
            const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${context.label} : ${pct}%`;
          }
        }
      }
    }
  };

  // Exams by Status Chart
  const examStatusChartData = {
    labels: examStatus.map(
      (item) =>
        item.status
          ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
          : "Unknown"
    ),
    datasets: [
      {
        data: examStatus.map((item) => item.count),
        backgroundColor: ["#465b96", "#0f8b8d"],
        borderWidth: 0,
      },
    ],
  };

  const examStatusChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = examStatus.reduce(
              (sum, item) => sum + item.count,
              0
            );

            const pct =
              total > 0
                ? ((context.raw / total) * 100).toFixed(1)
                : 0;

            return `${context.label} : ${pct}%`;
          },
        },
      },
    },
  };

  // Student Growth Chart
  const growthData = summary?.studentGrowth || [];
  const growthChartData = {
    labels: growthData.length ? growthData.map((g) => g.month) : [],
    datasets: [
      {
        label: 'New Students',
        data: growthData.length ? growthData.map((g) => g.count) : [],
        borderColor: '#2454d6',
        backgroundColor: 'rgba(36, 84, 214, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Exam Participation Chart
  const participationData = summary?.examParticipation || [];
  const participationChartData = {
    labels: participationData.length ? participationData.map((p) => p.examName || p.name) : [],
    datasets: [
      {
        label: 'Participants',
        data: participationData.length ? participationData.map((p) => p.count) : [],
        backgroundColor: '#0f8b8d'
      }
    ]
  };

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Exam system overview." />
      {loading ? (
        <div className="surface p-4">Loading dashboard...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          {/* Row 1: Student Statistics Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Students', value: cards.totalStudents, icon: 'bi-people', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', color: '#1565c0' },
              { label: 'Male Students', value: cards.maleCount, icon: 'bi-gender-male', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' },
              { label: 'Female Students', value: cards.femaleCount, icon: 'bi-gender-female', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', color: '#c62828' }
            ].map((stat) => (
              <div className="col-12 col-sm-6 col-xl-4" key={stat.label}>
                <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: stat.bg }}>
                  <div className="card-body d-flex align-items-center gap-3 p-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm"
                      style={{ width: 56, height: 56, minWidth: 56 }}>
                      <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 24 }} />
                    </div>
                    <div>
                      <div className="fs-3 fw-bold" style={{ color: stat.color }}>{stat.value ?? 0}</div>
                      <small className="fw-medium" style={{ color: stat.color }}>{stat.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2: Exam Statistics Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Exams', value: cards.totalExams, icon: 'bi-journal-check', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', color: '#1565c0' },
              { label: 'Published Exams', value: cards.completedExams, icon: 'bi-check-circle', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' },
              { label: 'Active Exams', value: cards.pendingExams, icon: 'bi-play-circle', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', color: '#e65100' }
            ].map((stat) => (
              <div className="col-12 col-sm-6 col-xl-4" key={stat.label}>
                <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: stat.bg }}>
                  <div className="card-body d-flex align-items-center gap-3 p-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm"
                      style={{ width: 56, height: 56, minWidth: 56 }}>
                      <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: 24 }} />
                    </div>
                    <div>
                      <div className="fs-3 fw-bold" style={{ color: stat.color }}>{stat.value ?? 0}</div>
                      <small className="fw-medium" style={{ color: stat.color }}>{stat.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="row g-3">
            {/* Gender Distribution Pie Chart */}
            <div className="col-lg-4">
              <div className="surface p-3 h-100">
                <h2 className="h6 fw-bold mb-3">Gender Distribution</h2>
                {cards.totalStudents ? (
                  <div className="d-flex flex-column align-items-center">
                    <div style={{ maxWidth: 220 }}>
                      <Doughnut data={genderChartData} options={genderChartOptions} />
                    </div>
                    {/* <div className="mt-2 small text-secondary text-center fw-bold">
                      <span style={{ color: '#2454d6' }}>Male : {cards.malePct}%</span>
                      &nbsp;&bull;&nbsp;
                      <span style={{ color: '#0f8b8d' }}>Female : {cards.femalePct}%</span>
                    </div> */}
                  </div>
                ) : <div className="text-secondary">No student data available.</div>}
              </div>
            </div>

            {/* Exams by Status */}
            <div className="col-lg-4">
              <div className="surface p-3 h-100">
                <h2 className="h6 fw-bold mb-3">Exams by Status</h2>
                {examStatus.length ? (
                  <div className="d-flex flex-column align-items-center">
                    <div style={{ maxWidth: 220 }}>
                      <Doughnut data={examStatusChartData} options={examStatusChartOptions} />
                    </div>
                    {/* <div className="mt-3 small text-secondary">
                      {examStatus.map((e) => `${e.status}: ${e.count}`).join(' • ')}
                    </div> */}
                  </div>
                ) : <div className="text-secondary">No exam data available.</div>}
              </div>
            </div>

            {/* Pass / Fail */}
            <div className="col-lg-4">
              <div className="surface p-3 h-100">
                <h2 className="h6 fw-bold mb-3">Pass / Fail</h2>
                {passFail.length ? (
                  <div className="d-flex gap-4 align-items-center justify-content-center h-75">
                    {passFail.map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="fs-1 fw-bold">{item.count}</div>
                        <div className={`small ${item.label === 'Pass' ? 'text-success' : 'text-danger'}`}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-secondary">No results yet.</div>}
              </div>
            </div>

            {/* Student Growth Chart */}
            {growthData.length > 0 && (
              <div className="col-lg-6">
                <div className="surface p-3 h-100">
                  <h2 className="h6 fw-bold mb-3">Student Growth</h2>
                  <Line data={growthChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            )}

            {/* Exam Participation Chart */}
            {participationData.length > 0 && (
              <div className="col-lg-6">
                <div className="surface p-3 h-100">
                  <h2 className="h6 fw-bold mb-3">Exam Participation</h2>
                  <Bar data={participationChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};