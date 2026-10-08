<!-- src/layouts/MainLayout.vue -->
<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <Header />

    <!-- Phần ruột thay đổi theo từng trang -->
    <main class="flex-grow-1">
      <router-view />
    </main>

    <Footer />
  </div>
</template>