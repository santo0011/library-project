import { useEffect, useState } from 'react';
import { Modal } from '../components/common/Modal.jsx';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { feeService } from '../services/feeService.js';
import { showToast } from '../utils/sweetAlerts.js';

const lockedFeeTypeMessage = 'This Fee Type has already been assigned and can no longer be edited.';
const blankType = { name: '', amount: '', description: '', isActive: true };

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

export const AdminFeeTypesPage = () => {
  const [feeTypes, setFeeTypes] = useState({ items: [], total: 0, page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10 });
  const [typeForm, setTypeForm] = useState(blankType);
  const [editingType, setEditingType] = useState(null);
  const [editTypeForm, setEditTypeForm] = useState(blankType);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadFeeTypes = () => {
    setLoading(true);
    feeService
      .listFeeTypes(filters)
      .then(setFeeTypes)
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
          <div className="col-lg-5 col-md-7">
            <label className="form-label">Search Fee Types</label>
            <input
              className="form-control"
              placeholder="Name or description"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div className="col-lg-7 col-md-5 text-md-end">
            <span className="small text-secondary">{activeCount} active on this page</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Assignments</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading fee types...</td></tr>
              ) : feeTypes.items.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-secondary">No fee types found.</td></tr>
              ) : feeTypes.items.map((type) => (
                <tr key={type._id}>
                  <td className="fw-semibold">{type.name}</td>
                  <td>{money(type.amount)}</td>
                  <td className="text-secondary">{type.description || '-'}</td>
                  <td>{type.assignmentCount || 0}</td>
                  <td>
                    <span className={`badge ${type.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => openEditType(type)} disabled={busy}>
                      <i className="bi bi-pencil me-1" />Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {editingType && (
        <Modal
          show={true}
          title="Edit Fee Type"
          onClose={() => setEditingType(null)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setEditingType(null)}>Cancel</button>
              <button className="btn btn-primary" form="edit-fee-type-form" type="submit" disabled={busy}>Save</button>
            </>
          }
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
          </form>
        </Modal>
      )}
    </>
  );
};
