const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
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
    list: () => request('/orders'),
  },
  appointments: {
    create: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request('/appointments'),
  },
};
