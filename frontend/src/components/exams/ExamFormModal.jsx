import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal.jsx';

const blank = {
  name: '',
  subject: '',
  description: '',
  totalMarks: 100,
  passMarks: 40,
  durationMinutes: 60,
  questionTimerSeconds: 30,
  startDate: '',
  endDate: '',
  status: 'draft'
};

export const ExamFormModal = ({ show, exam, onClose, onSubmit, busy }) => {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  const questionCount = exam?.questions?.length || 0;
  const cannotPublish = exam?._id && questionCount === 0;

  useEffect(() => {
    if (exam?._id) {
      const startDate = exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '';
      const endDate = exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '';
      setForm({ ...blank, ...exam, startDate, endDate });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [exam, show]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name || form.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters';
    if (!form.subject) nextErrors.subject = 'Subject is required';
    if (!form.totalMarks || form.totalMarks < 1) nextErrors.totalMarks = 'Must be at least 1';
    if (form.passMarks < 0 || form.passMarks > form.totalMarks) nextErrors.passMarks = 'Must be between 0 and total marks';
    if (!form.durationMinutes || form.durationMinutes < 1) nextErrors.durationMinutes = 'Must be at least 1 minute';
    if (!form.startDate) nextErrors.startDate = 'Start date is required';
    if (!form.endDate) nextErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      nextErrors.endDate = 'End date must be after start date';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      ...form,
      totalMarks: Number(form.totalMarks),
      passMarks: Number(form.passMarks),
      durationMinutes: Number(form.durationMinutes),
      questionTimerSeconds: Number(form.questionTimerSeconds),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString()
    };
    if (exam?._id) delete payload.password;
    onSubmit(payload);
  };

  return (
    <Modal
      show={show}
      title={exam ? 'Edit Exam' : 'Create Exam'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy} form="exam-form">
            {busy ? 'Saving...' : 'Save Exam'}
          </button>
        </>
      }
    >
      <form id="exam-form" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="name">Exam Name</label>
            <input id="name" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={update} />
            <div className="invalid-feedback">{errors.name}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="subject">Subject</label>
            <input id="subject" name="subject" className={`form-control ${errors.subject ? 'is-invalid' : ''}`} value={form.subject} onChange={update} />
            <div className="invalid-feedback">{errors.subject}</div>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="description">Description (optional)</label>
            <textarea id="description" name="description" className="form-control" rows="2" value={form.description} onChange={update} />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="totalMarks">Total Marks</label>
            <input id="totalMarks" name="totalMarks" type="number" className={`form-control ${errors.totalMarks ? 'is-invalid' : ''}`} value={form.totalMarks} onChange={update} />
            <div className="invalid-feedback">{errors.totalMarks}</div>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="passMarks">Pass Marks</label>
            <input id="passMarks" name="passMarks" type="number" className={`form-control ${errors.passMarks ? 'is-invalid' : ''}`} value={form.passMarks} onChange={update} />
            <div className="invalid-feedback">{errors.passMarks}</div>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="durationMinutes">Duration (min)</label>
            <input id="durationMinutes" name="durationMinutes" type="number" className={`form-control ${errors.durationMinutes ? 'is-invalid' : ''}`} value={form.durationMinutes} onChange={update} />
            <div className="invalid-feedback">{errors.durationMinutes}</div>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="questionTimerSeconds">Per Q Timer (sec)</label>
            <input id="questionTimerSeconds" name="questionTimerSeconds" type="number" className="form-control" value={form.questionTimerSeconds} onChange={update} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="startDate">Start Date</label>
            <input id="startDate" name="startDate" type="datetime-local" className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} value={form.startDate} onChange={update} />
            <div className="invalid-feedback">{errors.startDate}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="endDate">End Date</label>
            <input id="endDate" name="endDate" type="datetime-local" className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} value={form.endDate} onChange={update} />
            <div className="invalid-feedback">{errors.endDate}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="status">Status</label>
            <select id="status" name="status" className="form-select" value={form.status} onChange={update}>
              <option value="draft">Draft</option>
              <option value="published" disabled={cannotPublish}>Published</option>
            </select>
            {cannotPublish && (
              <div className="text-warning small mt-1">
                <i className="bi bi-exclamation-triangle me-1" />
                Add questions before publishing this exam.
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};