import { useEffect, useRef } from 'react';

export const Modal = ({ show, title, children, footer, onClose, size = 'md' }) => {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show && onClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current && onClose) onClose();
  };

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <>
      <div className="modal-overlay" ref={backdropRef} onClick={handleBackdropClick} />
      <div className="modal-container">
        <div className={`modal-box ${sizeClass}`}>
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {onClose && (
              <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
          <div className="modal-body">
            {children}
          </div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </>
  );
};