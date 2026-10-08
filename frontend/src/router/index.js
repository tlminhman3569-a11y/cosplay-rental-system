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
        path: '/vendor',
        component: DashboardLayout,
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