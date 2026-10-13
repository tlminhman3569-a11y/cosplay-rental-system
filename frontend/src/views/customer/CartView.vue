<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi } from '../../services/customerApi';
import { getDemoCart, saveDemoCart } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const cart = ref({ items: [], totals: {} });
const error = ref('');
const loading = ref(true);
const selectedIds = ref([]);
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const groups = computed(() => {
  const map = new Map();
  for (const item of cart.value.items) {
    const key = item.product.shop?.id || item.product.shop?.name || 'shop-unknown';
    if (!map.has(key)) map.set(key, { id: key, shop: item.product.shop || { name: 'Clarity shop' }, items: [] });
    map.get(key).items.push(item);
  }
  return [...map.values()];
});
const selectedItems = computed(() => cart.value.items.filter((item) => selectedIds.value.includes(item.id)));
const selectedTotals = computed(() => selectedItems.value.reduce((result, item) => ({
  rental: result.rental + (item.totals?.rentalAmount || 0), deposit: result.deposit + (item.totals?.depositAmount || 0)
}), { rental: 0, deposit: 0 }));
const selectedShopCount = computed(() => new Set(selectedItems.value.map((item) => item.product.shop?.id || item.product.shop?.name || 'shop-unknown')).size);
const allSelected = computed(() => cart.value.items.length > 0 && selectedIds.value.length === cart.value.items.length);

async function load() {
  loading.value = true;
  try {
    cart.value = route.query.demo === '1' ? getDemoCart() : (await cartApi.get()).data;
    const ids = cart.value.items.map((item) => item.id);
    const saved = JSON.parse(sessionStorage.getItem('checkout-item-ids') || 'null');
    selectedIds.value = Array.isArray(saved) ? saved.filter((id) => ids.includes(id)) : ids;
  } catch (requestError) {
    error.value = requestError.response?.data?.error?.message || 'Không thể tải giỏ thuê.';
  } finally { loading.value = false; }
}
function toggleAll(event) { selectedIds.value = event.target.checked ? cart.value.items.map((item) => item.id) : []; }
async function remove(id) {
  error.value = '';
  try {
    if (route.query.demo === '1') {
      cart.value.items = cart.value.items.filter((item) => item.id !== id);
      saveDemoCart(cart.value);
    } else await cartApi.remove(id);
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id);
    sessionStorage.setItem('checkout-item-ids', JSON.stringify(selectedIds.value));
    if (route.query.demo !== '1') await load();
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể xóa sản phẩm khỏi giỏ.'; }
}
async function changeItem(item, field, value) {
  error.value = '';
  try {
    if (route.query.demo === '1') {
      item[field] = value;
      saveDemoCart(cart.value);
      cart.value = getDemoCart();
    } else { await cartApi.update(item.id, { [field]: value }); await load(); }
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể cập nhật sản phẩm.'; await load(); }
}
function continueCheckout() {
  if (!selectedItems.value.length) { error.value = 'Chọn ít nhất một sản phẩm để tiếp tục.'; return; }
  sessionStorage.setItem('checkout-item-ids', JSON.stringify(selectedIds.value));
  router.push(route.query.demo === '1' ? '/customer/rental-request?demo=1' : '/customer/rental-request');
}
onMounted(load);
</script>

<template>
  <div class="cart-page py-4"><div class="container">
    <nav class="small text-muted mb-3">Khám phá đồ › <strong>Giỏ thuê</strong></nav>
    <div class="d-flex justify-content-between align-items-end gap-3 mb-3"><div><span class="eyebrow">GIỎ THUÊ</span><h1 class="display-6 fw-bold mb-1">Giỏ thuê ({{ cart.items.length }})</h1><p class="text-muted mb-0">Chọn sản phẩm muốn thanh toán cùng lúc.</p></div><label v-if="cart.items.length" class="select-all"><input type="checkbox" :checked="allSelected" @change="toggleAll"> Chọn tất cả ({{ cart.items.length }})</label></div>
    <div v-if="loading" class="py-5 text-center">Đang tải giỏ thuê...</div>
    <div v-else-if="error && !cart.items.length" class="alert alert-warning">{{ error }}</div>
    <div v-else class="row g-4"><section class="col-lg-8">
      <div v-if="error" class="alert alert-warning">{{ error }}</div>
      <div v-if="!cart.items.length" class="empty-cart text-center"><i class="bi bi-bag-x fs-1"></i><h2 class="h5 mt-3">Giỏ thuê đang trống</h2><router-link :to="route.query.demo === '1' ? '/customer/demo' : '/'" class="btn btn-primary mt-2">Tiếp tục xem đồ</router-link></div>
      <section v-for="group in groups" :key="group.id" class="shop-group mb-3">
        <header class="shop-heading"><span class="shop-avatar">{{ group.shop.name.slice(0, 1) }}</span><div><strong>{{ group.shop.name }}</strong><small>{{ group.shop.region || 'Chủ cho thuê trên Clarity' }}</small></div></header>
        <article v-for="item in group.items" :key="item.id" class="cart-item">
          <input v-model="selectedIds" class="item-select" type="checkbox" :value="item.id" :aria-label="`Chọn ${item.product.name}`">
          <div class="cart-image"><img v-if="item.product.images?.[0]?.url" :src="item.product.images[0].url" :alt="item.product.name"><i v-else class="bi bi-person-bounding-box"></i></div>
          <div class="flex-grow-1"><div class="item-title-row"><div><h2 class="h5 mb-1">{{ item.product.name }}</h2><small class="text-muted">Size {{ item.product.size || 'Linh hoạt' }} · {{ (item.selectedAccessories || []).length ? 'Có phụ kiện thuê kèm' : 'Trang phục chính' }}</small></div><button class="remove-button" aria-label="Xóa sản phẩm" @click="remove(item.id)"><i class="bi bi-trash3"></i><span>Xóa</span></button></div>
            <div class="rental-dates mt-3"><label>Ngày nhận<input :value="item.startDate.slice(0, 10)" type="date" class="form-control mt-1" @change="changeItem(item, 'startDate', $event.target.value)"></label><span class="date-arrow">→</span><label>Ngày trả<input :value="item.endDate.slice(0, 10)" type="date" class="form-control mt-1" @change="changeItem(item, 'endDate', $event.target.value)"></label></div>
            <div class="item-footer"><div class="quantity"><button :disabled="item.quantity <= 1" @click="changeItem(item, 'quantity', item.quantity - 1)">−</button><strong>{{ item.quantity }}</strong><button :disabled="item.quantity >= item.product.quantity" @click="changeItem(item, 'quantity', item.quantity + 1)">+</button></div><div class="availability"><i class="bi bi-check-circle-fill"></i> Còn trống</div><div class="item-prices"><strong>{{ money(item.totals.rentalAmount) }}</strong><small>Cọc {{ money(item.totals.depositAmount) }}</small></div></div>
          </div>
        </article>
      </section>
    </section>

    <aside class="col-lg-4"><div class="order-summary sticky-lg-top"><h2 class="h5">Tóm tắt giỏ thuê</h2><div class="summary-row mt-4"><span>Tiền thuê ({{ selectedItems.length }} sản phẩm)</span><strong>{{ money(selectedTotals.rental) }}</strong></div><div class="summary-row"><span>Phí nền tảng</span><span>0đ <small>(chủ đồ chịu 7%)</small></span></div><div class="summary-row"><span>Tiền cọc (hoàn lại)</span><strong>{{ money(selectedTotals.deposit) }}</strong></div><div class="summary-total"><span>Tổng thanh toán</span><strong>{{ money(selectedTotals.rental + selectedTotals.deposit) }}</strong></div><div class="split-note"><i class="bi bi-shop"></i><span>Giỏ được tách thành <strong>{{ selectedShopCount }} đơn riêng</strong> theo từng gian hàng.</span></div><p class="small text-muted">Mỗi chủ đồ xác nhận trong 12 giờ; từ chối hoặc quá hạn thì hoàn 100% phần của đơn đó.</p><button :disabled="!selectedItems.length" class="btn btn-primary w-100 py-3" @click="continueCheckout">Tiến hành thanh toán <i class="bi bi-arrow-right ms-1"></i></button><button class="btn btn-outline-primary w-100 mt-2" @click="router.push(route.query.demo === '1' ? '/customer/demo' : '/')">Tiếp tục xem đồ</button><p class="small text-muted mt-3 mb-0">Ngày thuê chỉ được giữ chỗ sau khi thanh toán.</p></div></aside>
    </div>
  </div></div>
</template>

<style scoped>
.cart-page{background:#faf8f5;min-height:72vh}.eyebrow{color:#8c6b52;font-size:.75rem;font-weight:800;letter-spacing:.12em}.select-all{white-space:nowrap;color:#55483f;font-size:.9rem}.select-all input,.item-select{accent-color:var(--bs-primary);width:18px;height:18px}.shop-group,.order-summary,.empty-cart{background:#fff;border:1px solid #e9e1d9;border-radius:16px;overflow:hidden}.shop-heading{display:flex;align-items:center;gap:.75rem;padding:1rem 1.2rem;background:#f7f3ef;border-bottom:1px solid #e9e1d9}.shop-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#e7d8ca;color:#5a4538;font-weight:700}.shop-heading small{display:block;color:#786f68;margin-top:.1rem}.cart-item{display:flex;align-items:flex-start;gap:.85rem;padding:1.25rem;border-bottom:1px solid #eee7e0}.cart-item:last-child{border-bottom:0}.item-select{margin-top:.25rem;flex:0 0 auto}.cart-image{width:94px;height:118px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;overflow:hidden;background:#eee7e0;color:#806b5a;font-size:1.8rem}.cart-image img{width:100%;height:100%;object-fit:cover}.item-title-row{display:flex;justify-content:space-between;gap:1rem}.remove-button{border:0;background:transparent;color:#9e4939;display:flex;gap:.35rem;align-items:center;font-size:.85rem}.rental-dates{display:flex;align-items:end;gap:.65rem}.rental-dates label{font-size:.75rem;color:#786f68;flex:1}.date-arrow{padding-bottom:.55rem;color:#8c6b52}.item-footer{display:flex;align-items:center;gap:1rem;margin-top:1rem}.quantity{display:flex;align-items:center;border:1px solid #ded5cc;border-radius:8px;overflow:hidden}.quantity button{border:0;background:#f8f5f1;width:30px;height:30px}.quantity button:disabled{color:#b9b0a8}.quantity strong{min-width:28px;text-align:center}.availability{font-size:.78rem;color:#348451;white-space:nowrap}.item-prices{margin-left:auto;text-align:right}.item-prices strong,.item-prices small{display:block}.item-prices strong{color:#a84934}.item-prices small{font-size:.76rem;color:#786f68;margin-top:.2rem}.order-summary{padding:1.35rem;position:sticky;top:90px}.summary-row,.summary-total{display:flex;justify-content:space-between;gap:.8rem;margin:.9rem 0;color:#655d57;font-size:.9rem}.summary-row small{font-size:.75rem}.summary-total{border-top:1px solid #e9e1d9;padding-top:1rem;color:#3f332c;font-size:1.1rem;font-weight:700}.split-note{display:flex;align-items:flex-start;gap:.6rem;background:#f7f1ea;border-radius:10px;padding:.8rem;color:#5d4c40;font-size:.85rem}.split-note i{color:#8c6b52}.order-summary>p{font-size:.8rem;margin:.85rem 0}.empty-cart{text-align:center;padding:3rem 1rem}@media(max-width:575px){.cart-item{padding:.9rem;gap:.55rem}.cart-image{width:64px;height:84px}.item-title-row{align-items:flex-start}.item-title-row .h5{font-size:.95rem}.rental-dates{gap:.3rem}.item-footer{flex-wrap:wrap}.availability{order:3}.item-prices{margin-left:auto}.select-all{font-size:.78rem}}
</style>
