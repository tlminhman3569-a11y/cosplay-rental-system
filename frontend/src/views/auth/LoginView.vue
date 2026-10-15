<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-bg py-5">
    <div class="card border-0 shadow-sm p-4 rounded-4" style="max-width: 420px; width: 100%;">
      <div class="text-center mb-4">
        <router-link to="/" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
          <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded" style="width: 36px; height: 36px; font-weight: bold;">C</div>
          <span class="fw-bold fs-4 text-primary">Clarity</span>
        </router-link>
        <h4 class="fw-bold text-primary mb-1">Đăng nhập</h4>
        <p class="text-muted small">Chào mừng bạn quay trở lại với Clarity</p>
      </div>

      <div v-if="authStore.errorMessage" class="alert alert-danger py-2 small" role="alert">
        {{ authStore.errorMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Email</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="name@example.com" required />
        </div>

        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <label class="form-label small fw-semibold text-primary mb-0">Mật khẩu</label>
            <a href="#" class="small text-muted text-decoration-none">Quên mật khẩu?</a>
          </div>
          <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold mb-3" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
          Đăng nhập
        </button>
      </form>

      <div class="text-center text-muted small">
        Chưa có tài khoản?
        <router-link to="/auth/register" class="text-primary fw-semibold text-decoration-none">Đăng ký ngay</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await authStore.login(form);
    router.push('/');
  } catch (err) {
    // Đã lưu lỗi trong authStore.errorMessage
  }
};
</script>