import { useNavigate } from 'react-router-dom';

export const PageHeader = ({ title, subtitle, action, back }) => {
  const navigate = useNavigate();
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div className="d-flex align-items-center gap-3">
        {back && <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => navigate(back)}><i className="bi bi-arrow-left" /></button>}
        <div>
          <h1 className="h4 fw-bold mb-1">{title}</h1>
          {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};
