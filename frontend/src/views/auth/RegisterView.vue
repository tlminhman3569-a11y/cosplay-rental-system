<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-bg py-5">
    <div class="card border-0 shadow-sm p-4 rounded-4" style="max-width: 420px; width: 100%;">
      <div class="text-center mb-4">
        <router-link to="/" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
          <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded" style="width: 36px; height: 36px; font-weight: bold;">C</div>
          <span class="fw-bold fs-4 text-primary">Clarity</span>
        </router-link>
        <h4 class="fw-bold text-primary mb-1">Tạo tài khoản mới</h4>
        <p class="text-muted small">Bắt đầu trải nghiệm thuê và cho thuê cosplay</p>
      </div>

      <div v-if="authStore.errorMessage || passwordMismatch" class="alert alert-danger py-2 small" role="alert">
        {{ passwordMismatch ? 'Mật khẩu xác nhận không khớp!' : authStore.errorMessage }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Họ và tên</label>
          <input v-model="form.fullName" type="text" class="form-control" placeholder="Nguyễn Văn A" required />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Email</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="name@example.com" required />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Mật khẩu</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" minlength="6" required />
        </div>

        <div class="mb-4">
          <label class="form-label small fw-semibold text-primary">Xác nhận mật khẩu</label>
          <input v-model="form.confirmPassword" type="password" class="form-control" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold mb-3" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
          Đăng ký
        </button>
      </form>

      <div class="text-center text-muted small">
        Đã có tài khoản?
        <router-link to="/auth/login" class="text-primary fw-semibold text-decoration-none">Đăng nhập ngay</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const passwordMismatch = ref(false);

const handleRegister = async () => {
  if (form.password !== form.confirmPassword) {
    passwordMismatch.value = true;
    return;
  }
  passwordMismatch.value = false;

  try {
    await authStore.register({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });
    router.push('/auth/verify-email');
  } catch (err) {
    // Đã lưu lỗi trong authStore.errorMessage
  }
};
</script>