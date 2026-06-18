import { useAuth } from './useAuth.js';

export const usePermission = (permission) => {
  const { user } = useAuth();
  return Boolean(user?.permissions?.includes(permission));
};
