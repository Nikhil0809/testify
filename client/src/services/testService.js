import api from './api';

export const getDashboard = () => api.get('/tests/dashboard').then((r) => r.data);
export const startTest = () => api.post('/tests/start').then((r) => r.data);
export const getActiveTest = () => api.get('/tests/active').then((r) => r.data);
export const saveAnswers = (id, answers) =>
  api.put(`/tests/${id}/answers`, { answers }).then((r) => r.data);
export const submitTest = (id, answers) =>
  api.post(`/tests/${id}/submit`, { answers }).then((r) => r.data);
export const getResult = (id) => api.get(`/tests/${id}/result`).then((r) => r.data);
export const getHistory = (params) =>
  api.get('/tests/history', { params }).then((r) => r.data);
