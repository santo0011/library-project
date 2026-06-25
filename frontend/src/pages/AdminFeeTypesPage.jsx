import { useEffect, useState } from 'react';
import { Drawer } from '../components/common/Drawer.jsx';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
import { feeService } from '../services/feeService.js';
import { showToast, confirmAction } from '../utils/sweetAlerts.js';

const lockedFeeTypeMessage = 'This Fee Type has already been assigned and can no longer be edited.';
const deleteBlockedMessage = 'This Fee Type has already been assigned to students and cannot be deleted.';
const blankType = { name: '', amount: '', description: '', isActive: true };

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

export const AdminFeeTypesPage = () => {
  const [feeTypes, setFeeTypes] = useState({ items: [], total: 0, page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({ search: '', statusFilter: '', page: 1, limit: 10 });
  const [typeForm, setTypeForm] = useState(blankType);
  const [editingType, setEditingType] = useState(null);
  const [editTypeForm, setEditTypeForm] = useState(blankType);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadFeeTypes = () => {
    setLoading(true);
    feeService
      .listFeeTypes(filters)
      .then((data) => {
        setFeeTypes(data);
        setSelectedIds([]);
      })
      .catch((err) => showToast('error', err.response?.data?.message || 'Unable to load fee types'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeeTypes();
  }, [filters]);

  const validateForm = (form) => {
    if (!form.name.trim() || form.amount === '' || Number(form.amount) < 0) {
      showToast('error', 'Enter fee type name and valid amount.');
      return false;
    }
    return true;
  };

  const createFeeType = async (event) => {
    event.preventDefault();
    if (!validateForm(typeForm)) return;

    setBusy(true);
    try {
      await feeService.createFeeType({ ...typeForm, amount: Number(typeForm.amount) });
      setTypeForm(blankType);
      setFilters((current) => ({ ...current, page: 1 }));
      showToast('success', 'Fee type created successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to create fee type');
    } finally {
      setBusy(false);
    }
  };

  const openEditType = (type) => {
    if (type.isLocked || type.assignmentCount > 0) {
      showToast('error', lockedFeeTypeMessage);
      return;
    }
    setEditingType(type);
    setEditTypeForm({
      name: type.name || '',
      amount: String(type.amount ?? ''),
      description: type.description || '',
      isActive: type.isActive
    });
  };

  const handleDeleteFeeType = async (type) => {
    if (type.isLocked || type.assignmentCount > 0) {
      showToast('error', deleteBlockedMessage);
      return;
    }

    const result = await confirmAction({
      title: 'Delete Fee Type?',
      text: 'Are you sure you want to delete this fee type?',
      confirmButtonText: 'Delete'
    });

    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await feeService.deleteFeeType(type._id);
      showToast('success', 'Fee type deleted successfully.');
      loadFeeTypes();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to delete fee type');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (type) => {
    const newStatus = !type.isActive;
    const actionLabel = newStatus ? 'Activate' : 'Deactivate';

    const result = await confirmAction({
      title: `${actionLabel} Fee Type?`,
      text: `Are you sure you want to ${actionLabel.toLowerCase()} "${type.name}"?`,
      confirmButtonText: actionLabel,
      confirmButtonColor: newStatus ? '#198754' : '#ffc107'
    });

    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      await feeService.toggleFeeTypeStatus(type._id, newStatus);
      showToast('success', `Fee type ${actionLabel.toLowerCase()}d successfully.`);
      loadFeeTypes();
    } catch (err) {
      showToast('error', err.response?.data?.message || `Unable to ${actionLabel.toLowerCase()} fee type`);
    } finally {
      setBusy(false);
    }
  };

  const handleBulkToggleStatus = async (newStatus) => {
    const actionLabel = newStatus ? 'Activate' : 'Deactivate';
    const selectedCount = selectedIds.length;

    if (!selectedCount) {
      showToast('error', 'Select at least one fee type.');
      return;
    }

    const result = await confirmAction({
      title: `${actionLabel} Selected Fee Types?`,
      text: `Are you sure you want to ${actionLabel.toLowerCase()} ${selectedCount} selected fee type(s)?`,
      confirmButtonText: actionLabel,
      confirmButtonColor: newStatus ? '#198754' : '#ffc107'
    });

    if (!result.isConfirmed) return;

    setBusy(true);
    try {
      const response = await feeService.bulkToggleFeeTypeStatus(selectedIds, newStatus);
      showToast('success', `${response.modifiedCount} fee type(s) ${actionLabel.toLowerCase()}d successfully.`);
      loadFeeTypes();
    } catch (err) {
      showToast('error', err.response?.data?.message || `Unable to ${actionLabel.toLowerCase()} fee types`);
    } finally {
      setBusy(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === feeTypes.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(feeTypes.items.map((t) => t._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateFeeType = async (event) => {
    event.preventDefault();
    if (!validateForm(editTypeForm)) return;

    setBusy(true);
    try {
      await feeService.updateFeeType(editingType._id, {
        ...editTypeForm,
        amount: Number(editTypeForm.amount)
      });
      setEditingType(null);
      loadFeeTypes();
      showToast('success', 'Fee type updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to update fee type');
    } finally {
      setBusy(false);
    }
  };

  const showingFrom = feeTypes.items.length ? (feeTypes.page - 1) * feeTypes.limit + 1 : 0;
  const showingTo = Math.min(feeTypes.page * feeTypes.limit, feeTypes.total);
  const activeCount = feeTypes.items.filter((type) => type.isActive).length;
  const allSelected = feeTypes.items.length > 0 && selectedIds.length === feeTypes.items.length;

  return (
    <>
      <PageHeader title="Fee Types" subtitle={`${feeTypes.total} fee type records.`} />

      <form className="surface p-3 mb-3" onSubmit={createFeeType}>
        <h2 className="h6 fw-bold mb-3">Create Fee Type</h2>
        <div className="row g-2 align-items-end">
          <div className="col-lg-3 col-md-6">
            <label className="form-label">Name</label>
            <input className="form-control" placeholder="January Fee" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
          </div>
          <div className="col-lg-2 col-md-6">
            <label className="form-label">Amount</label>
            <input type="number" min="0" className="form-control" placeholder="Amount" value={typeForm.amount} onChange={(e) => setTypeForm({ ...typeForm, amount: e.target.value })} />
          </div>
          <div className="col-lg-5 col-md-8">
            <label className="form-label">Description</label>
            <input className="form-control" placeholder="Description optional" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
          </div>
          <div className="col-lg-2 col-md-4">
            <button className="btn btn-primary w-100" type="submit" disabled={busy}>
              <i className="bi bi-plus-lg me-1" />Create
            </button>
          </div>
        </div>
      </form>

      <div className="surface p-3">
        <div className="row g-2 align-items-end mb-3">
          <div className="col-lg-3 col-md-5">
            <label className="form-label">Search Fee Types</label>
            <input
              className="form-control"
              placeholder="Name or description"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div className="col-lg-2 col-md-3">
            <label className="form-label">Status Filter</label>
            <select
              className="form-select"
              value={filters.statusFilter}
              onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value, page: 1 })}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-lg-7 col-md-5 text-md-end">
            <span className="small text-secondary me-3">{activeCount} active on this page</span>
            {selectedIds.length > 0 && (
              <>
                <button
                  className="btn btn-sm btn-success me-1"
                  type="button"
                  disabled={busy}
                  onClick={() => handleBulkToggleStatus(true)}
                >
                  <i className="bi bi-check-circle me-1" />Activate Selected
                </button>
                <button
                  className="btn btn-sm btn-warning me-1"
                  type="button"
                  disabled={busy}
                  onClick={() => handleBulkToggleStatus(false)}
                >
                  <i className="bi bi-pause-circle me-1" />Deactivate Selected
                </button>
              </>
            )}
          </div>
        </div>

        {/* Select-all checkbox for desktop */}
        {feeTypes.items.length > 0 && (
          <div className="d-flex align-items-center gap-2 mb-2 px-1">
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                id="select-all-fee-types"
                style={{ cursor: "pointer" }}
              />
              <label className="form-check-label small" htmlFor="select-all-fee-types">Select all</label>
            </div> 
          </div>
        )}
        {loading ? (
          <div className="loading-spinner text-center py-4"><i className="fa-solid fa-spinner fa-spin"></i></div>
        ) : (
          <ResponsiveTable
            columns={[
              {
                key: 'checkbox',
                label: '',
                render: (type) => (
                  <div className="form-check mb-0" style={{ pointerEvents: 'auto' }}>
                    <input className="form-check-input" type="checkbox" checked={selectedIds.includes(type._id)} onChange={() => toggleSelectOne(type._id)} style={{ border: "0.6px solid #585454", cursor: "pointer" }} />
                  </div>
                )
              },
              { key: 'name', label: 'Name', render: (type) => <span className="fw-semibold">{type.name}</span> },
              { key: 'amount', label: 'Amount', render: (type) => <>{money(type.amount)}</> },
              { key: 'description', label: 'Description', render: (type) => <span className="text-secondary">{type.description || '-'}</span> },
              { key: 'assignmentCount', label: 'Assignments', render: (type) => <>{type.assignmentCount || 0}</> },
              {
                key: 'status',
                label: 'Status',
                render: (type) => <span className={`badge ${type.isActive ? 'bg-success' : 'bg-secondary'}`}>{type.isActive ? 'Active' : 'Inactive'}</span>
              },
              {
                key: 'actions',
                label: 'Action',
                render: (type) => (
                  <div className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-outline-primary me-1" type="button" onClick={() => openEditType(type)} disabled={busy} title="Edit"><i className="bi bi-pencil me-1" />Edit</button>
                    <button className="btn btn-sm btn-outline-danger me-1" type="button" onClick={() => handleDeleteFeeType(type)} disabled={busy} title="Delete"><i className="bi bi-trash me-1" />Delete</button>
                  </div>
                )
              },
            ]}
            rows={feeTypes.items}
            mobileSummary={['name', 'amount']}
            mobileDetailExclude={['checkbox']}
            selectable={{ checked: (type) => selectedIds.includes(type._id), onSelect: (type) => toggleSelectOne(type._id) }}
            emptyMessage="No fee types found."
          />
        )}

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
          <span className="small text-secondary">Showing {showingFrom}-{showingTo} of {feeTypes.total}</span>
          {feeTypes.pages > 1 && (
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" type="button" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              {Array.from({ length: feeTypes.pages }, (_, index) => index + 1).slice(Math.max(filters.page - 3, 0), filters.page + 2).map((page) => (
                <button key={page} className={`btn btn-outline-secondary ${filters.page === page ? 'active' : ''}`} type="button" onClick={() => setFilters({ ...filters, page })}>{page}</button>
              ))}
              <button className="btn btn-outline-secondary" type="button" disabled={filters.page >= feeTypes.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </div>
      </div>

      <Drawer
        show={Boolean(editingType)}
        title="Edit Fee Type"
        onClose={() => setEditingType(null)}
        width="450px"
      >
        <form id="edit-fee-type-form" onSubmit={updateFeeType}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Name</label>
              <input className="form-control" value={editTypeForm.name} onChange={(e) => setEditTypeForm({ ...editTypeForm, name: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label">Amount</label>
              <input type="number" min="0" className="form-control" value={editTypeForm.amount} onChange={(e) => setEditTypeForm({ ...editTypeForm, amount: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" value={editTypeForm.description} onChange={(e) => setEditTypeForm({ ...editTypeForm, description: e.target.value })} />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input id="fee-type-active" className="form-check-input" type="checkbox" checked={editTypeForm.isActive} onChange={(e) => setEditTypeForm({ ...editTypeForm, isActive: e.target.checked })} />
                <label className="form-check-label" htmlFor="fee-type-active">Active</label>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button className="btn btn-outline-secondary" type="button" onClick={() => setEditingType(null)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Drawer>
    </>
  );
};