import { useEffect, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Drawer } from '../components/common/Drawer.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { ExamForm } from '../components/exams/ExamForm.jsx';
import { usePermission } from '../hooks/usePermission.js';
import { examService } from '../services/examService.js';
import { PERMISSIONS } from '../utils/constants.js';
import { confirmAction, showToast } from '../utils/sweetAlerts.js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/Toast.jsx';

export const ExamsPage = () => {
  const [exams, setExams] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const canWrite = usePermission(PERMISSIONS.EXAMS_WRITE);
  const canRead = usePermission(PERMISSIONS.EXAMS_READ);

  const load = () => {
    setLoading(true);
    examService.list(filters).then(setExams).finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  const save = async (payload) => {
    setBusy(true);
    try {
      if (editing?._id) await examService.update(editing._id, payload);
      else await examService.create(payload);
      setEditing(null);
      load();
    } catch (err) {
      const message = err.response?.data?.message || '';
      if (message.includes('Cannot Publish Exam')) {
        toast('Cannot Publish Exam', 'This exam does not contain any questions.\nPlease add at least one question before publishing the exam.');
      } else if (message.includes('students have already participated')) {
        toast('Delete Not Allowed', 'This exam cannot be deleted because one or more students have already participated in it.');
      } else {
        toast('Error', message || 'Failed to save exam');
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (exam) => {
    const result = await confirmAction({
      title: 'Delete Exam',
      text: `Delete "${exam.name}"? This action cannot be undone.`,
      confirmButtonText: 'Delete'
    });
    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await examService.remove(exam._id);
      load();
      showToast('success', 'Exam deleted successfully.');
    } catch (err) {
      const message = err.response?.data?.message || '';
      if (message.includes('students have already participated')) {
        showToast('error', 'This exam cannot be deleted because one or more students have already participated in it.');
      } else {
        showToast('error', message || 'Failed to delete exam');
      }
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (date) => date ? moment(date).format('DD MMM YYYY, h:mm A') : '-';

  return (
    <>
      <PageHeader
        title="Exam Management"
        subtitle={`${exams.total} exams in the system.`}
        action={canWrite && <button className="btn btn-primary" type="button" onClick={() => setEditing({})}><i className="bi bi-plus-lg me-2" />New Exam</button>}
      />
      <div className="surface p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6 col-xl-4">
            <input className="form-control" placeholder="Search exams" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} />
          </div>
          <div className="col-md-3 col-xl-2">
            <select className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>
      <div className="surface p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Total Marks</th>
                <th>Duration</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">Loading exams...</td>
                </tr>
              ) : (
                (exams.items || []).map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <div className="fw-semibold">{exam.name}</div>
                    </td>
                    <td>{exam.subject}</td>
                    <td>
                      {exam.totalMarks} (Pass: {exam.passMarks})
                    </td>
                    <td>{exam.durationMinutes} min</td>
                    <td>{formatDate(exam.startDate)}</td>
                    <td>{formatDate(exam.endDate)}</td>
                    <td>
                      <StatusBadge status={exam.status} />
                    </td>
                    <td className="text-end">
                      {canRead && (
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          type="button"
                          onClick={() => navigate(`/exams/${exam._id}/questions`)}
                          title="Questions"
                        >
                          <i className="bi bi-question-circle" />
                        </button>
                      )}

                      {canWrite && (
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          type="button"
                          onClick={() => setEditing(exam)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                      )}

                      {canWrite && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                          onClick={() => remove(exam)}
                          disabled={busy}
                          title="Delete"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="small text-secondary">Showing {(exams.items.length > 0 ? ((exams.page - 1) * 10 + 1) : 0)}–{Math.min(exams.page * 10, exams.total)} of {exams.total}</span>
          {exams.pages > 1 && (
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              {(() => {
                const pages = [];
                const total = exams.pages;
                const current = filters.page;
                const range = 2;
                let start = Math.max(1, current - range);
                let end = Math.min(total, current + range);
                if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
                return pages.map((p, i) =>
                  p === '...' ? <span key={`e${i}`} className="btn btn-outline-secondary border-0 px-1" style={{ cursor: 'default', fontSize: 12 }}>…</span>
                    : <button key={p} className={`btn btn-outline-secondary ${current === p ? 'active' : ''}`} onClick={() => setFilters({ ...filters, page: p })}>{p}</button>
                );
              })()}
              <button className="btn btn-outline-secondary" disabled={filters.page >= exams.pages} onClick={() => setFilters({ ...filters, page: exams.page + 1 })}>Next</button>
            </div>
          )}
        </div>
      </div>
      <Drawer
        show={Boolean(editing)}
        title={editing?._id ? 'Edit Exam' : 'Create Exam'}
        onClose={() => setEditing(null)}
        width="550px"
      >
        <ExamForm exam={editing?._id ? editing : null} onSubmit={save} onClose={() => setEditing(null)} busy={busy} />
      </Drawer>
    </>
  );
};
