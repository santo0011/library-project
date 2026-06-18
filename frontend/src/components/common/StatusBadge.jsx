export const StatusBadge = ({ status }) => {
  const styles = {
    active: 'text-bg-success',
    inactive: 'text-bg-secondary',
    invited: 'text-bg-warning'
  };

  return <span className={`badge ${styles[status] || 'text-bg-secondary'}`}>{status}</span>;
};
