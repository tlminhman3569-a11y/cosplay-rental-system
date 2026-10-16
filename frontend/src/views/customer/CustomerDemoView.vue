<script setup>
import { useRouter } from 'vue-router';
import { resetCustomerDemo } from '../../mock/customerDemo';
const router = useRouter();
const screens = [
  ['R07 · Chi tiết sản phẩm', '/products/demo?demo=1'], ['R25 · Giỏ thuê', '/customer/cart?demo=1'],
  ['R08 · Gửi yêu cầu thuê', '/customer/rental-request?demo=1'], ['R09 · Thanh toán', '/customer/checkout?demo=1'],
  ['R11 · Đơn thuê của tôi', '/customer/orders?demo=1'], ['R10 · Chờ duyệt', '/customer/orders/demo-order/pending?demo=1'],
  ['R13 · Nhận đồ', '/customer/orders/demo-order/receive?demo=1'], ['R14 · Trả đồ', '/customer/orders/demo-order/return?demo=1'],
  ['R12 · Theo dõi đơn', '/customer/orders/demo-order?demo=1'], ['R15 · Hoàn cọc', '/customer/orders/demo-order/refund?demo=1'],
  ['R20 · Hủy đơn', '/customer/orders/demo-order/cancel?demo=1'], ['R16 · Đánh giá', '/customer/orders/demo-order/review?demo=1'],
  ['R17 · Khiếu nại', '/customer/orders/demo-order/complaint?demo=1']
];
function resetDemo() { resetCustomerDemo(); router.go(); }
</script>
<template><div class="demo-page py-5"><div class="container"><div class="demo-hero"><div><span class="badge text-bg-secondary mb-2">CHẾ ĐỘ DEMO</span><h1 class="display-6 fw-bold">Màn hình khách thuê của Huy</h1><p class="mb-0">Chạy thử toàn bộ luồng xem đồ, giỏ thuê, thanh toán và 10 giai đoạn đơn mà không cần MongoDB hay VNPay.</p></div><button class="btn btn-outline-primary align-self-start" @click="resetDemo"><i class="bi bi-arrow-counterclockwise me-1"></i>Đặt lại demo</button></div><div class="row g-3 mt-2"><div v-for="([name, link], index) in screens" :key="link" class="col-md-6 col-lg-4"><router-link :to="link" class="card h-100 text-decoration-none text-dark demo-card"><div class="card-body d-flex gap-3"><span class="demo-number">{{ String(index + 1).padStart(2, '0') }}</span><div><div class="fw-semibold">{{ name }}</div><small class="text-muted">Mở màn hình demo</small></div><i class="bi bi-arrow-up-right ms-auto"></i></div></router-link></div></div></div></div></template>
<style scoped lang="scss" src="../../assets/css/customer/customer-demo.scss"></style>

