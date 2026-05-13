const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAdminToken() {
  return localStorage.getItem('azzabi_admin_token');
}

function getUserToken() {
  return localStorage.getItem('azzabi_user_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const adminToken = getAdminToken();
  const userToken = getUserToken();
  const token = adminToken || userToken;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || 'Erreur');
  }
  return res.json();
}

async function userRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getUserToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || 'Erreur');
  }
  return res.json();
}

export const api = {
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
      return request(`/products${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/products/${id}`),
  },
  orders: {
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list:   ()     => request('/orders'),
  },
  appointments: {
    create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    list:   ()     => request('/appointments'),
  },
  auth: {
    login:        (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me:           () => request('/auth/me'),
    userRegister: (name, email, password) => userRequest('/auth/user/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    userLogin:    (email, password)       => userRequest('/auth/user/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
    userMe:       () => userRequest('/auth/user/me'),
  },
  user: {
    orders:       () => userRequest('/users/me/orders'),
    appointments: () => userRequest('/users/me/appointments'),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    products: {
      list:    ()           => request('/admin/products'),
      create:  (data)       => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
      update:  (id, data)   => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete:  (id)         => request(`/admin/products/${id}`, { method: 'DELETE' }),
    },
    orders: {
      list:       ()            => request('/admin/orders'),
      setStatus:  (ref, status) => request(`/admin/orders/${ref}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    },
    appointments: {
      list:       ()            => request('/admin/appointments'),
      setStatus:  (ref, status) => request(`/admin/appointments/${ref}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    },
    sync: {
      woocommerce: () => request('/admin/sync/woocommerce', { method: 'POST' }),
    },
  },
};

export function saveToken(token)     { localStorage.setItem('azzabi_admin_token', token); }
export function clearToken()         { localStorage.removeItem('azzabi_admin_token'); }
export function saveUserToken(token) { localStorage.setItem('azzabi_user_token', token); }
export function clearUserToken()     { localStorage.removeItem('azzabi_user_token'); }
export { getUserToken };
