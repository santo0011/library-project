import { useState } from 'react';

const blank = {
  name: '', email: '', password: '', mobile: '', gender: 'Male', dateOfBirth: ''
};

export const StudentCreateForm = ({ onSubmit, onClose, busy }) => {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.password || form.password.length < 6) errs.password = 'At least 6 characters';
    if (!form.mobile) errs.mobile = 'Mobile is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { ...form };
    if (payload.dateOfBirth) {
      payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
    } else {
      delete payload.dateOfBirth;
    }
    onSubmit(payload);
  };

  return (
    <form id="create-student-form" onSubmit={submit}>
      {errors.api && <div className="alert alert-danger">{errors.api}</div>}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Full Name</label>
          <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Password</label>
          <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Mobile Number</label>
          <input className={`form-control ${errors.mobile ? 'is-invalid' : ''}`} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
        </div>
        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Date of Birth</label>
          <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy} form="create-student-form">
          {busy ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
};