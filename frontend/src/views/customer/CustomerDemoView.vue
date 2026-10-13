<script setup>
const screens = [
  ['R07 · Chi tiết sản phẩm', '/products/demo?demo=1'], ['R25 · Giỏ thuê', '/customer/cart?demo=1'],
  ['R08 · Gửi yêu cầu thuê', '/customer/rental-request?demo=1'], ['R09 · Thanh toán', '/customer/checkout?demo=1'],
  ['R11 · Đơn thuê của tôi', '/customer/orders?demo=1'], ['R10 · Chờ duyệt', '/customer/orders/demo-order/pending?demo=1'],
  ['R13 · Nhận đồ', '/customer/orders/demo-order/receive?demo=1'], ['R14 · Trả đồ', '/customer/orders/demo-order/return?demo=1'],
  ['R12 · Theo dõi đơn', '/customer/orders/demo-order?demo=1'], ['R15 · Hoàn cọc', '/customer/orders/demo-order/refund?demo=1'],
  ['R20 · Hủy đơn', '/customer/orders/demo-order/cancel?demo=1'], ['R16 · Đánh giá', '/customer/orders/demo-order/review?demo=1'],
  ['R17 · Khiếu nại', '/customer/orders/demo-order/complaint?demo=1']
];
</script>
<template><div class="container py-5"><span class="badge text-bg-secondary mb-2">Chế độ demo</span><h1 class="h2">Màn hình khách thuê của Huy</h1><p class="text-muted">Các màn dưới dùng dữ liệu mẫu trên trình duyệt; không cần đăng nhập, MongoDB hoặc VNPay.</p><div class="row g-3 mt-2"><div v-for="([name, link]) in screens" :key="link" class="col-md-6 col-lg-4"><router-link :to="link" class="card h-100 text-decoration-none text-dark demo-card"><div class="card-body"><i class="bi bi-window-sidebar fs-4 text-primary"></i><div class="fw-semibold mt-2">{{ name }}</div><small class="text-muted">Mở màn hình demo</small></div></router-link></div></div></div></template>
<style scoped>.demo-card:hover{border-color:var(--bs-primary);box-shadow:0 .25rem .75rem rgb(0 0 0 / .1)}</style>
