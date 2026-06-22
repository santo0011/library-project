import { useEffect, useState } from 'react';
import { QuestionForm } from './QuestionForm.jsx';
import { BulkImportForm } from './BulkImportForm.jsx';
import { PasteQuestionsForm } from './PasteQuestionsForm.jsx';

const TABS = [
  { key: 'single', label: 'Single Question', icon: 'bi-pencil-square' },
  { key: 'bulk', label: 'Bulk Import', icon: 'bi-file-earmark-spreadsheet' },
  { key: 'paste', label: 'Paste Questions', icon: 'bi-clipboard-data' }
];

export const QuestionFormModal = ({ question, onSubmit, onClose, busy, isLocked }) => {
  const isEditing = Boolean(question?._id);
  const [activeTab, setActiveTab] = useState('single');

  // When editing, force single tab and hide the tab bar
  useEffect(() => {
    if (isEditing) setActiveTab('single');
  }, [isEditing]);

  const handleBulkSubmit = (questions) => {
    onSubmit({ type: 'bulk', questions });
  };

  const handlePasteSubmit = (questions) => {
    onSubmit({ type: 'paste', questions });
  };

  return (
    <div>
      {/* Tabs - hidden when editing a question */}
      {!isEditing && (
        <div className="d-flex border-bottom mb-4 gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`btn btn-sm px-4 py-2 rounded-0 fw-semibold position-relative ${activeTab === tab.key ? 'text-primary' : 'text-secondary'}`}
              style={{
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'none',
                transition: 'var(--transition)',
                opacity: isLocked && tab.key !== 'single' ? 0.5 : 1
              }}
              onClick={() => {
                if (isLocked && tab.key !== 'single') return;
                setActiveTab(tab.key);
              }}
              disabled={isLocked && tab.key !== 'single'}
            >
              <i className={`bi ${tab.icon} me-2`} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="question-form-tab-content">
        {activeTab === 'single' && (
          <QuestionForm question={question} onSubmit={onSubmit} onClose={onClose} busy={busy} />
        )}
        {activeTab === 'bulk' && (
          <BulkImportForm onSubmit={handleBulkSubmit} onClose={onClose} busy={busy} />
        )}
        {activeTab === 'paste' && (
          <PasteQuestionsForm onSubmit={handlePasteSubmit} onClose={onClose} busy={busy} />
        )}
      </div>
    </div>
  );
};