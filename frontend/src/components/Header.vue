<template>
  <header class="bg-white border-bottom sticky-top">
    <div class="container d-flex justify-content-between align-items-center py-3">
      <!-- Logo Clarity -->
      <div class="d-flex align-items-center gap-2 text-decoration-none" style="cursor: pointer;">
        <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded"
             style="width: 38px; height: 38px; font-weight: bold; font-size: 20px;">
          C
        </div>
        <div class="d-flex flex-column lh-1">
          <span class="fw-bold text-primary" style="font-size: 1.3rem; letter-spacing: 0.5px;">Clarity</span>
          <span class="text-accent" style="font-size: 10px; letter-spacing: 1px; font-weight: 700; margin-top: 2px;">CHO THUÊ COSPLAY</span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="d-none d-md-flex gap-4">
        <a href="#" class="text-decoration-none fw-bold pb-1 text-primary" style="border-bottom: 2px solid var(--bs-primary);">Trang chủ</a>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Khám phá đồ</a>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Hướng dẫn thuê</a>
        <a href="#" class="text-decoration-none pb-1 menu-link text-dark">Chính sách</a>
      </nav>

      <!-- Action Buttons -->
      <div class="d-flex gap-3">
        <!-- Đã thêm flexbox và height cố định (40px) để ép chữ nằm chính giữa theo chiều dọc -->
        <button class="btn btn-outline-primary fw-semibold px-4 rounded-pill d-inline-flex align-items-center justify-content-center"
                style="height: 40px;">Đăng nhập</button>
        <button class="btn btn-secondary text-white fw-semibold px-4 rounded-pill d-inline-flex align-items-center justify-content-center"
                style="height: 40px;">Đăng ký</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.menu-link:hover {
  color: var(--bs-accent) !important;
}
</style>