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
    <div class="result-actions"><button v-if="successful" class="btn btn-primary" @click="router.push(route.query.demo === '1' ? '/customer/orders/demo-order/pending?demo=1' : '/customer/orders')">Xem trạng thái đơn</button><button v-else class="btn btn-primary" @click="router.push(route.query.demo === '1' ? '/customer/checkout?demo=1' : '/customer/checkout')">Thử thanh toán lại</button><button class="btn btn-outline-primary" @click="router.push(route.query.demo === '1' ? '/customer/orders?demo=1' : '/customer/orders')">{{ successful ? 'Danh sách đơn của tôi' : 'Đổi phương thức' }}</button></div>
    <p v-if="!successful" class="small text-muted mt-4 mb-0">Nếu giao dịch bị trừ tiền nhưng trạng thái thất bại, vui lòng chờ ngân hàng cập nhật và liên hệ hỗ trợ.</p>
  </section></div></main>
</template>

<style scoped lang="scss" src="../../assets/css/customer/checkout-result.scss"></style>

