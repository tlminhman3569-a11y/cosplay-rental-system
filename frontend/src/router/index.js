// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import { useAuthStore } from '../store/auth';

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
            // Route tìm kiếm sản phẩm cosplay
            {
                path: 'search',
                name: 'Search',
                component: () => import('../views/public/SearchView.vue')
            },
            //  Route tìm kiếm gian hàng / chủ đồ
            {
                path: 'shops',
                name: 'ShopSearch',
                component: () => import('../views/public/ShopSearchView.vue')
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
            {
                path: 'login',
                name: 'Login',
                component: () => import('../views/auth/LoginView.vue')
            },
            {
                path: 'register',
                name: 'Register',
                component: () => import('../views/auth/RegisterView.vue')
            },
            {
                path: 'verify-email',
                name: 'VerifyEmail',
                component: () => import('../views/auth/VerifyEmailView.vue')
            },
            {
                path: 'forgot-password',
                name: 'ForgotPassword',
                component: () => import('../views/auth/ForgotPasswordView.vue')
            },
            {
                path: 'reset-password',
                name: 'ResetPassword',
                component: () => import('../views/auth/ResetPasswordView.vue')
            },
        ]
    },

    // ==========================================
    // 3. VENDOR DASHBOARD (Chủ đồ)
    // ==========================================
    {
        path: '/vendor',
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
            // { path: 'dashboard', component: () => import('../views/vendor/VendorDashboard.vue') },
            // { path: 'products', component: () => import('../views/vendor/ManageProducts.vue') },
        ]
    },

    // ==========================================
    // 4. ADMIN & STAFF DASHBOARD
    // ==========================================
    {
        path: '/admin',
        component: DashboardLayout,
        meta: { requiresAuth: true },
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

// Guard chặn truy cập nếu chưa đăng nhập
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/auth/login');
    } else {
        next();
    }
});

export default router;