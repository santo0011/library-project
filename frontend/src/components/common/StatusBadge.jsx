export const StatusBadge = ({ status }) => {
  const styles = {
    active: "text-bg-success",
    inactive: "text-bg-secondary",
    invited: "text-bg-warning",
    published: "text-bg-success",
    draft: "text-bg-warning",
    archived: "text-bg-danger",
  };

  const formattedStatus =
    status?.charAt(0).toUpperCase() + status?.slice(1);

  return (
    <span className={`badge ${styles[status] || "text-bg-secondary"}`}>
      {formattedStatus}
    </span>
  );
};