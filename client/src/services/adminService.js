import api from './api';

export const listQuestions = (params) =>
  api.get('/admin/questions', { params }).then((r) => r.data);
export const createQuestion = (data) =>
  api.post('/admin/questions', data).then((r) => r.data);
export const updateQuestion = (id, data) =>
  api.put(`/admin/questions/${id}`, data).then((r) => r.data);
export const deleteQuestion = (id) =>
  api.delete(`/admin/questions/${id}`).then((r) => r.data);
export const listStudents = () => api.get('/admin/students').then((r) => r.data);
export const getStats = () => api.get('/admin/stats').then((r) => r.data);
