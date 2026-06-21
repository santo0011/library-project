const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const cards = [
  { label: 'Total Fee', key: 'totalFee', icon: 'bi-wallet2', color: '#1565c0', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
  { label: 'Paid Amount', key: 'paidAmount', icon: 'bi-check-circle', color: '#2e7d32', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
  { label: 'Due Amount', key: 'dueAmount', icon: 'bi-exclamation-circle', color: '#c62828', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
  { label: 'Payment Status', key: 'paymentStatus', icon: 'bi-receipt', color: '#e65100', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }
];

export const FeeSummaryCards = ({ fee }) => {
  const getValue = (card) => {
    if (card.key === 'paymentStatus') return fee.paymentStatus || '-';
    return money(fee[card.key]);
  };

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-sm-6 col-xl-3" key={card.label}>
          <div className="card shadow border-0 h-100" style={{ borderRadius: 12, background: card.bg }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-white shadow-sm" style={{ width: 56, height: 56, minWidth: 56 }}>
                <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: 24 }} />
              </div>
              <div>
                <div className="fs-4 fw-bold" style={{ color: card.color }}>{getValue(card)}</div>
                <small className="fw-medium" style={{ color: card.color }}>{card.label}</small>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};