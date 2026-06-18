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

  // Gender Distribution Chart
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [cards.maleCount || 0, cards.femaleCount || 0],
        backgroundColor: ['#2454d6', '#dc3545'],
        borderWidth: 0
      }
    ]
  };

  // Exams by Status Chart
  const examStatusChartData = {
    labels: examStatus.map((item) => item.status || 'Unknown'),
    datasets: [
      {
        data: examStatus.map((item) => item.count),
        backgroundColor: ['#2454d6', '#0f8b8d', '#b86b00', '#6c757d'],
        borderWidth: 0
      }
    ]
  };

  // Student Growth Chart (using recent students data)
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
          {/* Statistics Cards */}
          <div className="row g-3 mb-4">
            {[
              ['Total Students', cards.totalStudents, 'bi-people text-primary'],
              ['Male Students', cards.maleCount, 'bi-gender-male text-primary'],
              ['Female Students', cards.femaleCount, 'bi-gender-female text-danger'],
              ['Male %', cards.malePct + '%', 'bi-percent text-primary'],
              ['Female %', cards.femalePct + '%', 'bi-percent text-danger'],
              ['Total Exams', cards.totalExams, 'bi-journal-check text-warning'],
              ['Published Exams', cards.completedExams, 'bi-check-circle text-success'],
              ['Active Exams', cards.pendingExams, 'bi-play-circle text-info']
            ].map(([label, value, icon]) => (
              <div className="col-sm-6 col-xl-3" key={label}>
                <div className="surface metric-card p-3 d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-secondary small">{label}</div>
                    <div className="fs-2 fw-bold">{value ?? 0}</div>
                  </div>
                  <i className={`bi ${icon} fs-3`} />
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
                      <Doughnut data={genderChartData} />
                    </div>
                    <div className="mt-3 small text-secondary">
                      {cards.maleCount} Male &bull; {cards.femaleCount} Female
                    </div>
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
                      <Doughnut data={examStatusChartData} />
                    </div>
                    <div className="mt-3 small text-secondary">
                      {examStatus.map((e) => `${e.status}: ${e.count}`).join(' • ')}
                    </div>
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
