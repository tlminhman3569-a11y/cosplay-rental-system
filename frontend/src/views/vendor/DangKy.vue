<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PublicLayout from '@/layouts/PublicLayout.vue'
import FormField from '@/components/FormField.vue'
import StepperBar from '@/components/StepperBar.vue'
import TimelineList from '@/components/TimelineList.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errMsg } from '@/services/http'
import { REGISTER_ID_SLOTS, REGISTER_FLOW } from '@/config/vendorUi'

import { mockMeta, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const auth = {user:null}
const router = useRouter()
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const meta = ref(null)
const f = reactive({ shopName: 'Mochi Cosplay', area: 'TP. Hồ Chí Minh', intro: 'Trang phục và phụ kiện cosplay được chăm sóc kỹ.', hours: '09:00 – 21:00', phone: '0900000000', bank: 'Vietcombank', accountNo: '000000000000', accountName: 'CHU SHOP DEMO', idNumber: '000000000000' })
const idSlots = ref(REGISTER_ID_SLOTS.map((label) => ({ label, imgs: [] })))
const pledges = ref([])
const flow = REGISTER_FLOW
const STEPS = ['Thông tin shop', 'Xác minh danh tính', 'Tài khoản nhận tiền', 'Cam kết & gửi hồ sơ']

async function load() {
  loading.value = true; error.value = ''
  try {
    const m = copyMock(mockMeta)
    meta.value = m
    f.area = f.area || (m.areas || [])[0] || ''
    f.bank = f.bank || (m.banks || [])[0] || ''
    pledges.value = (m.pledges || []).map((text) => ({ text, on: true }))
    const u = auth.user
    if (u) {
      if (!f.phone) f.phone = u.phone || ''
      if (!f.accountName) f.accountName = String(u.fullName || '').toUpperCase()
    }
  } catch (e) {
    error.value = errMsg(e, 'Không tải được biểu mẫu đăng ký')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

const steps = computed(() => (meta.value && meta.value.registerSteps && meta.value.registerSteps.length ? meta.value.registerSteps : STEPS))
const areaOptions = computed(() => (meta.value ? meta.value.areas : []))
const bankOptions = computed(() => (meta.value ? meta.value.banks : []))
// Tài khoản chưa xác minh (NONE / REJECTED) mới phải gửi CCCD; PENDING / VERIFIED bỏ qua bước này
const needsId = computed(() => !auth.user || ['NONE', 'REJECTED'].includes(auth.user.verifyStatus))

const phoneOk = computed(() => /^0\d{9,10}$/.test(f.phone.replace(/[\s.]/g, '')))
const accountNoOk = computed(() => /^\d{8,16}$/.test(f.accountNo.replace(/\s/g, '')))
const idNumberOk = computed(() => /^\d{9,12}$/.test(f.idNumber.replace(/\s/g, '')))
const shopDone = computed(() => !!(f.shopName.trim().length >= 2 && f.area && f.hours.trim() && phoneOk.value))
const idDone = computed(() => !needsId.value || (idNumberOk.value && idSlots.value.every((s) => s.imgs.length > 0)))
const bankDone = computed(() => !!(f.bank && accountNoOk.value && f.accountName.trim()))
const pledgeDone = computed(() => pledges.value.length > 0 && pledges.value.every((p) => p.on))
// Bước hiện tại = bước đầu tiên chưa hoàn tất
const current = computed(() => {
  const flags = [shopDone.value, idDone.value, bankDone.value, pledgeDone.value]
  const i = flags.findIndex((x) => !x)
  return i < 0 ? flags.length - 1 : i
})
// Ảnh CCCD/chân dung tải vào thư mục riêng (private): chỉ chính chủ và Staff kiểm duyệt xem được
function missing() {
  const out = []
  if (!shopDone.value) out.push('thông tin shop')
  if (!idDone.value) out.push('số CCCD / ảnh CCCD, chân dung')
  if (!bankDone.value) out.push('tài khoản nhận tiền')
  if (!pledgeDone.value) out.push('cam kết chủ đồ')
  return out
}
async function submit() {
  const m = missing()
  if (m.length) { ui.toast('Còn thiếu: ' + m.join(', ')); return }
  submitting.value = true
  try {
    const body = {
      shopName: f.shopName.trim(), area: f.area, intro: f.intro.trim() || undefined, hours: f.hours.trim(),
      phone: f.phone.replace(/[\s.]/g, ''), bank: f.bank, accountNo: f.accountNo.replace(/\s/g, ''), accountName: f.accountName.trim(),
      accepted: true,
    }
    if (needsId.value) body.identity = { idNumber: f.idNumber.replace(/\s/g, ''), idFrontUrl: idSlots.value[0].imgs[0], idBackUrl: idSlots.value[1].imgs[0], selfieUrl: idSlots.value[2].imgs[0] }
    ui.toast('Đã hoàn tất hồ sơ minh họa; không gửi thông tin xác minh lên hệ thống')
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được hồ sơ, vui lòng thử lại')) } finally { submitting.value = false }
}
function saveDraft() { ui.toast('Chưa hỗ trợ lưu nháp hồ sơ – thông tin vẫn được giữ trên trang này cho tới khi bạn gửi hồ sơ') }
</script>

<template>
  <PublicLayout>
    <div class="row jb ae mb16">
      <div>
        <div class="crumb"><RouterLink :to="{ name: 'ChuHoSo' }">Hồ sơ shop</RouterLink> › <b>Trở thành chủ đồ</b></div>
        <h1 class="h1" style="margin-bottom:4px">Đăng ký làm chủ đồ &amp; xác minh</h1>
        <div class="muted">Hoàn tất 4 bước để mở gian hàng cho thuê trên Clarity.</div>
      </div>
    </div>
    <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load" />
    <template v-if="meta && !loading && !error">
    <div class="card" style="padding:16px 28px"><StepperBar :steps="steps" :current="current" /></div>

    <div class="row as g24 mt16">
      <div class="col fl1">
        <div class="card">
          <h3>1. Thông tin shop</h3>
          <div class="row">
            <div class="fl1"><FormField v-model="f.shopName" label="Tên shop" /></div>
            <div class="fl1"><FormField v-model="f.area" label="Khu vực nhận đồ" type="select" :options="areaOptions" /></div>
          </div>
          <FormField v-model="f.intro" label="Giới thiệu shop" type="textarea" placeholder="Bạn cho thuê loại đồ nào, từ khi nào, cách bảo quản đồ…" />
          <div class="row">
            <div class="fl1"><FormField v-model="f.hours" label="Giờ nhận/trả đồ" /></div>
            <div class="fl1"><FormField v-model="f.phone" label="Số điện thoại" :error="f.phone && !phoneOk ? 'Số điện thoại gồm 10–11 chữ số, bắt đầu bằng 0' : ''" /></div>
          </div>
        </div>

        <div class="card">
          <h3>2. Xác minh danh tính</h3>
          <template v-if="needsId">
            <FormField v-model="f.idNumber" label="Số CCCD" placeholder="9–12 chữ số" :error="f.idNumber && !idNumberOk ? 'Số CCCD gồm 9–12 chữ số' : ''" />
            <div class="row g12">
              <div v-for="s in idSlots" :key="s.label" class="fl1" style="min-width:0">
                <ImageUploader disabled v-model="s.imgs" :fixed="[{ url: '', label: s.label }]" :max="1" private :label="s.label" :h="120" />
              </div>
            </div>
          </template>
          <div v-else class="muted">Danh tính của bạn đã được gửi / xác minh nên không cần nộp lại CCCD.</div>
          <div class="muted sm mt8">Staff xác minh so khớp họ tên, số CCCD và khuôn mặt. Thông tin chỉ dùng để xác minh, không hiển thị công khai.</div>
        </div>

        <div class="card">
          <h3>3. Tài khoản nhận tiền</h3>
          <div class="row">
            <div class="fl1"><FormField v-model="f.bank" label="Ngân hàng" type="select" :options="bankOptions" /></div>
            <div class="fl1"><FormField v-model="f.accountNo" label="Số tài khoản" :error="f.accountNo && !accountNoOk ? 'Số tài khoản gồm 8–16 chữ số' : ''" /></div>
            <div class="fl1"><FormField v-model="f.accountName" label="Chủ tài khoản" /></div>
          </div>
          <div class="muted sm mt8">Tên chủ tài khoản phải trùng họ tên trên CCCD. Rút tiền tối thiểu 200.000đ, Admin duyệt trong 24 giờ.</div>
        </div>

        <div class="card">
          <h3>4. Cam kết chủ đồ</h3>
          <div v-for="p in pledges" :key="p.text" class="ck" :class="{ on: p.on }" style="cursor:pointer" @click="p.on = !p.on"><i></i>{{ p.text }}</div>
        </div>
      </div>

      <div class="col" style="width:380px;flex:none">
        <div class="card"><h3>Quy trình sau khi gửi hồ sơ</h3><TimelineList :items="flow" /></div>
        <div class="card tint">
          <h4>Quyền lợi &amp; phí</h4>
          <div class="rw"><span>Phí nền tảng</span><span>7% (trừ vào tiền thuê nhận)</span></div>
          <div class="rw"><span>Tiền cọc</span><span>Do Clarity giữ</span></div>
          <div class="rw"><span>Nhận tiền thuê</span><span>Sau khi đơn hoàn tất</span></div>
        </div>
        <div class="col g8">
          <button type="button" class="btn w" :disabled="submitting" @click="submit">{{ submitting ? 'Đang gửi…' : 'Gửi hồ sơ xác minh' }}</button>
          <button type="button" class="btn o w" @click="saveDraft">Lưu nháp</button>
        </div>
      </div>
    </div>
    </template>
  </PublicLayout>
</template>
