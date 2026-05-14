import axios from 'axios';

const STORAGE_KEY = 'safetyzone_user';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id;
        config.headers['X-User-Role'] = user.role || 'Unknown';
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

export default apiClient;
