<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import StarRating from '@/components/StarRating.vue'
import LoadState from '@/components/LoadState.vue'
import { useUiStore } from '@/stores/ui'
import { ownerService } from '@/services/ownerService'
import { errMsg } from '@/services/http'

const ui = useUiStore()
const data = ref(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const reviews = ref([])
const criteria = reactive([])
const comment = ref('')
const idx = ref(0)
const submitted = ref(false)
const skipped = ref(false)

function resetForm(crit) {
  criteria.splice(0, criteria.length, ...(crit || []).map((c) => ({ label: c[0], stars: 5 })))
  comment.value = ''; skipped.value = false
}
async function load(silent) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const d = await ownerService.reviews()
    data.value = d
    reviews.value = d.received.map((r) => ({ ...r, editing: false, draft: '', busy: false }))
    if (idx.value >= d.toReview.length) idx.value = 0
    resetForm(d.criteria)
  } catch (e) {
    const m = errMsg(e, 'Không tải được đánh giá')
    if (silent && data.value) ui.toast(m); else { error.value = m; ui.toast(m) }
  } finally { loading.value = false }
}
onMounted(() => load(false))

const cur = computed(() => (data.value ? data.value.toReview[idx.value] || null : null))
const summary = computed(() => (data.value ? data.value.summary : null))
const dist = computed(() => {
  const s = summary.value
  if (!s) return []
  const total = s.distTotal || s.dist.reduce((t, d) => t + d[1], 0)
  return s.dist.map((d) => ({ star: d[0], count: d[1], pct: total ? Math.round((d[1] / total) * 100) : 0 }))
})
const avg = computed(() => (criteria.length ? criteria.reduce((s, c) => s + c.stars, 0) / criteria.length : 0))

function pickOrder(i) { idx.value = i; resetForm(data.value.criteria); submitted.value = false }
function setStars(c, n) { if (!submitted.value) c.stars = n }
async function submit() {
  if (!cur.value) return
  busy.value = true
  try {
    await ownerService.reviewRenter(cur.value.orderCode, { criteria: criteria.map((c) => c.stars), comment: comment.value.trim() || undefined })
    submitted.value = true
    ui.toast('Đã gửi đánh giá người thuê – hiển thị sau khi hai bên cùng gửi hoặc hết 7 ngày')
    await load(true)
    submitted.value = false // đơn đã đánh giá rời khỏi danh sách chờ; form chuyển sang đơn kế tiếp (nếu có)
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được đánh giá')) } finally { busy.value = false }
}
function skip() { skipped.value = true; ui.toast('Bạn có thể đánh giá sau, còn ' + cur.value.daysLeft + ' ngày') }
function openReply(r) { r.editing = true; r.draft = '' }
async function sendReply(r) {
  if (!r.draft.trim()) { ui.toast('Nhập nội dung phản hồi'); return }
  r.busy = true
  try {
    await ownerService.replyReview(r.id, r.draft.trim())
    ui.toast('Đã gửi phản hồi đánh giá')
    await load(true)
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được phản hồi')) } finally { r.busy = false }
}
</script>

<template>
  <BoLayout role="owner" active="Đánh giá" title="Đánh giá hai chiều" sub="Đánh giá người thuê và phản hồi đánh giá về shop">
    <LoadState :loading="loading" :error="error" @retry="load(false)" />
    <div v-if="data && !loading && !error" class="row as">
      <div class="col fl1">
        <div v-if="cur" class="card">
          <div class="row jb ac mb12">
            <h3 style="margin:0">Đánh giá người thuê · {{ cur.orderCode }}</h3>
            <ChipTag v-if="submitted" kind="g">Đã gửi đánh giá</ChipTag>
            <ChipTag v-else kind="a">Chờ bạn đánh giá – còn {{ cur.daysLeft }} ngày</ChipTag>
          </div>
          <div v-if="data.toReview.length > 1" class="row g8 wrap mb12">
            <a v-for="(t, i) in data.toReview" :key="t.orderCode" @click="pickOrder(i)"><span class="chip" :class="{ n: i !== idx }" :style="i === idx ? 'background:#6B4630;color:#fff' : ''">{{ t.orderCode }}</span></a>
          </div>
          <div class="row g12 ac mb12">
            <span class="av l">{{ cur.initials }}</span>
            <div><b>{{ cur.renter }}</b><div class="muted">{{ cur.product }} · {{ cur.rent }} · đã hoàn tất, đã hoàn cọc</div></div>
          </div>
          <div v-for="c in criteria" :key="c.label" class="rw">
            <span>{{ c.label }}</span>
            <span class="stars" style="cursor:pointer">
              <span v-for="n in 5" :key="n" @click="setStars(c, n)">{{ n <= c.stars ? '★' : '☆' }}</span>
            </span>
          </div>
          <div class="muted sm mt8">Điểm trung bình: {{ avg.toFixed(1).replace('.', ',') }} ★</div>
          <label class="lbl mt12">Nhận xét</label>
          <textarea v-model="comment" class="ta" placeholder="Chia sẻ tình trạng đồ khi trả, mức độ hợp tác…" :disabled="submitted"></textarea>
          <div class="muted sm mt8">Hai bên chỉ thấy đánh giá của nhau sau khi cùng gửi hoặc hết 7 ngày.</div>
          <div class="row g8 mt12">
            <button type="button" class="btn" :class="{ dis: submitted }" :disabled="submitted || busy" @click="submit">Gửi đánh giá</button>
            <button type="button" class="btn o" :disabled="submitted" @click="skip">Để sau</button>
          </div>
          <div v-if="skipped && !submitted" class="muted sm mt8">Đã lưu — bạn còn {{ cur.daysLeft }} ngày để đánh giá.</div>
        </div>
        <div v-else class="card muted">Không có đơn nào đang chờ bạn đánh giá người thuê.</div>
        <div v-for="s in data.suspended" :key="s.orderCode" class="card warn">
          <b>Tạm hoãn đánh giá</b>
          <div class="muted mt8">{{ s.orderCode }} đang có tranh chấp {{ s.disputeCode }}. Đánh giá sẽ mở sau khi Admin phán quyết.</div>
        </div>
      </div>

      <div class="col fl1">
        <div class="card">
          <h4>Điểm của shop</h4>
          <div class="row ac g12">
            <div style="font-family:'Merriweather',serif;font-size:34px;font-weight:700">{{ summary.ratingText }}</div>
            <div class="fl1">
              <div v-for="d in dist" :key="d.star" class="row ac g8 sm">
                <span style="width:26px;white-space:nowrap">{{ d.star }}★</span>
                <div style="flex:1;height:8px;background:#EFE6D8;border-radius:4px"><div :style="{ width: d.pct + '%', height: '8px', background: '#B08A4A', borderRadius: '4px' }"></div></div>
                <span class="muted" style="width:26px">{{ d.count }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <h3>Đánh giá bạn nhận được ({{ summary.total }})</h3>
          <div v-for="r in reviews" :key="r.id" style="padding:12px 0;border-bottom:1px solid #EFE6D8">
            <b>{{ r.name }}</b> <StarRating :value="r.stars" />
            <div class="muted">{{ r.text }}</div>
            <div v-if="r.reply" class="card tint mt8" style="padding:10px 14px"><b class="sm">Phản hồi của shop</b><div class="muted">{{ r.reply }}</div></div>
            <div v-else-if="r.editing" class="mt8">
              <textarea v-model="r.draft" class="ta" style="min-height:60px" placeholder="Phản hồi của shop…"></textarea>
              <div class="row g8 mt8"><button type="button" class="btn s" :disabled="r.busy" @click="sendReply(r)">Gửi phản hồi</button><button type="button" class="btn s o" @click="r.editing = false">Hủy</button></div>
            </div>
            <div v-else class="mt8"><button type="button" class="btn s o" @click="openReply(r)">Phản hồi</button></div>
          </div>
          <div v-if="!reviews.length" class="muted">Shop chưa nhận được đánh giá nào.</div>
        </div>
      </div>
    </div>
  </BoLayout>
</template>
