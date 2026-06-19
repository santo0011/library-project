import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const showToast = (icon, title) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    backdrop: false,
    heightAuto: false,
    scrollbarPadding: false,
    showClass: {
      popup: 'swal2-show'
    },
    hideClass: {
      popup: 'swal2-hide'
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    willClose: (toast) => {
      toast.removeEventListener('mouseenter', Swal.stopTimer);
      toast.removeEventListener('mouseleave', Swal.resumeTimer);
    }
  });
};

export const confirmAction = ({
  title,
  text,
  confirmButtonText,
  confirmButtonColor = '#dc3545'
}) => Swal.fire({
  title,
  text,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText,
  cancelButtonText: 'Cancel',
  confirmButtonColor,
  reverseButtons: true,
  focusCancel: true
});
