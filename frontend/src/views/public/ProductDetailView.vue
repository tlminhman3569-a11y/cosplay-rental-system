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

<style scoped>
.product-page{background:#faf8f5;min-height:75vh}.breadcrumb-line{font-size:.83rem;color:#766b62}.product-hero{display:grid;place-items:center;aspect-ratio:1;background:#eee7e0}.product-hero img{width:100%;height:100%;object-fit:cover}.costume-placeholder{width:100%;height:100%;display:grid;place-content:center;text-align:center;gap:.6rem;background:radial-gradient(circle at 50% 25%,#f4d5d7,#d48791 48%,#60423d 49%,#4a342f);color:#fff;font-weight:700;font-size:1.1rem}.costume-placeholder i{font-size:7rem}.gallery-strip{display:flex;gap:.6rem;overflow:auto}.gallery-strip button,.gallery-placeholder{width:76px;height:76px;flex:0 0 auto;border:1px solid #ded5cc;border-radius:10px;background:#f1ebe5;overflow:hidden;display:grid;place-items:center;color:#806b5a}.gallery-strip button.active{border:2px solid var(--bs-primary)}.gallery-strip img{width:100%;height:100%;object-fit:cover}.gallery-placeholder small{font-size:.7rem}.info-chip,.badge-soft{background:#f1e9e1;border-radius:999px;padding:.45rem .7rem;font-size:.78rem;color:#55483f}.info-chip i{color:var(--bs-primary);margin-right:.35rem}.product-heading,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.category-badge{display:inline-block;border:1px solid #d7c9bd;border-radius:999px;background:#f8f5f1;color:#4a3b32;font-size:.78rem;font-weight:700;padding:.43rem .7rem}.favorite-button{border:1px solid #ded5cc;background:#fff;border-radius:50%;width:40px;height:40px;color:#805b4b}.price-line{font-size:1.8rem;font-weight:700;color:#a84934}.price-line small{font-size:.95rem;color:#786f68;font-weight:400}.deposit-line{color:#655d57}.size-panel,.selection-panel,.booking-panel,.content-panel,.shop-panel{background:#fff;border:1px solid #e7ded5;border-radius:16px;padding:1.25rem}.link-button{border:0;background:none;color:#785943;text-decoration:underline;font-size:.85rem}.size-summary{background:#f8f5f1;padding:.7rem;border-radius:8px;color:#655d57;font-size:.9rem}.selection-panel>p{margin:.35rem 0 .8rem}.accessory-option{display:flex;align-items:center;gap:.7rem;padding:.7rem 0;border-top:1px solid #eee7e0;font-size:.9rem}.accessory-option span small,.accessory-option strong small{display:block;color:#786f68;font-weight:400;font-size:.75rem}.accessory-option input{accent-color:var(--bs-primary);width:17px;height:17px}.accessory-option strong{text-align:right;font-size:.83rem}.booking-panel{background:#f6f1eb}.quantity-input{max-width:100px}.selected-dates{font-size:.84rem;color:#655d57}.price-breakdown>div{display:flex;justify-content:space-between;padding:.45rem 0;color:#655d57;font-size:.9rem}.price-breakdown .total{border-top:1px solid #ded5cc;margin-top:.35rem;padding-top:.8rem;color:#3f332c;font-weight:700;font-size:1rem}.eyebrow{display:block;color:#8c6b52;font-size:.7rem;font-weight:800;letter-spacing:.12em;margin-bottom:.25rem}.current-size{font-size:.82rem;background:#f1e9e1;border-radius:999px;padding:.45rem .7rem;color:#4a3b32}.size-table{margin-top:.7rem;vertical-align:middle}.size-table thead th{background:#f5f0eb;color:#65564b;font-size:.76rem}.table-active{--bs-table-bg:#f8f1e9}.included-item{padding:.6rem 0;border-top:1px solid #eee7e0;color:#655d57}.included-item i{color:#348451;margin-right:.55rem}.policy-panel li{padding:.45rem 0;color:#655d57}.rating-score{color:#a66b13;font-weight:800}.rating-score i{margin-right:.35rem}.rating-score span{font-size:.8rem;color:#786f68;font-weight:400}.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.2rem}.review-card{border:1px solid #eee7e0;border-radius:12px;padding:1rem}.review-person{display:flex;align-items:center;gap:.6rem}.review-person span,.shop-avatar{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#e7d8ca;color:#5a4538;font-weight:700}.review-person strong{font-size:.9rem}.review-stars{color:#d29b30;margin:.55rem 0}.review-card p{margin:0;color:#655d57;font-size:.87rem}.shop-panel{display:flex;align-items:center;gap:1rem}.shop-avatar{width:54px;height:54px;font-size:1.25rem}.shop-panel .eyebrow{margin:0}.similar-card{overflow:hidden;border-color:#e7ded5}.similar-thumb{height:180px;background:#eee7e0;display:grid;place-items:center;color:#805b4b;font-size:2.5rem}.similar-thumb img{width:100%;height:100%;object-fit:cover}.similar-card .card-body{padding:.9rem}.similar-card small{font-size:.76rem}@media(max-width:767px){.review-grid{grid-template-columns:1fr}.shop-panel{align-items:flex-start;flex-wrap:wrap}.shop-panel .btn{width:100%}.section-heading{align-items:flex-start;flex-direction:column}}
</style>
