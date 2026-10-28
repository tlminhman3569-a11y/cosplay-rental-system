<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { vendorService } from '@/services/vendorService'
import { errMsg } from '@/services/http'
import { vnd, dmy } from '@/utils/format'
const route = useRoute()
const order = ref(null), loading = ref(true), error = ref('')
let sequence = 0
async function load() {
 const seq = ++sequence
 loading.value = true; error.value = ''; order.value = null
 try {
  let code = String(route.query.code || '')
  if (!code) code = (await vendorService.orders({ limit: 1 }))[0]?.code || ''
  const detail = code ? await vendorService.order(code) : null
  if (seq === sequence) order.value = detail
 } catch(e) { if (seq === sequence) error.value = errMsg(e, 'Không tải được chi tiết đơn') }
 finally { if (seq === sequence) loading.value = false }
}
onMounted(load)
watch(() => route.query.code, load)
</script>
<template>
 <BoLayout role="owner" active="Đơn thuê" :title="'Chi tiết đơn ' + (order?.shortCode || '')">
  <div class="col">
   <LoadState :loading="loading" :error="error" @retry="load" />
   <div v-if="!loading && !error && !order" class="card muted">Shop chưa có đơn thuê.</div>
   <template v-if="order && !loading && !error">
    <div class="card row jb ac"><div><b>{{ order.shortCode }}</b><div class="muted sm">{{ order.code }}</div></div><ChipTag :kind="order.kind">{{ order.label }}</ChipTag><RouterLink :to="{name:'ChuDon'}" class="btn o s">Danh sách đơn</RouterLink></div>
    <div class="row as">
     <div class="card fl1"><h3>Người thuê &amp; giao nhận</h3>
      <div class="rw"><span>Người thuê</span><b>{{ order.renter }}</b></div>
      <div class="rw"><span>Người nhận</span><span>{{ order.receiver.name || 'Ẩn trước khi xác nhận' }}</span></div>
      <div class="rw"><span>Số điện thoại</span><span>{{ order.receiver.phone || 'Ẩn trước khi xác nhận' }}</span></div>
      <div class="rw"><span>Địa chỉ</span><span>{{ order.receiver.address || '—' }}</span></div>
      <div class="rw"><span>Giao nhận</span><span>{{ order.ship }}</span></div>
      <div class="rw"><span>Thời gian thuê</span><span>{{ dmy(order.start) }} – {{ dmy(order.end) }} ({{ order.days }} ngày)</span></div>
      <div class="mt12">{{ order.note || 'Người thuê không để lại lời nhắn.' }}</div>
     </div>
     <div class="card fl1"><h3>Tiền của đơn</h3>
      <div class="rw"><span>Tiền thuê</span><span>{{ vnd(order.money.rentalTotal) }}</span></div>
      <div class="rw"><span>Phí nền tảng</span><span>− {{ vnd(order.money.platformFee) }}</span></div>
      <div class="rw"><span>Tiền cọc</span><span>{{ vnd(order.money.depositTotal) }}</span></div>
      <div class="rw"><span>Phí giao hàng</span><span>{{ vnd(order.money.shippingFee) }}</span></div>
      <div class="rw"><span>Tổng tiền khách</span><span>{{ vnd(order.money.totalAmount) }}</span></div>
      <div class="rw tot"><span>Chủ đồ nhận sau phí</span><span>{{ vnd(order.money.payout) }}</span></div>
      <div class="muted sm mt12">Khoản thực nhận chỉ tính vào doanh thu khi đơn COMPLETED.</div>
     </div>
    </div>
    <div class="card"><h3>Sản phẩm trong đơn</h3><div class="tw"><table class="tbl"><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Giá/ngày</th><th>Cọc</th><th>Ngày thuê</th></tr></thead><tbody><tr v-for="(item,i) in order.items" :key="i"><td>{{ item.name }}</td><td>{{ item.quantity }}</td><td>{{ vnd(item.unitPrice) }}</td><td>{{ vnd(item.deposit) }}</td><td>{{ dmy(item.start) }} – {{ dmy(item.end) }}</td></tr></tbody></table></div></div>
    <div class="card"><h3>Tiến trình đơn</h3><div v-for="(event,i) in order.timeline" :key="i" class="rw"><span>{{ event.label }}</span><time>{{ new Date(event.at).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'}) }}</time></div><div v-if="!order.timeline.length" class="muted">Chưa có lịch sử trạng thái.</div><div v-if="order.cancelReason" class="mt12">Lý do hủy: {{ order.cancelReason }}</div></div>
    <RouterLink v-if="order.status === 'PENDING'" :to="{name:'ChuYeuCau'}" class="btn">Xác nhận / từ chối tại Yêu cầu thuê</RouterLink>
   </template>
  </div>
 </BoLayout>
</template>
