import { useState } from 'react';
import { StudentCreateForm } from './StudentCreateForm.jsx';
import { BulkImportStudentsForm } from './BulkImportStudentsForm.jsx';
import { PasteStudentsForm } from './PasteStudentsForm.jsx';

const TABS = [
  { key: 'single', label: 'Single Student', icon: 'bi-person-plus' },
  { key: 'bulk', label: 'Bulk Import', icon: 'bi-file-earmark-spreadsheet' },
  { key: 'paste', label: 'Paste Students', icon: 'bi-clipboard-data' }
];

export const StudentCreateFormModal = ({ onSubmit, onClose, busy }) => {
  const [activeTab, setActiveTab] = useState('single');

  const handleBulkSubmit = (students) => {
    onSubmit({ type: 'bulk', students });
  };

  const handlePasteSubmit = (students) => {
    onSubmit({ type: 'paste', students });
  };

  return (
    <div>
      {/* Tabs */}
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
              transition: 'var(--transition)'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bi ${tab.icon} me-2`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="question-form-tab-content">
        {activeTab === 'single' && (
          <StudentCreateForm onSubmit={onSubmit} onClose={onClose} busy={busy} />
        )}
        {activeTab === 'bulk' && (
          <BulkImportStudentsForm onSubmit={handleBulkSubmit} onClose={onClose} busy={busy} />
        )}
        {activeTab === 'paste' && (
          <PasteStudentsForm onSubmit={handlePasteSubmit} onClose={onClose} busy={busy} />
        )}
      </div>
    </div>
  );
};