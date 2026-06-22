import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';
import { Drawer } from '../components/common/Drawer.jsx';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { QuestionFormModal } from '../components/exams/QuestionFormModal.jsx';
import { examService } from '../services/examService.js';
import Swal from 'sweetalert2';

export const ExamQuestionsPage = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      examService.getById(id),
      examService.listQuestions({ limit: 100, subject: '' })
    ])
      .then(([examData, questionsData]) => {
        setExam(examData);
        setIsLocked(examData.isLocked || false);
        setQuestions(questionsData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleLockedAction = (action = '') => {
    Swal.fire({
      title: 'Action Not Allowed',
      text: action
        ? `This exam has already been attempted by students. Questions can no longer be ${action}.`
        : 'This exam has already been attempted by students. Questions can no longer be added, edited, imported, or deleted.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  };

  const handleAdd = () => {
    if (isLocked) {
      handleLockedAction('added, edited, imported, or deleted');
      return;
    }
    setEditing(null);
    setAdding(true);
  };

  const handleEdit = (q) => {
    if (isLocked) {
      handleLockedAction('edited');
      return;
    }
    setEditing(q);
    setAdding(true);
  };

  const handleDelete = (q) => {
    if (isLocked) {
      handleLockedAction('deleted');
      return;
    }
    setDeleting(q);
  };

  const saveQuestion = async (payload) => {
    // Handle bulk/paste import (array of questions)
    if (payload.type === 'bulk' || payload.type === 'paste') {
      setBusy(true);
      try {
        const result = await examService.bulkImport(id, payload.questions);
        Swal.fire({
          icon: 'success',
          title: 'Import Successful',
          text: `${result.total} question${result.total !== 1 ? 's' : ''} imported successfully.`,
          confirmButtonColor: 'var(--primary)',
          confirmButtonText: 'OK'
        });
        setAdding(false);
        load();
      } catch (err) {
        const errMsg = err.response?.data?.errors;
        if (errMsg && Array.isArray(errMsg)) {
          Swal.fire({
            icon: 'error',
            title: 'Import Failed',
            html: `<div class="text-start">${errMsg.map((e) => `<div>• ${e}</div>`).join('')}</div>`,
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Import Failed',
            text: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            confirmButtonText: 'OK'
          });
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    // Handle single question (existing workflow)
    setBusy(true);
    try {
      if (editing?._id) {
        await examService.updateQuestion(editing._id, payload);
      } else {
        const question = await examService.createQuestion({ ...payload, exam: id });
        const currentIds = exam?.questions?.map((q) => q._id) || [];
        await examService.addQuestions(id, [...currentIds, question._id]);
      }
      setEditing(null);
      setAdding(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async () => {
    setBusy(true);
    try {
      await examService.deleteQuestion(deleting._id);
      setDeleting(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="surface p-4">Loading...</div>;
  if (!exam) return <div className="alert alert-danger">Exam not found</div>;

  return (
    <>
      <PageHeader
        title={`Questions: ${exam.name}`}
        subtitle={`${questions.total || exam.questions?.length || 0} questions • ${exam.questionTimerSeconds}s per question timer`}
        action={
          <button className="btn btn-primary" type="button" onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2" />Add Question
          </button>
        }
      />

      <div className="surface p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Question</th>
                <th>Marks</th>
                <th>Correct Option</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(exam.questions || []).length === 0 ? (
                <tr><td colSpan="5" className="text-secondary">No questions added yet.</td></tr>
              ) : (
                (exam.questions || []).map((q, idx) => (
                  <tr key={q._id}>
                    <td>
                      <div className="fw-semibold">{q.title}</div>
                      <div className="small text-secondary">
                        {q.options?.map((o, i) => (
                          <span key={i} className={`me-2 ${i === q.correctOption ? 'text-success fw-bold' : ''}`}>
                            {String.fromCharCode(65 + i)}. {o.text}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{q.marks}</td>
                    <td><span className="badge text-bg-success">Option {String.fromCharCode(65 + q.correctOption)}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => handleEdit(q)} title="Edit"><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDelete(q)} title="Delete"><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        show={adding}
        title={editing?._id ? 'Edit Question' : 'Add Questions'}
        onClose={() => { setAdding(false); setEditing(null); }}
        width="660px"
      >
        <QuestionFormModal
          question={editing}
          onSubmit={saveQuestion}
          onClose={() => { setAdding(false); setEditing(null); }}
          busy={busy}
          isLocked={isLocked}
        />
      </Drawer>
      <ConfirmModal show={Boolean(deleting)} title="Delete question" message={`Delete this question? This action cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={deleteQuestion} busy={busy} />
    </>
  );
};