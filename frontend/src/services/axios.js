// frontend/src/services/axios.js
import axios from 'axios';

// Khởi tạo một Axios instance với cấu hình mặc định
const apiClient = axios.create({
    baseURL: 'http://localhost:5000', // Port Backend
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Timeout 10s
});

// Interceptor cho Response: Xử lý lỗi tập trung
apiClient.interceptors.response.use(
    (response) => {
        // Trả về thẳng cục data từ backend để component không phải gọi .data.data
        return response.data;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                // Nếu hết hạn token hoặc chưa đăng nhập -> Chuyển về trang đăng nhập
                console.warn('Unauthorized! Đang chuyển hướng về trang đăng nhập...');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

// Interceptor tự động gắn Token vào Header
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default apiClient;