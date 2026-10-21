// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';

const routes = [
    // ==========================================
    // 1. PUBLIC & CUSTOMER (Dùng MainLayout)
    // ==========================================
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'Home',
                // Trỏ về trang HomeView bạn đã làm ở bước trước
                component: () => import('../views/public/HomeView.vue')
            },
            // Team code Customer sẽ thêm route vào đây. Ví dụ:
            // { path: 'profile', component: () => import('../views/customer/ProfileView.vue') }
        ]
    },

    // ==========================================
    // 2. AUTHENTICATION (Không dùng layout chung)
    // ==========================================
    {
        path: '/auth',
        children: [
            // { path: 'login', component: () => import('../views/auth/LoginView.vue') },
            // { path: 'register', component: () => import('../views/auth/RegisterView.vue') },
        ]
    },

    // ==========================================
    // 3. VENDOR DASHBOARD (Chủ đồ)
    // ==========================================
    {
        path: '/vendor/dang-ky',
        component: MainLayout, // Trang đăng ký làm vendor thường dùng layout public (có header/footer)
        children: [
            {
                path: '',
                name: 'VendorDangKy',
                component: () => import('../views/vendor/DangKy.vue')
            }
        ]
    },
    {
        path: '/vendor',
        component: DashboardLayout, // Layout có sidebar bên trái cho Back Office
        children: [
            // Tự động chuyển hướng vào Tổng quan khi gõ /vendor
            {
                path: '',
                redirect: '/vendor/tong-quan'
            },
            // 1. Tổng quan
            {
                path: 'tong-quan',
                name: 'VendorTongQuan',
                component: () => import('../views/vendor/TongQuan.vue')
            },
            // 2. Quản lý Sản phẩm
            {
                path: 'san-pham',
                name: 'VendorSanPham',
                component: () => import('../views/vendor/SanPham.vue')
            },
            {
                path: 'san-pham/dang', // Dùng chung cho cả Thêm mới và Sửa (thông qua query ?id=)
                name: 'VendorDangSanPham',
                component: () => import('../views/vendor/DangSP.vue')
            },
            // 3. Kho hàng
            {
                path: 'kho-hang',
                name: 'VendorKhoHang',
                component: () => import('../views/vendor/Kho.vue')
            },
            // 4. Lịch cho thuê
            {
                path: 'lich-thue',
                name: 'VendorLichThue',
                component: () => import('../views/vendor/Lich.vue')
            },
            // 5. Yêu cầu thuê
            {
                path: 'yeu-cau-thue',
                name: 'VendorYeuCauThue',
                component: () => import('../views/vendor/YeuCau.vue')
            },
            // 6. Đơn thuê
            {
                path: 'don-thue',
                name: 'VendorDonThue',
                component: () => import('../views/vendor/Don.vue')
            },
            {
                path: 'don-thue/chi-tiet', // Dùng query ?code=ORD-...
                name: 'VendorChiTietDon',
                component: () => import('../views/vendor/DonChiTiet.vue')
            },
            // 7. Theo dõi trả đồ
            {
                path: 'tra-do',
                name: 'VendorTraDo',
                component: () => import('../views/vendor/TraDo.vue')
            },
            // 8. Doanh thu & Rút tiền
            {
                path: 'rut-tien',
                name: 'VendorRutTien',
                component: () => import('../views/vendor/RutTien.vue')
            },
            // 9. Tin nhắn
            {
                path: 'tin-nhan',
                name: 'VendorTinNhan',
                component: () => import('../views/vendor/TinNhan.vue')
            },
            // 10. Tranh chấp
            {
                path: 'tranh-chap',
                name: 'VendorTranhChap',
                component: () => import('../views/vendor/TranhChap.vue')
            },
            // 11. Đánh giá
            {
                path: 'danh-gia',
                name: 'VendorDanhGia',
                component: () => import('../views/vendor/DanhGia.vue')
            },
            // 12. Hồ sơ Shop
            {
                path: 'ho-so',
                name: 'VendorHoSo',
                component: () => import('../views/vendor/HoSo.vue')
            },
            // 13. Thống kê
            {
                path: 'thong-ke',
                name: 'VendorThongKe',
                component: () => import('../views/vendor/ThongKe.vue')
            }
        ]
    },

    // ==========================================
    // 4. ADMIN & STAFF DASHBOARD
    // ==========================================
    {
        path: '/admin',
        component: DashboardLayout,
        children: [
            // { path: 'users', component: () => import('../views/admin/ManageUsers.vue') },
        ]
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    // Cấu hình khi chuyển route thì cuộn lên đầu trang
    scrollBehavior() {
        return { top: 0 };
    }
});

export default router;