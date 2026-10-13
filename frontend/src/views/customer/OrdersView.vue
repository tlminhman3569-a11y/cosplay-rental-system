<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../../services/customerApi';
import { getDemoOrder } from '../../mock/customerDemo';

const router = useRouter(); const route = useRoute();
const orders = ref([]); const error = ref(''); const loading = ref(true); const selectedStatus = ref('ALL'); const search = ref('');
const labels = { AWAITING_PAYMENT: 'Chờ thanh toán', PENDING: 'Chờ shop xác nhận', CONFIRMED: 'Đã xác nhận', READY: 'Đang chuẩn bị', SHIPPING: 'Đang giao đồ', RENTING: 'Đang thuê', RETURNED: 'Đã trả đồ', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' };
const filters = [{ key: 'ALL', label: 'Tất cả' }, { key: 'PENDING', label: 'Chờ xác nhận' }, { key: 'RENTING', label: 'Đang thuê' }, { key: 'NEED_RETURN', label: 'Cần trả' }, { key: 'INSPECTION', label: 'Đang kiểm tra' }, { key: 'COMPLETED', label: 'Hoàn tất' }, { key: 'DISPUTE', label: 'Tranh chấp' }];
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
const filteredOrders = computed(() => orders.value.filter((order) => {
  const matchesStatus = selectedStatus.value === 'ALL'
    || (selectedStatus.value === 'DISPUTE' ? Boolean(order.dispute || order.disputeId)
      : selectedStatus.value === 'NEED_RETURN' ? order.status === 'RENTING' && (order.orderItems || []).some((item) => new Date(item.endDate) <= new Date())
        : selectedStatus.value === 'INSPECTION' ? order.status === 'RETURNED'
          : order.status === selectedStatus.value);
  const needle = search.value.trim().toLocaleLowerCase('vi');
  const matchesSearch = !needle || [order.id, order.checkoutRef, ...(order.orderItems || []).map((item) => item.productName)].filter(Boolean).some((value) => value.toLocaleLowerCase('vi').includes(needle));
  return matchesStatus && matchesSearch;
}));
const routeFor = (order) => route.query.demo === '1' ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`;
async function load() {
  loading.value = true;
  if (route.query.demo === '1') { orders.value = [getDemoOrder()]; loading.value = false; return; }
  try { orders.value = (await orderApi.list()).data.items; }
  catch (e) { error.value = e.response?.data?.error?.message || 'Không thể tải danh sách đơn.'; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="orders-page py-4"><div class="container">
    <span class="eyebrow">ĐƠN THUÊ CỦA TÔI</span>
    <h1 class="display-6 fw-bold mb-1">Theo dõi mọi hành trình thuê đồ</h1>
    <p class="text-muted mb-3">Theo dõi mọi đơn bạn đã đặt trên Clarity.</p>
    <div class="search-box mb-3"><i class="bi bi-search"></i><input v-model="search" class="form-control" placeholder="Tìm mã đơn hoặc tên đồ..."></div>
    <div class="filter-bar mb-4"><button v-for="filter in filters" :key="filter.key" class="filter-button" :class="{ active: selectedStatus === filter.key }" @click="selectedStatus = filter.key">{{ filter.label }} <span v-if="filter.key === 'ALL'">({{ orders.length }})</span></button></div>
    <div v-if="loading" class="py-5 text-center">Đang tải đơn thuê...</div>
    <div v-else-if="error" class="alert alert-warning">{{ error }}</div>
    <div v-else-if="!filteredOrders.length" class="empty-orders text-center"><i class="bi bi-bag-heart fs-1"></i><h2 class="h5 mt-3">Chưa có đơn thuê trong mục này</h2><router-link to="/customer/demo" class="btn btn-primary mt-2">Xem các màn demo</router-link></div>
    <article v-for="order in filteredOrders" :key="order.id" class="order-card mb-3">
      <div class="order-card-head"><div><span class="shop-badge"><i class="bi bi-shop me-1"></i>{{ order.shop?.name || 'Clarity shop' }}</span><small class="d-block text-muted mt-2">Mã đơn #{{ order.id.slice(-6).toUpperCase() }} · {{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</small></div><span class="status-badge" :class="`status-${order.status}`">{{ order.dispute || order.disputeId ? 'Có tranh chấp' : labels[order.status] || order.status }}</span></div>
      <div v-for="item in order.orderItems" :key="item.id" class="rental-item"><div class="product-mark"><i class="bi bi-person-heart"></i></div><div class="flex-grow-1"><strong>{{ item.productName }}</strong><span>{{ new Date(item.startDate).toLocaleDateString('vi-VN') }} – {{ new Date(item.endDate).toLocaleDateString('vi-VN') }} · {{ item.quantity }} bộ</span></div></div>
      <div class="order-card-foot"><div><small class="text-muted d-block">Tổng thanh toán</small><strong>{{ money(order.totalAmount) }}</strong></div><div class="d-flex flex-wrap gap-2"><button v-if="order.dispute || order.disputeId" class="btn btn-outline-danger" @click="router.push(route.query.demo === '1' ? `/customer/orders/${order.id}/complaint?demo=1` : `/customer/orders/${order.id}/complaint`)">Xem khiếu nại</button><button class="btn btn-outline-primary" @click="router.push(routeFor(order))">{{ order.status === 'PENDING' ? 'Theo dõi đơn' : 'Xem đơn' }} <i class="bi bi-arrow-right ms-1"></i></button><button v-if="order.status === 'COMPLETED'" class="btn btn-link">Đánh giá / thuê lại</button></div></div>
    </article>
  </div></div>
</template>

<style scoped>
.orders-page{background:#faf8f5;min-height:72vh}.eyebrow{color:#8c6b52;font-size:.75rem;font-weight:800;letter-spacing:.12em}.search-box{display:flex;align-items:center;gap:.7rem;border:1px solid #ded5cc;border-radius:10px;background:#fff;padding:0 .9rem}.search-box i{color:#8c6b52}.search-box input{border:0;box-shadow:none}.filter-bar{display:flex;gap:.6rem;overflow:auto;padding-bottom:.25rem}.filter-button{white-space:nowrap;border:1px solid #ded5cc;background:#fff;border-radius:999px;padding:.45rem .85rem;color:#655d57;font-size:.86rem}.filter-button.active{background:var(--bs-primary);border-color:var(--bs-primary);color:#fff}.order-card,.empty-orders{background:#fff;border:1px solid #e9e1d9;border-radius:16px;padding:1.25rem}.order-card-head,.order-card-foot{display:flex;justify-content:space-between;gap:1rem;align-items:center}.shop-badge{font-weight:700}.status-badge{border-radius:999px;padding:.4rem .7rem;background:#eee7e0;color:#655d57;font-size:.78rem;font-weight:700}.status-SHIPPING,.status-RENTING{background:#e3f1fb;color:#176b9b}.status-COMPLETED{background:#e2f4e7;color:#29723a}.status-CANCELLED{background:#fae5e1;color:#9b3d30}.rental-item{border-top:1px solid #eee7e0;border-bottom:1px solid #eee7e0;margin:1rem 0;padding:1rem 0;display:flex;gap:1rem;align-items:center}.rental-item span{display:block;font-size:.9rem;color:#786f68;margin-top:.25rem}.product-mark{width:52px;height:60px;display:grid;place-items:center;background:#f0e5dc;border-radius:8px;font-size:1.5rem;color:#805b4b}.order-card-foot strong{color:var(--bs-primary)}@media(max-width:575px){.order-card-head,.order-card-foot{align-items:flex-start;flex-direction:column}.status-badge{align-self:flex-start}}
</style>
