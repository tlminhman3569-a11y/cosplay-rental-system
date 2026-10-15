<script setup>
// Chi tiết đơn của shop: ?code=ORD-… (không có code thì mở đơn cần kiểm tra / đơn mới nhất)
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import StepperBar from '@/components/StepperBar.vue'
import TimelineList from '@/components/TimelineList.vue'
import LoadState from '@/components/LoadState.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'
import { vnd, dm } from '@/utils/format'

const ui = useUiStore()
const route = useRoute()
const order = ref(null)
const loading = ref(true)
const error = ref('')
const empty = ref(false)
const busy = ref(false)
const note = ref('')
const tracking = ref('')
const damage = reactive({ amount: '', reason: '' })
const handoverPhotos = ref([])
const damagePhotos = ref([])

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''; empty.value = false
  try {
    let code = String(route.query.code || '')
    if (!code) {
      const list = await ownerService.orders({ group: 'all', limit: 50 })
      const pick = list.find((o) => o.group === 'check') || list[0]
      if (!pick) { order.value = null; empty.value = true; return }
      code = pick.code
    }
    order.value = await ownerService.order(code)
  } catch (e) {
    const m = errMsg(e, 'Không tải được chi tiết đơn')
    if (silent && order.value) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))
watch(() => route.query.code, () => { note.value = ''; tracking.value = ''; load(false) })

const v = computed(() => (order.value ? order.value.view : null))
const na = computed(() => (order.value ? order.value.nextAction : null))
const insp = computed(() => (v.value ? v.value.inspection : null))
const money = computed(() => (v.value ? v.value.money : null))
const locked = computed(() => !!(order.value && (order.value.status === 'DISPUTED' || (insp.value && insp.value.locked))))
const stepNo = computed(() => (v.value && v.value.currentStep >= 0 ? v.value.currentStep + 1 : 0))
const stepName = computed(() => (v.value && v.value.currentStep >= 0 ? v.value.steps[v.value.currentStep] : order.value ? order.value.label : ''))
const nextText = computed(() => {
  if (na.value) return na.value.label
  if (locked.value) return 'Bị khóa – đơn đang có tranh chấp'
  if (order.value && order.value.status === 'PENDING') return 'Xử lý ở mục Yêu cầu thuê'
  return 'Không còn bước kế tiếp'
})
const inspChip = computed(() => {
  const i = insp.value
  if (!i) return null
  if (i.overdue) return ['r', 'Quá hạn kiểm tra ' + i.hoursAllowed + ' giờ']
  if (i.hoursLeft != null) return ['a', 'Còn ' + i.hoursLeft + ' giờ để kiểm tra']
  return ['g', 'Hoàn thành trong hạn ' + i.hoursAllowed + ' giờ']
})
// checklist có thể là mảng chuỗi hoặc mảng object
const checklist = computed(() => {
  const c = insp.value && Array.isArray(insp.value.checklist) ? insp.value.checklist : []
  return c.map((x) => (typeof x === 'string' ? { label: x, on: true } : { label: x.label || x.name || x.text || '', on: x.checked ?? x.on ?? x.ok ?? true })).filter((x) => x.label)
})
const pickup = computed(() => (v.value ? v.value.handoverPickup : null))
const lateDays = computed(() => (v.value ? v.value.lateDays : 0))
const actualReturn = computed(() => (order.value ? order.value.actualReturnDate : null))

async function runNext() {
  if (!na.value) return
  if (na.value.needsTracking && !tracking.value.trim()) { ui.toast('Nhập mã vận đơn trước khi giao'); return }
  busy.value = true
  try {
    const body = {}
    if (note.value.trim()) body.reason = note.value.trim()
    if (na.value.needsTracking) body.trackingCode = tracking.value.trim()
    if (na.value.action === 'handover') await ownerService.handover(order.value.code, { type: na.value.type || 'PICKUP', photos: handoverPhotos.value })
    else await ownerService.orderAction(order.value.code, na.value.action, body)
    note.value = ''; tracking.value = ''; handoverPhotos.value = []
    ui.toast('Đã cập nhật đơn ' + order.value.code + ' – ' + na.value.label)
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không cập nhật được đơn')) } finally { busy.value = false }
}
function resetForm() { note.value = ''; tracking.value = ''; handoverPhotos.value = [] }
async function reportDamage() {
  const amount = Number(String(damage.amount).replace(/[^\d]/g, '')) || 0
  if (!amount) { ui.toast('Nhập số tiền yêu cầu bồi thường'); return }
  if (money.value && amount > money.value.deposit) { ui.toast('Số tiền yêu cầu không được vượt tiền cọc ' + vnd(money.value.deposit)); return }
  if (!damage.reason.trim()) { ui.toast('Vui lòng mô tả hư hỏng'); return }
  busy.value = true
  try {
    await ownerService.reportDamage(order.value.code, { claimedAmount: amount, reason: damage.reason.trim(), photos: damagePhotos.value })
    damage.amount = ''; damage.reason = ''; damagePhotos.value = []
    ui.toast('Đã báo hư hỏng – đơn chuyển sang tranh chấp')
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không báo được hư hỏng')) } finally { busy.value = false }
}
</script>

<template>
  <BoLayout role="owner" active="Đơn thuê" :title="'Chi tiết đơn ' + (order ? order.code : '')" :crumb="'Đơn thuê › ' + (order ? order.code : 'Chi tiết')">
    <div class="col">
      <LoadState :loading="loading" :error="error" @retry="load(false)" />
      <div v-if="empty && !loading && !error" class="card muted">Shop chưa có đơn thuê nào. <RouterLink :to="{ name: 'ChuDon' }" class="b" style="color:#6B4630">Về danh sách đơn</RouterLink></div>
      <template v-if="order && v && !loading && !error">
        <div class="card">
          <div class="row jb ac mb12">
            <h3 style="margin:0">{{ order.code }} · {{ order.product }}</h3>
            <div class="row g8"><ChipTag :kind="order.kind">{{ order.label }}</ChipTag><ChipTag v-if="order.dispute" kind="r">Có tranh chấp</ChipTag></div>
          </div>
          <StepperBar :steps="v.steps" :current="v.currentStep" />
        </div>

        <div class="card">
          <div class="row jb ac mb8">
            <h3 style="margin:0">Cập nhật trạng thái đơn</h3>
            <span class="muted sm">Mọi thay đổi được ghi vào dòng thời gian và thông báo cho người thuê</span>
          </div>
          <div class="row as g16">
            <div class="fl1"><label class="lbl">Trạng thái hiện tại</label><input class="inp" :value="(stepNo ? stepNo + '. ' : '') + stepName" disabled></div>
            <div class="fl1">
              <label class="lbl">Chuyển sang</label>
              <select class="sel" disabled><option>{{ nextText }}</option></select>
              <div v-if="locked" class="card" style="padding:6px 0;margin-top:6px">
                <div style="padding:7px 14px;font-size:13px;color:#8C7A68">Hoàn cọc <span class="note">Khóa: đơn đang có tranh chấp {{ order.disputeCode || (v.dispute && v.dispute.code) }}</span></div>
                <div style="padding:7px 14px;font-size:13px;font-weight:700;color:#6B4630;background:#F6F1E9">✓ Có tranh chấp (đang áp dụng)</div>
              </div>
            </div>
            <div class="fl1">
              <template v-if="na && na.needsTracking">
                <label class="lbl">Mã vận đơn</label>
                <input v-model="tracking" class="inp" placeholder="Ví dụ: GRAB-7742-HN0210">
              </template>
              <label class="lbl" :class="{ mt8: na && na.needsTracking }">Ghi chú gửi người thuê</label>
              <textarea v-model="note" class="ta" style="min-height:64px" placeholder="Ví dụ: đã nhận lại đồ, bắt đầu kiểm tra…" :disabled="!na"></textarea>
              <template v-if="na && na.action === 'handover'">
                <label class="lbl mt8">Ảnh đồng kiểm khi bàn giao</label>
                <ImageUploader v-model="handoverPhotos" :max="10" label="Tải ảnh bàn giao" :h="70" />
              </template>
            </div>
          </div>
          <div class="row g12 mt12">
            <button type="button" class="btn s" :class="{ dis: !na }" :disabled="!na || busy" @click="runNext">{{ na ? na.label : 'Cập nhật trạng thái' }}</button>
            <button type="button" class="btn s o" :disabled="!na" @click="resetForm">Hủy</button>
            <RouterLink v-if="order.status === 'PENDING'" class="btn s" :to="{ name: 'ChuYeuCau' }">Xác nhận / từ chối ở Yêu cầu thuê</RouterLink>
            <span class="muted sm" style="align-self:center">Chủ đồ chỉ chuyển được sang bước kế tiếp hợp lệ; các bước có Escrow (thanh toán, hoàn cọc) do hệ thống xử lý.</span>
          </div>
        </div>

        <div class="row as">
          <div class="card fl1">
            <h3>Người thuê</h3>
            <div class="row g12 ac">
              <span class="av l">{{ v.renterInfo.initials }}</span>
              <div>
                <b>{{ v.renterInfo.name }}</b> <ChipTag v-if="v.renterInfo.verified" kind="g">CCCD ✓</ChipTag>
                <div class="muted">{{ v.renterInfo.phone }}<template v-if="v.renterInfo.city"> · {{ v.renterInfo.city }}</template></div>
                <div class="muted">★ {{ v.renterInfo.rating || '—' }} · {{ v.renterInfo.orderCount }} đơn đã thuê</div>
              </div>
            </div>
            <div class="div"></div>
            <div class="rw"><span>Thời gian thuê</span><span>{{ dm(order.start) }} – {{ dm(order.end) }} ({{ v.days }} ngày)</span></div>
            <div v-if="actualReturn" class="rw"><span>Trả thực tế</span><span>{{ dm(actualReturn) }}<template v-if="lateDays > 0"> (trễ {{ lateDays }} ngày)</template></span></div>
            <div v-if="v.payment" class="rw"><span>Thanh toán</span><span>{{ v.payment.txn }} · {{ v.payment.method }}</span></div>
          </div>
          <div class="card fl1">
            <h3>Tiền của đơn</h3>
            <div class="rw"><span>Tiền thuê {{ money.days }} × {{ vnd(money.pricePerDay) }}</span><span>{{ vnd(money.rentalTotal) }}</span></div>
            <div class="rw"><span>Phí nền tảng {{ money.feeRate }}%</span><span>− {{ vnd(money.platformFee) }}</span></div>
            <div class="rw"><span>Cọc đang giữ</span><span>{{ vnd(money.deposit) }}</span></div>
            <div class="rw"><span>Phí trả muộn {{ money.lateFeeRate }}%/ngày (trừ vào cọc)</span><span>{{ vnd(money.lateFee) }}</span></div>
            <div v-if="money.claimedAmount" class="rw"><span>Chủ đồ yêu cầu bồi thường</span><span>{{ vnd(money.claimedAmount) }}</span></div>
            <div v-if="money.staffProposalToOwner != null" class="rw"><span>Staff đề xuất</span><span>{{ vnd(money.staffProposalToOwner) }}</span></div>
            <div class="rw tot"><span>Bạn nhận (sau phí)</span><span>{{ vnd(money.ownerPayout) }}</span></div>
          </div>
        </div>

        <div class="row">
          <div class="card fl1">
            <h3>Giao đồ</h3>
            <div class="rw"><span>Đơn vị</span><span>{{ v.shipping.method }}</span></div>
            <div class="rw"><span>Mã vận đơn</span><span>{{ v.shipping.tracking || '—' }}</span></div>
            <div class="rw"><span>Giao ngày</span><span>{{ v.shipping.shippedAt || '—' }}</span></div>
            <div class="row g8 mt8 wrap">
              <img v-for="(u, i) in v.shipping.photos" :key="u + i" :src="u" alt="" style="width:80px;height:64px;object-fit:cover;border-radius:6px">
              <span v-if="!v.shipping.photos.length" class="muted sm">Chưa có ảnh đóng gói / giao đồ.</span>
            </div>
          </div>
          <div class="card fl1">
            <h3>Đồng kiểm nhận đồ</h3>
            <div class="ck" :class="{ on: pickup && pickup.ownerConfirmed }"><i></i>Chủ đồ xác nhận ảnh gửi đi</div>
            <div class="ck" :class="{ on: pickup && pickup.renterConfirmed }"><i></i>Người thuê xác nhận nhận đồ<template v-if="pickup && pickup.at"> {{ pickup.at }}</template></div>
            <div class="row g8 mt8 wrap">
              <img v-for="(u, i) in (pickup ? pickup.photos : [])" :key="u + i" :src="u" alt="" style="width:80px;height:64px;object-fit:cover;border-radius:6px">
              <span v-if="!pickup || !pickup.photos.length" class="muted sm">Chưa có ảnh đồng kiểm.</span>
            </div>
          </div>
        </div>

        <div v-if="insp" class="card">
          <div class="row jb ac mb8">
            <h3 style="margin:0">Kiểm tra sau trả<template v-if="order.dispute"> – đã báo hư hỏng</template></h3>
            <ChipTag :kind="inspChip[0]">{{ inspChip[1] }}</ChipTag>
          </div>
          <div class="row">
            <div class="fl1">
              <label class="lbl">Danh sách kiểm tra</label>
              <div v-for="c in checklist" :key="c.label" class="ck" :class="{ on: c.on }"><i></i>{{ c.label }}</div>
              <div v-if="!checklist.length" class="muted sm">Chưa có biên bản đồng kiểm khi trả.</div>
              <label class="lbl mt12">Ảnh hư hỏng / ảnh khi trả</label>
              <div class="row g8 wrap">
                <img v-for="(u, i) in insp.photos" :key="u + i" :src="u" alt="" style="width:80px;height:64px;object-fit:cover;border-radius:6px">
                <span v-if="!insp.photos.length" class="muted sm">Chưa có ảnh.</span>
              </div>
            </div>
            <div class="fl1">
              <label class="lbl">Số tiền yêu cầu bồi thường</label>
              <input v-if="insp.canReportDamage" v-model="damage.amount" class="inp" inputmode="numeric" :placeholder="'Tối đa ' + vnd(money.deposit)">
              <input v-else class="inp" :value="vnd(insp.claimedAmount)" disabled>
              <label class="lbl mt12">Ghi chú</label>
              <textarea v-if="insp.canReportDamage" v-model="damage.reason" class="ta" style="min-height:64px" placeholder="Mô tả hư hỏng (rách, ố bẩn, thiếu phụ kiện…)"></textarea>
              <textarea v-else class="ta" style="min-height:64px" :value="insp.note" disabled></textarea>
              <template v-if="insp.canReportDamage">
                <label class="lbl mt12">Ảnh hư hỏng</label>
                <ImageUploader v-model="damagePhotos" :max="10" label="Tải ảnh hư hỏng" :h="70" />
              </template>
            </div>
          </div>
          <div class="row g12 mt16">
            <button v-if="insp.canReportDamage" type="button" class="btn ro" :disabled="busy" @click="reportDamage">Báo hư hỏng &amp; mở tranh chấp</button>
            <RouterLink v-if="v.dispute" class="btn o" :to="{ name: 'ChuTranhChap', query: { code: v.dispute.code } }">Xem tranh chấp {{ v.dispute.code }}</RouterLink>
            <span v-if="insp.locked" class="muted sm" style="align-self:center">Biên bản kiểm tra đã khóa, không thể sửa khi đang tranh chấp.</span>
            <span v-else-if="insp.canComplete" class="muted sm" style="align-self:center">Nguyên vẹn thì bấm "Hoàn tất đơn" ở phần cập nhật trạng thái; hư hỏng thì báo bồi thường.</span>
          </div>
        </div>

        <div class="card">
          <h3>Tiến trình</h3>
          <TimelineList :items="v.timeline" />
        </div>
      </template>
    </div>
  </BoLayout>
</template>
