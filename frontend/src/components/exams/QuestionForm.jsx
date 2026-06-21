import { useEffect, useState } from 'react';

const blank = {
  title: '',
  type: 'mcq',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctOption: 0,
  marks: 1,
  subject: 'A',
  explanation: ''
};

export const QuestionForm = ({ question, onSubmit, onClose, busy }) => {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (question) {
      const opts = question.options?.length === 4 ? question.options : blank.options;
      setForm({ ...blank, ...question, options: opts });
    } else {
      setForm(blank);
    }
    setErrors({});
  }, [question]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const updateOption = (index, value) => {
    const options = [...form.options];
    options[index] = { text: value };
    setForm((current) => ({ ...current, options }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.title || form.title.trim().length < 2) nextErrors.title = 'Question text is required';
    if (!form.subject) nextErrors.subject = 'Subject is required';
    if (!form.marks || form.marks < 1) nextErrors.marks = 'Marks must be at least 1';
    const emptyOptions = form.options.some((opt) => !opt.text?.trim());
    if (emptyOptions) nextErrors.options = 'All options must have text';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      ...form,
      marks: Number(form.marks),
      correctOption: Number(form.correctOption)
    };
    onSubmit(payload);
  };

  return (
    <form id="question-form" onSubmit={submit}>
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label" htmlFor="title">Question Text</label>
          <textarea id="title" name="title" className={`form-control ${errors.title ? 'is-invalid' : ''}`} rows="2" value={form.title} onChange={updateField} />
          <div className="invalid-feedback">{errors.title}</div>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="marks">Marks</label>
          <input id="marks" name="marks" type="number" className={`form-control ${errors.marks ? 'is-invalid' : ''}`} value={form.marks} onChange={updateField} />
          <div className="invalid-feedback">{errors.marks}</div>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="correctOption">Correct Option</label>
          <select id="correctOption" name="correctOption" className="form-select" value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: Number(e.target.value) })}>
            <option value={0}>Option 1</option>
            <option value={1}>Option 2</option>
            <option value={2}>Option 3</option>
            <option value={3}>Option 4</option>
          </select>
        </div>
        <div className="col-12">
          <label className="form-label">Options {errors.options && <span className="text-danger small">({errors.options})</span>}</label>
          {form.options.map((opt, i) => (
            <div className="input-group mb-2" key={i}>
              <span className="input-group-text">{i + 1}</span>
              <input className={`form-control ${form.correctOption === i ? 'border-success' : ''}`} value={opt.text} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
              {form.correctOption === i && <span className="input-group-text bg-success text-white"><i className="bi bi-check-lg" /></span>}
            </div>
          ))}
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="explanation">Explanation (optional)</label>
          <textarea id="explanation" name="explanation" className="form-control" rows="2" value={form.explanation} onChange={updateField} />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy} form="question-form">
          {busy ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
};