import { api } from './api.js';

export const examService = {
  async list(params = {}) {
    const { data } = await api.get('/exams', { params });
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/exams/${id}`);
    return data.data;
  },

  async create(payload) {
    const { data } = await api.post('/exams', payload);
    return data.data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/exams/${id}`, payload);
    return data.data;
  },

  async remove(id) {
    const { data } = await api.delete(`/exams/${id}`);
    return data;
  },

  async addQuestions(id, questionIds) {
    const { data } = await api.post(`/exams/${id}/questions`, { questionIds });
    return data.data;
  },

  async listQuestions(params = {}) {
    const { data } = await api.get('/exams/all/questions', { params });

    console.log("data", data)

    return data.data;
  },

  async createQuestion(payload) {

    const { data } = await api.post('/exams/all/questions', payload);
    return data.data;
  },

  async updateQuestion(id, payload) {
    const { data } = await api.put(`/exams/all/questions/${id}`, payload);
    return data.data;
  },

  async deleteQuestion(id) {
    const { data } = await api.delete(`/exams/all/questions/${id}`);
    return data;
  },

  async bulkImport(id, questions) {
    const { data } = await api.post(`/exams/${id}/questions/bulk`, { questions });
    return data.data;
  },

  async bulkDelete(id, questionIds) {
    const { data } = await api.post(`/exams/${id}/questions/bulk-delete`, { questionIds });
    return data;
  }
};
