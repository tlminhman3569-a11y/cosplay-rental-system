<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { cartApi, orderApi, paymentApi } from '../../services/customerApi';
import { getDemoCart, getDemoOrder, saveDemoOrder } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const cart = ref({ items: [], totals: {} });
const loading = ref(true);
const error = ref('');
const submitting = ref(false);
const copied = ref(false);
const method = ref('VNPAY');
const selectedIds = JSON.parse(sessionStorage.getItem('checkout-item-ids') || 'null');
const checkoutForm = JSON.parse(sessionStorage.getItem('checkout-form') || '{}');
const isDemo = computed(() => route.query.demo === '1');
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

function copyCard() {
  navigator.clipboard.writeText('9704198526191432198');
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

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
  try {
    if (isDemo.value) {
      const order = getDemoOrder();
      const checkoutRef = `CHK-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      Object.assign(order, checkoutForm, {
        checkoutRef,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        totalAmount: cart.value.totals.totalAmount,
        orderItems: cart.value.items.map((item) => ({ id: item.id, productName: item.product.name, quantity: item.quantity, startDate: item.startDate, endDate: item.endDate })),
        statusHistory: [{ status: 'PENDING', createdAt: new Date().toISOString(), note: 'Đơn đã thanh toán qua VNPay, đang chờ shop xác nhận.' }]
      });
      saveDemoOrder(order);

      const response = await paymentApi.createUrl({
        amount: cart.value.totals.totalAmount,
        checkoutRef,
        orderInfo: `Thanh toan don thue ${checkoutRef}`
      });
      const targetUrl = response?.paymentUrl || response?.data?.paymentUrl;
      if (!targetUrl) throw new Error('Không nhận được URL thanh toán từ VNPay server.');
      window.location.assign(targetUrl);
      return;
    }

    const response = await orderApi.checkout({ ...checkoutForm, cartItemIds: cart.value.items.map((item) => item.id) });
    sessionStorage.removeItem('checkout-form');
    sessionStorage.removeItem('checkout-item-ids');
    const targetUrl = response?.paymentUrl || response?.data?.paymentUrl;
    if (!targetUrl) throw new Error('Không nhận được URL thanh toán từ VNPay server.');
    window.location.assign(targetUrl);
  } catch (requestError) {
    console.error('Lỗi thanh toán VNPay:', requestError);
    error.value = requestError.response?.data?.error?.message || requestError.message || 'Không thể tạo thanh toán VNPay.';
    submitting.value = false;
  }
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
      <article v-if="method === 'VNPAY'" class="qr-card mt-3"><div class="qr-art"><span class="qr-corner top-left"></span><span class="qr-corner top-right"></span><span class="qr-corner bottom-left"></span><i class="bi bi-qr-code"></i><b>VNPAY</b></div><div><span class="eyebrow">CỔNG VNPAY SANDBOX</span><h2 class="h5">Thanh toán qua cổng VNPAY</h2><p class="text-muted mb-2">Bạn sẽ được chuyển đến Cổng thanh toán VNPay Sandbox chính thức để xác nhận giao dịch.</p><strong>Số tiền {{ money(cart.totals.totalAmount) }}</strong><div class="mt-2 p-2 bg-light rounded border small"><div class="d-flex justify-content-between align-items-center"><span><strong>Thẻ test NCB:</strong> <code>9704198526191432198</code></span><button class="btn btn-sm btn-outline-primary py-0 px-2" type="button" @click="copyCard"><i class="bi" :class="copied ? 'bi-check2' : 'bi-clipboard'"></i> {{ copied ? 'Đã copy' : 'Sao chép' }}</button></div><div class="text-muted mt-1">Tên: <code>NGUYEN VAN A</code> · Ngày: <code>07/15</code> · OTP: <code>123456</code></div></div><button class="btn btn-primary mt-3" :disabled="submitting" @click="pay">{{ submitting ? 'Đang mở VNPay...' : 'Mở cổng VNPAY Sandbox' }} <i class="bi bi-box-arrow-up-right ms-1"></i></button></div></article>

      <article class="escrow-card mt-3"><h2 class="h6 mb-3">Quy trình tiền được bảo vệ</h2><div class="escrow-steps"><div><i class="bi bi-shield-lock"></i><strong>Tiền được giữ</strong><small>Clarity giữ tiền thuê và cọc</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-shop"></i><strong>Chủ đồ xác nhận</strong><small>Trong 12 giờ</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-box-seam"></i><strong>Nhận đồ</strong><small>Đồng kiểm</small></div><i class="bi bi-chevron-right"></i><div><i class="bi bi-arrow-counterclockwise"></i><strong>Hoàn cọc</strong><small>1–3 ngày làm việc</small></div></div></article>
      <div class="d-flex gap-2 mt-3"><button class="btn btn-link" @click="simulateFailure">Xem trạng thái thanh toán thất bại (demo)</button></div>
    </section>

    <aside class="col-lg-5"><div class="summary-card sticky-lg-top"><div class="card-body p-4"><h2 class="h5">Tóm tắt thanh toán</h2><div v-for="item in cart.items" :key="item.id" class="summary-product"><span class="summary-thumb"><img v-if="item.product.images?.[0]?.url" :src="item.product.images[0].url"><i v-else class="bi bi-person-heart"></i></span><div><strong>{{ item.product.name }}</strong><small>{{ checkoutForm.receiverName || 'Người nhận' }} · {{ item.startDate.slice(0, 10) }} – {{ item.endDate.slice(0, 10) }}</small><small>Thuê {{ item.totals.rentalDays }} ngày × {{ money(item.product.pricePerDay) }}</small></div></div><div class="summary-row mt-3"><span>Phí nền tảng</span><span>0đ (chủ đồ chịu 7%)</span></div><div class="summary-row"><span>Tiền thuê</span><strong>{{ money(cart.totals.rentalTotal) }}</strong></div><div class="summary-row"><span>Tiền cọc</span><strong>{{ money(cart.totals.depositTotal) }}</strong></div><div class="summary-total"><span>Tổng thanh toán</span><strong>{{ money(cart.totals.totalAmount) }}</strong></div><button class="btn btn-primary w-100 py-3 mt-2" :disabled="submitting" @click="pay">{{ submitting ? 'Đang chuyển đến VNPay...' : `Tiếp tục · ${money(cart.totals.totalAmount)}` }}</button><p class="security-copy mt-3"><i class="bi bi-lock-fill"></i> Thông tin thanh toán được mã hóa. Clarity không lưu số thẻ; tiền chỉ được chuyển cho chủ đồ sau khi đơn hoàn tất.</p></div></div></aside>
    </div>
  </div></div>
</template>

<style scoped lang="scss" src="../../assets/css/customer/checkout.scss"></style>

