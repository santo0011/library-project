import { useState } from 'react';

const LETTER_TO_INDEX = { a: 0, b: 1, c: 2, d: 3 };

const parseQuestions = (text) => {
  const blocks = text.split(/(?=Question\s*:)/).filter((b) => b.trim());
  const results = [];

  blocks.forEach((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l);
    const question = {};
    const errors = [];

    // Extract question text
    const qMatch = block.match(/Question\s*:\s*(.+)/i);
    if (qMatch) {
      question.title = qMatch[1].trim();
    } else {
      question.title = '';
      errors.push('Question text not found. Use format: "Question: Your question here"');
    }

    // Extract options
    const optionLines = lines.filter((l) => /^[A-Da-d][.)\s]/.test(l));
    const options = [];
    for (const letter of ['A', 'B', 'C', 'D']) {
      const match = block.match(new RegExp(`${letter}[.)\\s]+([^\\n]*)`, 'i'));
      if (match) {
        options.push({ text: match[1].trim() });
      } else {
        options.push({ text: '' });
        errors.push(`Option ${letter} not found`);
      }
    }
    question.options = options;

    // Extract answer
    const aMatch = block.match(/Answer\s*:\s*([A-Da-d])/i);
    if (aMatch) {
      const idx = LETTER_TO_INDEX[aMatch[1].toLowerCase()];
      question.correctOption = idx !== undefined ? idx : 0;
    } else {
      question.correctOption = 0;
      errors.push('Correct answer not found. Use format: "Answer: A"');
    }

    // Extract marks
    const mMatch = block.match(/Marks\s*:\s*(\d+)/i);
    question.marks = mMatch ? parseInt(mMatch[1], 10) : 1;
    if (!mMatch) errors.push('Marks not found. Use format: "Marks: 1"');

    // Extract time
    const tMatch = block.match(/Time\s*:\s*(\d+)/i);
    question.time = tMatch ? parseInt(tMatch[1], 10) : 30;
    if (!tMatch) errors.push('Time not found. Use format: "Time: 30"');

    // Validate
    if (!question.title || question.title.length < 2) errors.push('Question text is required (min 2 chars)');
    const emptyOpts = question.options.some((o) => !o.text.trim());
    if (emptyOpts) errors.push('All options must have text');
    if (question.marks < 1) errors.push('Marks must be at least 1');
    if (question.time < 5) errors.push('Time must be at least 5 seconds');

    results.push({
      ...question,
      hasErrors: errors.length > 0,
      errors
    });
  });

  return results;
};

export const PasteQuestionsForm = ({ onSubmit, onClose, busy }) => {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [tab, setTab] = useState('paste');

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      const result = parseQuestions(val);
      setParsed(result);
    } else {
      setParsed([]);
    }
  };

  const handleImport = () => {
    const validQuestions = parsed.filter((p) => !p.hasErrors);
    const questionPayloads = validQuestions.map((q) => ({
      title: q.title,
      options: q.options.map((o) => ({ text: o.text.trim() })),
      correctOption: q.correctOption,
      marks: q.marks,
      subject: 'A',
      explanation: '',
      timeSeconds: q.time
    }));

    if (questionPayloads.length === 0) {
      return;
    }

    onSubmit(questionPayloads);
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
                <h6 className="fw-bold mb-1">Paste Questions</h6>
                <p className="mb-0 small text-secondary">Paste questions copied from ChatGPT, Word, or any document. Each question must follow the format below.</p>
              </div>
            </div>
          </div>

          <div className="mb-3 p-3 rounded-3 bg-light small">
            <p className="fw-semibold mb-2">Expected format:</p>
            <code className="d-block p-2 bg-white rounded-2 border" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: '1.6' }}>
              Question: HTML stands for?{'\n'}
              A. Hyper Text Markup Language{'\n'}
              B. Home Tool{'\n'}
              C. High Text{'\n'}
              D. None{'\n'}
              Answer: A{'\n'}
              Marks: 1{'\n'}
              Time: 30
            </code>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Paste your questions here
              {text.trim() && (
                <span className="text-secondary fw-normal ms-2 small">
                  — {parsed.length} question{parsed.length !== 1 ? 's' : ''} detected ({validCount} valid)
                </span>
              )}
            </label>
            <textarea
              className="form-control font-monospace"
              rows="10"
              value={text}
              onChange={handleTextChange}
              placeholder={`Paste questions here...\n\nExample:\nQuestion: HTML stands for?\nA. Hyper Text Markup Language\nB. Home Tool\nC. High Text\nD. None\nAnswer: A\nMarks: 1\nTime: 30`}
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
                  {parsed.filter((p) => p.hasErrors).length} question{parsed.filter((p) => p.hasErrors).length !== 1 ? 's' : ''} ha{parsed.filter((p) => p.hasErrors).length === 1 ? 's' : 've'} errors. Click "Review & Fix" for details.
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
                    #{i + 1}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!hasValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${validCount} Question${validCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {tab === 'review' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">
              Question Review
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
                  <span className="fw-semibold">Question #{i + 1}</span>
                  {p.hasErrors ? (
                    <span className="badge bg-danger">Invalid</span>
                  ) : (
                    <span className="badge bg-success">Valid</span>
                  )}
                </div>
                <p className="mt-2 mb-1 fw-medium">{p.title || <span className="text-danger">(empty)</span>}</p>
                <div className="small">
                  <div className="row g-1">
                    {p.options.map((opt, oi) => (
                      <div key={oi} className="col-6">
                        <span className={`badge ${oi === p.correctOption ? 'bg-success' : 'bg-light text-secondary'} me-1`}>
                          {String.fromCharCode(65 + oi)}
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
            <button type="button" className="btn btn-outline-secondary" onClick={() => setTab('paste')}>Back</button>
            <button type="button" className="btn btn-primary" disabled={!hasValid || busy} onClick={handleImport}>
              {busy ? 'Importing...' : `Import ${validCount} Question${validCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};