<template>
  <header class="bg-white border-bottom sticky-top">
    <div class="container d-flex justify-content-between align-items-center py-3">
      <!-- Logo Clarity -->
      <router-link to="/" class="d-flex align-items-center gap-2 text-decoration-none">
        <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded"
             style="width: 38px; height: 38px; font-weight: bold; font-size: 20px;">
          C
        </div>
        <div class="d-flex flex-column lh-1">
          <span class="fw-bold text-primary" style="font-size: 1.3rem; letter-spacing: 0.5px;">Clarity</span>
          <span class="text-accent" style="font-size: 10px; letter-spacing: 1px; font-weight: 700; margin-top: 2px;">CHO THUÊ COSPLAY</span>
        </div>
      </router-link>

      <!-- Navigation Menu -->
      <nav class="d-none d-md-flex gap-4">
        <router-link to="/" class="text-decoration-none fw-bold pb-1 text-primary" style="border-bottom: 2px solid var(--bs-primary);">Trang chủ</router-link>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Khám phá đồ</a>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Hướng dẫn thuê</a>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Chính sách</a>
      </nav>

      <!-- Action Buttons -->
      <div class="d-flex gap-3 align-items-center">
        <template v-if="!authStore.isAuthenticated">
          <router-link to="/auth/login" class="btn btn-outline-primary fw-semibold px-4 rounded-pill d-inline-flex align-items-center justify-content-center" style="height: 40px;">
            Đăng nhập
          </router-link>
          <router-link to="/auth/register" class="btn btn-secondary text-white fw-semibold px-4 rounded-pill d-inline-flex align-items-center justify-content-center" style="height: 40px;">
            Đăng ký
          </router-link>
        </template>
        <template v-else>
          <div class="d-flex align-items-center gap-2">
            <div class="d-flex justify-content-center align-items-center text-white bg-primary rounded-circle" style="width: 36px; height: 36px; font-weight: bold;">
              {{ authStore.user?.fullName?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <span class="fw-semibold text-primary small d-none d-sm-inline">{{ authStore.user?.fullName }}</span>
          </div>
          <button @click="handleLogout" class="btn btn-sm btn-outline-danger rounded-pill px-3">
            Đăng xuất
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.menu-link:hover {
  color: var(--bs-accent) !important;
}
</style>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push('/auth/login');
};
</script>