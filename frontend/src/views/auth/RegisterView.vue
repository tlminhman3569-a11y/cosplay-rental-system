<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Đăng Ký Tài Khoản</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Họ và tên</label>
          <input v-model="form.fullName" type="text" required placeholder="Nguyễn Văn A" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required placeholder="nhap@email.com" />
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input v-model="form.password" type="password" required minlength="6" placeholder="Tối thiểu 6 ký tự" />
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Đang gửi mã OTP...' : 'Tiếp tục' }}
        </button>
      </form>

      <div class="auth-footer">
        <router-link to="/auth/login">Đã có tài khoản? Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({ fullName: '', email: '', password: '' });
const loading = ref(false);
const errorMessage = ref('');

const handleRegister = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await authStore.register(form);
    // Chuyển sang màn hình nhập OTP
    router.push('/auth/verify-email');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đăng ký thất bại.';
  } finally {
    loading.value = false;
  }
};
</script>