import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Optional: handle success messages if backend provides them
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      // Only show toast if it's not the login page to avoid double toasts on initial load
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please login again. 🔑');
      }
    } else {
      const message = error.response?.data?.detail || '😓 Something went wrong. Please try again.';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
