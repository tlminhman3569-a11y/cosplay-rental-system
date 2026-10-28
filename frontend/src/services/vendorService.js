import api from './axious'
// HTTP client của nhóm đã trả response.data.
const path = value => encodeURIComponent(String(value))
const get = (url, params) => api.get('/vendor' + url, { params })
export const vendorService = {
meta: () => get('/meta'), shop: () => get('/shop'), shopName: async () => (await get('/shop')).name, dashboard: () => get('/dashboard'),
products: status => get('/products', { status: status || 'ALL' }), product: id => get('/products/' + path(id)),
createProduct: body => api.post('/vendor/products', body), updateProduct: (id, body) => api.put('/vendor/products/' + path(id), body),
hideProduct: id => api.post('/vendor/products/' + path(id) + '/hide'), showProduct: id => api.post('/vendor/products/' + path(id) + '/show'), deleteProduct: id => api.delete('/vendor/products/' + path(id)),
orders: params => get('/orders', params), order: code => get('/orders/' + path(code)), requests: () => get('/requests'),
confirmRequest: code => api.post('/vendor/requests/' + path(code) + '/confirm'), rejectRequest: (code, reason) => api.post('/vendor/requests/' + path(code) + '/reject', { reason }),
revenue: () => get('/revenue'), stats: params => get('/stats', params),
}
