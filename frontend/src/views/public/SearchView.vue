<template>
  <div class="bg-light-bg min-vh-100 py-4">
    <div class="container">

      <!-- TOP SEARCH BAR & TAB TOGGLE -->
      <div class="bg-white p-3 rounded-4 shadow-sm mb-3">
        <div class="d-flex gap-2 mb-3">
          <input v-model="searchQuery" type="text" class="form-control form-control-lg border shadow-none" placeholder="Tìm sản phẩm, nhân vật hoặc gian hàng..." />
          <button @click="executeSearch" class="btn btn-primary px-4 fw-bold text-nowrap">Tìm</button>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary rounded-pill px-3 py-1 text-nowrap small">Sản phẩm (128)</button>
          <router-link to="/shops" class="btn btn-outline-secondary rounded-pill px-3 py-1 text-nowrap small">Gian hàng (14)</router-link>
        </div>
      </div>

      <!-- BREADCRUMB & HEADER -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <nav class="small text-muted mb-1">
            <router-link to="/" class="text-muted text-decoration-none">Trang chủ</router-link> > <span class="text-dark fw-semibold">Khám phá đồ</span>
          </nav>
          <h4 class="fw-bold text-primary mb-0">Kết quả: 128 bộ cosplay tại Hà Nội</h4>
        </div>

        <!-- Sort Dropdown -->
        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted text-nowrap">Sắp xếp:</span>
          <select class="form-select form-select-sm border-0 shadow-sm bg-white fw-semibold" style="width: 160px;">
            <option>Phù hợp nhất</option>
            <option>Giá tăng dần</option>
            <option>Giá giảm dần</option>
            <option>Đánh giá cao</option>
          </select>
        </div>
      </div>

      <div class="row g-3">

        <!-- LEFT SIDEBAR FILTER -->
        <div class="col-md-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">

            <!-- Danh mục tree -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-2">Danh mục (thể loại > series > nhân vật)</label>
              <div class="small">
                <div class="fw-semibold text-dark"><i class="bi bi-folder-check me-1"></i>Game</div>
                <div class="ms-3">
                  <div class="fw-bold text-primary"><i class="bi bi-folder2-open me-1"></i>Genshin Impact</div>
                  <div class="ms-3 text-accent fw-bold">• Raiden Shogun</div>
                  <div class="ms-3 text-muted">○ Keqing</div>
                  <div class="ms-3 text-muted">○ Zhongli</div>
                </div>
                <div class="ms-3 text-muted mt-1"><i class="bi bi-folder me-1"></i>Honkai Impact 3rd</div>
                <div class="fw-semibold text-muted mt-2"><i class="bi bi-folder me-1"></i>Anime/Manga</div>
                <div class="fw-semibold text-muted mt-1"><i class="bi bi-folder me-1"></i>Vocaloid</div>
              </div>
            </div>

            <!-- Loại sản phẩm -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-2">Loại sản phẩm</label>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="checkbox" checked id="cat1" />
                <label class="form-check-label" for="cat1">Trọn bộ</label>
              </div>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="checkbox" id="cat2" />
                <label class="form-check-label" for="cat2">Phụ kiện lẻ</label>
              </div>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="checkbox" id="cat3" />
                <label class="form-check-label" for="cat3">Tóc giả</label>
              </div>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="checkbox" id="cat4" />
                <label class="form-check-label" for="cat4">Đạo cụ / vũ khí</label>
              </div>
            </div>

            <!-- Size -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-2">Size</label>
              <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-primary active px-2 py-0">S</button>
                <button class="btn btn-sm btn-outline-primary px-2 py-0">M</button>
                <button class="btn btn-sm btn-outline-primary px-2 py-0">L</button>
                <button class="btn btn-sm btn-outline-primary px-2 py-0">XL</button>
              </div>
            </div>

            <!-- Giá / ngày -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-1">Giá / ngày</label>
              <input type="range" class="form-range" min="100000" max="500000" step="10000" />
              <div class="d-flex justify-content-between extra-small text-muted">
                <span>100.000đ</span>
                <span>500.000đ</span>
              </div>
            </div>

            <!-- Khoảng ngày thuê -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-1">Khoảng ngày thuê</label>
              <input type="text" class="form-control form-control-sm text-center" value="20/10 – 22/10/2026" />
            </div>

            <!-- Khu vực -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-1">Khu vực</label>
              <select class="form-select form-select-sm">
                <option>Toàn Hà Nội</option>
                <option>Cầu Giấy</option>
                <option>Thanh Xuân</option>
              </select>
            </div>

            <!-- Nhận hàng -->
            <div class="mb-3">
              <label class="fw-bold text-primary small mb-2">Nhận hàng</label>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="radio" name="delivery" checked id="del1" />
                <label class="form-check-label" for="del1">Giao tận nơi</label>
              </div>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="radio" name="delivery" id="del2" />
                <label class="form-check-label" for="del2">Tự lấy</label>
              </div>
            </div>

            <!-- Đánh giá -->
            <div class="mb-4">
              <label class="fw-bold text-primary small mb-2">Đánh giá</label>
              <div class="form-check small mb-1">
                <input class="form-check-input" type="checkbox" id="rat1" />
                <label class="form-check-label" for="rat1"><i class="bi bi-star-fill text-warning"></i> 4 sao trở lên</label>
              </div>
            </div>

            <button class="btn btn-primary w-100 py-2 fw-bold rounded-3">Áp dụng</button>

          </div>
        </div>

        <!-- RIGHT PRODUCT GRID -->
        <div class="col-md-9">
          <div class="row g-3">
            <div v-for="item in searchResults" :key="item.id" class="col-6 col-md-4">
              <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div class="bg-placeholder text-center py-5 text-muted small fw-semibold">{{ item.imageText }}</div>
                <div class="card-body p-3">
                  <h6 class="fw-bold text-primary text-truncate mb-1">{{ item.title }}</h6>
                  <p class="text-muted small mb-2">{{ item.series }} · Size {{ item.size }}</p>
                  <div class="fw-bold text-danger fs-6 mb-1">{{ item.price }}/ngày</div>
                  <div class="text-muted extra-small">Cọc {{ item.deposit }} · Đã thuê {{ item.rentCount }} lần</div>
                  <hr class="my-2" />
                  <div class="d-flex justify-content-between align-items-center extra-small text-muted mb-1">
                    <span><i class="bi bi-person-circle me-1"></i>{{ item.owner }}</span>
                    <span><i class="bi bi-star-fill text-warning me-1"></i>{{ item.rating }}</span>
                  </div>
                  <div class="extra-small text-muted"><i class="bi bi-geo-alt me-1"></i>{{ item.location }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- PAGINATION -->
          <nav class="mt-4 d-flex justify-content-center">
            <ul class="pagination gap-1">
              <li class="page-item disabled"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-muted text-decoration-none" href="#"><</a></li>
              <li class="page-item active"><a class="page-item border-0 rounded-circle px-3 py-1 bg-primary text-white text-decoration-none" href="#">1</a></li>
              <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">2</a></li>
              <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">3</a></li>
              <li class="page-item"><span class="px-2 text-muted">...</span></li>
              <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">15</a></li>
              <li class="page-item"><a class="page-item border-0 rounded-circle px-3 py-1 bg-white text-dark text-decoration-none" href="#">></a></li>
            </ul>
          </nav>
        </div>

      </div>
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const searchQuery = ref(route.query.q || '');

const searchResults = ref([
  { id: 1, title: 'Cosplay Raiden Shogun – Genshin Impact', series: 'Genshin Impact', size: 'M', price: '250.000đ', deposit: '1.000.000đ', rentCount: 48, owner: 'Trần Thị Mai', rating: '4,8', location: 'Hà Nội · Cầu Giấy', imageText: 'Ảnh Genshin Impact' },
  { id: 2, title: 'Cosplay Arthur Pendragon – Fate/Grand Order', series: 'Fate/Grand Order', size: 'L', price: '320.000đ', deposit: '1.500.000đ', rentCount: 37, owner: 'Phạm Thành Long', rating: '4,7', location: 'Hà Nội · Đống Đa', imageText: 'Ảnh Fate/Grand Order' },
  { id: 3, title: 'Cosplay Hatsune Miku – Sakura Version', series: 'Vocaloid', size: 'S', price: '180.000đ', deposit: '800.000đ', rentCount: 29, owner: 'Vũ Phương Lý', rating: '4,9', location: 'Hà Nội · Thanh Xuân', imageText: 'Ảnh Vocaloid' },
  { id: 4, title: 'Cosplay Gojo Satoru – Jujutsu Kaisen', series: 'Jujutsu Kaisen', size: 'L', price: '120.000đ', deposit: '600.000đ', rentCount: 26, owner: 'Phạm Minh Đức', rating: '4,6', location: 'Hà Nội · Hai Bà Trưng', imageText: 'Ảnh Jujutsu Kaisen' },
  { id: 5, title: 'Cosplay Keqing – Opulent Splendor', series: 'Genshin Impact', size: 'M', price: '290.000đ', deposit: '1.200.000đ', rentCount: 31, owner: 'Bùi Khánh Linh', rating: '4,8', location: 'Hà Nội · Cầu Giấy', imageText: 'Ảnh Genshin Impact' },
  { id: 6, title: 'Cosplay Elysia – Honkai Impact 3rd', series: 'Honkai Impact 3rd', size: 'S', price: '450.000đ', deposit: '2.000.000đ', rentCount: 22, owner: 'Đỗ Gia Bảo', rating: '4,9', location: 'Hà Nội · Nam Từ Liêm', imageText: 'Ảnh Honkai Impact 3rd' },
  { id: 7, title: 'Cosplay Nezuko – Kimetsu no Yaiba', series: 'Kimetsu no Yaiba', size: 'M', price: '210.000đ', deposit: '700.000đ', rentCount: 19, owner: 'Vũ Phương Lý', rating: '4,9', location: 'Hà Nội · Thanh Xuân', imageText: 'Ảnh Kimetsu no Yaiba' },
  { id: 8, title: 'Cosplay Zhongli – Genshin Impact', series: 'Genshin Impact', size: 'L', price: '340.000đ', deposit: '1.400.000đ', rentCount: 17, owner: 'Bùi Khánh Linh', rating: '4,8', location: 'Hà Nội · Cầu Giấy', imageText: 'Ảnh Genshin Impact' },
  { id: 9, title: 'Cosplay Kafka – Honkai: Star Rail', series: 'Honkai: Star Rail', size: 'M', price: '380.000đ', deposit: '1.600.000đ', rentCount: 12, owner: 'Đỗ Gia Bảo', rating: '4,7', location: 'Hà Nội · Nam Từ Liêm', imageText: 'Ảnh Honkai: Star Rail' },
]);

const executeSearch = () => {
  // Logic kết nối API khi bấm Tìm
};

onMounted(() => {
  if (searchQuery.value) {
    executeSearch();
  }
});
</script>