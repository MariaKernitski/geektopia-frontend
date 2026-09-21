import axios from 'axios';

const api = axios.create({
  // Endereço da API: definido por ambiente (VITE_API_URL no .env do front). Sem ele, usa o backend local.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Geektopia:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;