import axios from 'axios'
const api = axios.create({ baseURL: 'http://localhost:3000/api/vendor' })

// Gắn token tự động
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const vendorService = {
  // Sản phẩm
  getProducts: () => api.get('/products'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Đơn hàng & Doanh thu
  getOrders: () => api.get('/orders'),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  getRevenue: () => api.get('/orders/revenue')
}