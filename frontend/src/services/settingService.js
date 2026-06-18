import { api } from './api.js';

export const settingService = {
  async list() {
    const { data } = await api.get('/settings');
    return data.data;
  },
  async update(key, payload) {
    const { data } = await api.patch(`/settings/${key}`, payload);
    return data.data;
  }
};
