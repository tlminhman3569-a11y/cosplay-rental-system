<!-- src/views/public/HomeView.vue -->
<template>
  <div class="bg-light-bg min-vh-100 py-4">
    <div class="container">

      <!-- HERO BANNER -->
      <section class="bg-primary text-white p-4 p-md-5 rounded-4 mb-4 shadow-sm position-relative overflow-hidden">
        <div class="mb-3">
          <span class="badge bg-white text-primary px-3 py-2 rounded-pill fw-semibold">
            <i class="bi bi-shield-check me-1"></i> Cọc do sàn giữ · Đồng kiểm ảnh/QR
          </span>
        </div>
        <h2 class="fw-bold fs-1 mb-2">Thuê cosplay chuẩn từng chi tiết, từ chủ đồ uy tín gần bạn</h2>
        <p class="text-light opacity-75 mb-4 max-w-600">
          Hàng nghìn bộ trang phục Genshin Impact, Honkai Star Rail, Anime & Vocaloid... Thủ tục nhanh chóng, giao nhận tận nơi.
        </p>

        <!-- Search Box -->
        <div class="bg-white p-2 p-md-3 rounded-4 shadow d-flex flex-column flex-md-row gap-2 align-items-center">
          <div class="flex-grow-1 w-100">
            <input v-model="searchQuery" type="text" class="form-control border-0 shadow-none text-dark" placeholder="Tên nhân vật, series (Ví dụ: Raiden Shogun, Genshin Impact)..." />
          </div>
          <div class="border-start d-none d-md-block h-100 py-2"></div>
          <div class="w-100 w-md-auto">
            <input type="text" class="form-control border-0 shadow-none text-muted" placeholder="20/10/2026 – 22/10/2026" />
          </div>
          <div class="border-start d-none d-md-block h-100 py-2"></div>
          <div class="w-100 w-md-auto">
            <select class="form-select border-0 shadow-none text-muted">
              <option>Hà Nội</option>
              <option>TP. Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
            </select>
          </div>
          <button @click="handleSearch" class="btn btn-secondary text-white fw-bold px-4 py-2 rounded-3 w-100 w-md-auto text-nowrap">
            Tìm cosplay
          </button>
        </div>
      </section>

      <!-- CATEGORY TAGS -->
      <section class="d-flex gap-2 mb-4 overflow-auto pb-2 custom-scroll">
        <button v-for="tag in categoryTags" :key="tag" class="btn btn-outline-secondary rounded-pill text-nowrap bg-white border-0 shadow-sm px-3 py-1 text-primary fw-medium">
          {{ tag }}
        </button>
      </section>

      <!-- SECTION 1: COSPLAY NỔI BẬT TUẦN NÀY -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary mb-0">Cosplay nổi bật tuần này</h4>
          <router-link to="/search" class="text-accent text-decoration-none fw-semibold small">Xem tất cả ></router-link>
        </div>
        <div class="row g-3">
          <div v-for="item in featuredList" :key="item.id" class="col-6 col-md-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <div class="bg-placeholder text-center py-5 text-muted small fw-semibold">{{ item.imageText }}</div>
              <div class="card-body p-3">
                <h6 class="fw-bold text-primary text-truncate mb-1">{{ item.title }}</h6>
                <p class="text-muted small mb-2">{{ item.series }} · Size {{ item.size }}</p>
                <div class="fw-bold text-danger fs-6 mb-1">{{ item.price }}/ngày</div>
                <div class="text-muted extra-small">Cọc {{ item.deposit }} · Đã thuê {{ item.rentCount }} lần</div>
                <hr class="my-2" />
                <div class="d-flex justify-content-between align-items-center extra-small text-muted">
                  <span><i class="bi bi-person-circle me-1"></i>{{ item.owner }}</span>
                  <span><i class="bi bi-star-fill text-warning me-1"></i>{{ item.rating }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: BÁN CHẠY NHẤT -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary mb-0">Bán chạy nhất</h4>
          <router-link to="/search" class="text-accent text-decoration-none fw-semibold small">Xem tất cả ></router-link>
        </div>
        <div class="row g-3">
          <div v-for="item in bestSellerList" :key="item.id" class="col-6 col-md-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
              <span class="position-absolute top-0 start-0 bg-danger text-white extra-small px-2 py-1 rounded-end fw-bold z-1">Bán chạy · {{ item.rentCount }} lượt</span>
              <div class="bg-placeholder text-center py-5 text-muted small fw-semibold">{{ item.imageText }}</div>
              <div class="card-body p-3">
                <h6 class="fw-bold text-primary text-truncate mb-1">{{ item.title }}</h6>
                <p class="text-muted small mb-2">{{ item.series }} · Size {{ item.size }}</p>
                <div class="fw-bold text-danger fs-6 mb-1">{{ item.price }}/ngày</div>
                <div class="text-muted extra-small">Cọc {{ item.deposit }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: MỚI ĐĂNG GẦN ĐÂY -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary mb-0">Mới đăng gần đây</h4>
          <router-link to="/search" class="text-accent text-decoration-none fw-semibold small">Xem tất cả ></router-link>
        </div>
        <div class="row g-3">
          <div v-for="item in newestList" :key="item.id" class="col-6 col-md-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
              <span class="position-absolute top-0 start-0 bg-success text-white extra-small px-2 py-1 rounded-end fw-bold z-1">Mới</span>
              <div class="bg-placeholder text-center py-5 text-muted small fw-semibold">{{ item.imageText }}</div>
              <div class="card-body p-3">
                <h6 class="fw-bold text-primary text-truncate mb-1">{{ item.title }}</h6>
                <p class="text-muted small mb-2">{{ item.series }} · Size {{ item.size }}</p>
                <div class="fw-bold text-danger fs-6 mb-1">{{ item.price }}/ngày</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: GỢI Ý CHO BẠN -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary mb-0">Gợi ý cho bạn</h4>
          <router-link to="/search" class="text-accent text-decoration-none fw-semibold small">Xem tất cả ></router-link>
        </div>
        <div class="row g-3">
          <div v-for="item in recommendedList" :key="item.id" class="col-6 col-md-3">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <div class="bg-placeholder text-center py-5 text-muted small fw-semibold">{{ item.imageText }}</div>
              <div class="card-body p-3">
                <h6 class="fw-bold text-primary text-truncate mb-1">{{ item.title }}</h6>
                <p class="text-muted small mb-2">{{ item.series }} · Size {{ item.size }}</p>
                <div class="fw-bold text-danger fs-6 mb-1">{{ item.price }}/ngày</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: GIAN HÀNG NỔI BẬT -->
      <section class="mb-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="fw-bold text-primary mb-0">Gian hàng nổi bật</h4>
          <router-link to="/shops" class="text-accent text-decoration-none fw-semibold small">Tìm gian hàng ></router-link>
        </div>
        <div class="row g-3">
          <div v-for="shop in shopList" :key="shop.id" class="col-6 col-md-3">
            <div class="card border-0 shadow-sm rounded-4 p-3 text-center h-100 bg-white">
              <div class="mx-auto rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mb-2" style="width: 48px; height: 48px;">
                {{ shop.avatar }}
              </div>
              <h6 class="fw-bold text-primary mb-1">{{ shop.name }}</h6>
              <p class="text-muted extra-small mb-2">{{ shop.owner }} · {{ shop.location }}</p>
              <div class="badge bg-light-bg text-dark border extra-small fw-normal">{{ shop.itemsCount }} sản phẩm</div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 6: CÁCH HOẠT ĐỘNG -->
      <section class="mb-4">
        <h4 class="fw-bold text-primary mb-3 text-center">Cách hoạt động</h4>
        <div class="row g-3">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm p-4 rounded-4 text-center h-100 bg-white">
              <div class="rounded-circle bg-accent text-white fw-bold d-inline-flex align-items-center justify-content-center mb-3" style="width: 40px; height: 40px;">1</div>
              <h6 class="fw-bold text-primary">Chọn đồ & gửi yêu cầu</h6>
              <p class="text-muted small mb-0">Chọn bộ cosplay, ngày thuê, hình thức nhận. Gửi yêu cầu tới chủ đồ.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm p-4 rounded-4 text-center h-100 bg-white">
              <div class="rounded-circle bg-accent text-white fw-bold d-inline-flex align-items-center justify-content-center mb-3" style="width: 40px; height: 40px;">2</div>
              <h6 class="fw-bold text-primary">Thanh toán trước · Giữ do sàn giữ</h6>
              <p class="text-muted small mb-0">Thanh toán tiền thuê + cọc. Chủ đồ xác nhận trong 12 giờ. Cọc do sàn giữ an toàn.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm p-4 rounded-4 text-center h-100 bg-white">
              <div class="rounded-circle bg-accent text-white fw-bold d-inline-flex align-items-center justify-content-center mb-3" style="width: 40px; height: 40px;">3</div>
              <h6 class="fw-bold text-primary">Đồng kiểm, sử dụng & hoàn cọc</h6>
              <p class="text-muted small mb-0">Đồng kiểm và nhận đồ. Sử dụng xong trả đồ -> Hoàn cọc 1-3 ngày làm việc.</p>
            </div>
          </div>
        </div>
      </section>

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
.max-w-600 {
  max-width: 600px;
}
</style>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');

const categoryTags = ['Tất cả', 'Game', 'Anime/Manga', 'Vocaloid', 'Phim & TV', 'Truyện tranh phương Tây', 'Lolita / Fantasy', 'Phụ kiện & Tóc giả'];

const featuredList = ref([
  { id: 1, title: 'Cosplay Raiden Shogun – Genshin Impact', series: 'Genshin Impact', size: 'M', price: '250.000đ', deposit: '1.000.000đ', rentCount: 48, owner: 'Trần Thị Mai', rating: '4,8', imageText: 'Ảnh Genshin Impact' },
  { id: 2, title: 'Cosplay Arthur Pendragon – Fate/Grand Order', series: 'Fate/Grand Order', size: 'L', price: '320.000đ', deposit: '1.500.000đ', rentCount: 37, owner: 'Phạm Thành Long', rating: '4,7', imageText: 'Ảnh Fate/Grand Order' },
  { id: 3, title: 'Cosplay Hatsune Miku – Sakura Version', series: 'Vocaloid', size: 'S', price: '180.000đ', deposit: '800.000đ', rentCount: 29, owner: 'Vũ Phương Lý', rating: '4,9', imageText: 'Ảnh Vocaloid' },
  { id: 4, title: 'Cosplay Gojo Satoru – Jujutsu Kaisen', series: 'Jujutsu Kaisen', size: 'L', price: '120.000đ', deposit: '600.000đ', rentCount: 26, owner: 'Phạm Minh Đức', rating: '4,6', imageText: 'Ảnh Jujutsu Kaisen' },
]);

const bestSellerList = ref([
  { id: 1, title: 'Cosplay Raiden Shogun – Genshin Impact', series: 'Genshin Impact', size: 'M', price: '250.000đ', deposit: '1.000.000đ', rentCount: 48, imageText: 'Ảnh Genshin Impact' },
  { id: 2, title: 'Cosplay Arthur Pendragon – Fate/Grand Order', series: 'Fate/Grand Order', size: 'L', price: '320.000đ', deposit: '1.500.000đ', rentCount: 37, imageText: 'Ảnh Fate/Grand Order' },
  { id: 3, title: 'Cosplay Keqing – Opulent Splendor', series: 'Genshin Impact', size: 'M', price: '290.000đ', deposit: '1.200.000đ', rentCount: 31, imageText: 'Ảnh Genshin Impact' },
  { id: 4, title: 'Cosplay Hatsune Miku – Sakura Version', series: 'Vocaloid', size: 'S', price: '180.000đ', deposit: '800.000đ', rentCount: 29, imageText: 'Ảnh Vocaloid' },
]);

const newestList = ref([
  { id: 1, title: 'Cosplay Kafka – Honkai: Star Rail', series: 'Honkai: Star Rail', size: 'M', price: '380.000đ', imageText: 'Ảnh Star Rail' },
  { id: 2, title: 'Cosplay Zhongli – Genshin Impact', series: 'Genshin Impact', size: 'L', price: '340.000đ', imageText: 'Ảnh Genshin Impact' },
  { id: 3, title: 'Cosplay Nezuko – Kimetsu no Yaiba', series: 'Kimetsu no Yaiba', size: 'M', price: '210.000đ', imageText: 'Ảnh Kimetsu' },
  { id: 4, title: 'Cosplay Elysia – Honkai Impact 3rd', series: 'Honkai Impact 3rd', size: 'S', price: '450.000đ', imageText: 'Ảnh Honkai 3rd' },
]);

const recommendedList = ref([
  { id: 1, title: 'Cosplay Keqing – Opulent Splendor', series: 'Genshin Impact', size: 'M', price: '290.000đ', imageText: 'Ảnh Genshin Impact' },
  { id: 2, title: 'Cosplay Zhongli – Genshin Impact', series: 'Genshin Impact', size: 'L', price: '340.000đ', imageText: 'Ảnh Genshin Impact' },
  { id: 3, title: 'Cosplay Kafka – Honkai: Star Rail', series: 'Honkai: Star Rail', size: 'M', price: '380.000đ', imageText: 'Ảnh Star Rail' },
  { id: 4, title: 'Cosplay Nezuko – Kimetsu no Yaiba', series: 'Kimetsu no Yaiba', size: 'M', price: '210.000đ', imageText: 'Ảnh Kimetsu' },
]);

const shopList = ref([
  { id: 1, name: 'Mai Cosplay House', owner: 'Trần Thị Mai', location: 'Cầu Giấy', itemsCount: 3, avatar: 'MC' },
  { id: 2, name: 'Ly Cosplay Studio', owner: 'Vũ Phương Lý', location: 'Thanh Xuân', itemsCount: 5, avatar: 'LS' },
  { id: 3, name: 'Linh Costume Hub', owner: 'Bùi Khánh Linh', location: 'Cầu Giấy', itemsCount: 4, avatar: 'LC' },
  { id: 4, name: 'Bảo Honkai Corner', owner: 'Đỗ Gia Bảo', location: 'Nam Từ Liêm', itemsCount: 2, avatar: 'BH' },
]);

const handleSearch = () => {
  router.push({ path: '/search', query: { q: searchQuery.value } });
};
</script>