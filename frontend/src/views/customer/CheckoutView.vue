<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi, orderApi } from '../../services/customerApi';
import { getDemoCart, getDemoOrder, saveDemoOrder } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const cart = ref({ items: [], totals: {} });
const loading = ref(true);
const error = ref('');
const submitting = ref(false);
const method = ref('VNPAY');
const selectedIds = JSON.parse(sessionStorage.getItem('checkout-item-ids') || 'null');
const checkoutForm = JSON.parse(sessionStorage.getItem('checkout-form') || '{}');
const isDemo = computed(() => route.query.demo === '1');
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const methods = [
  { id: 'VNPAY', title: 'VNPAY', detail: 'Quét mã QR hoặc chuyển hướng sang VNPAY', icon: 'bi-qr-code', connected: true },
  { id: 'MOMO', title: 'Momo', detail: 'Ví điện tử Momo', icon: 'bi-wallet2' },
  { id: 'CARD', title: 'Thẻ ATM / Visa / Master', detail: 'Nhập thông tin thẻ an toàn', icon: 'bi-credit-card' },
  { id: 'WALLET', title: 'Ví hệ thống Clarity', detail: 'Số dư: 0đ', icon: 'bi-wallet' }
];

async function load() {
  try {
    cart.value = isDemo.value ? getDemoCart() : (await cartApi.get()).data;
    if (Array.isArray(selectedIds)) cart.value.items = cart.value.items.filter((item) => selectedIds.includes(item.id));
    cart.value.totals = cart.value.items.reduce((sum, item) => ({ rentalTotal: sum.rentalTotal + item.totals.rentalAmount, depositTotal: sum.depositTotal + item.totals.depositAmount, totalAmount: sum.totalAmount + item.totals.rentalAmount + item.totals.depositAmount }), { rentalTotal: 0, depositTotal: 0, totalAmount: 0 });
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tải thông tin thanh toán.'; }
  finally { loading.value = false; }
}
async function pay() {
  error.value = '';
  if (!cart.value.items.length) { error.value = 'Không có sản phẩm được chọn để thanh toán.'; return; }
  if (method.value !== 'VNPAY') { error.value = 'Momo, thẻ và ví Clarity đang được minh họa theo wireframe; thanh toán trực tiếp hiện dùng VNPAY sandbox.'; return; }
  submitting.value = true;
  if (isDemo.value) {
    const order = getDemoOrder();
    Object.assign(order, checkoutForm, { totalAmount: cart.value.totals.totalAmount, orderItems: cart.value.items.map((item) => ({ id: item.id, productName: item.product.name, quantity: item.quantity, startDate: item.startDate, endDate: item.endDate })) });
    saveDemoOrder(order);
    setTimeout(() => router.push('/customer/checkout/result?demo=1&status=success'), 400);
    return;
  }
  try {
    const response = await orderApi.checkout({ ...checkoutForm, cartItemIds: cart.value.items.map((item) => item.id) });
    sessionStorage.removeItem('checkout-form');
    sessionStorage.removeItem('checkout-item-ids');
    window.location.assign(response.data.paymentUrl);
  } catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tạo thanh toán.'; submitting.value = false; }
}
function simulateFailure() {
  if (!isDemo.value) { error.value = 'Kết quả thất bại chỉ là trạng thái minh họa trong demo.'; return; }
  router.push('/customer/checkout/result?demo=1&status=failed');
}
onMounted(load);
</script>

<template>
  <div class="checkout-page py-4"><div class="container">
    <div class="checkout-steps mb-4"><span class="step done">✓</span><span>Yêu cầu</span><i></i><span class="step active">2</span><span>Thanh toán & cọc</span><i></i><span class="step">3</span><span>Chủ đồ xác nhận</span></div>
    <span class="eyebrow">THANH TOÁN AN TOÀN</span><h1 class="display-6 fw-bold mb-1">Thanh toán & tiền cọc</h1><p class="text-muted mb-4">Tiền được Clarity giữ an toàn cho đến khi đơn thuê hoàn tất.</p>
    <div v-if="loading" class="py-5 text-center">Đang tải thông tin thanh toán...</div>
    <div v-else class="row g-4"><section class="col-lg-7">
      <div v-if="error" class="alert alert-warning">{{ error }}</div>
      <article class="payment-card"><div class="card-body p-4"><h2 class="h5 mb-3">Phương thức thanh toán</h2><label v-for="item in methods" :key="item.id" class="method-option" :class="{ selected: method === item.id }"><input v-model="method" type="radio" name="payment-method" :value="item.id"><i :class="`bi ${item.icon}`"></i><span><strong>{{ item.title }}</strong><small>{{ item.detail }}</small></span><span v-if="item.connected" class="connected-mark"><i class="bi bi-check-circle-fill"></i></span><span v-else class="mock-mark">Mock</span></label></div></article>
      <article v-if="method === 'VNPAY'" class="qr-card mt-3"><div v-if="isDemo" class="qr-art"><span class="qr-corner top-left"></span><span class="qr-corner top-right"></span><span class="qr-corner bottom-left"></span><i class="bi bi-qr-code"></i><b>DEMO</b></div><div><span class="eyebrow">{{ isDemo ? 'VNPAY · MINH HỌA' : 'VNPAY SANDBOX' }}</span><h2 class="h5">{{ isDemo ? 'Quét mã QR hoặc chuyển hướng' : 'Thanh toán qua cổng VNPAY' }}</h2><p class="text-muted mb-2">{{ isDemo ? 'Màn này minh họa bố cục thanh toán trong wireframe.' : 'Bạn sẽ được chuyển đến cổng VNPay sandbox để hoàn tất giao dịch.' }}</p><strong>Số tiền {{ money(cart.totals.totalAmount) }}</strong><small v-if="isDemo" class="d-block text-muted mt-1">Mã QR minh họa · không phải mã thanh toán thật</small><button class="btn btn-primary mt-3" :disabled="submitting" @click="pay">{{ isDemo ? 'Mô phỏng thanh toán' : 'Mở cổng VNPAY' }} <i class="bi bi-box-arrow-up-right ms-1"></i></button></div></article>
      <article class="escrow-card mt-3"><h2 class="h6 mb-3">Quy trình tiền được bảo vệ</h2><div class="escrow-steps"><div><i class="bi bi-shield-lock"></i><strong>Tiền được giữ</strong><small>Clarity giữ tiền thuê và cọc</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-shop"></i><strong>Chủ đồ xác nhận</strong><small>Trong 12 giờ</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-box-seam"></i><strong>Nhận đồ</strong><small>Đồng kiểm</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-arrow-counterclockwise"></i><strong>Hoàn cọc</strong><small>1–3 ngày làm việc</small></div></div></article>
      <div class="d-flex gap-2 mt-3"><button class="btn btn-link" @click="simulateFailure">Xem trạng thái thanh toán thất bại (demo)</button></div>
    </section>

    <aside class="col-lg-5"><div class="summary-card sticky-lg-top"><div class="card-body p-4"><h2 class="h5">Tóm tắt thanh toán</h2><div v-for="item in cart.items" :key="item.id" class="summary-product"><span class="summary-thumb"><img v-if="item.product.images?.[0]?.url" :src="item.product.images[0].url"><i v-else class="bi bi-person-heart"></i></span><div><strong>{{ item.product.name }}</strong><small>{{ checkoutForm.receiverName || 'Người nhận' }} · {{ item.startDate.slice(0, 10) }} – {{ item.endDate.slice(0, 10) }}</small><small>Thuê {{ item.totals.rentalDays }} ngày × {{ money(item.product.pricePerDay) }}</small></div></div><div class="summary-row mt-3"><span>Phí nền tảng</span><span>0đ (chủ đồ chịu 7%)</span></div><div class="summary-row"><span>Tiền thuê</span><strong>{{ money(cart.totals.rentalTotal) }}</strong></div><div class="summary-row"><span>Tiền cọc</span><strong>{{ money(cart.totals.depositTotal) }}</strong></div><div class="summary-total"><span>Tổng thanh toán</span><strong>{{ money(cart.totals.totalAmount) }}</strong></div><button class="btn btn-primary w-100 py-3 mt-2" :disabled="submitting" @click="pay">{{ submitting ? 'Đang chuyển đến VNPay...' : `Tiếp tục · ${money(cart.totals.totalAmount)}` }}</button><p class="security-copy mt-3"><i class="bi bi-lock-fill"></i> Thông tin thanh toán được mã hóa. Clarity không lưu số thẻ; tiền chỉ được chuyển cho chủ đồ sau khi đơn hoàn tất.</p></div></div></aside>
    </div>
  </div></div>
</template>

<style scoped>
.checkout-page{background:#faf8f5;min-height:72vh}.eyebrow{display:block;color:#8c6b52;font-size:.72rem;font-weight:800;letter-spacing:.12em;margin-bottom:.25rem}.checkout-steps{display:flex;align-items:center;gap:.55rem;font-size:.82rem;color:#786f68}.checkout-steps>i{width:36px;height:2px;background:#ded5cc}.step{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#e8e1da;font-size:.8rem;font-weight:700}.step.done,.step.active{background:var(--bs-primary);color:#fff}.payment-card,.qr-card,.escrow-card,.summary-card{background:#fff;border:1px solid #e9e1d9;border-radius:16px}.method-option{display:flex;align-items:center;gap:.8rem;border:1px solid #e4dcd4;border-radius:12px;padding:.85rem;margin-top:.7rem;cursor:pointer}.method-option.selected{border-color:var(--bs-primary);background:#fbf7f3}.method-option input{accent-color:var(--bs-primary)}.method-option>i{font-size:1.3rem;color:#795b48}.method-option small,.summary-product small{display:block;color:#786f68;font-size:.78rem;margin-top:.15rem}.method-option>span:nth-last-child(1){margin-left:auto}.connected-mark{color:#348451}.mock-mark{font-size:.68rem;background:#eee7e0;color:#655d57;padding:.25rem .45rem;border-radius:99px}.qr-card{padding:1.3rem;display:flex;align-items:center;gap:1.3rem}.qr-art{width:142px;height:142px;display:grid;place-content:center;gap:.2rem;position:relative;border:8px solid #fff;outline:1px solid #e4dcd4;background:repeating-conic-gradient(#302a26 0 25%,#fff 0 50%) 0 0/14px 14px;color:#fff;text-shadow:0 1px 3px #000;text-align:center;flex:0 0 auto}.qr-art>i{font-size:2.7rem}.qr-art>b{font-size:.7rem}.qr-corner{position:absolute;width:31px;height:31px;border:5px solid #382d26;background:#fff}.top-left{top:5px;left:5px}.top-right{top:5px;right:5px}.bottom-left{bottom:5px;left:5px}.escrow-card{padding:1.25rem}.escrow-steps{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.escrow-steps>div{display:grid;justify-items:center;text-align:center;gap:.3rem;min-width:0}.escrow-steps>div>i{font-size:1.25rem;color:#765941}.escrow-steps strong{font-size:.75rem}.escrow-steps small{font-size:.67rem;color:#786f68}.escrow-steps>.bi{color:#b6aaa0}.summary-card{padding:1.35rem;position:sticky;top:90px}.summary-product{display:flex;gap:.7rem;border-bottom:1px solid #eee7e0;padding:.85rem 0}.summary-product>div{min-width:0}.summary-product strong{font-size:.87rem}.summary-thumb{width:50px;height:58px;display:grid;place-items:center;flex:0 0 auto;border-radius:8px;background:#f0e5dc;color:#805b4b;overflow:hidden}.summary-thumb img{width:100%;height:100%;object-fit:cover}.summary-row,.summary-total{display:flex;justify-content:space-between;gap:.8rem;margin:.8rem 0;color:#655d57;font-size:.88rem}.summary-total{border-top:1px solid #e9e1d9;padding-top:1rem;font-size:1.05rem;font-weight:700;color:#3f332c}.security-copy{font-size:.77rem;color:#786f68}.security-copy i{color:#348451;margin-right:.25rem}@media(max-width:575px){.qr-card{align-items:flex-start;flex-direction:column}.escrow-steps{align-items:flex-start;flex-direction:column}.escrow-steps>div{grid-template-columns:28px 1fr;text-align:left;justify-items:start}.escrow-steps small{grid-column:2}.escrow-steps>.bi{display:none}.checkout-steps{font-size:.68rem;gap:.3rem}.checkout-steps>i{width:12px}}
</style>
