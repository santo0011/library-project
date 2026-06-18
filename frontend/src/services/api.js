import axios from 'axios';
import { authStorage } from '../utils/authStorage.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
  withCredentials: true
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const token = authStorage.token();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefreshRequest = original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isRefreshRequest) {
      original._retry = true;
      try {
        refreshRequest ||= api.post('/auth/refresh').finally(() => {
          refreshRequest = null;
        });
        const { data } = await refreshRequest;
        authStorage.set(data.data);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        authStorage.clear();
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);
