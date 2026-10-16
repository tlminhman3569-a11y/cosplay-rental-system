// backend/controllers/public/public.controller.js
const prisma = require('../../config/prisma');

// 1. Dữ liệu trang chủ
exports.getHomeFeeds = async (req, res) => {
    try {
        res.status(200).json({
            message: 'Lấy dữ liệu trang chủ thành công',
            featured: [],
            bestSellers: [],
            newest: [],
            shops: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

// 2. Tìm kiếm sản phẩm
exports.searchProducts = async (req, res) => {
    try {
        const { q, categoryId, size, minPrice, maxPrice, page = 1, limit = 9 } = req.query;
        res.status(200).json({
            message: 'Tìm kiếm sản phẩm thành công',
            total: 128,
            page: Number(page),
            products: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

// 3. Tìm kiếm gian hàng
exports.searchShops = async (req, res) => {
    try {
        const { q, sort, page = 1, limit = 10 } = req.query;
        res.status(200).json({
            message: 'Tìm kiếm gian hàng thành công',
            total: 14,
            page: Number(page),
            shops: []
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};