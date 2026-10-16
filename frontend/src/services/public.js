// frontend/src/services/public.js
import apiClient from './axios';

export const publicService = {
    // API lấy dữ liệu trang chủ (Banners, Nổi bật, Bán chạy, Mới đăng)
    getHomeFeeds: async () => {
        return await apiClient.get('/api/public/home-feeds');
    },

    // API tìm kiếm sản phẩm cosplay có bộ lọc
    searchProducts: async (params) => {
        return await apiClient.get('/api/public/products/search', { params });
    },

    // API tìm kiếm gian hàng / chủ đồ
    searchShops: async (params) => {
        return await apiClient.get('/api/public/shops/search', { params });
    }
};