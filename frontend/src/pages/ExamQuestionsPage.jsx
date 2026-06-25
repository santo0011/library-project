import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';
import { Drawer } from '../components/common/Drawer.jsx';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { QuestionFormModal } from '../components/exams/QuestionFormModal.jsx';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
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
  const [selectedIds, setSelectedIds] = useState([]);

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

  // Reset selection when questions change
  useEffect(() => {
    setSelectedIds([]);
  }, [questions]);

  const allQuestionIds = (exam?.questions || []).map((q) => q._id);
  const allSelected = allQuestionIds.length > 0 && selectedIds.length === allQuestionIds.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...allQuestionIds]);
    }
  };

  const handleSelectOne = (qId) => {
    setSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

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

  const handleBulkDelete = () => {
    if (isLocked) {
      handleLockedAction('deleted');
      return;
    }
    if (selectedIds.length === 0) return;

    Swal.fire({
      title: 'Delete Selected Questions?',
      text: 'Are you sure you want to delete the selected question(s)? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
      focusCancel: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        setBusy(true);
        try {
          await examService.bulkDelete(id, selectedIds);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${selectedIds.length} question(s) deleted successfully`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            backdrop: false,
            heightAuto: false
          });
          setSelectedIds([]);
          load();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            confirmButtonText: 'OK'
          });
        } finally {
          setBusy(false);
        }
      }
    });
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

  if (loading) return <div className="surface p-4"><div className="loading-spinner text-center"><i className="fa-solid fa-spinner fa-spin"></i></div></div>;
  if (!exam) return <div className="alert alert-danger">Exam not found</div>;

  const questionList = exam.questions || [];

  return (
    <>
      <PageHeader
        title={`Questions: ${exam.name}`}
        subtitle={`${questions.total || questionList.length || 0} questions • ${exam.questionTimerSeconds}s per question timer`}
        action={
          !isLocked && (
            <button className="btn btn-primary" type="button" onClick={handleAdd}>
              <i className="bi bi-plus-lg me-2" />Add Question
            </button>
          )
        }
      />

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3 bg-light border">
          <i className="bi bi-check-square fs-5" style={{ color: 'var(--primary)' }} />
          <span className="fw-semibold">{selectedIds.length} question{selectedIds.length !== 1 ? 's' : ''} selected</span>
          <button
            className="btn btn-danger btn-sm ms-auto"
            type="button"
            onClick={handleBulkDelete}
            disabled={busy}
          >
            <i className="bi bi-trash me-2" />Delete Selected
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            onClick={() => setSelectedIds([])}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="surface p-3">
        {/* Select-all checkbox for desktop — placed as a row above the table */}
        {questionList.length > 0 && (
          <div className="d-flex align-items-center gap-2 mb-2 px-1">
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                id="select-all"
                style={{ cursor: "pointer" }}
              />
              <label className="form-check-label small" htmlFor="select-all">Select all</label>
            </div>
          </div>
        )}
        <ResponsiveTable
          columns={[
            {
              key: 'checkbox',
              label: '',
              render: (q) => (
                <div className="form-check mb-0" style={{ pointerEvents: 'auto' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selectedIds.includes(q._id)}
                    onChange={() => handleSelectOne(q._id)}
                    id={`check-${q._id}`}
                    style={{ border: "0.6px solid #585454", cursor: "pointer" }}
                  />
                  <label className="form-check-label" htmlFor={`check-${q._id}`} />
                </div>
              )
            },
            {
              key: 'title',
              label: 'Question',
              render: (q) => (
                <>
                  <div className="fw-semibold">{q.title}</div>
                  <div className="small text-secondary">
                    {q.options?.map((o, i) => (
                      <span key={i} className={`me-2 ${i === q.correctOption ? 'text-success fw-bold' : ''}`}>
                        {String.fromCharCode(65 + i)}. {o.text}
                      </span>
                    ))}
                  </div>
                </>
              )
            },
            { key: 'marks', label: 'Marks', render: (q) => <>{q.marks}</> },
            { key: 'correctOption', label: 'Correct Option', render: (q) => <span className="badge text-bg-success">Option {String.fromCharCode(65 + q.correctOption)}</span> },
            {
              key: 'actions',
              label: 'Actions',
              render: (q) => (
                <div className="text-end" style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => handleEdit(q)} title="Edit"><i className="bi bi-pencil" /></button>
                  <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDelete(q)} title="Delete"><i className="bi bi-trash" /></button>
                </div>
              )
            },
          ]}
          rows={questionList}
          mobileSummary={['title', 'marks']}
          mobileDetailExclude={['checkbox']}
          selectable={{ checked: (row) => selectedIds.includes(row._id), onSelect: (row) => handleSelectOne(row._id) }}
          emptyMessage="No questions added yet."
        />
      </div>

      <Drawer
        show={adding}
        title={editing?._id ? 'Edit Question' : 'Add Questions'}
        onClose={() => { setAdding(false); setEditing(null); }}
        width="600px"
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