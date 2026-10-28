<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
<template>
  <main style="max-width:640px;margin:80px auto;padding:24px">
    <h1>{{ route.query.reason === 'login' ? 'Vui lòng đăng nhập' : 'Không thể truy cập gian hàng' }}</h1>
    <p>Khu vực này dành cho tài khoản VENDOR hoặc OWNER đã có gian hàng.</p>
    <p v-if="route.query.reason !== 'login'">Vui lòng kiểm tra quyền tài khoản, gian hàng và kết nối máy chủ.</p>
    <a href="/">Về trang chủ</a>
  </main>
</template>
