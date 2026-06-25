import { useState } from 'react';

/* ─── ResponsiveTable ───
   Renders a normal table on desktop/tablet.
   On mobile (≤768px) converts rows into expandable cards.
   Props:
     columns  - Array of { key, label, render: (row) => JSX }
     rows     - Array of row objects
     mobileSummary - Array of keys to show in card summary (2-4 items)
     onRowClick - optional click handler for desktop rows
     emptyMessage - string shown when no rows
     mobileDetailExclude - Array of column keys to hide in mobile detail expanded view
     selectable - if true, renders a checkbox at the top of each mobile card
       Expected to be { checked: boolean, onSelect: (row) => void, rowId: (row) => string }
 */
export const ResponsiveTable = ({ columns, rows, mobileSummary, onRowClick, emptyMessage = 'No data available.', mobileDetailExclude = [], selectable }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-4 text-secondary">
        <i className="bi bi-inbox fs-2 d-block mb-2" />
        <small>{emptyMessage}</small>
      </div>
    );
  }

  // Determine which columns are summary vs detail
  const summaryKeys = mobileSummary || columns.slice(0, 3).map((c) => c.key);
  const detailColumns = columns.filter((c) => !summaryKeys.includes(c.key) && !mobileDetailExclude.includes(c.key));

  return (
    <>
      {/* ─── Desktop / Tablet Table ─── */}
      <div className="responsive-table-desktop">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const rowId = row._id || row.id || idx;
                return (
                  <tr key={rowId} className={onRowClick ? 'cursor-pointer' : ''}
                    onClick={() => onRowClick?.(row)}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : row[col.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Mobile Cards ─── */}
      <div className="responsive-table-mobile">
        <div className="d-flex flex-column gap-2">
          {rows.map((row, idx) => {
            const rowId = row._id || row.id || idx;
            const isExpanded = expanded[rowId];

            const isSelected = selectable ? selectable.checked(row) : false;

            return (
              <div key={rowId} className={`surface p-3 mobile-record-card ${isSelected ? 'border-primary' : ''}`} style={isSelected ? { borderColor: 'var(--primary)', borderWidth: 2 } : {}}>
                {/* Select checkbox at top of card */}
                {selectable && (
                  <div className="d-flex justify-content-end mb-2">
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => selectable.onSelect(row)}
                        style={{ cursor: "pointer", border: "0.6px solid #585454" }}
                      />
                    </div>
                  </div>
                )}
                {/* Summary Fields */}
                <div className="d-flex flex-column gap-1">
                  {summaryKeys.map((key) => {
                    const col = columns.find((c) => c.key === key);
                    if (!col) return null;
                    return (
                      <div key={key} className="d-flex justify-content-between align-items-center">
                        <span className="small text-secondary">{col.label}</span>
                        <span className="fw-semibold small" style={{ color: 'var(--app-text)' }}>
                          {col.render ? col.render(row) : row[key] ?? '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Expand / View Details Button */}
                {detailColumns.length > 0 && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-primary w-100 mt-2 rounded-pill"
                      onClick={() => toggleExpand(rowId)}
                    >
                      <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`} />
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>

                    {/* Expandable Detail Fields */}
                    <div className={`mobile-record-details ${isExpanded ? 'expanded' : ''}`}>
                      <div className="d-flex flex-column gap-2 pt-2">
                        {detailColumns.map((col) => (
                          <div key={col.key} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                            <span className="small text-secondary">{col.label}</span>
                            <span className="fw-semibold small" style={{ color: 'var(--app-text)' }}>
                              {col.render ? col.render(row) : row[col.key] ?? '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};