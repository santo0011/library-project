import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

const TEMPLATE_COLUMNS = ['Full Name', 'Email', 'Password', 'Mobile Number', 'Gender', 'Date of Birth'];

const generateSampleTemplate = () => {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    TEMPLATE_COLUMNS,
    ['Santo Biswas', 'santobiswas0011@gmail.com', '123456', '7584049912', 'Male', '2002-06-24']
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'student_import_template.xlsx');
};

export const BulkImportStudentsForm = ({ onSubmit, onClose, busy }) => {
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

          const name = String(row[0] || '').trim();
          const email = String(row[1] || '').trim().toLowerCase();
          const password = String(row[2] || '').trim();
          const mobile = String(row[3] || '').trim();
          const gender = String(row[4] || '').trim() || 'Male';
          const dateOfBirth = String(row[5] || '').trim();

          if (!name || name.length < 2) rowErrors.push('Full Name is required (min 2 chars)');
          if (!email) rowErrors.push('Email is required');
          if (!password || password.length < 6) rowErrors.push('Password must be at least 6 characters');
          if (!mobile) rowErrors.push('Mobile Number is required');

          return {
            rowNum,
            name,
            email,
            password,
            mobile,
            gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Male',
            dateOfBirth,
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
    const validStudents = preview.filter((p) => !p.hasErrors);
    const studentPayloads = validStudents.map((s) => ({
      name: s.name,
      email: s.email,
      password: s.password,
      mobile: s.mobile,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth || undefined
    }));

    if (studentPayloads.length === 0) {
      setErrors(['No valid students to import. Please fix the errors and try again.']);
      return;
    }

    onSubmit(studentPayloads);
  };

  const isValid = preview.length > 0 && preview.some((p) => !p.hasErrors);

  return (
    <div>
      {tab === 'upload' && (
        <div>
          <div className="mb-4 p-4 rounded-3" style={{ background: 'var(--primary-light)' }}>
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-people fs-1" style={{ color: 'var(--primary)' }} />
              <div>
                <h6 className="fw-bold mb-1">Bulk Import Students</h6>
                <p className="mb-0 small text-secondary">Upload an Excel (.xlsx) or CSV file with student data. Download the template below for the correct format.</p>
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

              <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="table table-sm small">
                  <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} className={p.hasErrors ? 'table-danger' : 'table-success'}>
                        <td>{p.rowNum}</td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || <span className="text-danger">(empty)</span>}</td>
                        <td>{p.email || <span className="text-danger">(empty)</span>}</td>
                        <td>{p.mobile || <span className="text-danger">(empty)</span>}</td>
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
              {busy ? 'Importing...' : `Import ${preview.filter((p) => !p.hasErrors).length} Students`}
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
                <p className="mt-2 mb-1 fw-medium">{p.name || <span className="text-danger">(empty)</span>}</p>
                <div className="small">
                  <div><span className="text-secondary">Email:</span> {p.email || <span className="text-danger">(empty)</span>}</div>
                  <div><span className="text-secondary">Mobile:</span> {p.mobile || <span className="text-danger">(empty)</span>}</div>
                  <div><span className="text-secondary">Gender:</span> {p.gender}</div>
                  <div><span className="text-secondary">DOB:</span> {p.dateOfBirth || '-'}</div>
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
              {busy ? 'Importing...' : `Import ${preview.filter((p) => !p.hasErrors).length} Students`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};