import api from './axious';

export const productApi = {
  list: (params) => api.get('/api/products', { params }),
  detail: (id) => api.get(`/api/products/${id}`),
  section: (name, params) => api.get(`/api/products/sections/${name}`, { params }),
};

export const cartApi = {
  get: () => api.get('/api/customer/cart/items'),
  create: (payload) => api.post('/api/customer/cart/items', payload),
  update: (id, payload) => api.patch(`/api/customer/cart/items/${id}`, payload),
  remove: (id) => api.delete(`/api/customer/cart/items/${id}`),
};

export const orderApi = {
  checkout: (payload) => api.post('/api/customer/checkouts', payload),
  list: (params) => api.get('/api/customer/orders', { params }),
  detail: (id) => api.get(`/api/customer/orders/${id}`),
};
