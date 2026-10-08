<!-- src/views/public/HomeView.vue -->
<template>
  <div class="container mt-4">
    <!-- Hero & Search Section (Khối màu nâu đậm to nhất) -->
    <section class="hero-section p-4 mb-4">
      <div class="d-flex justify-content-between mb-4">
        <div class="bg-light rounded" style="width: 150px; height: 12px;"></div>
        <div class="bg-secondary rounded" style="width: 200px; height: 100px;"></div>
      </div>

      <!-- Thanh tìm kiếm -->
      <div class="bg-white p-2 rounded d-flex gap-2">
        <div class="flex-grow-1 border-end"></div>
        <div class="flex-grow-1 border-end"></div>
        <button class="btn text-white rounded px-4" style="background-color: #7E6454;">Search</button>
      </div>
    </section>

    <!-- Thẻ Tag / Categories -->
    <section class="d-flex gap-2 mb-4 overflow-auto">
      <div v-for="i in 8" :key="'tag'+i" class="rounded-pill img-placeholder" style="width: 80px; height: 16px;"></div>
    </section>

    <!-- Grid Sản phẩm (4 cột) -->
    <section class="row g-4 mb-5">
      <div v-for="i in 8" :key="'product'+i" class="col-6 col-md-3">
        <div class="card h-100 border-0 shadow-sm">
          <!-- Ảnh sản phẩm -->
          <div class="img-placeholder" style="height: 180px;"></div>
          <!-- Thông tin dưới ảnh -->
          <div class="card-body bg-white">
            <div class="bg-secondary rounded mb-2" style="width: 50%; height: 8px;"></div>
            <div class="bg-secondary rounded" style="width: 30%; height: 8px;"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>