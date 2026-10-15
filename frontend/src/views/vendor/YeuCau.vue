<script setup>
import { ref, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import OwnerCountdown from '@/components/owner/OwnerCountdown.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { dmy, vnd } from '@/utils/format'

const ui = useUiStore()
const DEFAULT_REASONS = ['Bộ đồ đang bận / không còn trống', 'Bộ đồ đang giặt hoặc bảo trì', 'Không giao được tới khu vực của khách', 'Lý do khác']
const reasons = ref(DEFAULT_REASONS)
// state: PENDING | CONFIRMED | REJECTED (cập nhật tại chỗ sau khi gọi API thành công để chủ đồ thấy kết quả)
const list = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true; error.value = ''
  try {
    const [rows, meta] = await Promise.all([ownerService.requests(), ownerService.meta().catch(() => null)])
    list.value = rows.map((r) => ({ ...r, state: 'PENDING', reason: '', busy: false }))
    if (meta && meta.rejectReasons && meta.rejectReasons.length) reasons.value = meta.rejectReasons
  } catch (e) {
    error.value = errMsg(e, 'Không tải được danh sách yêu cầu thuê')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

const pendingCount = computed(() => list.value.filter((r) => r.state === 'PENDING').length)
const sub = computed(() => `${pendingCount.value} yêu cầu · khách đã thanh toán trước`)

async function confirm(r) {
  r.busy = true
  try {
    await ownerService.confirmRequest(r.code)
    r.state = 'CONFIRMED'
    ui.toast(`Đã xác nhận ${r.code} – đơn chuyển sang Chuẩn bị đồ`)
  } catch (e) { ui.toast(errMsg(e, 'Không xác nhận được đơn')) } finally { r.busy = false }
}
async function reject(r) {
  if (!r.reason) { ui.toast('Vui lòng chọn lý do từ chối'); return }
  r.busy = true
  try {
    await ownerService.rejectRequest(r.code, r.reason)
    r.state = 'REJECTED'
    ui.toast(`Đã từ chối ${r.code} – hoàn 100% cho khách`)
  } catch (e) { ui.toast(errMsg(e, 'Không từ chối được đơn')) } finally { r.busy = false }
}
</script>

<template>
  <BoLayout role="owner" active="Yêu cầu thuê" title="Yêu cầu thuê chờ xác nhận" :sub="sub">
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load" />
      <template v-if="!loading && !error">
      <div class="card warn" style="padding:12px 16px">Từ chối hoặc quá hạn → hoàn 100% cho khách, ảnh hưởng điểm phản hồi của shop.</div>
      <div v-for="r in list" :key="r.code" class="card">
        <div class="row jb ac mb12">
          <div class="row g12 ac">
            <span class="av">{{ r.initials }}</span>
            <div>
              <b style="font-size:15px">{{ r.renter }}</b> <ChipTag v-if="r.verified" kind="g">CCCD ✓</ChipTag>
              <div class="muted sm">★ {{ r.rating || '—' }} · {{ r.orderCount }} đơn đã thuê</div>
            </div>
          </div>
          <div class="tr">
            <template v-if="r.state === 'PENDING'">
              <div class="muted sm">Hạn xác nhận (12 giờ)</div>
              <b style="font-size:20px" :style="r.urgent ? 'color:#B5432F' : ''">còn <OwnerCountdown :deadline="r.deadline" :seconds="r.secondsLeft" /></b>
            </template>
            <ChipTag v-else-if="r.state === 'CONFIRMED'" kind="g">Đã xác nhận</ChipTag>
            <ChipTag v-else kind="n">Đã từ chối</ChipTag>
          </div>
        </div>
        <div class="row">
          <div class="fl1">
            <div class="rw"><span>Mã đơn</span><b>{{ r.code }}</b></div>
            <div class="rw"><span>Sản phẩm</span><span>{{ r.productLabel }} ({{ vnd(r.pricePerDay) }}/ngày)</span></div>
            <div class="rw"><span>Thời gian thuê</span><span>{{ dmy(r.start) }} – {{ dmy(r.end) }} ({{ r.days }} ngày)</span></div>
            <div class="rw"><span>Giao nhận</span><span>{{ r.ship }} · {{ r.route }}</span></div>
          </div>
          <div class="fl1">
            <div class="lbl">Lời nhắn từ người thuê</div>
            <div class="card tint" style="padding:12px">{{ r.note }}</div>
            <div class="mt12"><ChipTag kind="g">Đã thanh toán – Clarity đang giữ {{ vnd(r.held) }}</ChipTag></div>
            <div class="muted sm mt8">Gồm thuê {{ vnd(r.rentalTotal) }} + cọc {{ vnd(r.depositAmount) }} (bạn nhận {{ vnd(r.payout) }} sau phí {{ r.feeRate }}%)</div>
          </div>
        </div>
        <div class="div"></div>
        <div v-if="r.state === 'PENDING'" class="row ac g12">
          <button type="button" class="btn g" :disabled="r.busy" @click="confirm(r)">Xác nhận đơn</button>
          <div style="width:230px;flex:none">
            <select v-model="r.reason" class="sel">
              <option value="">Từ chối – chọn lý do</option>
              <option v-for="o in reasons" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
          <button type="button" class="btn ro" :disabled="r.busy" @click="reject(r)">Từ chối</button>
          <RouterLink class="btn o" :to="{ name: 'ChuTinNhan', query: { order: r.code } }">Chat</RouterLink>
        </div>
        <div v-else-if="r.state === 'CONFIRMED'" class="row ac g12">
          <span class="muted">Đơn đã chuyển sang bước Chuẩn bị đồ; ngày thuê được giữ trên lịch.</span>
          <RouterLink class="btn s" :to="{ name: 'ChuDonChiTiet', query: { code: r.code } }">Xem đơn thuê</RouterLink>
        </div>
        <div v-else class="row ac g12">
          <span class="muted">Lý do: {{ r.reason }}. Đã hoàn 100% cho khách; các ngày thuê mở lại trên lịch.</span>
        </div>
      </div>
      <div v-if="!list.length" class="card muted">Không có yêu cầu nào.</div>
      </template>
    </div>
  </BoLayout>
</template>
