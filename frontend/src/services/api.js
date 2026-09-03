import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bidwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unified error extractor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred. Please try again.';
    
    // Auto logout if 401 token invalid
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('bidwise_token');
      localStorage.removeItem('bidwise_user');
      // Redirect to login if expired
      window.location.href = '/login';
    }

    return Promise.reject(new Error(message));
  }
);

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  seedDemo: () => api.post('/demo/seed')
};

// Company Profile Services
export const companyService = {
  getProfile: () => api.get('/company'),
  updateProfile: (data) => api.put('/company', data),
  uploadDocument: (formData) => api.post('/company/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDocument: (docId) => api.delete(`/company/documents/${docId}`)
};

// Tender Services
export const tenderService = {
  getAll: (params) => api.get('/tenders', { params }),
  getById: (id) => api.get(`/tenders/${id}`),
  upload: (formData, onProgress) => api.post('/tenders/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  }),
  delete: (id) => api.delete(`/tenders/${id}`),
  processTender: (id) => api.post(`/tenders/${id}/process`),
  getStatus: (id) => api.get(`/tenders/${id}/status`)
};

// Analysis Services
export const analysisService = {
  getFull: (tenderId) => api.get(`/tenders/${tenderId}/analysis`),
  getRequirements: (tenderId) => api.get(`/tenders/${tenderId}/analysis/requirements`),
  getMatching: (tenderId) => api.get(`/tenders/${tenderId}/analysis/matching`),
  getRisks: (tenderId) => api.get(`/tenders/${tenderId}/analysis/risks`),
  getDecision: (tenderId) => api.get(`/tenders/${tenderId}/analysis/decision`),
  getReport: (tenderId) => api.get(`/tenders/${tenderId}/analysis/report`)
};

// Chat Services
export const chatService = {
  ask: (tenderId, question) => api.post(`/tenders/${tenderId}/chat`, { question }),
  getHistory: (tenderId) => api.get(`/tenders/${tenderId}/chat`),
  clearHistory: (tenderId) => api.delete(`/tenders/${tenderId}/chat`)
};

// Machine Learning Services
export const mlService = {
  getStatus: () => api.get('/ml/status'),
  predict: (tenderId, companyId) => api.post('/ml/predict', { tenderId, companyId }),
  train: (options) => api.post('/ml/train', options)
};

export default api;
