<script setup>
import { ref, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import TabsBar from '@/components/TabsBar.vue'
import OwnerCountdown from '@/components/owner/OwnerCountdown.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { vendorService } from '@/services/vendorService'
import { errMsg } from '@/services/http'
import { ORDER_TABS } from '@/config/ownerUi'
import { dm, vnd } from '@/utils/format'

const ui = useUiStore()
const rows = ref([])
const shopName = ref('')
const loading = ref(true)
const error = ref('')
const tab = ref('all')

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const [list, name] = await Promise.all([vendorService.orders({ group: 'all', limit: 200 }), vendorService.shopName()])
    rows.value = list; shopName.value = name
  } catch (e) {
    const m = errMsg(e, 'Không tải được danh sách đơn thuê')
    if (silent) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const match = (o, key) => (key === 'all' ? true : key === 'dispute' ? !!o.dispute : o.group === key)
const tabs = computed(() => ORDER_TABS.map((t) => ({ key: t.key, label: t.label, count: rows.value.filter((o) => match(o, t.key)).length })))
const shown = computed(() => rows.value.filter((o) => match(o, tab.value)))

// Ghi chú cuối trang: lấy từ chính danh sách đơn
const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)
const byEnd = (a, b) => (a.end < b.end ? -1 : a.end > b.end ? 1 : 0)
const urgentOrder = computed(() => rows.value.find((o) => o.dispute) || rows.value.find((o) => o.group === 'pending') || null)
const soonShip = computed(() => [...rows.value.filter((o) => ['CONFIRMED', 'READY', 'SHIPPING'].includes(o.status))].sort(byStart)[0] || null)
const soonReturn = computed(() => [...rows.value.filter((o) => o.status === 'RENTING')].sort(byEnd)[0] || null)

// Thao tác kế tiếp hợp lệ do server quyết định (nextAction)
</script>

<template>
  <BoLayout role="owner" active="Đơn thuê" title="Đơn thuê" :sub="loading ? '' : rows.length + ' đơn' + (shopName ? ' của ' + shopName : '')">
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load(false)" />
      <template v-if="!loading && !error">
      <TabsBar v-model="tab" :tabs="tabs" />
      <div class="tw">
        <table class="tbl">
          <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Người thuê</th><th>Thời gian thuê</th><th>Giao nhận</th><th>Tổng nhận</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            <tr v-for="o in shown" :key="o.code">
              <td><b>{{ o.code }}</b></td>
              <td>{{ o.product }}</td>
              <td>{{ o.renter }}</td>
              <td>{{ dm(o.start) }} – {{ dm(o.end) }}</td>
              <td>{{ o.ship }}</td>
              <td><b>{{ vnd(o.payout) }}</b></td>
              <td>
                <ChipTag :kind="o.kind">{{ o.label }}</ChipTag>
                <div v-if="o.dispute" class="mt8"><ChipTag kind="r">Có tranh chấp</ChipTag></div>
                <div v-if="o.deadline" class="mt8"><b :style="o.urgent ? 'color:#B5432F' : ''">còn <OwnerCountdown :deadline="o.deadline" :seconds="o.secondsLeft" /></b></div>
              </td>
              <td>
                <RouterLink class="btn s o" :to="{ name: 'ChuDonChiTiet', query: { code: o.code } }">Chi tiết</RouterLink>
                <div v-if="o.group === 'pending'" class="mt8"><RouterLink class="btn s" :to="{ name: 'ChuYeuCau' }">Xử lý yêu cầu</RouterLink></div>
              </td>
            </tr>
            <tr v-if="!shown.length"><td colspan="8" class="muted">Không có đơn nào trong mục này.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="row">
        <div class="card fl1 warn">
          <b>Cần làm ngay</b>
          <div v-if="urgentOrder && urgentOrder.dispute" class="muted mt8">{{ urgentOrder.code }}: có tranh chấp{{ urgentOrder.disputeCode ? ' ' + urgentOrder.disputeCode : '' }}, cần phản hồi trong 48 giờ.</div>
          <div v-else-if="urgentOrder" class="muted mt8">{{ urgentOrder.code }} {{ urgentOrder.product }} đang chờ bạn xác nhận.</div>
          <div v-else class="muted mt8">Hiện không có việc gấp.</div>
          <div v-if="urgentOrder" class="mt12"><RouterLink class="btn s" :to="{ name: 'ChuDonChiTiet', query: { code: urgentOrder.code } }">Mở đơn</RouterLink></div>
        </div>
        <div class="card fl1">
          <b>Sắp giao</b>
          <div v-if="soonShip" class="muted mt8">{{ soonShip.code }} {{ soonShip.product }} giao {{ soonShip.ship }} ngày {{ dm(soonShip.start) }}, hãy đóng gói và chụp ảnh trước khi giao.</div>
          <div v-else class="muted mt8">Chưa có đơn nào sắp giao.</div>
          <div v-if="soonShip" class="mt12"><RouterLink class="btn s o" :to="{ name: 'ChuDonChiTiet', query: { code: soonShip.code } }">Xem đơn</RouterLink></div>
        </div>
        <div class="card fl1">
          <b>Sắp trả</b>
          <div v-if="soonReturn" class="muted mt8">{{ soonReturn.code }} {{ soonReturn.product }} hạn trả {{ dm(soonReturn.end) }}, nhắc khách trả đúng hạn để tránh phí trễ 20%/ngày.</div>
          <div v-else class="muted mt8">Chưa có đơn nào sắp đến hạn trả.</div>
          <div v-if="soonReturn" class="mt12"><RouterLink class="btn s o" :to="{ name: 'ChuTinNhan', query: { order: soonReturn.code } }">Nhắn khách</RouterLink></div>
        </div>
      </div>
      <div class="muted sm">Tổng nhận = tiền thuê − phí nền tảng của từng đơn. Chỉ đơn hoàn tất được tính vào doanh thu; đơn chờ xác nhận xử lý ở mục Yêu cầu thuê.</div>
      </template>
    </div>
  </BoLayout>
</template>
