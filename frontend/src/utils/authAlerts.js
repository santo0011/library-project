import { confirmAction, showToast } from './sweetAlerts.js';

export const showAuthToast = (icon, title) => {
  showToast(icon, title);
};

export const confirmLogout = () => confirmAction({
  title: 'Confirm Logout',
  text: 'Are you sure you want to logout?',
  confirmButtonText: 'Logout',
  confirmButtonColor: '#dc3545'
});
