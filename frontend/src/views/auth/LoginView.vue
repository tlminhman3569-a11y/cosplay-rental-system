<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Đăng Nhập</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required placeholder="nhap@email.com" />
        </div>
        <div class="form-group">
          <label>Mật khẩu</label>
          <input v-model="form.password" type="password" required placeholder="••••••••" />
        </div>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>

      <div class="auth-footer">
        <router-link to="/auth/forgot-password">Quên mật khẩu?</router-link>
        <span> | </span>
        <router-link to="/auth/register">Đăng ký tài khoản</router-link>
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

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(form);
    router.push('/');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đăng nhập thất bại.';
  } finally {
    loading.value = false;
  }
};
</script>