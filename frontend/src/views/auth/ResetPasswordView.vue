<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-bg py-5">
    <div class="card border-0 shadow-sm p-4 rounded-4" style="max-width: 420px; width: 100%;">
      <div class="text-center mb-4">
        <router-link to="/" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
          <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded" style="width: 36px; height: 36px; font-weight: bold;">C</div>
          <span class="fw-bold fs-4 text-primary">Clarity</span>
        </router-link>
        <h4 class="fw-bold text-primary mb-1">Đặt lại mật khẩu</h4>
        <p class="text-muted small">
          Nhập mã OTP vừa gửi đến email:<br />
          <strong class="text-primary">{{ authStore.pendingEmail }}</strong>
        </p>
      </div>

      <div v-if="authStore.errorMessage || passwordMismatch" class="alert alert-danger py-2 small" role="alert">
        {{ passwordMismatch ? 'Mật khẩu xác nhận không khớp!' : authStore.errorMessage }}
      </div>

      <form @submit.prevent="handleResetPassword">
        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Mã OTP (6 chữ số)</label>
          <input
              v-model="form.otp"
              type="text"
              maxlength="6"
              class="form-control text-center fw-bold letter-spacing-1"
              placeholder="000000"
              required
          />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold text-primary">Mật khẩu mới</label>
          <input v-model="form.newPassword" type="password" class="form-control" placeholder="••••••••" minlength="6" required />
        </div>

        <div class="mb-4">
          <label class="form-label small fw-semibold text-primary">Xác nhận mật khẩu mới</label>
          <input v-model="form.confirmPassword" type="password" class="form-control" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold mb-3" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
          Đổi mật khẩu
        </button>
      </form>

      <div class="text-center text-muted small">
        Quay lại
        <router-link to="/auth/login" class="text-primary fw-semibold text-decoration-none">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.letter-spacing-1 {
  letter-spacing: 4px;
  font-size: 20px;
}
</style>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  otp: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordMismatch = ref(false);

onMounted(() => {
  if (!authStore.pendingEmail) {
    router.push('/auth/forgot-password');
  }
});

const handleResetPassword = async () => {
  if (form.newPassword !== form.confirmPassword) {
    passwordMismatch.value = true;
    return;
  }
  passwordMismatch.value = false;

  try {
    await authStore.resetPassword({
      email: authStore.pendingEmail,
      otp: form.otp,
      newPassword: form.newPassword,
    });
    alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
    router.push('/auth/login');
  } catch (err) {
    // Đã lưu lỗi trong authStore.errorMessage
  }
};
</script>