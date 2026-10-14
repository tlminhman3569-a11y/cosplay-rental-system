<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi, productApi } from '../../services/customerApi';
import { addDemoCartItem, demoProduct } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const product = ref(null);
const loading = ref(true);
const error = ref('');
const added = ref(false);
const selectedImage = ref(0);
const form = ref({ quantity: 1, startDate: '', endDate: '', selectedAccessories: [] });
const heroImage = computed(() => product.value?.images?.[selectedImage.value]?.url || product.value?.images?.find((image) => image.isPrimary)?.url || product.value?.images?.[0]?.url);
const rentalDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0;
  return Math.max(0, Math.floor((new Date(`${form.value.endDate}T00:00:00`) - new Date(`${form.value.startDate}T00:00:00`)) / 86400000));
});
const chosenAccessories = computed(() => (product.value?.accessories || []).filter((accessory) => form.value.selectedAccessories.some((item) => item.accessoryId === accessory.id)));
const rentalTotal = computed(() => ((product.value?.pricePerDay || 0) + chosenAccessories.value.reduce((sum, accessory) => sum + (accessory.rentalPricePerDay || 0), 0)) * rentalDays.value * form.value.quantity);
const depositTotal = computed(() => ((product.value?.depositAmount || 0) + chosenAccessories.value.reduce((sum, accessory) => sum + (accessory.depositAmount || 0), 0)) * form.value.quantity);
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

async function load() {
  if (route.query.demo === '1') { product.value = demoProduct; loading.value = false; return; }
  try { product.value = (await productApi.detail(route.params.id)).data; }
  catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tải sản phẩm.'; }
  finally { loading.value = false; }
}
function toggleAccessory(accessory) {
  const index = form.value.selectedAccessories.findIndex((item) => item.accessoryId === accessory.id);
  if (index >= 0) form.value.selectedAccessories.splice(index, 1);
  else form.value.selectedAccessories.push({ accessoryId: accessory.id, quantity: 1 });
}
function validateRentalPeriod() {
  if (!form.value.startDate || !form.value.endDate) { error.value = 'Hãy chọn ngày nhận và ngày trả.'; return false; }
  if (rentalDays.value < 1) { error.value = 'Ngày trả phải sau ngày nhận.'; return false; }
  const blocked = product.value.blockedDates?.some((range) => new Date(form.value.startDate) <= new Date(range.endDate) && new Date(form.value.endDate) >= new Date(range.startDate));
  if (blocked) { error.value = 'Sản phẩm đã có lịch bận trong khoảng ngày này.'; return false; }
  if (rentalDays.value < (product.value.minRentalDays || 1) || rentalDays.value > (product.value.maxRentalDays || 30)) { error.value = `Thời gian thuê phải từ ${product.value.minRentalDays || 1} đến ${product.value.maxRentalDays || 30} ngày.`; return false; }
  return true;
}
async function addToCart() {
  error.value = ''; added.value = false;
  if (!validateRentalPeriod()) return;
  if (Number(form.value.quantity) < 1 || Number(form.value.quantity) > product.value.quantity) { error.value = 'Số lượng thuê vượt quá số bộ còn có.'; return; }
  if (route.query.demo === '1') { addDemoCartItem({ ...form.value }); added.value = true; return; }
  try { await cartApi.create({ productId: product.value.id, ...form.value }); added.value = true; }
  catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể thêm vào giỏ.'; }
}
onMounted(load);
</script>

<template>
  <div class="product-page py-4">
    <div class="container">
      <div v-if="loading" class="text-center py-5">Đang tải sản phẩm...</div>
      <div v-else-if="error && !product" class="alert alert-danger">{{ error }}</div>
      <template v-else-if="product">
        <nav class="breadcrumb-line mb-3">
          Trang chủ › {{ product.category?.name || 'Cosplay' }}
          <template v-if="product.series?.name && product.series.name !== product.category?.name">
            › {{ product.series.name }}
          </template>
          › <strong>{{ product.characterName || product.name }}</strong>
        </nav>

        <div class="row g-4 align-items-start">
          <section class="col-lg-7">
            <div class="product-hero rounded-4 overflow-hidden">
              <img v-if="heroImage" :src="heroImage" :alt="product.name">
              <div v-else class="costume-placeholder"><i class="bi bi-person-heart"></i><span>{{ product.characterName || product.name }}</span></div>
            </div>
            <div class="gallery-strip mt-3">
              <button v-for="(image, index) in product.images || []" :key="image.id || image.url" :class="{ active: selectedImage === index }" @click="selectedImage = index"><img :src="image.url" :alt="`${product.name} ảnh ${index + 1}`"></button>
              <div v-if="!product.images?.length" v-for="n in 5" :key="n" class="gallery-placeholder"><i class="bi bi-image"></i><small>Ảnh {{ n }}</small></div>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-3"><span class="info-chip"><i class="bi bi-shield-check"></i>Đã kiểm tra chất lượng</span><span class="info-chip"><i class="bi bi-box-seam"></i>Còn {{ product.quantity }} bộ</span><span class="info-chip"><i class="bi bi-tag"></i>{{ product.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ẩn' }}</span></div>
          </section>

          <section class="col-lg-5">
            <div class="product-heading"><span class="category-badge">{{ product.category?.name || 'Cosplay' }}</span><button class="favorite-button" aria-label="Yêu thích"><i class="bi bi-heart"></i></button></div>
            <h1 class="h2 fw-bold mt-3">{{ product.name }}</h1>
            <p class="text-muted mb-2">{{ product.series?.name || product.characterName }} · {{ product.gender }} · Tình trạng: Như mới</p>
            <div class="price-line">{{ money(product.pricePerDay) }} <small>/ ngày</small></div>
            <p class="deposit-line">Cọc {{ money(product.depositAmount) }} · Có {{ product.quantity }} bộ</p>

            <div class="size-panel mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><h2 class="h6 mb-0">Size {{ product.size || 'Linh hoạt' }}</h2><button class="link-button" @click="$refs.sizeGuide?.scrollIntoView({ behavior: 'smooth' })">Hướng dẫn chọn size</button></div><div class="size-summary">Chọn size phù hợp trước khi gửi yêu cầu thuê.</div></div>
            <div class="selection-panel mb-3"><h2 class="h6">Phụ kiện đi kèm ({{ product.accessories?.length || 0 }})</h2><p class="small text-muted">Chọn món muốn thuê cùng trang phục; giá và cọc được tính vào tóm tắt.</p><label v-for="accessory in product.accessories || []" :key="accessory.id" class="accessory-option"><input type="checkbox" :checked="form.selectedAccessories.some(item => item.accessoryId === accessory.id)" @change="toggleAccessory(accessory)"><span class="flex-grow-1">{{ accessory.name }}<small>{{ accessory.type || 'Phụ kiện' }}</small></span><strong>{{ money(accessory.rentalPricePerDay) }}<small>/ngày</small></strong></label><div v-if="!product.accessories?.length" class="small text-muted">Sản phẩm không có phụ kiện đi kèm.</div></div>

            <div class="booking-panel">
              <h2 class="h6 mb-3">Chọn ngày thuê</h2>
              <div class="row g-2"><label class="col-6 small">Ngày nhận<input v-model="form.startDate" type="date" class="form-control mt-1"></label><label class="col-6 small">Ngày trả<input v-model="form.endDate" type="date" class="form-control mt-1"></label></div>
              <label class="small mt-3 d-block">Số lượng</label><input v-model.number="form.quantity" type="number" min="1" :max="product.quantity" class="form-control quantity-input">
              <p v-if="rentalDays" class="selected-dates mt-3 mb-0">{{ rentalDays }} ngày thuê · Sau mỗi lượt thuê cần {{ product.cleaningDays || 1 }} ngày vệ sinh</p>
              <div class="price-breakdown mt-3"><div><span>Thuê {{ rentalDays || '—' }} ngày</span><strong>{{ money(rentalTotal) }}</strong></div><div><span>Tiền cọc hoàn lại</span><strong>{{ money(depositTotal) }}</strong></div><div class="total"><span>Tổng thanh toán</span><strong>{{ money(rentalTotal + depositTotal) }}</strong></div></div>
              <div v-if="error" class="alert alert-danger py-2 mt-3 mb-0">{{ error }}</div><div v-if="added" class="alert alert-success py-2 mt-3 mb-0">Đã thêm sản phẩm vào giỏ thuê.</div>
              <button class="btn btn-primary w-100 py-2 mt-3" @click="addToCart"><i class="bi bi-bag-plus me-2"></i>Thêm vào giỏ thuê</button>
              <button class="btn btn-outline-primary w-100 mt-2" @click="router.push(route.query.demo === '1' ? '/customer/cart?demo=1' : '/customer/cart')">Xem giỏ thuê</button>
            </div>
          </section>
        </div>

        <section ref="sizeGuide" class="content-panel mt-5"><div class="section-heading"><div><span class="eyebrow">CHỌN ĐÚNG KÍCH CỠ</span><h2 class="h4 mb-0">Hướng dẫn chọn size</h2></div><span class="current-size">Size hiện có: {{ product.size || 'Linh hoạt' }}</span></div><p class="text-muted">Thông số dưới đây là hướng dẫn tham khảo để chọn trang phục.</p><div class="table-responsive"><table class="table size-table"><thead><tr><th>SIZE</th><th>CHIỀU CAO</th><th>NGỰC</th><th>EO</th><th>MÔNG</th></tr></thead><tbody><tr :class="{ 'table-active': product.size === 'M' }"><th>M (bộ này)</th><td>1m55–1m65</td><td>82–88 cm</td><td>62–68 cm</td><td>88–94 cm</td></tr><tr :class="{ 'table-active': product.size === 'S' }"><th>S</th><td>1m48–1m55</td><td>78–82 cm</td><td>58–62 cm</td><td>84–88 cm</td></tr><tr :class="{ 'table-active': product.size === 'L' }"><th>L</th><td>1m65–1m72</td><td>88–94 cm</td><td>68–74 cm</td><td>94–100 cm</td></tr></tbody></table></div></section>

        <div class="row g-4 mt-1"><section class="col-lg-7"><div class="content-panel h-100"><div class="section-heading"><div><span class="eyebrow">THÔNG TIN SẢN PHẨM</span><h2 class="h4 mb-0">Mô tả trang phục</h2></div><span class="badge-soft">{{ product.productType || 'COSTUME' }}</span></div><p>{{ product.description || 'Chủ shop chưa bổ sung mô tả cho trang phục này.' }}</p><h3 class="h6 mt-4">Trang phục chính</h3><div class="included-item"><i class="bi bi-check-circle-fill"></i>Trang phục chính theo bộ · đã gồm trong giá thuê</div><div v-if="product.accessories?.length" class="included-item"><i class="bi bi-check-circle-fill"></i>{{ product.accessories.length }} phụ kiện có thể chọn thuê kèm</div></div></section><section class="col-lg-5"><div class="content-panel policy-panel h-100"><span class="eyebrow">AN TÂM THUÊ ĐỒ</span><h2 class="h4">Chính sách thuê</h2><ul><li>Cọc được giữ trong thời gian thuê và hoàn sau khi shop kiểm tra.</li><li>Hủy miễn phí khi còn từ 48 giờ trước ngày nhận; trong 48 giờ có thể áp dụng phí hủy.</li><li>Trả muộn có thể khấu trừ phí từ tiền cọc theo chính sách của shop.</li><li>Đồng kiểm tình trạng trang phục khi nhận và khi trả.</li></ul></div></section></div>

        <section class="content-panel mt-4"><div class="section-heading"><div><span class="eyebrow">CỘNG ĐỒNG CLARITY</span><h2 class="h4 mb-0">Đánh giá sản phẩm <small>({{ product.reviewCount || 41 }})</small></h2></div><div class="rating-score"><i class="bi bi-star-fill"></i>4,8 <span>/ 5</span></div></div><div class="review-grid"><article v-for="review in [{ initials: 'Q', name: 'Đỗ Thị Quỳnh', stars: 5, text: 'Bộ đồ đẹp, đúng ảnh, phụ kiện còn mới. Chủ đồ phản hồi rất nhanh.' }, { initials: 'T', name: 'Lê Nguyễn Anh Tuấn', stars: 5, text: 'Giao đúng hẹn, đồng kiểm dễ dàng, hoàn cọc nhanh.' }, { initials: 'H', name: 'Nguyễn Thị Hồng', stars: 4, text: 'Trang phục đẹp, shop tư vấn size rõ ràng.' }]" :key="review.name" class="review-card"><div class="review-person"><span>{{ review.initials }}</span><strong>{{ review.name }}</strong></div><div class="review-stars">{{ '★'.repeat(review.stars) }}{{ '☆'.repeat(5 - review.stars) }}</div><p>{{ review.text }}</p></article></div></section>

        <section class="shop-panel mt-4"><div class="shop-avatar">{{ (product.shop?.name || 'C').slice(0, 1) }}</div><div class="flex-grow-1"><span class="eyebrow">CHỦ CHO THUÊ</span><h2 class="h5 mb-1">{{ product.shop?.name || 'Clarity shop' }}</h2><p class="text-muted mb-0">{{ product.shop?.region || 'Thông tin khu vực chưa có' }} · Phản hồi nhanh · {{ product.rentalCount || 0 }} lượt thuê</p></div><button class="btn btn-outline-primary">Xem gian hàng</button></section>

        <section v-if="product.similarProducts?.length" class="mt-5"><div class="section-heading mb-3"><div><span class="eyebrow">CÓ THỂ BẠN SẼ THÍCH</span><h2 class="h4 mb-0">Sản phẩm tương tự</h2></div><span class="text-muted small">Cùng series hoặc danh mục</span></div><div class="row g-3"><div v-for="item in product.similarProducts" :key="item.id" class="col-6 col-md-3"><router-link :to="`/products/${item.id}`" class="card similar-card h-100 text-decoration-none text-dark"><div class="similar-thumb"><img v-if="item.images?.[0]?.url" :src="item.images[0].url" :alt="item.name"><i v-else class="bi bi-person-heart"></i></div><div class="card-body"><small class="text-muted">{{ item.series?.name || item.category?.name }}</small><div class="fw-semibold mt-1">{{ item.name }}</div><div class="text-danger mt-2">{{ money(item.pricePerDay) }}<small>/ngày</small></div><small class="text-muted">Cọc {{ money(item.depositAmount) }}</small></div></router-link></div></div></section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss" src="../../assets/css/customer/product-detail.scss"></style>

