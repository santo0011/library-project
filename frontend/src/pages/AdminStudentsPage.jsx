import { useEffect, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Drawer } from '../components/common/Drawer.jsx';
import { StudentCreateForm } from '../components/users/StudentCreateForm.jsx';
import { api } from '../services/api.js';
import { AdminStudentDetailPage } from './AdminStudentDetailPage.jsx';
import { confirmAction, showToast } from '../utils/sweetAlerts.js';

const blankStudent = {
  name: '', email: '', password: '', mobile: '', gender: 'Male', dateOfBirth: ''
};

export const AdminStudentsPage = () => {
  const [students, setStudents] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [createBusy, setCreateBusy] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drawerStudentId, setDrawerStudentId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/students', { params: filters }).then((res) => setStudents(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, [filters]);

  const createStudent = async (payload) => {
    setCreateBusy(true);
    setCreateErrors({});
    try {
      const { data } = await api.post('/students', payload);
      setCreateSuccess(data.data);
      load();
    } catch (err) {
      setCreateErrors({ api: err.response?.data?.message || 'Failed to create' });
    } finally {
      setCreateBusy(false);
    }
  };

  const updateStudent = async () => {
    setBusy(true);
    try {
      const payload = { ...editing };
      delete payload._id;
      delete payload.role;
      delete payload.permissions;
      delete payload.studentId;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.lastLoginAt;
      delete payload.__v;
      delete payload.refreshTokenHash;
      // Only send password if admin entered a new one
      if (!payload.password || !payload.password.trim()) {
        delete payload.password;
      }
      await api.patch(`/students/${editing._id}`, payload);
      setEditing(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (student) => {
    const isActive = student.status === 'active';
    const action = isActive ? 'deactivate' : 'activate';
    const result = await confirmAction({
      title: isActive ? 'Deactivate Student' : 'Activate Student',
      text: `Are you sure you want to ${action} ${student.name}?`,
      confirmButtonText: isActive ? 'Deactivate' : 'Activate',
      confirmButtonColor: isActive ? '#ffc107' : '#198754'
    });
    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await api.patch(`/students/${student._id}/toggle-status`);
      load();
      showToast('success', `Student ${isActive ? 'deactivated' : 'activated'} successfully.`);
    } catch (err) {
      showToast('error', err.response?.data?.message || `Failed to ${action} student`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Student Management"
        subtitle={`${students.total} students registered.`}
        action={<button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateSuccess(null); setCreateErrors({}); }}><i className="bi bi-plus-lg me-2" />Create Student</button>}
      />
      <div className="surface p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <input className="form-control" placeholder="Search by name, ID, email, or mobile" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div className="surface p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Registered</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading...</td></tr>
              ) : students.items.length === 0 ? (
                <tr><td colSpan="8" className="text-secondary text-center">No students found.</td></tr>
              ) : students.items.map((s) => (
                <tr key={s._id}>
                  <td><span className="badge text-bg-secondary">{s.studentId || '-'}</span></td>
                  <td className="fw-semibold">{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.mobile || '-'}</td>
                  <td>{s.gender || '-'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>{s.createdAt ? moment(s.createdAt).format('DD, MMM, YYYY') : '-'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditing({ ...s })} title="Edit"><i className="bi bi-pencil" /></button>
                    <button className="btn btn-sm btn-outline-info me-1" onClick={() => setDrawerStudentId(s._id)} title="View Profile"><i className="bi bi-eye" /></button>
                    <button className={`btn btn-sm ${s.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`} onClick={() => toggleStatus(s)} disabled={busy} title={s.status === 'active' ? 'Deactivate' : 'Activate'}>
                      <i className={`bi ${s.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="small text-secondary">Showing {(students.items.length > 0 ? ((students.page - 1) * 10 + 1) : 0)}–{Math.min(students.page * 10, students.total)} of {students.total}</span>
          {students.pages > 1 && (
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              {(() => {
                const pages = [];
                const total = students.pages;
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
              <button className="btn btn-outline-secondary" disabled={filters.page >= students.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Create Student Drawer */}
      <Drawer
        show={showCreate}
        title="Create Student"
        onClose={() => { setShowCreate(false); setCreateSuccess(null); }}
        width="550px"
      >
        {createSuccess ? (
          <div>
            <div className="alert alert-success">Student created successfully!</div>
            <p><strong>Student ID:</strong> {createSuccess.studentId}</p>
            <p><strong>Name:</strong> {createSuccess.name}</p>
            <p><strong>Email:</strong> {createSuccess.email}</p>
            <p className="text-warning">Please provide the student their Student ID and password for login.</p>
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button className="btn btn-primary" onClick={() => { setShowCreate(false); setCreateSuccess(null); }}>Done</button>
            </div>
          </div>
        ) : (
          <div>
            {createErrors.api && <div className="alert alert-danger">{createErrors.api}</div>}
            <StudentCreateForm onSubmit={createStudent} onClose={() => setShowCreate(false)} busy={createBusy} />
          </div>
        )}
      </Drawer>

      {/* Edit Student Drawer */}
      <Drawer
        show={Boolean(editing)}
        title="Edit Student"
        onClose={() => setEditing(null)}
        width="550px"
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input className="form-control" value={editing?.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input className="form-control" value={editing?.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Mobile</label>
            <input className="form-control" value={editing?.mobile || ''} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Gender</label>
            <select className="form-select" value={editing?.gender || 'Male'} onChange={(e) => setEditing({ ...editing, gender: e.target.value })}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Reset Password (leave blank to keep current)</label>
            <input type="password" className="form-control" placeholder="Enter new password" value={editing?._newPw || ''} onChange={(e) => setEditing({ ...editing, _newPw: e.target.value, password: e.target.value })} />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={updateStudent} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </Drawer>

      {/* Student Details Drawer */}
      <Drawer
        show={Boolean(drawerStudentId)}
        title="Student Details"
        onClose={() => setDrawerStudentId(null)}
        width="800px"
      >
        {drawerStudentId && <AdminStudentDetailPage id={drawerStudentId} onClose={() => setDrawerStudentId(null)} />}
      </Drawer>
    </>
  );
};
