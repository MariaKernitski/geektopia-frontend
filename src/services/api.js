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

// Conta inativada no meio da sessão: o servidor responde 403 com `inativa`. Sai do site e explica no login.
api.interceptors.response.use((r) => r, (erro) => {
  if (erro.response?.status === 403 && erro.response.data?.inativa && localStorage.getItem('@Geektopia:token')) {
    localStorage.removeItem('@Geektopia:token');
    localStorage.removeItem('@Geektopia:user');
    window.location.assign('/login?conta=inativa');
  }
  return Promise.reject(erro);
});

export default api;