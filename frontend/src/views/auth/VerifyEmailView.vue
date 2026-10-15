<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Xác Thực OTP</h2>
      <p class="subtitle">
        Mã OTP đã được gửi tới email: <b>{{ authStore.pendingEmail }}</b>
      </p>

      <form @submit.prevent="handleVerify">
        <div class="form-group">
          <input
              v-model="otp"
              type="text"
              maxlength="6"
              class="otp-input"
              placeholder="000000"
              required
          />
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Đang xác thực...' : 'Xác nhận OTP' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const otp = ref('');
const loading = ref(false);
const errorMessage = ref('');

onMounted(() => {
  // Nếu người dùng F5 hoặc chưa nhập form đăng ký mà vào thẳng link này -> chuyển về Đăng ký
  if (!authStore.pendingEmail) {
    router.push('/auth/register');
  }
});

const handleVerify = async () => {
  if (otp.value.length !== 6) {
    errorMessage.value = 'Mã OTP phải gồm 6 chữ số.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    await authStore.verifyOtp(otp.value);
    alert('Đăng ký tài khoản thành công!');
    router.push('/');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.';
  } finally {
    loading.value = false;
  }
};
</script>