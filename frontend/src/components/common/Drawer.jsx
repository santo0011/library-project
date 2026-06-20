import { useEffect, useRef } from 'react';

export const Drawer = ({ show, title, children, onClose, width = '860px' }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show && onClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <>
      <div
        className={`drawer-overlay ${show ? 'drawer-overlay--visible' : ''}`}
        onClick={handleBackdropClick}
      />
      <div className={`drawer-container ${show ? 'drawer-container--visible' : ''}`} ref={drawerRef}>
        <div className="drawer-box" style={{ maxWidth: width }}>
          <div className="drawer-header">
            <h2 className="drawer-title">{title}</h2>
            {onClose && (
              <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
          <div className="drawer-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};