<script setup>
import { ref, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import KpiRow from '@/components/KpiRow.vue'
import ChipTag from '@/components/ChipTag.vue'
import RevenueBars from '@/components/owner/RevenueBars.vue'
import OwnerCountdown from '@/components/owner/OwnerCountdown.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { vendorService } from '@/services/vendorService'
import { errMsg } from '@/services/http'
import { leftText } from '@/config/ownerUi'
import { dm, vnd } from '@/utils/format'

const ui = useUiStore()
const data = ref(null)
const shopName = ref('')
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true; error.value = ''
  try {
    const [d, name] = await Promise.all([vendorService.dashboard(), vendorService.shopName()])
    data.value = d; shopName.value = name
  } catch (e) {
    error.value = errMsg(e, 'Không tải được tổng quan shop')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

const greeting = computed(() => (data.value ? `Xin chào ${data.value.greeting.name}, hôm nay là ${data.value.greeting.date}` : ''))
const kpis = computed(() => {
  const k = data.value ? data.value.kpis : null
  if (!k) return []
  return [
    { k: 'Doanh thu tháng ' + String(k.revenueMonthLabel || '').replace(/^T/, ''), v: vnd(k.revenueMonth), d: k.revenueDeltaText },
    { k: 'Đơn đang xử lý', v: String(k.processingCount), d: k.processingNote },
    { k: 'Yêu cầu chờ xác nhận', v: String(k.pendingCount), d: k.pendingNote, bad: true },
    { k: 'Điểm đánh giá', v: k.rating, d: k.reviewCount + ' đánh giá' },
  ]
})
const urgent = computed(() => (data.value ? data.value.urgent : null))
const alertD = computed(() => (data.value ? data.value.disputeAlert : null))
const shortLabel = (s) => String(s || '').split(' – ')[0]
</script>

<template>
  <BoLayout role="owner" active="Tổng quan" title="Tổng quan shop" :sub="greeting">
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load" />
      <template v-if="data">
        <KpiRow :items="kpis" />
        <div v-if="urgent || alertD" class="row">
          <div v-if="urgent" class="card warn fl1">
            <div class="row g12 as">
              <ChipTag kind="a">Sắp hết hạn</ChipTag>
              <div class="fl1">
                <b>{{ urgent.code }} {{ shortLabel(urgent.productLabel) }}… còn {{ leftText(urgent.secondsLeft) }} để xác nhận</b>
                <div class="muted">Yêu cầu của {{ urgent.renter }} cần được xác nhận hoặc từ chối tại mục Yêu cầu thuê.</div>
              </div>
            </div>
            <div class="mt12"><RouterLink class="btn s" :to="{ name: 'ChuYeuCau' }">Xem yêu cầu</RouterLink></div>
          </div>
          <div v-if="alertD" class="card err fl1">
            <div class="row g12 as">
              <ChipTag kind="r">Tranh chấp</ChipTag>
              <div class="fl1">
                <b>Có 1 tranh chấp cần phản hồi ({{ alertD.code }}) trong {{ alertD.hoursLeft }} giờ</b>
                <div class="muted">Đơn {{ alertD.orderCode }} · {{ alertD.status === 'ESCALATED' ? 'đã chuyển Admin, ' : '' }}bạn có thể bổ sung bằng chứng.</div>
              </div>
            </div>
            <div class="mt12"><RouterLink class="btn s r" :to="{ name: 'ChuTranhChap', query: { code: alertD.code } }">Phản hồi tranh chấp</RouterLink></div>
          </div>
        </div>
        <div>
          <h3 class="mb8" style="font-size:16px">Yêu cầu chờ xác nhận</h3>
          <div class="tw">
            <table class="tbl">
              <thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Người thuê</th><th>Thời gian thuê</th><th>Thanh toán</th><th>Hạn xác nhận</th><th></th></tr></thead>
              <tbody>
                <tr v-for="r in data.pendingRequests" :key="r.code">
                  <td><b>{{ r.code }}</b></td>
                  <td>{{ r.productLabel }}</td>
                  <td>{{ r.renter }}</td>
                  <td>{{ dm(r.start) }} – {{ dm(r.end) }}</td>
                  <td><ChipTag kind="a">Chờ shop xác nhận</ChipTag></td>
                  <td><b :style="r.urgent ? 'color:#B5432F' : ''">còn <OwnerCountdown :deadline="r.deadline" :seconds="r.secondsLeft" /></b></td>
                  <td><RouterLink class="btn s" :to="{ name: 'ChuYeuCau' }">Xem</RouterLink></td>
                </tr>
                <tr v-if="!data.pendingRequests.length"><td colspan="7" class="muted">Hiện không có yêu cầu nào đang chờ xác nhận.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="row">
          <div class="card fl1" style="flex:1.5">
            <div class="row jb ac mb8">
              <h3 style="margin:0">Đơn đang xử lý</h3>
              <RouterLink class="b sm" :to="{ name: 'ChuDon' }" style="color:#6B4630">Xem tất cả →</RouterLink>
            </div>
            <div v-for="o in data.processingOrders" :key="o.code" class="row ac jb" style="padding:10px 0;border-bottom:1px solid #EFE6D8">
              <div>
                <RouterLink :to="{ name: 'ChuDonChiTiet', query: { code: o.code } }"><b>{{ o.code }}</b></RouterLink>
                <template v-for="c in o.chips" :key="c[0]"> <ChipTag :kind="c[1]">{{ c[0] }}</ChipTag></template>
                <div class="muted sm">{{ o.sub }}</div>
              </div>
              <ChipTag :kind="o.status[1]">{{ o.status[0] }}</ChipTag>
            </div>
            <div v-if="!data.processingOrders.length" class="muted">Chưa có đơn nào đang xử lý.</div>
          </div>
          <div class="card fl1">
            <h3>Doanh thu 6 tháng (triệu đồng)</h3>
            <RevenueBars v-if="data.revenue6m.length" :data="data.revenue6m" />
            <div v-else class="muted">Chưa có dữ liệu doanh thu.</div>
          </div>
        </div>
        <div class="card tint">
          <div class="row ac jb">
            <div><b>Thao tác nhanh</b><div class="muted">Quản lý shop {{ shopName || 'của bạn' }}</div></div>
            <div class="row g12">
              <RouterLink class="btn" :to="{ name: 'ChuDangSP' }">+ Đăng sản phẩm mới</RouterLink>
              <RouterLink class="btn o" :to="{ name: 'ChuRutTien' }">Rút tiền</RouterLink>
              <RouterLink class="btn o" :to="{ name: 'ChuTinNhan' }">Xem tin nhắn</RouterLink>
              <RouterLink class="btn o" :to="{ name: 'ChuHoSo' }">Hồ sơ shop</RouterLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </BoLayout>
</template>
