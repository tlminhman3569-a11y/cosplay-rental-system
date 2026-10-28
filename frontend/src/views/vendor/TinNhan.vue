<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BoLayout from '@/layouts/BoLayout.vue'
import ChipTag from '@/components/ChipTag.vue'
import ImgPh from '@/components/ImgPh.vue'
import LoadState from '@/components/owner/LoadState.vue'
import { useUiStore } from '@/store/ui'
import { errMsg } from '@/services/http'
import AttachmentLink from '@/components/AttachmentLink.vue'

import { mockConversations, mockMessages, mockConversationSummary, mockMeta, copyMock } from '../../../mock/vendor'
const ui = useUiStore()
const route = useRoute()
const convs = ref([])
const activeId = ref(0)
const messages = ref([])
const loading = ref(true)
const error = ref('')
const opening = ref(false)
const sending = ref(false)
const keyword = ref('')
const draft = ref('')
const box = ref(null)
const quickReplies = ref(['Đã nhận bằng chứng', 'Hướng dẫn cách giặt', 'Cảm ơn bạn đã thuê'])

const active = computed(() => convs.value.find((c) => c.id === activeId.value) || null)
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return k ? convs.value.filter((c) => (c.name + ' ' + (c.preview || '')).toLowerCase().includes(k)) : convs.value
})
function scrollDown() { nextTick(() => { if (box.value) box.value.scrollTop = box.value.scrollHeight }) }

async function refreshList() {
  const list = copyMock(mockConversations).map(c => ({...c, summary:c.order ? mockConversationSummary : null}))
  // giữ cuộc đang mở ở trạng thái đã đọc ngay trên giao diện
  convs.value = list.map((c) => (c.id === activeId.value ? { ...c, unread: 0 } : c))
}

async function openConv(id) {
  if (!id) return
  opening.value = true
  activeId.value = id
  try {
    const c = {...mockConversations.find(c => c.id === id), messages:copyMock(mockMessages)}
    if (activeId.value !== id) return
    messages.value = c.messages || []
    const row = convs.value.find((x) => x.id === id)
    if (row) row.unread = 0
    else convs.value = [{ ...c, unread: 0 }, ...convs.value]
    scrollDown()
  } catch (e) { ui.toast(errMsg(e, 'Không mở được cuộc trò chuyện')) } finally { opening.value = false }
}
function open(c) { if (c.id !== activeId.value) openConv(c.id) }

async function load() {
  loading.value = true; error.value = ''
  try {
    const [list, meta] = await Promise.all([Promise.resolve(copyMock(mockConversations).map(c => ({...c, summary:c.order ? mockConversationSummary : null}))), Promise.resolve(mockMeta)])
    convs.value = list
    if (meta && meta.quickReplies && meta.quickReplies.length) quickReplies.value = meta.quickReplies
    let id = 0
    const orderCode = String(route.query.order || '')
    if (orderCode) {
      const found = list.find((c) => c.order === orderCode)
      if (found) id = found.id
      else {
        try {
          const created = {...mockConversations[0],order:orderCode}
          convs.value = [created, ...list.filter((c) => c.id !== created.id)]
          id = created.id
        } catch (e) { ui.toast(errMsg(e, 'Không mở được hội thoại của đơn ' + orderCode)) }
      }
    }
    const qid = Number(route.query.id || route.query.conversation || 0)
    if (!id && qid && list.some((c) => c.id === qid)) id = qid
    if (!id && list.length) id = list[0].id
    loading.value = false
    if (id) await openConv(id)
  } catch (e) {
    error.value = errMsg(e, 'Không tải được tin nhắn')
    ui.toast(error.value)
  } finally { loading.value = false }
}
onMounted(load)

async function openSupport() {
  let c = convs.value.find((x) => x.type === 'SUPPORT')
  if (!c) {
    try {
      const created = mockConversations[2]
      convs.value = [created, ...convs.value.filter((x) => x.id !== created.id)]
      c = created
    } catch (e) { ui.toast(errMsg(e, 'Không mở được hội thoại hỗ trợ')); return }
  }
  open(c)
}
async function send(attachmentUrl) {
  const att = typeof attachmentUrl === 'string' ? attachmentUrl : ''
  const t = draft.value.trim() || (att ? 'Đã gửi một tệp đính kèm' : '')
  if (!t || !active.value || sending.value) return
  sending.value = true
  try {
    const m = {id:Date.now(),type:'me',text:t,attachmentUrl:att || null}
    messages.value = [...messages.value, { ...m, type: 'me', text: m.text || t, attachmentUrl: m.attachmentUrl || att || null }]
    active.value.preview = 'Bạn: ' + t
    draft.value = ''
    scrollDown()
  } catch (e) { ui.toast(errMsg(e, 'Không gửi được tin nhắn')) } finally { sending.value = false }
}
const uploading = ref(false)
// Nút Ảnh / Tệp: chọn tệp thật, tải lên rồi gửi kèm attachmentUrl
async function attach(pdf) {
  if (!active.value || sending.value || uploading.value) return
  uploading.value = true
  try {
    const url = ''; ui.toast('Tệp đính kèm chỉ minh họa trên trang này')
    uploading.value = false
    if (url) await send(url)
  } catch (e) { ui.toast(e.response ? errMsg(e, 'Không tải được tệp lên') : e.message || 'Không tải được tệp lên') } finally { uploading.value = false }
}
function quick(t) { draft.value = t }
</script>

<template>
  <BoLayout role="owner" active="Tin nhắn" title="Tin nhắn">
    <div class="muted sm mb12">Dữ liệu minh họa · thao tác trên trang không ghi vào hệ thống.</div><LoadState :loading="loading" :error="error" @retry="load" />
    <div v-if="!loading && !error && !convs.length" class="card muted">Bạn chưa có cuộc trò chuyện nào. Tin nhắn với người thuê sẽ xuất hiện khi có đơn thuê.</div>
    <div v-if="!loading && !error && convs.length && active" class="row as" style="min-height:640px">
      <div class="card" style="width:250px;flex:none;padding:0;overflow:hidden;align-self:stretch">
        <div style="padding:12px"><input v-model="keyword" class="inp" placeholder="Tìm cuộc trò chuyện…"></div>
        <div v-for="c in filtered" :key="c.id" class="row g8 ac" :style="{ padding: '12px', borderBottom: '1px solid #EFE6D8', cursor: 'pointer', background: c.id === activeId ? '#F6F1E9' : '' }" @click="open(c)">
          <span class="av s" :class="{ gold: c.gold }">{{ c.initials }}</span>
          <div class="fl1">
            <b>{{ c.name }}</b>
            <div class="muted sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ c.preview }}</div>
          </div>
          <span v-if="c.unread" style="background:#B5432F;color:#fff;border-radius:10px;padding:1px 7px;font-size:11px">{{ c.unread }}</span>
        </div>
        <div v-if="!filtered.length" class="muted" style="padding:12px">Không tìm thấy cuộc trò chuyện.</div>
      </div>

      <div class="card fl1" style="padding:0;display:flex;flex-direction:column;overflow:hidden">
        <div class="row jb ac" style="padding:12px 16px;border-bottom:1px solid #E3D8C8">
          <div class="row g8 ac" style="white-space:nowrap">
            <span class="av s" :class="{ gold: active.gold }">{{ active.initials }}</span><b>{{ active.name }}</b>
            <ChipTag v-if="active.order" kind="n">{{ active.order }}</ChipTag>
          </div>
          <span class="muted sm" style="white-space:nowrap">{{ active.online ? 'Online' : 'Offline' }}</span>
        </div>
        <div ref="box" class="col g8" style="padding:16px;height:470px;overflow:auto">
          <div v-for="(m, i) in messages" :key="m.id || 's' + i" class="bubble" :class="m.type">{{ m.text }}<AttachmentLink :url="m.attachmentUrl" /></div>
          <div v-if="opening" class="muted sm">Đang tải tin nhắn…</div>
        </div>
        <div style="padding:12px 16px;border-top:1px solid #E3D8C8">
          <div class="row g8 wrap mb8">
            <a v-for="q in quickReplies" :key="q" @click="quick(q)"><ChipTag kind="b">{{ q }}</ChipTag></a>
          </div>
          <div class="row g8">
            <button type="button" class="btn o" :disabled="uploading" @click="attach(false)">{{ uploading ? 'Đang tải…' : 'Ảnh' }}</button>
            <button type="button" class="btn o" :disabled="uploading" @click="attach(true)">Tệp</button>
            <div style="flex:1 1 auto;min-width:0"><input v-model="draft" class="inp" placeholder="Nhập tin nhắn…" @keyup.enter="send()"></div>
            <button type="button" class="btn" :disabled="sending" @click="send()">Gửi</button>
          </div>
        </div>
      </div>

      <div class="card" style="width:270px;flex:none;align-self:stretch">
        <h3>Tóm tắt đơn</h3>
        <template v-if="active.summary">
          <div class="row g8 mb12">
            <ImgPh :label="active.summary.imgLabel" :w="44" :h="56" />
            <div><b>{{ active.summary.product }}</b><div class="muted sm">{{ active.summary.orderCode }}</div></div>
          </div>
          <div class="rw"><span>Trạng thái</span><span>{{ active.summary.status }}</span></div>
          <div class="rw"><span>Thuê</span><span>{{ active.summary.rent }}</span></div>
          <div class="rw"><span>Giao nhận</span><span>{{ active.summary.ship }}</span></div>
          <div class="rw"><span>Cọc đang giữ</span><span>{{ active.summary.deposit }}</span></div>
          <div v-if="active.summary.dispute" class="mt12"><ChipTag kind="r">Có tranh chấp</ChipTag></div>
          <div class="div"></div>
          <div class="col g8">
            <RouterLink v-if="active.summary.dispute" class="btn w ro" :to="{ name: 'ChuTranhChap', query: active.summary.disputeCode ? { code: active.summary.disputeCode } : {} }">Xem tranh chấp</RouterLink>
            <RouterLink class="btn w o" :to="{ name: 'ChuDonChiTiet', query: { code: active.summary.orderCode } }">Xem đơn</RouterLink>
            <button type="button" class="btn w o" @click="openSupport">Chat Clarity hỗ trợ</button>
          </div>
        </template>
        <div v-else class="muted">Cuộc trò chuyện với Clarity Hỗ trợ không gắn với một đơn cụ thể.</div>
        <div v-if="!active.summary" class="col g8 mt12"><RouterLink class="btn w ro" :to="{ name: 'ChuTranhChap' }">Xem tranh chấp</RouterLink></div>
      </div>
    </div>
  </BoLayout>
</template>
