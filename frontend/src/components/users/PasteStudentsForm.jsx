import { useState } from 'react';

const parseStudents = (text) => {
  const blocks = text.split(/(?=Full Name\s*:)/).filter((b) => b.trim());
  const results = [];

  blocks.forEach((block, idx) => {
    const student = {};
    const errors = [];

    const nameMatch = block.match(/Full Name\s*:\s*(.+)/i);
    if (nameMatch) {
      student.name = nameMatch[1].trim();
    } else {
      student.name = '';
      errors.push('Full Name not found. Use format: "Full Name: John Doe"');
    }

    const emailMatch = block.match(/Email\s*:\s*(.+)/i);
    if (emailMatch) {
      student.email = emailMatch[1].trim().toLowerCase();
    } else {
      student.email = '';
      errors.push('Email not found. Use format: "Email: john@example.com"');
    }

    const passwordMatch = block.match(/Password\s*:\s*(.+)/i);
    if (passwordMatch) {
      student.password = passwordMatch[1].trim();
    } else {
      student.password = '';
      errors.push('Password not found. Use format: "Password: 123456"');
    }

    const mobileMatch = block.match(/Mobile\s*(?:Number)?\s*:\s*(.+)/i);
    if (mobileMatch) {
      student.mobile = mobileMatch[1].trim();
    } else {
      student.mobile = '';
      errors.push('Mobile Number not found. Use format: "Mobile Number: 9876543210"');
    }

    const genderMatch = block.match(/Gender\s*:\s*(.+)/i);
    if (genderMatch) {
      student.gender = ['Male', 'Female', 'Other'].includes(genderMatch[1].trim()) ? genderMatch[1].trim() : 'Male';
    } else {
      student.gender = 'Male';
      errors.push('Gender not found. Use format: "Gender: Male"');
    }

    const dobMatch = block.match(/Date\s*(?:of\s*)?Birth\s*:\s*(.+)/i);
    if (dobMatch) {
      student.dateOfBirth = dobMatch[1].trim();
    } else {
      student.dateOfBirth = '';
    }

    // Validate
    if (!student.name || student.name.length < 2) errors.push('Full Name is required (min 2 chars)');
    if (!student.email) errors.push('Email is required');
    if (!student.password || student.password.length < 6) errors.push('Password must be at least 6 characters');
    if (!student.mobile) errors.push('Mobile Number is required');

    results.push({
      ...student,
      index: idx + 1,
      hasErrors: errors.length > 0,
      errors
    });
  });

  return results;
};

export const PasteStudentsForm = ({ onSubmit, onClose, busy }) => {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [tab, setTab] = useState('paste');

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      const result = parseStudents(val);
      setParsed(result);
    } else {
      setParsed([]);
    }
  };

  const handleImport = () => {
    const validStudents = parsed.filter((p) => !p.hasErrors);
    const studentPayloads = validStudents.map((s) => ({
      name: s.name,
      email: s.email,
      password: s.password,
      mobile: s.mobile,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth || undefined
    }));

    if (studentPayloads.length === 0) return;
    onSubmit(studentPayloads);
  };

  const validCount = parsed.filter((p) => !p.hasErrors).length;
  const hasValid = validCount > 0;

  return (
    <div>
      {tab === 'paste' && (
        <div>
          <div className="mb-4 p-4 rounded-3" style={{ background: 'var(--primary-light)' }}>
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-clipboard-data fs-1" style={{ color: 'var(--primary)' }} />
              <div>
                <h6 className="fw-bold mb-1">Paste Students</h6>
                <p className="mb-0 small text-secondary">Paste student data copied from ChatGPT, Excel, Word, or any document. Each student must follow the format below.</p>
              </div>
            </div>
          </div>

          <div className="mb-3 p-3 rounded-3 bg-light small">
            <p className="fw-semibold mb-2">Expected format:</p>
            <code className="d-block p-2 bg-white rounded-2 border" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: '1.6' }}>
              Full Name: John Doe{'\n'}
              Email: john@example.com{'\n'}
              Password: 123456{'\n'}
              Mobile Number: 9876543210{'\n'}
              Gender: Male{'\n'}
              Date of Birth: 2005-05-10
            </code>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Paste your student data here
              {text.trim() && (
                <span className="text-secondary fw-normal ms-2 small">
                  — {parsed.length} student{parsed.length !== 1 ? 's' : ''} detected ({validCount} valid)
                </span>
              )}
            </label>
            <textarea
              className="form-control font-monospace"
              rows="10"
              value={text}
              onChange={handleTextChange}
              placeholder={`Paste student data here...\n\nExample:\nFull Name: John Doe\nEmail: john@example.com\nPassword: 123456\nMobile Number: 9876543210\nGender: Male\nDate of Birth: 2005-05-10`}
              style={{ fontSize: '0.875rem', lineHeight: '1.6' }}
            />
          </div>

          {parsed.length > 0 && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">
                  {validCount} valid / {parsed.length} total
                </span>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setTab('review')}>
                  <i className="bi bi-list-check me-1" /> Review & Fix
                </button>
              </div>

              {parsed.filter((p) => p.hasErrors).length > 0 && (
                <div className="alert alert-warning py-2 small mb-2">
                  <i className="bi bi-exclamation-triangle me-1" />
                  {parsed.filter((p) => p.hasErrors).length} student{parsed.filter((p) => p.hasErrors).length !== 1 ? 's' : ''} ha{parsed.filter((p) => p.hasErrors).length === 1 ? 's' : 've'} errors. Click "Review & Fix" for details.
                </div>
              )}

              <div className="d-flex flex-wrap gap-1">
                {parsed.map((p, i) => (
                  <span
                    key={i}
                    className={`badge ${p.hasErrors ? 'bg-danger' : 'bg-success'} cursor-pointer`}
                    onClick={() => setTab('review')}
                    title={p.hasErrors ? p.errors.join(' | ') : 'Valid'}
                  >
                    #{p.index}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!hasValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${validCount} Student${validCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {tab === 'review' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">
              Student Review
              <span className="text-secondary fw-normal ms-2 small">({validCount} valid, {parsed.filter((p) => p.hasErrors).length} with errors)</span>
            </h6>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setTab('paste')}>
              <i className="bi bi-arrow-left me-1" /> Back
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {parsed.map((p, i) => (
              <div key={i} className={`p-3 mb-2 rounded-3 border ${p.hasErrors ? 'border-danger bg-danger-light' : 'border-success bg-success-light'}`}>
                <div className="d-flex justify-content-between align-items-start">
                  <span className="fw-semibold">Student #{p.index}</span>
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
            <button type="button" className="btn btn-outline-secondary" onClick={() => setTab('paste')}>Back</button>
            <button type="button" className="btn btn-primary" disabled={!hasValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${validCount} Student${validCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};