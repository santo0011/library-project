const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const cards = [
  { label: 'Total Fee', key: 'totalFee', icon: 'bi-wallet2', borderClass: 'stat-card-blue', iconBg: '#eef2ff', iconColor: '#4f46e5' },
  { label: 'Paid Amount', key: 'paidAmount', icon: 'bi-check-circle', borderClass: 'stat-card-green', iconBg: '#ecfdf5', iconColor: '#059669' },
  { label: 'Due Amount', key: 'dueAmount', icon: 'bi-exclamation-circle', borderClass: 'stat-card-red', iconBg: '#fef2f2', iconColor: '#dc2626' },
  { label: 'Payment Status', key: 'paymentStatus', icon: 'bi-receipt', borderClass: 'stat-card-amber', iconBg: '#fffbeb', iconColor: '#d97706' }
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
          <div className={`stat-card ${card.borderClass}`}>
            <div className="d-flex align-items-center gap-3">
              <div className="dashboard-stat-icon" style={{ background: card.iconBg, color: card.iconColor }}>
                <i className={`bi ${card.icon}`} />
              </div>
              <div>
                <div className="stat-value" style={{ color: card.iconColor }}>{getValue(card)}</div>
                <small className="stat-label">{card.label}</small>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};