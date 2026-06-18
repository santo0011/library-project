import { AppRoutes } from './routes/AppRoutes.jsx';
import { ToastProvider } from './components/common/Toast.jsx';

export const App = () => (
  <ToastProvider>
    <AppRoutes />
  </ToastProvider>
);
