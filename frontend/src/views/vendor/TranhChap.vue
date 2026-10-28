<script setup>
// Tranh chấp của shop: ?code=DIS-… (không có code thì mở tranh chấp đầu tiên)
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import ImgPh from '@/components/ImgPh.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import TimelineList from '@/components/TimelineList.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errMsg } from '@/services/http'
import { vnd } from '@/utils/format'

import { mockDisputes, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const route = useRoute()
const list = ref([])
const d = ref(null)
const loading = ref(true)
const error = ref('')
const empty = ref(false)
const sending = ref(false)
const reply = ref('')
const files = ref([])
const sent = ref(false)

async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''; empty.value = false
  try {
    list.value = copyMock(mockDisputes)
    const code = String(route.query.code || '') || (list.value[0] ? list.value[0].code : '')
    if (!code) { d.value = null; empty.value = true; return }
    d.value = copyMock(mockDisputes.find(x => x.code === code) || mockDisputes[0])
  } catch (e) {
    const m = errMsg(e, 'Không tải được tranh chấp')
    if (silent && d.value) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))
watch(() => route.query.code, () => { reply.value = ''; files.value = []; sent.value = false; load(false) })

const v = computed(() => (d.value ? d.value.view : null))
const timeline = computed(() => (d.value ? d.value.log || [] : []))
const others = computed(() => list.value.filter((x) => !d.value || x.code !== d.value.code))
const canSend = computed(() => !!(d.value && d.value.canRespond) && (reply.value.trim().length > 0 || files.value.length > 0))
const evLabel = (e, i) => e.label || e.note || 'Bằng chứng ' + (i + 1)

async function send() {
  if (!d.value.canRespond) { ui.toast('Tranh chấp này không còn nhận phản hồi'); return }
  if (!canSend.value) { ui.toast('Nhập phản hồi hoặc tải bằng chứng trước khi gửi'); return }
  sending.value = true
  try {
    mockDisputes[0].log.push({state:'d',title:'Phản hồi minh họa của chủ shop',sub:reply.value.trim()})
    sent.value = true
    reply.value = ''; files.value = []
    ui.toast('Đã lưu phản hồi minh họa trên trang')
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được phản hồi')) } finally { sending.value = false }
}
</script>

<template>
  <BoLayout role="owner" active="Tranh chấp" :title="'Tranh chấp ' + (d ? d.code : '')">
    <div class="col">
      <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load(false)" />
      <div v-if="empty && !loading && !error" class="card muted">Shop chưa có tranh chấp nào.</div>
      <template v-if="d && v && !loading && !error">
        <div class="card">
          <div class="row jb ac mb8">
            <h3 style="margin:0">{{ d.code }} · {{ d.orderCode }}</h3>
            <div class="row g8"><ChipTag v-for="c in d.chips" :key="c[0]" :kind="c[1]">{{ c[0] }}</ChipTag></div>
          </div>
          <div class="row">
            <div class="fl1">
              <div class="rw"><span>Sản phẩm</span><span>{{ v.product }}</span></div>
              <div class="rw"><span>Người thuê</span><span>{{ v.renter }}</span></div>
              <div class="rw"><span>Mở ngày</span><span>{{ v.openedAt }}</span></div>
            </div>
            <div class="fl1">
              <div class="rw"><span>Cọc đang giữ</span><span>{{ vnd(v.deposit) }}</span></div>
              <div class="rw"><span>Chủ đồ yêu cầu</span><span>{{ vnd(v.claimed) }}</span></div>
              <div class="rw"><span>Staff hòa giải</span><span>{{ v.staff || '—' }}</span></div>
            </div>
          </div>
          <div class="mt12"><RouterLink class="btn s o" :to="{ name: 'ChuDonChiTiet', query: { code: d.orderCode } }">Xem đơn {{ d.orderCode }}</RouterLink></div>
        </div>

        <div class="row as">
          <div class="card fl1">
            <h4>Mô tả của chủ đồ</h4>
            <div class="muted" style="font-size:14px">{{ v.ownerText || '—' }}</div>
            <div class="row g8 mt12 wrap">
              <a v-for="(e, i) in v.ownerEvidences" :key="e.id || i" :href="e.url || undefined" target="_blank" rel="noopener"><ImgPh :label="evLabel(e, i)" :src="e.url" :w="90" :h="70" /></a>
              <span v-if="!v.ownerEvidences.length" class="muted sm">Chưa có bằng chứng từ chủ đồ.</span>
            </div>
          </div>
          <div class="card fl1">
            <h4>Phản bác của người thuê</h4>
            <div class="muted" style="font-size:14px">{{ v.renterText || 'Người thuê chưa phản hồi.' }}</div>
            <div class="row g8 mt12 wrap">
              <a v-for="(e, i) in v.renterEvidences" :key="e.id || i" :href="e.url || undefined" target="_blank" rel="noopener"><ImgPh :label="evLabel(e, i)" :src="e.url" :w="90" :h="70" /></a>
              <span v-if="!v.renterEvidences.length" class="muted sm">Chưa có bằng chứng từ người thuê.</span>
            </div>
          </div>
        </div>

        <div class="row as">
          <div class="card fl1"><h3>Nhật ký hòa giải</h3><TimelineList :items="timeline" /></div>
          <div class="card fl1">
            <h3>Bổ sung bằng chứng / phản hồi ({{ v.respondHours }} giờ)</h3>
            <textarea v-model="reply" class="ta" style="min-height:70px" placeholder="Nhập phản hồi cho Admin…" :disabled="!d.canRespond"></textarea>
            <div class="mt12"><ImageUploader v-model="files" :max="10" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" label="Tải ảnh bằng chứng" :h="70" :disabled="true" /></div>
            <div class="mt12"><button type="button" class="btn" :class="{ dis: !canSend }" :disabled="sending || !d.canRespond" @click="send">Gửi phản hồi</button></div>
            <div v-if="!d.canRespond" class="muted sm mt8">Tranh chấp đã có phán quyết hoặc không còn nhận phản hồi.</div>
            <div v-if="sent" class="muted sm mt8">Phản hồi minh họa đã được thêm vào nhật ký trên trang.</div>
          </div>
        </div>

        <div class="card tint">
          <h4>Điều gì sẽ xảy ra tiếp theo?</h4>
          <div class="muted">Admin xem xét bằng chứng và ra phán quyết. Cọc {{ vnd(v.deposit) }} tiếp tục được Clarity giữ; số tiền theo phán quyết sẽ chuyển vào ví của bạn, phần còn lại hoàn cho khách. Bạn có thể phản hồi trong {{ v.respondHours }} giờ.</div>
        </div>
        <div class="card">
          <h4>Tranh chấp khác</h4>
          <div v-for="o in others" :key="o.code" class="rw">
            <span><RouterLink :to="{ name: 'ChuTranhChap', query: { code: o.code } }"><b>{{ o.code }}</b></RouterLink> · {{ o.orderCode }} · {{ o.product }}</span>
            <span class="row g8"><ChipTag v-for="c in o.chips" :key="c[0]" :kind="c[1]">{{ c[0] }}</ChipTag></span>
          </div>
          <div v-if="!others.length" class="muted">Không có tranh chấp nào khác đang mở.</div>
        </div>
      </template>
    </div>
  </BoLayout>
</template>
