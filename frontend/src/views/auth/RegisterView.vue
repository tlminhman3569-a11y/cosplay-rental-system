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

      <!-- Nút Đăng ký nhanh bằng Google -->
      <div class="position-relative my-3 text-center">
        <hr class="text-muted" />
        <span class="position-absolute top-50 start-50 translate-middle bg-white px-2 small text-muted">Hoặc</span>
      </div>

      <div id="googleRegisterBtnContainer" class="w-100 mb-3"></div>
      <button type="button" @click="handleGoogleRegister" class="btn btn-outline-secondary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3" :disabled="authStore.loading">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Tiếp tục với Google
      </button>

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

/* global google */
const initGoogleSDK = () => {
  if (typeof google !== 'undefined' && google.accounts) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1052953258525-sample.apps.googleusercontent.com';

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await authStore.googleLogin({ idToken: response.credential });
          router.push('/');
        } catch (err) {
          // Lỗi hiển thị trong authStore.errorMessage
        }
      }
    });

    google.accounts.id.renderButton(
        document.getElementById('googleRegisterBtnContainer'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
    );
  }
};

onMounted(() => {
  setTimeout(initGoogleSDK, 500);
});

//  Hàm kích hoạt popup chọn tài khoản Google
const handleGoogleRegister = () => {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.prompt();
  } else {
    alert('Hệ thống đang tải Google SDK, vui lòng thử lại sau vài giây!');
  }
};
</script>