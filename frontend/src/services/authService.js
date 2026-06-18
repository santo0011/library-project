import { api } from './api.js';

export const authService = {
  async login(credentials) {
    const endpoint = credentials.portal === 'student' ? '/auth/student/login' : '/auth/admin/login';
    const { portal: _portal, identifier, email, password } = credentials;
    const payload = credentials.portal === 'student' 
      ? { identifier: identifier || email, password } 
      : { email, password };
    const { data } = await api.post(endpoint, payload);
    return data.data;
  },
  async refresh() {
    const { data } = await api.post('/auth/refresh');
    return data.data;
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
  async changePassword(payload) {
    const { data } = await api.post('/auth/change-password', payload);
    return data;
  },
  async logout() {
    await api.post('/auth/logout');
  }
};