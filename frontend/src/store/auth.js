import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/services/axios';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(JSON.parse(localStorage.getItem('user')) || null);
    const token = ref(localStorage.getItem('token') || '');
    const pendingEmail = ref(''); // Lưu email tạm thời để chuyển qua màn OTP

    const isAuthenticated = computed(() => !!token.value);

    // 1. Gửi thông tin đăng ký -> Nhận OTP
    async function register(payload) {
        const response = await apiClient.post('/auth/register', payload);
        pendingEmail.value = payload.email;
        return response.data;
    }

    // 2. Xác nhận OTP
    async function verifyOtp(otp) {
        const response = await apiClient.post('/auth/verify-otp', {
            email: pendingEmail.value,
            otp,
        });
        setAuthData(response.data.user, response.data.token);
        return response.data;
    }

    // 3. Đăng nhập
    async function login(credentials) {
        const response = await apiClient.post('/auth/login', credentials);
        setAuthData(response.data.user, response.data.token);
        return response.data;
    }

    // Helper lưu trạng thái
    function setAuthData(userData, tokenValue) {
        user.value = userData;
        token.value = tokenValue;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', tokenValue);
    }

    // 4. Đăng xuất
    function logout() {
        user.value = null;
        token.value = '';
        pendingEmail.value = '';
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    return {
        user,
        token,
        pendingEmail,
        isAuthenticated,
        register,
        verifyOtp,
        login,
        logout,
    };
});