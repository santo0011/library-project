import { useEffect, useState } from 'react';
import moment from 'moment';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.jsx';
import { Drawer } from '../components/common/Drawer.jsx';
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
  const [createForm, setCreateForm] = useState(blankStudent);
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

  const createStudent = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!createForm.name || createForm.name.trim().length < 2) errs.name = 'Name is required';
    if (!createForm.email) errs.email = 'Email is required';
    if (!createForm.password || createForm.password.length < 6) errs.password = 'At least 6 characters';
    if (!createForm.mobile) errs.mobile = 'Mobile is required';
    if (createForm.dateOfBirth) {
      // valid - will be sent
    }
    setCreateErrors(errs);
    if (Object.keys(errs).length) return;

    setCreateBusy(true);
    try {
      const payload = { ...createForm };
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
      } else {
        delete payload.dateOfBirth;
      }
      const { data } = await api.post('/students', payload);
      setCreateSuccess(data.data);
      setCreateForm(blankStudent);
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
        action={<button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateSuccess(null); setCreateForm(blankStudent); setCreateErrors({}); }}><i className="bi bi-plus-lg me-2" />Create Student</button>}
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

      {/* Create Student Modal */}
      {showCreate && (
        <Modal show={true} title="Create Student" size="lg" onClose={() => setShowCreate(false)}
          footer={createSuccess ? <button className="btn btn-primary" onClick={() => { setShowCreate(false); setCreateSuccess(null); }}>Done</button> :
            <><button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" form="create-student-form" type="submit" disabled={createBusy}>{createBusy ? 'Creating...' : 'Create'}</button></>
          }
        >
          {createSuccess ? (
            <div>
              <div className="alert alert-success">Student created successfully!</div>
              <p><strong>Student ID:</strong> {createSuccess.studentId}</p>
              <p><strong>Name:</strong> {createSuccess.name}</p>
              <p><strong>Email:</strong> {createSuccess.email}</p>
              <p className="text-warning">Please provide the student their Student ID and password for login.</p>
            </div>
          ) : (
            <form id="create-student-form" onSubmit={createStudent}>
              {createErrors.api && <div className="alert alert-danger">{createErrors.api}</div>}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input className={`form-control ${createErrors.name ? 'is-invalid' : ''}`} value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                  {createErrors.name && <div className="invalid-feedback">{createErrors.name}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className={`form-control ${createErrors.email ? 'is-invalid' : ''}`} value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                  {createErrors.email && <div className="invalid-feedback">{createErrors.email}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input type="password" className={`form-control ${createErrors.password ? 'is-invalid' : ''}`} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                  {createErrors.password && <div className="invalid-feedback">{createErrors.password}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Mobile Number</label>
                  <input className={`form-control ${createErrors.mobile ? 'is-invalid' : ''}`} value={createForm.mobile} onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })} />
                  {createErrors.mobile && <div className="invalid-feedback">{createErrors.mobile}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className={`form-control ${createErrors.dateOfBirth ? 'is-invalid' : ''}`} value={createForm.dateOfBirth} onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })} />
                  {createErrors.dateOfBirth && <div className="invalid-feedback">{createErrors.dateOfBirth}</div>}
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Edit Student Modal */}
      {editing && (
        <Modal show={true} title="Edit Student" size="lg" onClose={() => setEditing(null)}
          footer={<><button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={updateStudent} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></>}
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input className="form-control" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input className="form-control" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mobile</label>
              <input className="form-control" value={editing.mobile || ''} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Gender</label>
              <select className="form-select" value={editing.gender || 'Male'} onChange={(e) => setEditing({ ...editing, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Reset Password (leave blank to keep current)</label>
              <input type="password" className="form-control" placeholder="Enter new password" value={editing._newPw || ''} onChange={(e) => setEditing({ ...editing, _newPw: e.target.value, password: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {/* Student Details Drawer */}
      <Drawer
        show={Boolean(drawerStudentId)}
        title="Student Details"
        onClose={() => setDrawerStudentId(null)}
        width="850px"
      >
        {drawerStudentId && <AdminStudentDetailPage id={drawerStudentId} onClose={() => setDrawerStudentId(null)} />}
      </Drawer>
    </>
  );
};
