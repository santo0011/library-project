import { api } from './api.js';

export const feeService = {
  async list(params) {
    const { data } = await api.get('/fees', { params });
    return data.data;
  },

  async getByStudent(studentId) {
    const { data } = await api.get(`/fees/students/${studentId}`);
    return data.data;
  },

  async getMine() {
    const { data } = await api.get('/fees/mine');
    return data.data;
  },

  async listFeeTypes(params) {
    const { data } = await api.get('/fees/types', { params });
    return data.data;
  },

  async createFeeType(payload) {
    const { data } = await api.post('/fees/types', payload);
    return data.data;
  },

  async updateFeeType(id, payload) {
    const { data } = await api.patch(`/fees/types/${id}`, payload);
    return data.data;
  },

  async deleteFeeType(id) {
    const { data } = await api.delete(`/fees/types/${id}`);
    return data.data;
  },

  async toggleFeeTypeStatus(id, isActive) {
    const { data } = await api.patch(`/fees/types/${id}/toggle-status`, { isActive });
    return data.data;
  },

  async bulkToggleFeeTypeStatus(ids, isActive) {
    const { data } = await api.post('/fees/types/bulk-toggle-status', { ids, isActive });
    return data.data;
  },

  async bulkAssign(payload) {
    const { data } = await api.post('/fees/assign', payload);
    return data.data;
  },

  async bulkRemove(payload) {
    const { data } = await api.post('/fees/remove', payload);
    return data.data;
  },

  async setTotalFee(studentId, totalFee) {
    const { data } = await api.patch(`/fees/students/${studentId}/total-fee`, { totalFee });
    return data.data;
  },

  async recordPayment(studentId, payload) {
    const { data } = await api.post(`/fees/students/${studentId}/payments`, payload);
    return data.data;
  }
};
