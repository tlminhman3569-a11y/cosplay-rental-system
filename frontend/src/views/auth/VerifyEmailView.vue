<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light-bg py-5">
    <div class="card border-0 shadow-sm p-4 rounded-4 text-center" style="max-width: 420px; width: 100%;">
      <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 mx-auto" style="width: 56px; height: 56px;">
        <i class="bi bi-envelope-check fs-3"></i>
      </div>

      <h4 class="fw-bold text-primary mb-1">Xác nhận mã OTP</h4>
      <p class="text-muted small mb-3">
        Mã xác thực 6 chữ số đã được gửi đến email:<br />
        <strong class="text-primary">{{ authStore.pendingEmail }}</strong>
      </p>

      <div v-if="authStore.errorMessage" class="alert alert-danger py-2 small" role="alert">
        {{ authStore.errorMessage }}
      </div>

      <form @submit.prevent="handleVerify">
        <div class="mb-3">
          <input
              v-model="otp"
              type="text"
              maxlength="6"
              class="form-control form-control-lg text-center letter-spacing-2 fw-bold"
              placeholder="000000"
              required
          />
        </div>

        <div class="mb-3 small text-muted">
          Mã OTP có hiệu lực trong:
          <span class="fw-bold" :class="timer > 0 ? 'text-danger' : 'text-muted'">{{ formatTime(timer) }}</span>
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold mb-3" :disabled="authStore.loading || timer === 0">
          <span v-if="authStore.loading" class="spinner-border spinner-border-sm me-2"></span>
          Xác nhận
        </button>
      </form>

      <div class="text-center text-muted small">
        Chưa nhận được mã?
        <router-link to="/auth/register" class="text-primary fw-semibold text-decoration-none">Đăng ký lại</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.letter-spacing-2 {
  letter-spacing: 8px;
  font-size: 24px;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const otp = ref('');
const timer = ref(180); // 3 phút = 180s
let intervalId = null;

const startTimer = () => {
  timer.value = 180;
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (timer.value > 0) {
      timer.value--;
    } else {
      clearInterval(intervalId);
    }
  }, 1000);
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

onMounted(() => {
  if (!authStore.pendingEmail) {
    router.push('/auth/register');
    return;
  }
  startTimer();
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

const handleVerify = async () => {
  if (!otp.value || otp.value.length < 6) return;
  try {
    await authStore.verifyOtp(otp.value);
    alert('Xác thực tài khoản thành công!');
    router.push('/');
  } catch (err) {
    // Đã lưu lỗi trong authStore.errorMessage
  }
};
</script>