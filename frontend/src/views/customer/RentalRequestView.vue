<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi } from '../../services/customerApi';
import { getDemoCart } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const cart = ref({ items: [], totals: {} });
const loading = ref(true);
const error = ref('');
const saved = JSON.parse(sessionStorage.getItem('checkout-form') || '{}');
const selectedIds = JSON.parse(sessionStorage.getItem('checkout-item-ids') || 'null');
const carriers = [
  { name: 'Giao qua GHN', fee: 35000, eta: '1–2 ngày', method: 'DELIVERY' },
  { name: 'Grab Express', fee: 45000, eta: 'Trong ngày', method: 'DELIVERY' },
  { name: 'Viettel Post', fee: 30000, eta: '2–3 ngày', method: 'DELIVERY' },
  { name: 'GHTK', fee: 32000, eta: '1–3 ngày', method: 'DELIVERY' },
  { name: 'Chủ đồ tự giao', fee: 0, eta: 'Thỏa thuận với chủ đồ', method: 'DELIVERY' },
  { name: 'Khách tự lấy', fee: 0, eta: 'Nhận tại shop', method: 'PICKUP' }
];
const form = ref({
  receiverName: saved.receiverName || '', receiverPhone: saved.receiverPhone || '',
  shippingAddress: saved.shippingAddress || '', city: saved.city || '',
  shippingProvider: saved.shippingProvider || carriers[0].name,
  shippingMethod: saved.shippingMethod || 'DELIVERY', note: saved.note || '', agreed: saved.agreed || false
});
const isDemo = computed(() => route.query.demo === '1');
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const shipping = computed(() => carriers.find((carrier) => carrier.name === form.value.shippingProvider) || carriers[0]);
const rentalRange = computed(() => {
  const dates = cart.value.items.flatMap((item) => [item.startDate, item.endDate]).filter(Boolean).sort();
  if (!dates.length) return 'Chưa chọn ngày thuê';
  const format = (date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${format(dates[0])} – ${format(dates.at(-1))}`;
});

async function load() {
  loading.value = true;
  try {
    cart.value = isDemo.value ? getDemoCart() : (await cartApi.get()).data;
    if (Array.isArray(selectedIds)) cart.value.items = cart.value.items.filter((item) => selectedIds.includes(item.id));
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tải giỏ thuê.'; }
  finally { loading.value = false; }
}
function continueToPayment() {
  error.value = '';
  if (!cart.value.items.length) { error.value = 'Giỏ thuê đang trống. Hãy chọn trang phục trước.'; return; }
  if (!form.value.receiverName || !form.value.receiverPhone || !form.value.shippingAddress || !form.value.city) { error.value = 'Hãy điền đầy đủ thông tin giao nhận.'; return; }
  if (!form.value.agreed) { error.value = 'Bạn cần đồng ý đồng kiểm khi nhận và trả đồ.'; return; }
  sessionStorage.setItem('checkout-form', JSON.stringify(form.value));
  router.push(isDemo.value ? '/customer/checkout?demo=1' : '/customer/checkout');
}
onMounted(load);
</script>

<template>
  <div class="request-page py-4"><div class="container">
    <div class="request-steps mb-4"><span class="step active">1</span><span>Yêu cầu</span><i></i><span class="step">2</span><span>Thanh toán & cọc</span><i></i><span class="step">3</span><span>Chủ đồ xác nhận</span></div>
    <span class="eyebrow">GỬI YÊU CẦU THUÊ</span><h1 class="display-6 fw-bold mb-1">Thông tin thuê và nhận đồ</h1><p class="text-muted mb-4">Kiểm tra thời gian thuê, chọn cách nhận và xác nhận địa chỉ.</p>
    <div v-if="loading" class="py-5 text-center">Đang tải yêu cầu thuê...</div>
    <div v-else class="row g-4">
      <section class="col-lg-8">
        <div v-if="error" class="alert alert-warning">{{ error }}</div>
        <article class="request-card mb-3"><div class="card-body p-4"><div class="d-flex align-items-start gap-3"><span class="section-icon"><i class="bi bi-calendar2-check"></i></span><div><h2 class="h5 mb-1">Thời gian thuê</h2><p class="mb-0 text-muted">{{ rentalRange }}</p></div></div><div v-for="item in cart.items" :key="item.id" class="rental-line"><span class="costume-mark"><img v-if="item.product.images?.[0]?.url" :src="item.product.images[0].url"><i v-else class="bi bi-person-heart"></i></span><div class="flex-grow-1"><strong>{{ item.product.name }}</strong><small>{{ item.product.shop?.name }} · Size {{ item.product.size }} · {{ item.totals.rentalDays }} ngày × {{ money(item.product.pricePerDay) }}</small></div><strong>{{ money(item.totals.rentalAmount) }}</strong></div></div></article>
        <article class="request-card"><div class="card-body p-4"><div class="d-flex align-items-center gap-3 mb-4"><span class="section-icon"><i class="bi bi-truck"></i></span><h2 class="h5 mb-0">Hình thức nhận đồ</h2></div><div class="carrier-grid"><label v-for="carrier in carriers" :key="carrier.name" :class="{ selected: form.shippingProvider === carrier.name }"><input v-model="form.shippingProvider" :value="carrier.name" type="radio" @change="form.shippingMethod = carrier.method"><i :class="`bi ${carrier.method === 'PICKUP' ? 'bi-shop' : 'bi-truck'}`"></i><span><strong>{{ carrier.name }}</strong><small>{{ carrier.fee ? `${money(carrier.fee)} · ${carrier.eta}` : `Miễn phí · ${carrier.eta}` }}</small></span></label></div></div></article>
        <article class="request-card mt-3"><div class="card-body p-4"><div class="d-flex align-items-center gap-3 mb-4"><span class="section-icon"><i class="bi bi-geo-alt"></i></span><h2 class="h5 mb-0">Địa chỉ nhận</h2></div><div class="row g-3"><label class="col-md-6 form-label">Họ tên<input v-model="form.receiverName" class="form-control mt-1" placeholder="Họ và tên người nhận"></label><label class="col-md-6 form-label">Số điện thoại<input v-model="form.receiverPhone" class="form-control mt-1" inputmode="tel" placeholder="0912 334 881"></label><label class="col-12 form-label">Địa chỉ<input v-model="form.shippingAddress" class="form-control mt-1" placeholder="Số nhà, đường, phường/xã"></label><label class="col-12 form-label">Tỉnh / thành phố<input v-model="form.city" class="form-control mt-1" placeholder="Ví dụ: Hà Nội"></label><label class="col-12 form-label">Lời nhắn cho chủ đồ<textarea v-model="form.note" class="form-control mt-1" rows="3" placeholder="Ví dụ: Mình cần nhận trước 10:00 ngày nhận đồ..."></textarea></label><label class="col-12 agreement"><input v-model="form.agreed" type="checkbox"><span>Tôi đồng ý <a href="#rental-policy">chính sách thuê</a> và đồng kiểm khi nhận/trả đồ.</span></label></div></div></article>
        <article id="rental-policy" class="request-card mt-3"><div class="card-body p-4"><h2 class="h6"><i class="bi bi-shield-check me-2"></i>Chính sách thuê</h2><p class="small text-muted mb-0">Tiền cọc được giữ trong thời gian thuê; hai bên đồng kiểm tình trạng trang phục khi nhận và khi trả. Phí giao hàng thanh toán riêng cho đơn vị vận chuyển.</p></div></article>
      </section>
      <aside class="col-lg-4"><div class="summary-card"><div class="card-body p-4"><h2 class="h5">Tóm tắt đơn</h2><div v-for="item in cart.items" :key="item.id" class="summary-product"><span class="summary-thumb"><img v-if="item.product.images?.[0]?.url" :src="item.product.images[0].url"><i v-else class="bi bi-person-heart"></i></span><div><strong>{{ item.product.name }}</strong><small>{{ item.product.shop?.name }} · Size {{ item.product.size }}</small><small>{{ item.totals.rentalDays }} ngày × {{ money(item.product.pricePerDay) }}</small></div></div><div class="summary-row mt-3"><span>Phí nền tảng</span><span>0đ (chủ đồ chịu 7%)</span></div><div class="summary-row"><span>Tiền thuê</span><strong>{{ money(cart.totals.rentalTotal) }}</strong></div><div class="summary-row"><span>Tiền cọc</span><strong>{{ money(cart.totals.depositTotal) }}</strong></div><hr><div class="d-flex justify-content-between fs-5 fw-bold"><span>Tổng thanh toán</span><span class="text-primary">{{ money(cart.totals.totalAmount) }}</span></div><p class="delivery-note">Phí giao {{ money(shipping.fee) }} trả cho đơn vị vận chuyển khi nhận đồ, không nằm trong tổng trên.</p><button class="btn btn-primary w-100 py-3" @click="continueToPayment">Tiếp tục thanh toán <i class="bi bi-arrow-right ms-1"></i></button><p class="small text-muted text-center mb-0 mt-3">Shop xác nhận trong 12 giờ; từ chối hoặc quá hạn sẽ hoàn 100%.</p></div></div></aside>
    </div>
  </div></div>
</template>

<style scoped>
.request-page{background:#faf8f5;min-height:72vh}.eyebrow{color:#8c6b52;font-size:.75rem;font-weight:800;letter-spacing:.12em}.request-steps{display:flex;align-items:center;gap:.55rem;font-size:.84rem;color:#786f68}.request-steps i{width:34px;height:2px;background:#ded5cc}.step{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#e8e1da;font-size:.8rem;font-weight:700}.step.active{background:var(--bs-primary);color:#fff}.request-card,.summary-card{background:#fff;border:1px solid #e9e1d9;border-radius:16px}.section-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f0e5dc;color:var(--bs-primary);font-size:1.2rem}.rental-line{display:flex;align-items:center;gap:1rem;border-top:1px solid #eee7e0;margin-top:1.25rem;padding-top:1.25rem}.rental-line small,.summary-product small{display:block;color:#786f68;margin-top:.2rem}.costume-mark,.summary-thumb{display:grid;place-items:center;width:48px;height:56px;border-radius:9px;background:#f0e5dc;color:#805b4b;font-size:1.25rem;overflow:hidden;flex:0 0 auto}.costume-mark img,.summary-thumb img{width:100%;height:100%;object-fit:cover}.carrier-grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.carrier-grid label{display:flex;align-items:center;gap:.65rem;border:1px solid #ded5cc;border-radius:12px;padding:.8rem;cursor:pointer}.carrier-grid label.selected{border-color:var(--bs-primary);background:#fcf6f1}.carrier-grid input,.agreement input{accent-color:var(--bs-primary)}.carrier-grid i{font-size:1.25rem;color:var(--bs-primary)}.carrier-grid small{display:block;color:#786f68;font-size:.77rem;margin-top:.12rem}.agreement{display:flex;align-items:flex-start;gap:.6rem;border-top:1px solid #eee7e0;padding-top:1rem}.agreement input{margin-top:.25rem}.summary-product{display:flex;gap:.7rem;border-bottom:1px solid #eee7e0;padding:.8rem 0}.summary-product>div{min-width:0}.summary-product strong{font-size:.86rem}.summary-row{display:flex;justify-content:space-between;gap:1rem;margin:.8rem 0;color:#655d57;font-size:.88rem}.delivery-note{padding:.7rem;border-radius:8px;background:#f8f5f1;color:#655d57;font-size:.78rem}@media(max-width:575px){.carrier-grid{grid-template-columns:1fr}.request-steps{font-size:.7rem;gap:.3rem}.request-steps i{width:14px}}
</style>
