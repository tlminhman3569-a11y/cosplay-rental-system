import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../services/axios';

export const useAuthStore = defineStore('auth', () => {
    // --- STATE ---
    const user = ref(JSON.parse(localStorage.getItem('user')) || null);
    const token = ref(localStorage.getItem('token') || ''); // Giữ nguyên key 'token' giống code gốc của bạn
    const pendingEmail = ref(localStorage.getItem('pendingEmail') || ''); // Đã bổ sung lưu localStorage để tránh mất email khi F5
    const loading = ref(false);
    const errorMessage = ref('');

    // --- GETTERS ---
    const isAuthenticated = computed(() => !!token.value);
    const userRole = computed(() => user.value?.roleId || null); // Tính năng mới AI gợi ý (Lấy quyền user)

    // --- ACTIONS ---

    // Helper lưu trạng thái đăng nhập
    function setAuthData(userData, tokenValue) {
        user.value = userData;
        token.value = tokenValue;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', tokenValue);
    }

    // 1. Gửi thông tin đăng ký -> Nhận OTP
    async function register(payload) {
        loading.value = true;
        errorMessage.value = '';
        try {
            // Lưu ý: Đổi lại endpoint thành '/auth/register' hoặc '/api/auth/register' tùy thuộc vào Backend của bạn
            const response = await apiClient.post('/api/auth/register', payload);

            pendingEmail.value = payload.email;
            localStorage.setItem('pendingEmail', payload.email);
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    // 2. Xác nhận OTP
    async function verifyOtp(otp) {
        loading.value = true;
        errorMessage.value = '';
        try {
            const response = await apiClient.post('/api/auth/verify-otp', {
                email: pendingEmail.value,
                otp,
            });

            // response đã là data từ Backend (không gọi response.data)
            if (response.token && response.user) {
                setAuthData(response.user, response.token);
                pendingEmail.value = '';
                localStorage.removeItem('pendingEmail');
            }
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    // 3. Đăng nhập
    async function login(credentials) {
        loading.value = true;
        errorMessage.value = '';
        try {
            const response = await apiClient.post('/api/auth/login', credentials);
            if (response.token && response.user) {
                setAuthData(response.user, response.token);
            }
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    // 4. Đăng nhập bằng google
    async function googleLogin(googlePayload) {
        loading.value = true;
        errorMessage.value = '';
        try {
            const response = await apiClient.post('/api/auth/google', googlePayload);
            if (response.token && response.user) {
                setAuthData(response.user, response.token);
            }
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Đăng nhập bằng Google thất bại!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    // 5. Quên mật khẩu
    async function forgotPassword(payload) {
        loading.value = true;
        errorMessage.value = '';
        try {
            const response = await apiClient.post('/api/auth/forgot-password', payload);
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Yêu cầu thất bại. Vui lòng thử lại!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    //  6. Action Đặt lại mật khẩu mới
    async function resetPassword(payload) {
        loading.value = true;
        errorMessage.value = '';
        try {
            const response = await apiClient.post('/api/auth/reset-password', payload);
            pendingEmail.value = '';
            localStorage.removeItem('pendingEmail');
            return response;
        } catch (error) {
            errorMessage.value = error.response?.data?.message || 'Đặt lại mật khẩu thất bại!';
            throw error;
        } finally {
            loading.value = false;
        }
    }

    // 7. Đăng xuất
    function logout() {
        user.value = null;
        token.value = '';
        pendingEmail.value = '';
        errorMessage.value = '';
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('pendingEmail');
    }

    return {
        user,
        token,
        pendingEmail,
        loading,
        errorMessage,
        isAuthenticated,
        userRole,
        register,
        verifyOtp,
        login,
        googleLogin,
        forgotPassword,
        resetPassword,
        logout,
    };
});
