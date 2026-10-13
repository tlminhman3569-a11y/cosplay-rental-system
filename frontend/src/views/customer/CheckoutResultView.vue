<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getDemoOrder } from '../../mock/customerDemo';

const route = useRoute();
const router = useRouter();
const successful = computed(() => route.query.status === 'success');
const demoOrder = computed(() => route.query.demo === '1' ? getDemoOrder() : null);
const amount = computed(() => Number(route.query.amount) || demoOrder.value?.totalAmount || 0);
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
</script>

<template>
  <main class="result-page py-5"><div class="container"><section class="result-card">
    <div class="result-icon" :class="successful ? 'success' : 'failed'"><i :class="`bi ${successful ? 'bi-check-lg' : 'bi-x-lg'}`"></i></div>
    <span class="eyebrow">KẾT QUẢ THANH TOÁN</span>
    <h1 class="display-6 fw-bold">{{ successful ? 'Thanh toán thành công' : 'Thanh toán thất bại' }}</h1>
    <p class="text-muted">{{ successful ? 'Đơn thuê đang chờ chủ đồ xác nhận. Tiền được Clarity giữ trong thời gian xử lý đơn.' : 'Giao dịch chưa hoàn tất. Bạn chưa bị trừ tiền; hãy kiểm tra lại và thử thanh toán lần nữa.' }}</p>
    <div class="transaction-box"><div><span>Mã giao dịch</span><strong>{{ route.query.vnp_TxnRef || demoOrder?.checkoutRef || 'TX-DEMO-99812' }}</strong></div><div><span>Số tiền</span><strong>{{ money(amount) }}</strong></div><div><span>Phương thức</span><strong>VNPAY</strong></div><div><span>Trạng thái đơn</span><strong>{{ successful ? 'Chờ chủ đồ xác nhận' : 'Chưa thanh toán' }}</strong></div></div>
    <div class="result-actions"><button v-if="successful" class="btn btn-primary" @click="router.push(route.query.demo === '1' ? '/customer/orders?demo=1' : '/customer/orders')">Xem trạng thái đơn</button><button v-else class="btn btn-primary" @click="router.push(route.query.demo === '1' ? '/customer/checkout?demo=1' : '/customer/checkout')">Thử thanh toán lại</button><button class="btn btn-outline-primary" @click="router.push(route.query.demo === '1' ? '/customer/demo' : '/')">{{ successful ? 'Về trang chủ' : 'Đổi phương thức' }}</button></div>
    <p v-if="!successful" class="small text-muted mt-4 mb-0">Nếu giao dịch bị trừ tiền nhưng trạng thái thất bại, vui lòng chờ ngân hàng cập nhật và liên hệ hỗ trợ.</p>
  </section></div></main>
</template>

<style scoped>
.result-page{min-height:72vh;background:#faf8f5}.result-card{max-width:720px;margin:0 auto;padding:clamp(1.5rem,5vw,3.5rem);background:#fff;border:1px solid #e9e1d9;border-radius:22px;text-align:center}.result-icon{width:74px;height:74px;margin:0 auto 1.3rem;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:2rem}.result-icon.success{background:#348451}.result-icon.failed{background:#a84934}.eyebrow{color:#8c6b52;font-size:.72rem;font-weight:800;letter-spacing:.12em}.result-card h1{margin:.45rem 0}.transaction-box{margin:1.8rem 0;padding:1rem 1.2rem;background:#f8f5f1;border-radius:14px;text-align:left}.transaction-box>div{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 0;border-bottom:1px solid #e7ded5}.transaction-box>div:last-child{border-bottom:0}.transaction-box span{color:#786f68}.transaction-box strong{text-align:right;color:#463a32}.result-actions{display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap}@media(max-width:575px){.transaction-box>div{align-items:flex-start;flex-direction:column;gap:.2rem}.transaction-box strong{text-align:left}}
</style>
