<script setup>
import BoLayout from './BoLayout.vue'
defineProps({ active: String, footer: { type: Boolean, default: true }, narrow: Boolean, flush: Boolean })
</script>
<template>
 <BoLayout public-page>
  <header class="hd"><RouterLink :to="{ name: 'Home' }" class="logo"><i>C</i><div>Clarity<small>CHO THUÊ COSPLAY</small></div></RouterLink><span class="role">ĐĂNG KÝ CHỦ CHO THUÊ</span></header>
  <div class="page-wrap"><main class="main" :class="{ narrow }"><slot /></main></div>
  <footer v-if="footer" class="ft"><div class="logo"><i>C</i><div>Clarity<small>CHO THUÊ COSPLAY</small></div></div><div>Hướng dẫn thuê · Chính sách · Liên hệ hỗ trợ</div><div>© 2026 Clarity</div></footer>
 </BoLayout>
</template>
