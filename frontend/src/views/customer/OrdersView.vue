<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi } from '../../services/customerApi';
import { demoOrder } from '../../mock/customerDemo';
import { useRoute } from 'vue-router';
const router = useRouter(); const route = useRoute(); const orders = ref([]); const error = ref(''); const loading = ref(true);
const labels = { AWAITING_PAYMENT: 'Chờ thanh toán', PENDING: 'Chờ shop xác nhận', CONFIRMED: 'Đã xác nhận', READY: 'Đang chuẩn bị', SHIPPING: 'Đang giao đồ', RENTING: 'Đang thuê', RETURNED: 'Đã trả đồ', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' };
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
onMounted(async () => { if (route.query.demo === '1') { orders.value = [demoOrder]; loading.value = false; return; } try { orders.value = (await orderApi.list()).data.items; } catch (e) { error.value = e.response?.data?.error?.message || 'Không thể tải danh sách đơn.'; } finally { loading.value = false; } });
</script>
<template><div class="container py-4"><h1 class="h3">Đơn thuê của tôi</h1><div v-if="loading">Đang tải đơn thuê...</div><div v-else-if="error" class="alert alert-warning">{{ error }}</div><div v-else-if="!orders.length" class="border rounded p-5 text-center">Bạn chưa có đơn thuê nào.</div><article v-for="order in orders" :key="order.id" class="card mb-3"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="fw-semibold">{{ order.shop.name }}</div><small class="text-muted">{{ new Date(order.createdAt).toLocaleString('vi-VN') }}</small></div><span class="badge text-bg-warning align-self-start">{{ labels[order.status] || order.status }}</span></div><div v-for="item in order.orderItems" :key="item.id" class="py-2 border-bottom">{{ item.productName }} · {{ new Date(item.startDate).toLocaleDateString('vi-VN') }} – {{ new Date(item.endDate).toLocaleDateString('vi-VN') }}</div><div class="d-flex justify-content-between align-items-center pt-3"><strong>{{ money(order.totalAmount) }}</strong><button class="btn btn-outline-primary btn-sm" @click="router.push(route.query.demo === '1' ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Theo dõi đơn</button></div></div></article></div></template>
