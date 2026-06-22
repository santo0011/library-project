import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const TEMPLATE_COLUMNS = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer (A/B/C/D)', 'Marks', 'Time (Seconds)'];

const LETTER_TO_INDEX = { a: 0, b: 1, c: 2, d: 3 };
const INDEX_TO_LETTER = ['A', 'B', 'C', 'D'];

const generateSampleTemplate = () => {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    TEMPLATE_COLUMNS,
    ['HTML stands for?', 'Hyper Text Markup Language', 'Home Tool', 'High Text', 'None', 'A', '1', '30'],
    ['CSS stands for?', 'Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets', 'None', 'A', '1', '30']
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 30 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'question_import_template.xlsx');
};

export const BulkImportForm = ({ onSubmit, onClose, busy }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [tab, setTab] = useState('upload');

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseFile(f);
  };

  const parseFile = (f) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const rows = json.filter((row, idx) => idx > 0 && row.some((cell) => String(cell).trim() !== ''));
        const parsed = rows.map((row, idx) => {
          const rowNum = idx + 2;
          const rowErrors = [];

          const title = String(row[0] || '').trim();
          const optionA = String(row[1] || '').trim();
          const optionB = String(row[2] || '').trim();
          const optionC = String(row[3] || '').trim();
          const optionD = String(row[4] || '').trim();
          const answerLetter = String(row[5] || '').trim().toUpperCase();
          const marks = String(row[6] || '').trim();
          const time = String(row[7] || '').trim();

          if (!title || title.length < 2) rowErrors.push('Question text is required (min 2 chars)');
          if (!optionA) rowErrors.push('Option A is required');
          if (!optionB) rowErrors.push('Option B is required');
          if (!optionC) rowErrors.push('Option C is required');
          if (!optionD) rowErrors.push('Option D is required');

          const correctIdx = LETTER_TO_INDEX[answerLetter.toLowerCase()];
          if (correctIdx === undefined) rowErrors.push('Correct Answer must be A, B, C, or D');

          const marksNum = Number(marks);
          if (!marks || isNaN(marksNum) || marksNum < 1) rowErrors.push('Marks must be at least 1');

          const timeNum = Number(time);
          if (!time || isNaN(timeNum) || timeNum < 5) rowErrors.push('Time must be at least 5 seconds');

          return {
            rowNum,
            title,
            options: [
              { text: optionA },
              { text: optionB },
              { text: optionC },
              { text: optionD }
            ],
            correctOption: correctIdx !== undefined ? correctIdx : 0,
            marks: marksNum || 1,
            time: timeNum || 30,
            hasErrors: rowErrors.length > 0,
            errors: rowErrors
          };
        });

        setPreview(parsed);
        setErrors([]);
      } catch (err) {
        setErrors(['Failed to parse file. Please ensure it is a valid .xlsx or .csv file.']);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = () => {
    const validQuestions = preview.filter((p) => !p.hasErrors);
    const questionPayloads = validQuestions.map((q) => ({
      title: q.title,
      options: q.options,
      correctOption: q.correctOption,
      marks: q.marks,
      subject: 'A',
      explanation: '',
      timeSeconds: q.time
    }));

    if (questionPayloads.length === 0) {
      setErrors(['No valid questions to import. Please fix the errors and try again.']);
      return;
    }

    onSubmit(questionPayloads);
  };

  const isValid = preview.length > 0 && preview.some((p) => !p.hasErrors);

  return (
    <div>
      {tab === 'upload' && (
        <div>
          <div className="mb-4 p-4 rounded-3" style={{ background: 'var(--primary-light)' }}>
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-file-earmark-spreadsheet fs-1" style={{ color: 'var(--primary)' }} />
              <div>
                <h6 className="fw-bold mb-1">Bulk Import Questions</h6>
                <p className="mb-0 small text-secondary">Upload an Excel (.xlsx) or CSV file with your questions. Download the template below for the correct format.</p>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mb-3">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={generateSampleTemplate}>
              <i className="bi bi-download me-1" /> Download Sample Template
            </button>
          </div>

          <div
            className="border-2 border-dashed rounded-3 p-5 text-center mb-3"
            style={{
              borderColor: file ? 'var(--success)' : 'var(--app-border)',
              background: file ? 'var(--success-light)' : 'var(--app-bg)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--app-border)'; }}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) {
                fileRef.current.files = e.dataTransfer.files;
                setFile(f);
                parseFile(f);
              }
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="d-none"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <i className="bi bi-file-earmark-check fs-1" style={{ color: 'var(--success)' }} />
                <p className="mt-2 fw-semibold mb-0">{file.name}</p>
                <p className="small text-secondary mb-0">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
              </div>
            ) : (
              <div>
                <i className="bi bi-cloud-arrow-up fs-1" style={{ color: 'var(--primary)' }} />
                <p className="mt-2 fw-semibold mb-0">Drop your file here or click to browse</p>
                <p className="small text-secondary mb-0">Supports .xlsx, .xls, .csv files</p>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="alert alert-danger py-2 small">
              {errors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">
                  Preview: {preview.filter((p) => !p.hasErrors).length} valid / {preview.length} total
                </span>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setTab('review')}>
                  <i className="bi bi-eye me-1" /> Review Details
                </button>
              </div>

              <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <table className="table table-sm small">
                  <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Answer</th>
                      <th>Marks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} className={p.hasErrors ? 'table-danger' : 'table-success'}>
                        <td>{p.rowNum}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || <span className="text-danger">(empty)</span>}</td>
                        <td>{INDEX_TO_LETTER[p.correctOption]}</td>
                        <td>{p.marks}</td>
                        <td>
                          {p.hasErrors ? (
                            <span className="text-danger" title={p.errors.join(' | ')}>
                              <i className="bi bi-x-circle-fill me-1" />Invalid
                            </span>
                          ) : (
                            <span className="text-success"><i className="bi bi-check-circle-fill me-1" />Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!isValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${preview.filter((p) => !p.hasErrors).length} Questions`}
            </button>
          </div>
        </div>
      )}

      {tab === 'review' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Detailed Review</h6>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setTab('upload')}>
              <i className="bi bi-arrow-left me-1" /> Back
            </button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {preview.map((p, i) => (
              <div key={i} className={`p-3 mb-2 rounded-3 border ${p.hasErrors ? 'border-danger bg-danger-light' : 'border-success bg-success-light'}`}>
                <div className="d-flex justify-content-between align-items-start">
                  <span className="fw-semibold">Row {p.rowNum}</span>
                  {p.hasErrors ? (
                    <span className="badge bg-danger">Invalid</span>
                  ) : (
                    <span className="badge bg-success">Valid</span>
                  )}
                </div>
                <p className="mt-2 mb-1 fw-medium">{p.title || <span className="text-danger">(empty question)</span>}</p>
                <div className="small">
                  <div className="row g-1">
                    {p.options.map((opt, oi) => (
                      <div key={oi} className="col-6">
                        <span className={`badge ${oi === p.correctOption ? 'bg-success' : 'bg-light text-secondary'} me-1`}>
                          {INDEX_TO_LETTER[oi]}
                        </span>
                        {opt.text || <span className="text-danger">(empty)</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-muted">Marks: {p.marks} | Time: {p.time}s</div>
                  {p.hasErrors && (
                    <div className="mt-2 text-danger">
                      {p.errors.map((e, ei) => <div key={ei}>• {e}</div>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setTab('upload')}>Back</button>
            <button type="button" className="btn btn-primary" disabled={!isValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${preview.filter((p) => !p.hasErrors).length} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};