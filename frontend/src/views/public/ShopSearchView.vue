<template>
  <div class="bg-light-bg min-vh-100 py-4">
    <div class="container">

      <!-- TOP SEARCH BAR & TAB TOGGLE -->
      <div class="bg-white p-3 rounded-4 shadow-sm mb-3">
        <div class="d-flex gap-2 mb-3">
          <input v-model="searchQuery" type="text" class="form-control form-control-lg border shadow-none" placeholder="cosplay" />
          <button @click="executeShopSearch" class="btn btn-primary px-4 fw-bold text-nowrap">Tìm</button>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/search" class="btn btn-outline-secondary rounded-pill px-3 py-1 text-nowrap small">Sản phẩm (128)</router-link>
          <button class="btn btn-primary rounded-pill px-3 py-1 text-nowrap small">Gian hàng (14)</button>
        </div>
      </div>

      <!-- BREADCRUMB & SORT FILTER PILLS -->
      <nav class="small text-muted mb-1">
        <router-link to="/" class="text-muted text-decoration-none">Trang chủ</router-link> > <span class="text-dark fw-semibold">Gian hàng</span>
      </nav>

      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <h4 class="fw-bold text-primary mb-0">14 gian hàng khớp "cosplay"</h4>

        <!-- Filter Pills -->
        <div class="d-flex align-items-center gap-2 overflow-auto pb-1">
          <span class="small text-muted text-nowrap">Sắp xếp:</span>
          <button class="btn btn-sm btn-primary rounded-pill px-3 text-nowrap">Liên quan nhất</button>
          <button class="btn btn-sm btn-outline-secondary bg-white border-0 text-dark rounded-pill px-3 text-nowrap">Đánh giá cao</button>
          <button class="btn btn-sm btn-outline-secondary bg-white border-0 text-dark rounded-pill px-3 text-nowrap">Nhiều sản phẩm</button>
          <button class="btn btn-sm btn-outline-secondary bg-white border-0 text-dark rounded-pill px-3 text-nowrap">Phản hồi nhanh</button>
        </div>
      </div>

      <!-- SHOP CARD LIST -->
      <div class="d-flex flex-column gap-3 mb-4">
        <div v-for="shop in shopResults" :key="shop.id" class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <div class="row align-items-center g-3">

            <!-- Left Info -->
            <div class="col-md-5 d-flex align-items-center gap-3">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5 flex-shrink-0" style="width: 56px; height: 56px;">
                {{ shop.avatar }}
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                  <h6 class="fw-bold text-primary mb-0 fs-5">{{ shop.name }}</h6>
                  <span v-if="shop.verified" class="badge bg-success-subtle text-success border border-success-subtle extra-small">Đã xác minh</span>
                </div>
                <div class="text-muted extra-small mb-1">{{ shop.owner }} · {{ shop.location }}</div>
                <div class="text-muted extra-small">
                  <i class="bi bi-star-fill text-warning me-1"></i>{{ shop.rating }} ({{ shop.reviewsCount }} đánh giá) · {{ shop.productsCount }} sản phẩm · Phản hồi trong {{ shop.responseTime }}
                </div>
              </div>
            </div>

            <!-- Middle Featured Tags -->
            <div class="col-md-4 d-flex gap-2 justify-content-md-center">
              <span v-for="tag in shop.featuredTags" :key="tag" class="badge bg-placeholder text-dark fw-normal px-3 py-2 rounded-3 align-self-center">
                {{ tag }}
              </span>
            </div>

            <!-- Right Action Button -->
            <div class="col-md-3 text-md-end">
              <button class="btn btn-primary px-4 py-2 rounded-3 fw-bold w-100 w-md-auto">Xem gian hàng</button>
            </div>

          </div>
        </div>
      </div>

      <!-- PAGINATION -->
      <nav class="d-flex justify-content-center">
        <ul class="pagination gap-1">
          <li class="page-item disabled"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-muted text-decoration-none" href="#"><</a></li>
          <li class="page-item active"><a class="page-item border-0 rounded-circle px-3 py-1 bg-primary text-white text-decoration-none" href="#">1</a></li>
          <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">2</a></li>
          <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">3</a></li>
          <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">></a></li>
        </ul>
      </nav>

    </div>
  </div>
</template>

<style scoped>
.bg-placeholder {
  background-color: #E6DED5;
}
.extra-small {
  font-size: 11px;
}
</style>

<script setup>
import { ref } from 'vue';

const searchQuery = ref('cosplay');

const shopResults = ref([
  { id: 1, name: 'Mai Cosplay House', avatar: 'MC', owner: 'Trần Thị Mai', location: 'Hà Nội · Cầu Giấy', verified: true, rating: '4,8', reviewsCount: 126, productsCount: 3, responseTime: '1 giờ', featuredTags: ['Raiden', 'Yae Miko', 'Nahida'] },
  { id: 2, name: 'Ly Cosplay Studio', avatar: 'LS', owner: 'Vũ Phương Lý', location: 'Hà Nội · Thanh Xuân', verified: true, rating: '4,9', reviewsCount: 98, productsCount: 5, responseTime: '30 phút', featuredTags: ['Miku', 'Nezuko', 'Rem'] },
  { id: 3, name: 'Linh Costume Hub', avatar: 'LC', owner: 'Bùi Khánh Linh', location: 'Hà Nội · Cầu Giấy', verified: true, rating: '4,8', reviewsCount: 74, productsCount: 4, responseTime: '1 giờ', featuredTags: ['Keqing', 'Zhongli', 'Ganyu'] },
  { id: 4, name: 'Long Fate Wardrobe', avatar: 'LW', owner: 'Phạm Thành Long', location: 'Hà Nội · Đống Đa', verified: true, rating: '4,7', reviewsCount: 61, productsCount: 3, responseTime: '2 giờ', featuredTags: ['Arthur', 'Mordred', 'Gilgamesh'] },
  { id: 5, name: 'Bảo Honkai Corner', avatar: 'BH', owner: 'Đỗ Gia Bảo', location: 'Hà Nội · Nam Từ Liêm', verified: true, rating: '4,9', reviewsCount: 52, productsCount: 2, responseTime: '1 giờ', featuredTags: ['Elysia', 'Kafka'] },
]);

const executeShopSearch = () => {
  // Logic gọi API gian hàng khi bấm Tìm
};
</script>