import axios from 'axios';
import { supabase } from '../config/supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  xsrfCookieName: 'csrf-token',
  xsrfHeaderName: 'X-CSRF-Token',
});

api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch (_e) {
      // Ignore token retrieval errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT retry auth verification or login endpoints to avoid infinite loops and duplicate requests
    if (!originalRequest || (originalRequest.url && originalRequest.url.includes('/auth/'))) {
      return Promise.reject(error);
    }

    // If 401 Unauthorized occurs on a data route and we haven't retried yet, attempt automatic refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.get('/auth/me');
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
