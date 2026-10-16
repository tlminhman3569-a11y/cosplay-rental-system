<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-bg py-5">
    <div class="card border-0 shadow-sm p-4 rounded-4" style="max-width: 420px; width: 100%;">
      <div class="text-center mb-4">
        <router-link to="/" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
          <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded" style="width: 36px; height: 36px; font-weight: bold;">C</div>
          <span class="fw-bold fs-4 text-primary">Clarity</span>
        </router-link>
        <h4 class="fw-bold text-primary mb-1">Quên mật khẩu</h4>
        <p class="text-muted small">Nhập email đăng ký để nhận mã khôi phục mật khẩu</p>
      </div>

      <div v-if="successMessage" class="alert alert-success py-2 small" role="alert">
        {{ successMessage }}
      </div>

      <div v-if="authStore.errorMessage" class="alert alert-danger py-2 small" role="alert">
        {{ authStore.errorMessage }}
      </div>

      <form @submit.prevent="handleForgotPassword">
        <div class="mb-4">
          <label class="form-label small fw-semibold text-primary">Email tài khoản</label>
          <input v-model="email" type="email" class="form-control" placeholder="name@example.com" required />
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold mb-3" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
          Gửi yêu cầu khôi phục
        </button>
      </form>

      <div class="text-center text-muted small">
        Quay lại
        <router-link to="/auth/login" class="text-primary fw-semibold text-decoration-none">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../store/auth';
import {useRouter} from "vue-router";

const authStore = useAuthStore();
const email = ref('');
const successMessage = ref('');
const router = useRouter();

const handleForgotPassword = async () => {
  successMessage.value = '';
  try {
    // Gọi action khôi phục mật khẩu trong store
    await authStore.forgotPassword({ email: email.value });

    // Lưu email khôi phục và chuyển hướng sang trang đặt lại mật khẩu sau 1s
    authStore.pendingEmail = email.value;
    localStorage.setItem('pendingEmail', email.value);

    successMessage.value = 'Mã khôi phục đã được gửi! Đang chuyển hướng...';
    setTimeout(() => {
      router.push('/auth/reset-password');
    }, 1200);
  } catch (err) {
    // Lỗi đã tự lưu trong authStore.errorMessage
  }
};
</script>