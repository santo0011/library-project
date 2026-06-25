import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Drawer } from '../components/common/Drawer.jsx';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ResponsiveTable } from '../components/common/ResponsiveTable.jsx';
import { feeService } from '../services/feeService.js';
import { confirmAction, showToast } from '../utils/sweetAlerts.js';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const statusClass = {
  Paid: 'bg-success',
  Partial: 'bg-warning',
  Unpaid: 'bg-danger'
};

const blankPayment = {
  feeType: '',
  amount: '',
  paymentDate: moment().format('YYYY-MM-DD'),
  paymentMode: 'Cash',
  transactionId: '',
  remarks: ''
};

export const AdminFeeManagementPage = () => {
  const [fees, setFees] = useState({ items: [], total: 0, page: 1, pages: 1, limit: 10 });
  const [feeTypes, setFeeTypes] = useState([]);
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10 });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedFeeType, setSelectedFeeType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [paymentForm, setPaymentForm] = useState(blankPayment);
  const [drawerFeeTypeId, setDrawerFeeTypeId] = useState('');
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('assigned');
  const [assignedHistorySearch, setAssignedHistorySearch] = useState('');
  const [assignedHistoryPage, setAssignedHistoryPage] = useState(1);
  const [paymentHistoryPage, setPaymentHistoryPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentPaymentsLoading, setRecentPaymentsLoading] = useState(true);

  const loadFees = () => {
    setLoading(true);
    return feeService
      .list(filters)
      .then((data) => {
        setFees(data);
        setSelectedStudents([]);
      })
      .catch((err) => showToast('error', err.response?.data?.message || 'Unable to load fee records'))
      .finally(() => setLoading(false));
  };

  const loadFeeTypes = () => {
    return feeService
      .listFeeTypes({ activeOnly: true })
      .then(setFeeTypes)
      .catch((err) => showToast('error', err.response?.data?.message || 'Unable to load fee types'));
  };

  const loadHistoryRecords = async () => {
    setHistoryLoading(true);
    try {
      const firstPage = await feeService.list({ page: 1, limit: 100, search: '' });
      const records = [...(firstPage.items || [])];

      for (let page = 2; page <= firstPage.pages; page += 1) {
        const nextPage = await feeService.list({ page, limit: 100, search: '' });
        records.push(...(nextPage.items || []));
      }

      setHistoryRecords(records);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to load fee history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [filters]);

  useEffect(() => {
    loadFeeTypes();
  }, []);

  useEffect(() => {
    setRecentPaymentsLoading(true);
    feeService
      .getRecentPayments(5)
      .then(setRecentPayments)
      .catch(() => {})
      .finally(() => setRecentPaymentsLoading(false));
  }, []);

  const activeFeeTypes = feeTypes;
  const selectedFeeTypeData = activeFeeTypes.find((type) => type._id === selectedFeeType);
  const allPageSelected = fees.items.length > 0 && fees.items.every((row) => selectedStudents.includes(row.student._id));

  const selectedPayments = useMemo(
    () => [...(selected?.payments || [])].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    [selected]
  );
  const selectedAssignedFees = useMemo(
    () => [...(selected?.assignedFees || [])].sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)),
    [selected]
  );
  const selectedPaymentFee = selectedAssignedFees.find((fee) => fee.feeType === paymentForm.feeType);
  const selectedPaymentFeePaid = selectedPayments
    .filter((payment) => payment.feeType === paymentForm.feeType)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const selectedPaymentFeeDue = selectedPaymentFee
    ? Math.max(selectedPaymentFee.amount - selectedPaymentFeePaid, 0)
    : Number(selected?.dueAmount || 0);
  const drawerFeeType = activeFeeTypes.find((type) => type._id === drawerFeeTypeId)
    || selectedAssignedFees.find((fee) => fee.feeType === drawerFeeTypeId);

  const assignedHistory = useMemo(() => {
    if (!selected) return [];

    const studentFees = [...(selected.assignedFees || [])];
    let result = studentFees.map((fee) => {
      const paidAmount = (selected.payments || [])
        .filter((payment) => payment.feeType === fee.feeType)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      return {
        id: fee._id,
        feeType: fee.feeType,
        name: fee.name,
        amount: fee.amount,
        assignedAt: fee.assignedAt,
        paymentStatus: paidAmount <= 0 ? 'Unpaid' : paidAmount >= Number(fee.amount || 0) ? 'Paid' : 'Partial',
        paidAmount,
        dueAmount: Math.max(Number(fee.amount || 0) - paidAmount, 0)
      };
    });

    if (assignedHistorySearch.trim()) {
      const search = assignedHistorySearch.trim().toLowerCase();
      result = result.filter((row) =>
        (row.name || '').toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    return result;
  }, [assignedHistorySearch, selected]);

  const paymentHistory = useMemo(() => {
    if (!selected) return [];

    return [...(selected.payments || [])]
      .sort((a, b) => new Date(b.createdAt || b.paymentDate || 0) - new Date(a.createdAt || a.paymentDate || 0));
  }, [selected]);

  const assignedHistoryPages = Math.ceil(assignedHistory.length / 10) || 1;
  const paymentHistoryPages = Math.ceil(paymentHistory.length / 10) || 1;
  const pagedAssignedHistory = assignedHistory.slice((assignedHistoryPage - 1) * 10, assignedHistoryPage * 10);
  const pagedPaymentHistory = paymentHistory.slice((paymentHistoryPage - 1) * 10, paymentHistoryPage * 10);
  const totalAssignedStudents = assignedHistory.length;
  const totalPaidForDrawerFee = paymentHistory.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalDueForDrawerFee = assignedHistory.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0);
  const drawerFeeStatus = totalAssignedStudents === 0 || totalPaidForDrawerFee <= 0
    ? 'Unpaid'
    : totalDueForDrawerFee <= 0 ? 'Paid' : 'Partial';

  const feeDue = (fee) => {
    const paid = selectedPayments
      .filter((payment) => payment.feeType === fee.feeType)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return Math.max(Number(fee.amount || 0) - paid, 0);
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    );
  };

  const toggleAll = () => {
    setSelectedStudents(allPageSelected ? [] : fees.items.map((row) => row.student._id));
  };

  const assignFees = async () => {
    if (!selectedFeeType) {
      showToast('error', 'Select a fee type first.');
      return;
    }
    if (!selectedStudents.length) {
      showToast('error', 'Select at least one student.');
      return;
    }

    const confirmation = await confirmAction({
      title: 'Confirm Fee Assignment?',
      text: 'Are you sure you want to assign this fee to the selected student(s)?',
      confirmButtonText: 'Assign',
      confirmButtonColor: '#198754'
    });
    if (!confirmation.isConfirmed) return;

    setBusy(true);
    try {
      const result = await feeService.bulkAssign({ feeTypeId: selectedFeeType, studentIds: selectedStudents });
      loadFees();
      loadFeeTypes();
      showToast('success', `Assigned to ${result.assigned} student(s). ${result.skipped} duplicate(s) skipped.`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to assign fee');
    } finally {
      setBusy(false);
    }
  };

  const removeFees = async () => {
    if (!selectedFeeType) {
      showToast('error', 'Select a fee type first.');
      return;
    }
    if (!selectedStudents.length) {
      showToast('error', 'Select at least one student.');
      return;
    }

    const confirmation = await confirmAction({
      title: 'Confirm Fee Removal?',
      text: 'Are you sure you want to remove this fee from the selected student(s)?',
      confirmButtonText: 'Remove',
      confirmButtonColor: '#dc3545'
    });
    if (!confirmation.isConfirmed) return;

    setBusy(true);
    try {
      const studentIds = selectedStudents;
      const result = await feeService.bulkRemove({ feeTypeId: selectedFeeType, studentIds: selectedStudents });
      await Promise.all([
        loadFees(),
        loadFeeTypes(),
        loadHistoryRecords(),
        selected && studentIds.includes(selected.student?._id)
          ? feeService.getByStudent(selected.student._id).then((detail) => {
            setSelected(detail);
            setPaymentForm({ ...blankPayment, feeType: detail.assignedFees?.[0]?.feeType || '' });
          })
          : Promise.resolve()
      ]);
      if (result.blocked > 0) {
        showToast('error', 'This fee cannot be removed because payment has already been recorded.');
      } else {
        showToast('success', `Removed from ${result.removed} student(s). ${result.skipped} not assigned.`);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to remove fee');
    } finally {
      setBusy(false);
    }
  };

  const openStudent = async (row) => {
    setBusy(true);
    try {
      const detail = await feeService.getByStudent(row.student._id);
      setSelected(detail);
      const initialFeeType = selectedFeeType || detail.assignedFees?.[0]?.feeType || '';
      setDrawerFeeTypeId(initialFeeType);
      setActiveHistoryTab('assigned');
      setAssignedHistorySearch('');
      setAssignedHistoryPage(1);
      setPaymentHistoryPage(1);
      setPaymentForm({ ...blankPayment, feeType: initialFeeType });
      loadHistoryRecords();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to load fee details');
    } finally {
      setBusy(false);
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setDrawerFeeTypeId('');
    setPaymentForm(blankPayment);
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    const amount = Number(paymentForm.amount);
    if (!paymentForm.feeType && selectedAssignedFees.length) {
      showToast('error', 'Select a fee type for this payment.');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('error', 'Enter a valid payment amount.');
      return;
    }
    if (amount > Number(selected.dueAmount || 0) || amount > selectedPaymentFeeDue) {
      showToast('error', 'Paid amount cannot exceed total fee.');
      return;
    }

    const confirmation = await confirmAction({
      title: 'Confirm Payment?',
      text: 'Are you sure you want to record this payment?',
      confirmButtonText: 'Record Payment',
      confirmButtonColor: '#198754'
    });
    if (!confirmation.isConfirmed) return;

    setBusy(true);
    try {
      const updated = await feeService.recordPayment(selected.student._id, {
        ...paymentForm,
        amount,
        paymentDate: paymentForm.paymentDate ? new Date(paymentForm.paymentDate).toISOString() : undefined
      });
      setSelected(updated);
      setPaymentForm({ ...blankPayment, feeType: updated.assignedFees?.[0]?.feeType || '' });
      loadFees();
      loadHistoryRecords();
      showToast('success', 'Payment recorded successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to record payment');
    } finally {
      setBusy(false);
    }
  };

  const showingFrom = fees.items.length ? (fees.page - 1) * fees.limit + 1 : 0;
  const showingTo = Math.min(fees.page * fees.limit, fees.total);

  return (
    <>
      <PageHeader title="Fee Management" subtitle={`${fees.total} student fee records.`} />

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header border-0 pt-3 pb-0" style={{ background: 'transparent' }}>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--app-text)' }}>
            <i className="bi bi-clock-history me-2 text-primary" />Recent Payments
          </h6>
        </div>
        <div className="card-body p-3">
          {recentPaymentsLoading ? (
            <div className="loading-spinner"><i className="fa-solid fa-spinner fa-spin"></i></div>
          ) : recentPayments.length === 0 ? (
            <p className="text-secondary small mb-0">No payments recorded yet.</p>
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'student', label: 'Student', render: (p) => <span className="fw-semibold text-truncate d-inline-block" style={{ maxWidth: 160 }} title={p.student?.name || '-'}>{p.student?.name || '-'}</span> },
                { key: 'amount', label: 'Amount', render: (p) => <span className="fw-semibold text-success">{money(p.amount)}</span> },
                { key: 'feeName', label: 'Fee Type', render: (p) => <>{p.feeName || '-'}</> },
                { key: 'paymentMode', label: 'Mode', render: (p) => <>{p.paymentMode || '-'}</> },
                { key: 'paymentDate', label: 'Date & Time', render: (p) => <>{p.paymentDate ? moment(p.paymentDate).format('DD, MMM, YYYY h:mm A') : '-'}</> },
                { key: 'transactionId', label: 'Transaction', render: (p) => <span className="text-truncate d-inline-block" style={{ maxWidth: 120 }} title={p.transactionId || '-'}>{p.transactionId || '-'}</span> },
              ]}
              rows={recentPayments}
              mobileSummary={['student', 'amount']}
              emptyMessage="No payments recorded yet."
            />
          )}
        </div>
      </div>

      <div className="surface p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-lg-4">
            <label className="form-label">Fee Type</label>
            <select className="form-select" value={selectedFeeType} onChange={(e) => setSelectedFeeType(e.target.value)}>
              <option value="">Select active fee type</option>
              {activeFeeTypes.map((type) => (
                <option key={type._id} value={type._id}>{type.name} - {money(type.amount)}</option>
              ))}
            </select>
          </div>
          <div className="col-lg-4">
            <label className="form-label">Search Students</label>
            <input
              className="form-control"
              placeholder="Name, ID, email, or mobile"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div className="col-lg-2 col-6">
            <button className="btn btn-outline-secondary w-100" type="button" onClick={toggleAll} disabled={!fees.items.length}>
              {allPageSelected ? 'Clear All' : 'Select All'}
            </button>
          </div>
          <div className="col-lg-1 col-6">
            <button className="btn btn-success w-100" type="button" onClick={assignFees} disabled={busy || !selectedFeeType || !selectedStudents.length}>
              Assign
            </button>
          </div>
          <div className="col-lg-1 col-6">
            <button className="btn btn-outline-danger w-100" type="button" onClick={removeFees} disabled={busy || !selectedFeeType || !selectedStudents.length}>
              Remove
            </button>
          </div>
          {selectedFeeTypeData && (
            <div className="col-12">
              <span className="small text-secondary">{selectedStudents.length} selected for {selectedFeeTypeData.name} ({money(selectedFeeTypeData.amount)}).</span>
            </div>
          )}
        </div>
      </div>

      <div className="surface p-3">
        {/* Select-all checkbox for desktop — placed as a row above the table */}
        {fees.items.length > 0 && (
          <div className="d-flex align-items-center gap-2 mb-2 px-1">
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={allPageSelected}
                onChange={toggleAll}
                id="select-all-fees"
                style={{ cursor: "pointer" }}
              />
              <label className="form-check-label small" htmlFor="select-all-fees">Select all</label>
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
                render: (row) => (
                  <div className="form-check mb-0" style={{ pointerEvents: 'auto' }}>
                    <input style={{ border: "0.6px solid #585454", cursor: "pointer" }} className="form-check-input" type="checkbox" checked={selectedStudents.includes(row.student._id)} onChange={() => toggleStudent(row.student._id)} />
                  </div>
                )
              },
              { key: 'name', label: 'Student Name', render: (row) => <span className="fw-semibold">{row.student.name}</span> },
              { key: 'studentId', label: 'Student ID', render: (row) => <span className="badge text-bg-secondary">{row.student.studentId || '-'}</span> },
              { key: 'totalFee', label: 'Total Fee', render: (row) => <>{money(row.totalFee)}</> },
              { key: 'paidAmount', label: 'Paid Amount', render: (row) => <span className="text-success fw-semibold">{money(row.paidAmount)}</span> },
              {
                key: 'dueAmount',
                label: 'Due Amount',
                render: (row) => <span className={row.dueAmount > 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>{money(row.dueAmount)}</span>
              },
              {
                key: 'paymentStatus',
                label: 'Status',
                render: (row) => <span className={`badge ${statusClass[row.paymentStatus] || 'bg-secondary'}`}>{row.paymentStatus}</span>
              },
              { key: 'assigned', label: 'Assigned', render: (row) => <>{row.assignedFees?.length || 0}</> },
              {
                key: 'actions',
                label: 'Action',
                render: (row) => (
                  <div className="text-end" style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openStudent(row)} disabled={busy} title="Manage fees">
                      <i className="bi bi-cash-coin me-1" />Manage
                    </button>
                  </div>
                )
              },
            ]}
            rows={fees.items}
            mobileSummary={['name', 'totalFee']}
            mobileDetailExclude={['checkbox']}
            selectable={{ checked: (row) => selectedStudents.includes(row.student._id), onSelect: (row) => toggleStudent(row.student._id) }}
            emptyMessage="No students found."
          />
        )}

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
          <span className="small text-secondary">Showing {showingFrom}-{showingTo} of {fees.total}</span>
          {fees.pages > 1 && (
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              {Array.from({ length: fees.pages }, (_, index) => index + 1).slice(Math.max(filters.page - 3, 0), filters.page + 2).map((page) => (
                <button key={page} className={`btn btn-outline-secondary ${filters.page === page ? 'active' : ''}`} onClick={() => setFilters({ ...filters, page })}>{page}</button>
              ))}
              <button className="btn btn-outline-secondary" disabled={filters.page >= fees.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          )}
        </div>
      </div>

      <Drawer
        show={Boolean(selected)}
        title={`${selected?.student?.name || 'Student'} Fee Details`}
        onClose={closeDrawer}
        width="750px"
      >
        {selected && (
          <>
            <div className="row g-3 mb-3">
              {[
                { label: 'Total Fee', value: money(selected.totalFee), color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
                { label: 'Paid Amount', value: money(selected.paidAmount), color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
                { label: 'Due Amount', value: money(selected.dueAmount), color: '#c62828', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }
              ].map((item) => (
                <div className="col-md-4" key={item.label}>
                  <div className="p-3 rounded-3 h-100" style={{ background: item.bg }}>
                    <small className="fw-semibold" style={{ color: item.color }}>{item.label}</small>
                    <div className="fs-4 fw-bold" style={{ color: item.color }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <form className="surface p-3 mb-3" onSubmit={recordPayment}>
              <h6 className="fw-bold mb-3">Record Payment</h6>
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label">Fee Types</label>
                  <select className="form-select" value={paymentForm.feeType} onChange={(e) => setPaymentForm({ ...paymentForm, feeType: e.target.value })}>
                    <option value="">Select fee type</option>
                    {selectedAssignedFees.map((fee) => (
                      <option key={fee._id} value={fee.feeType}>{fee.name} - due {money(feeDue(fee))}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Amount</label>
                  <input type="number" min="1" max={selectedPaymentFeeDue || undefined} className="form-control" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-control" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Mode</label>
                  <select className="form-select" value={paymentForm.paymentMode} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                    {['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI', 'Other'].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Transaction ID</label>
                  <input className="form-control" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Remarks</label>
                  <input className="form-control" value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
                </div>
                <div className="col-12 text-end">
                  <button className="btn btn-success" type="submit" disabled={busy || selected.dueAmount <= 0 || selectedPaymentFeeDue <= 0}>
                    <i className="bi bi-plus-circle me-1" />Record Payment
                  </button>
                </div>
              </div>
            </form>

            <div className="surface p-3">


              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button className={`nav-link ${activeHistoryTab === 'assigned' ? 'active' : ''}`} type="button" onClick={() => setActiveHistoryTab('assigned')}>
                    Assigned Fee History
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeHistoryTab === 'payments' ? 'active' : ''}`} type="button" onClick={() => setActiveHistoryTab('payments')}>
                    Payment History
                  </button>
                </li>
              </ul>

              {activeHistoryTab === 'assigned' ? (
                <>
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Search Fee Types</label>
                      <input
                        className="form-control"
                        placeholder="Fee type name"
                        value={assignedHistorySearch}
                        onChange={(e) => {
                          setAssignedHistorySearch(e.target.value);
                          setAssignedHistoryPage(1);
                        }}
                      />
                    </div>

                    <div className="col-md-6 d-flex justify-content-md-end align-items-end">
                      <span className="small text-secondary">
                        {assignedHistory.length} assigned fee(s)
                      </span>
                    </div>
                  </div>

                  <div className="fee-drawer-table-wrap">
                    <table className="table align-middle fee-drawer-table">
                      <thead>
                        <tr>
                          <th style={{ width: 48 }}>SL.</th>
                          <th>Fee Type</th>
                          <th>Total Fee</th>
                          <th>Paid Amount</th>
                          <th>Due Amount</th>
                          <th>Payment Status</th>
                          <th>Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedAssignedHistory.length === 0 ? (
                          <tr><td colSpan="7" className="text-center text-secondary">No assigned fees found.</td></tr>
                        ) : pagedAssignedHistory.map((row, index) => (
                          <tr key={row.id || index}>
                            <td className="text-secondary">{(assignedHistoryPage - 1) * 10 + index + 1}</td>
                            <td className="fw-semibold">{row.name || '-'}</td>
                            <td>{money(row.amount)}</td>
                            <td className="text-success fw-semibold">{money(row.paidAmount)}</td>
                            <td className={row.dueAmount > 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>{money(row.dueAmount)}</td>
                            <td><span className={`badge ${statusClass[row.paymentStatus] || 'bg-secondary'}`}>{row.paymentStatus}</span></td>
                            <td>{row.assignedAt ? moment(row.assignedAt).format('DD, MMM, YYYY') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                    <span className="small text-secondary">Page {assignedHistoryPage} of {assignedHistoryPages}</span>
                    {assignedHistoryPages > 1 && (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" type="button" disabled={assignedHistoryPage <= 1} onClick={() => setAssignedHistoryPage(assignedHistoryPage - 1)}>Previous</button>
                        <button className="btn btn-outline-secondary" type="button" disabled={assignedHistoryPage >= assignedHistoryPages} onClick={() => setAssignedHistoryPage(assignedHistoryPage + 1)}>Next</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="d-flex justify-content-end mb-3">
                    <span className="small text-secondary">{paymentHistory.length} payment record(s)</span>
                  </div>
                  <div className="fee-drawer-table-wrap">
                    <table className="table align-middle fee-drawer-table">
                      <thead>
                        <tr>
                          <th style={{ width: 48 }}>SL.</th>
                          <th>Fee Type</th>
                          <th>Amount Paid</th>
                          <th>Payment Date</th>
                          <th>Payment Method</th>
                          <th>Reference ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPaymentHistory.length === 0 ? (
                          <tr><td colSpan="6" className="text-center text-secondary">No payments found.</td></tr>
                        ) : pagedPaymentHistory.map((payment, index) => (
                          <tr key={payment._id || index}>
                            <td className="text-secondary">{(paymentHistoryPage - 1) * 10 + index + 1}</td>
                            <td>{payment.feeName || '-'}</td>
                            <td className="fw-semibold text-success">{money(payment.amount)}</td>
                            <td>{payment.paymentDate ? moment(payment.paymentDate).format('DD, MMM, YYYY') : '-'}</td>
                            <td className="text-truncate" title={payment.paymentMode || '-'}>{payment.paymentMode || '-'}</td>
                            <td className="text-truncate" title={payment.transactionId || '-'}>{payment.transactionId || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                    <span className="small text-secondary">Page {paymentHistoryPage} of {paymentHistoryPages}</span>
                    {paymentHistoryPages > 1 && (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" type="button" disabled={paymentHistoryPage <= 1} onClick={() => setPaymentHistoryPage(paymentHistoryPage - 1)}>Previous</button>
                        <button className="btn btn-outline-secondary" type="button" disabled={paymentHistoryPage >= paymentHistoryPages} onClick={() => setPaymentHistoryPage(paymentHistoryPage + 1)}>Next</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>


          </>
        )}
      </Drawer>

    </>
  );
};
