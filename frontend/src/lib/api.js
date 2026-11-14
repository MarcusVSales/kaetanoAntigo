import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  withCredentials: true,
});

// ── Token helpers ─────────────────────────────────────────────────────────────
// Usa sessionStorage em vez de localStorage quando possível
// sessionStorage é limpo ao fechar o browser — menor janela de ataque XSS
const TOKEN_KEY = 'kaetano_token';

const getToken  = () => {
  if (typeof window === 'undefined') return null;
  // Tenta sessionStorage primeiro (mais seguro), depois localStorage como fallback
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
};

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  // Armazena em sessionStorage — expira ao fechar o browser
  sessionStorage.setItem(TOKEN_KEY, token);
  // Remove do localStorage se havia um antigo
  localStorage.removeItem(TOKEN_KEY);
};

export const removeToken = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

// ── Interceptor: adiciona token automaticamente ───────────────────────────────
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor: redireciona para login se token expirar ──────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    const isAdmin = typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login';

    if (err.response?.status === 401 && isAdmin) {
      removeToken();
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login:  (u, p) => api.post('/auth/login', { username: u, password: p }),
  verify: ()     => api.get('/auth/verify'),
  forgotPassword: email           => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post('/auth/reset-password', { token, password }),
};

// ── Visitas (só admin) ────────────────────────────────────────────────────────
export const analyticsAPI = {
  summary: days => api.get('/analytics/summary', { params: { days } }),
};

// ── Products API ──────────────────────────────────────────────────────────────
export const productsAPI = {
  list:        params       => api.get('/products', { params }),
  archive:     ()           => api.get('/products/archive'),
  categories:  ()           => api.get('/products/categories'),
  get:         id           => api.get(`/products/${id}`),
  adminList:   ()           => api.get('/products/admin/all'),
  create:      data         => api.post('/products', data),
  update:      (id, d)      => api.put(`/products/${id}`, d),
  remove:      id           => api.delete(`/products/${id}`),
  unmarkSold:  id           => api.put(`/products/${id}/unmark-sold`),
  uploadImages: (pid, files) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return api.post(`/products/${pid}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage:     (pid, iid)       => api.delete(`/products/${pid}/images/${iid}`),
  setPrimaryImage: (pid, iid)       => api.put(`/products/${pid}/images/${iid}/primary`),
  saveCrop:        (pid, iid, crop) => api.put(`/products/${pid}/images/${iid}/crop`, { crop_data: crop }),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const getImageUrl = filename =>
  filename ? `${API_URL}/uploads/${filename}` : '/images/placeholder.svg';

// Miniatura leve (640px, ~35 KB) criada no upload. Fotos antigas não têm miniatura:
// por isso o onError abaixo (useThumbFallback) volta para a foto original.
export const getThumbUrl = filename =>
  filename ? `${API_URL}/uploads/${filename.replace(/\.[^.]+$/, '')}-sm.webp` : '/images/placeholder.svg';

export const thumbFallback = (e, filename) => {
  const el = e.currentTarget;
  if (!el.dataset.fb && filename) { el.dataset.fb = '1'; el.src = getImageUrl(filename); }
  else el.src = '/images/placeholder.svg';
};

export const getWhatsAppLink = name => {
  const n = process.env.NEXT_PUBLIC_WHATSAPP || '5511965713610';
  // encodeURIComponent previne injeção na URL do WhatsApp
  return `https://wa.me/${n}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${name}`)}`;
};

export default api;
