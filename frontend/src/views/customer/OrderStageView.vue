<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderApi } from '../../services/customerApi';
import { getDemoComplaint, getDemoOrder, saveDemoComplaint, updateDemoOrder } from '../../mock/customerDemo';
import AccessibleSelect from '../../components/AccessibleSelect.vue';

const props = defineProps({ stage: { type: String, default: 'tracking' } });
const route = useRoute();
const router = useRouter();
const order = ref(null);
const error = ref('');
const notice = ref('');
const actionSectionRef = ref(null);
const actionCompleted = ref({
  refund: false,
  cancel: false,
  received: false,
  returned: false,
  review: false
});
const ratings = ref({ communication: 5, description: 4, punctuality: 5 });
const message = ref('');
const cancelReason = ref('');
const agreeCancel = ref(false);
const checklist = ref({ complete: true, condition: true, size: true, clean: true });
const evidenceFiles = ref([]);
const complaintSubmitted = ref(false);
const returnMethod = ref('Grab Express');
const disputeReason = ref('Không đồng ý với mức bồi thường hư hỏng');
const disputeResolution = ref('Hoàn cọc sau khi trừ phí trễ');
const disputeReasonOptions = [
  { value: 'Không đồng ý với mức bồi thường hư hỏng', label: 'Không đồng ý với mức bồi thường hư hỏng' },
  { value: 'Không đồng ý phí trả muộn', label: 'Không đồng ý phí trả muộn' },
  { value: 'Đồ không đúng mô tả', label: 'Đồ không đúng mô tả' }
];
const disputeResolutionOptions = [
  { value: 'Hoàn cọc sau khi trừ phí trễ', label: 'Hoàn cọc sau khi trừ phí trễ' },
  { value: 'Đề nghị kiểm tra lại bằng chứng', label: 'Đề nghị kiểm tra lại bằng chứng' },
  { value: 'Khác', label: 'Khác' }
];

const titles = {
  pending: ['Chờ chủ đồ xác nhận', 'Đã thanh toán · Chờ chủ đồ xác nhận', 'bi-hourglass-split'],
  receive: ['Đồng kiểm nhận đồ', 'Kiểm tra cùng chủ đồ trước khi xác nhận nhận trang phục.', 'bi-box2-heart'],
  return: ['Trả đồ thuê', 'Chọn cách trả và ghi nhận tình trạng trang phục.', 'bi-arrow-return-left'],
  tracking: ['Theo dõi đơn thuê', 'Theo dõi tiến trình thuê và lịch sử cập nhật.', 'bi-truck'],
  refund: ['Kết quả kiểm tra & hoàn cọc', 'Xem đề xuất khấu trừ và chọn cách phản hồi.', 'bi-wallet2'],
  cancel: ['Hủy đơn', 'Kiểm tra số tiền được hoàn trước khi xác nhận hủy.', 'bi-x-circle'],
  review: ['Đánh giá giao dịch', 'Đánh giá hai chiều giúp cộng đồng Clarity đáng tin hơn.', 'bi-star'],
  complaint: ['Khiếu nại', 'Gửi ý kiến và bằng chứng để Clarity hỗ trợ xử lý.', 'bi-flag']
};
const dbSteps = [
  { label: 'Chờ chủ đồ xác nhận', statuses: ['PENDING'] }, { label: 'Đã xác nhận', statuses: ['CONFIRMED'] },
  { label: 'Chuẩn bị đồ', statuses: ['READY'] }, { label: 'Đang giao', statuses: ['SHIPPING'] },
  { label: 'Đồng kiểm nhận đồ', statuses: [] }, { label: 'Đang thuê', statuses: ['RENTING'] },
  { label: 'Đang trả', statuses: [] }, { label: 'Kiểm tra sau trả', statuses: ['RETURNED'] },
  { label: 'Hoàn cọc', statuses: [] }, { label: 'Hoàn tất', statuses: ['COMPLETED'] }
];
const statusLabels = { AWAITING_PAYMENT: 'Chờ thanh toán', PENDING: 'Chờ chủ đồ xác nhận', CONFIRMED: 'Đã xác nhận', READY: 'Chuẩn bị đồ', SHIPPING: 'Đang giao', RENTING: 'Đang thuê', RETURNED: 'Kiểm tra sau trả', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy' };
const isDemo = computed(() => route.query.demo === '1');
const title = computed(() => titles[props.stage] || titles.tracking);
const screenStatus = computed(() => {
  if (actionCompleted.value.refund) return 'COMPLETED';
  if (actionCompleted.value.cancel) return 'CANCELLED';
  if (actionCompleted.value.received) return 'RENTING';
  if (actionCompleted.value.returned) return 'RETURNED';
  if (!order.value) return 'PENDING';
  if (!isDemo.value) return order.value.status;
  if (props.stage === 'tracking') return order.value.status || 'PENDING';
  return ({ pending: 'PENDING', receive: 'SHIPPING', return: 'RENTING', tracking: 'PENDING', refund: 'RETURNED', cancel: 'PENDING', review: 'COMPLETED', complaint: 'RETURNED' })[props.stage] || order.value.status;
});
const currentIndex = computed(() => {
  const map = { AWAITING_PAYMENT: 0, PENDING: 0, CONFIRMED: 1, READY: 2, SHIPPING: 3, RENTING: 5, RETURNED: 7, COMPLETED: 9, CANCELLED: -1 };
  return map[screenStatus.value] ?? 0;
});
const isDisputed = computed(() => isDemo.value || Boolean(order.value?.dispute || order.value?.disputeId));
const deposit = computed(() => order.value?.depositTotal ?? order.value?.depositAmount ?? 1000000);
const rental = computed(() => order.value?.rentalTotal ?? Math.max(0, (order.value?.totalAmount || 1500000) - deposit.value));
const damageFee = computed(() => isDemo.value ? 300000 : 0);
const lateFee = computed(() => isDemo.value ? 50000 : 0);
const expectedRefund = computed(() => Math.max(0, deposit.value - damageFee.value - lateFee.value));
const daysUntilStart = computed(() => {
  const date = order.value?.orderItems?.[0]?.startDate;
  return date ? Math.ceil((new Date(date) - new Date()) / 86400000) : 2;
});
const cancelPenalty = computed(() => screenStatus.value === 'PENDING' || daysUntilStart.value >= 2 ? 0 : Math.round(rental.value * 0.3));
const refundOnCancel = computed(() => Math.max(0, (order.value?.totalAmount || rental.value + deposit.value) - cancelPenalty.value));
const history = computed(() => {
  const list = order.value?.statusHistory || [];
  return list.length ? [...list].map((entry) => ({
    ...entry,
    toStatus: entry.toStatus || entry.status,
    changedAt: entry.changedAt || entry.createdAt
  })).reverse() : [
    { toStatus: 'COMPLETED', changedAt: '2026-10-25T14:30:00', note: 'Staff chuyển hồ sơ lên Admin để phán quyết.' },
    { toStatus: 'RETURNED', changedAt: '2026-10-24T10:00:00', note: 'Đồ đã trả; phát sinh ý kiến về khoản bồi thường.' },
    { toStatus: 'RENTING', changedAt: '2026-10-20T10:30:00', note: 'Hai bên đồng kiểm khi nhận đồ.' },
    { toStatus: 'SHIPPING', changedAt: '2026-10-20T08:05:00', note: `Đơn vị vận chuyển ${order.value?.shippingProvider || 'Grab Express'} nhận đơn.` },
    { toStatus: 'CONFIRMED', changedAt: '2026-10-18T12:14:00', note: 'Chủ đồ xác nhận đơn thuê.' },
    { toStatus: 'PENDING', changedAt: order.value?.createdAt || '2026-10-18T09:12:00', note: 'Thanh toán thành công qua VNPAY.' }
  ];
});
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
function date(value, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) { return value ? new Date(value).toLocaleDateString('vi-VN', options) : '20/10/2026'; }
async function load() {
  if (isDemo.value) {
    order.value = getDemoOrder();
    if (props.stage === 'complaint') {
      const complaint = getDemoComplaint();
      if (complaint) {
        disputeReason.value = complaint.reason;
        disputeResolution.value = complaint.resolution;
        message.value = complaint.message;
        evidenceFiles.value = complaint.evidenceFiles || [];
        complaintSubmitted.value = true;
        notice.value = 'Đã lưu lựa chọn, mô tả và tên tệp trong demo trên trình duyệt; chưa gửi lên backend.';
      }
    }
    return;
  }
  if (!route.params.id) { error.value = 'Không tìm thấy mã đơn thuê.'; return; }
  try { order.value = (await orderApi.detail(route.params.id)).data; }
  catch (requestError) { error.value = requestError.response?.data?.error?.message || 'Không thể tải đơn thuê.'; }
}
function demoUpdate(status, text) { order.value = updateDemoOrder(status, text); notice.value = text; }
function runAction(action) {
  if (action === 'received') {
    actionCompleted.value.received = true;
    notice.value = 'Bạn đã xác nhận nhận đồ; tiền cọc vẫn được Clarity giữ.';
    if (isDemo.value) demoUpdate('RENTING', notice.value);
    else if (order.value) order.value.status = 'RENTING';
    return;
  }
  if (action === 'returned') {
    actionCompleted.value.returned = true;
    notice.value = 'Đã ghi nhận yêu cầu trả đồ. Chủ shop sẽ kiểm tra trong 24 giờ.';
    if (isDemo.value) demoUpdate('RETURNED', notice.value);
    else if (order.value) order.value.status = 'RETURNED';
    return;
  }
  if (action === 'refund') {
    actionCompleted.value.refund = true;
    notice.value = `Đã đồng ý khoản khấu trừ; dự kiến hoàn ${money(expectedRefund.value)} về tài khoản.`;
    if (isDemo.value) demoUpdate('COMPLETED', notice.value);
    else if (order.value) order.value.status = 'COMPLETED';
    return;
  }
  if (action === 'cancel') {
    actionCompleted.value.cancel = true;
    notice.value = `Đã gửi yêu cầu hủy đơn thành công. Dự kiến hoàn ${money(refundOnCancel.value)} theo chính sách.`;
    if (isDemo.value) demoUpdate('CANCELLED', notice.value);
    else if (order.value) order.value.status = 'CANCELLED';
    return;
  }
  if (action === 'review') {
    actionCompleted.value.review = true;
    notice.value = `Đã gửi đánh giá ${Object.values(ratings.value).reduce((sum, value) => sum + value, 0)}/15. Cảm ơn bạn!`;
    return;
  }
  if (action === 'complaint') {
    complaintSubmitted.value = true;
    notice.value = 'Đã gửi khiếu nại thành công; nội dung và bằng chứng đã được lưu lại để Staff hỗ trợ giải quyết.';
    if (isDemo.value) {
      saveDemoComplaint({
        orderId: order.value?.id,
        reason: disputeReason.value,
        resolution: disputeResolution.value,
        message: message.value,
        evidenceFiles: [...evidenceFiles.value]
      });
    }
    return;
  }
}
function onEvidenceChange(event) { evidenceFiles.value = [...event.target.files].map((file) => file.name); }
function historyDescription(entry) {
  if (entry.note) return entry.note;
  if (!entry.fromStatus) return 'Cập nhật từ hệ thống';
  return `${statusLabels[entry.fromStatus] || entry.fromStatus} → ${statusLabels[entry.toStatus] || entry.toStatus}`;
}
function scrollToActiveSection() {
  if (props.stage && props.stage !== 'tracking' && props.stage !== 'pending') {
    nextTick(() => {
      setTimeout(() => {
        actionSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    });
  }
}
watch(() => props.stage, () => {
  scrollToActiveSection();
});
onMounted(() => {
  load();
  scrollToActiveSection();
});
</script>

<template>
  <div class="stage-page py-4"><div class="container">
    <button class="btn btn-link p-0 mb-3 text-decoration-none text-primary" @click="router.push(isDemo ? '/customer/orders?demo=1' : '/customer/orders')"><i class="bi bi-arrow-left me-1"></i>Đơn thuê của tôi</button>
    <div v-if="error" class="alert alert-warning">{{ error }}</div>
    <header class="stage-hero"><div class="stage-icon"><i :class="`bi ${title[2]}`"></i></div><div class="flex-grow-1"><span class="eyebrow">ĐƠN {{ order?.id?.slice(-12)?.toUpperCase() || 'ORD-2026-8801' }}</span><h1 class="display-6 fw-bold mb-1">{{ title[0] }}</h1><p class="mb-0">{{ title[1] }}</p></div><span class="status-pill" :class="{ disputed: isDisputed && ['tracking','refund','complaint'].includes(stage) }">{{ isDisputed && ['tracking','refund','complaint'].includes(stage) ? 'Có tranh chấp' : statusLabels[screenStatus] }}</span></header>
    <div v-if="notice" class="alert alert-success mt-3"><i class="bi bi-check-circle me-2"></i>{{ notice }}</div>

    <section v-if="stage !== 'cancel' && screenStatus !== 'CANCELLED'" class="timeline-card mt-4"><div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h5 mb-0">{{ stage === 'pending' ? 'Thời gian còn lại' : 'Tiến trình đơn thuê' }}</h2><small v-if="stage !== 'pending'" class="text-muted">Cập nhật từ chủ đồ</small></div><div v-if="stage === 'pending'" class="countdown"><strong>Còn 09:00:00</strong><span>Chủ đồ cần xác nhận trong 12 giờ kể từ khi thanh toán.</span></div><div class="timeline"> <div v-for="(step, index) in dbSteps" :key="step.label" class="timeline-step" :class="{ done: index < currentIndex, current: index === currentIndex }"><span class="step-icon">{{ index < currentIndex ? '✓' : index + 1 }}</span><strong>{{ step.label }}</strong></div></div></section>

    <div class="row g-4 mt-1"><section class="col-lg-7"><article class="detail-card"><div class="d-flex justify-content-between align-items-center"><h2 class="h5 mb-0">Sản phẩm thuê</h2><span class="shop-name"><i class="bi bi-shop me-1"></i>{{ order?.shop?.name || 'Mai Cosplay House' }}</span></div><div v-for="item in order?.orderItems || []" :key="item.id" class="product-line"><div class="product-thumb"><img v-if="item.product?.images?.[0]?.url" :src="item.product.images[0].url"><i v-else class="bi bi-person-heart"></i></div><div class="flex-grow-1"><strong>{{ item.productName }}</strong><span class="d-block small text-muted mt-1">Size {{ item.product?.size || 'M' }} · Thuê {{ date(item.startDate) }} – {{ date(item.endDate) }} · {{ item.quantity }} bộ</span><small class="text-muted">{{ order?.shippingProvider || 'Grab Express' }}</small></div></div><div v-if="!order?.orderItems?.length" class="product-line"><div class="product-thumb"><i class="bi bi-person-heart"></i></div><div><strong>Cosplay Raiden Shogun – Genshin Impact</strong><span class="d-block small text-muted mt-1">Chủ đồ: Trần Thị Mai · Size M</span><small>Thuê 20/10–22/10/2026 · {{ order?.shippingProvider || 'Grab Express' }}</small></div></div><div class="order-money"><div><span>Mã giao dịch</span><strong>{{ order?.checkoutRef || 'TX-99812' }} · VNPAY</strong></div><div><span>Tổng thanh toán</span><strong>{{ money(order?.totalAmount || 1500000) }}</strong></div><div><span>Tiền đang được Clarity giữ</span><strong>{{ money(order?.totalAmount || 1500000) }}</strong></div><small>Tiền thuê {{ money(rental) }} + cọc {{ money(deposit) }}. Chưa chuyển cho chủ đồ.</small></div></article></section><aside class="col-lg-5"><article class="detail-card"><h2 class="h5"><i class="bi bi-geo-alt me-2"></i>Thông tin giao nhận</h2><div class="info-row"><i class="bi bi-house"></i><span>{{ [order?.shippingAddress, order?.city].filter(Boolean).join(', ') || '12 Trần Duy Hưng, Cầu Giấy, Hà Nội' }}</span></div><div class="info-row"><i class="bi bi-truck"></i><span>{{ order?.shippingProvider || 'Grab Express' }} · {{ order?.shippingMethod || 'Giao tận nơi' }}</span></div><div class="info-row"><i class="bi bi-person"></i><span>{{ order?.receiverName || 'Phạm Văn Minh' }} · {{ order?.receiverPhone || '0912 334 881' }}</span></div></article><article class="detail-card mt-3"><h2 class="h5">Điều gì xảy ra tiếp theo?</h2><p class="small text-muted mb-2">Chủ đồ xác nhận để đơn chuyển sang chuẩn bị. Nếu chủ đồ từ chối hoặc quá hạn, khoản thanh toán được hoàn theo chính sách.</p><button class="btn btn-outline-primary btn-sm">Chat với chủ đồ</button></article></aside></div>

    <div ref="actionSectionRef" class="stage-action-area">
      <section v-if="stage === 'receive'" class="detail-card mt-4">
        <div class="section-title"><div><span class="eyebrow">ĐỒ ĐÃ ĐƯỢC BÀN GIAO</span><h2 class="h5">Đồng kiểm nhận đồ</h2></div><span class="soft-pill">{{ order?.shippingProvider || 'Grab Express' }}</span></div>
        <p class="text-muted">Hãy kiểm tra trang phục cùng chủ đồ trước khi xác nhận. Ảnh đồng kiểm là căn cứ đối chiếu nếu có tranh chấp.</p>
        <h3 class="h6 mt-4">Ảnh nhận đồ của bạn</h3>
        <div class="evidence-grid">
          <label v-for="label in ['Toàn bộ','Kimono','Váy','Phụ kiện','Giày và tóc giả','Đạo cụ']" :key="label" class="evidence-tile">
            <i class="bi bi-camera"></i><span>Ảnh · {{ label }}</span>
          </label>
          <label class="evidence-tile add-tile">
            <i class="bi bi-plus-lg"></i><span>Thêm ảnh / video<input type="file" accept="image/*,video/*" multiple @change="onEvidenceChange"></span>
          </label>
        </div>
        <p class="small text-muted mt-2">Đã chọn {{ evidenceFiles.length }} tệp · nên chụp ít nhất 4 ảnh rõ tình trạng đồ.</p>
        <h3 class="h6 mt-4">Danh sách kiểm tra</h3>
        <div class="checklist">
          <label><input v-model="checklist.complete" type="checkbox">Đủ trang phục và phụ kiện</label>
          <label><input v-model="checklist.condition" type="checkbox">Không rách, không ố bẩn</label>
          <label><input v-model="checklist.size" type="checkbox">Đúng size đã thuê</label>
          <label><input v-model="checklist.clean" type="checkbox">Đồ sạch, không có mùi lạ</label>
        </div>
        <div class="check-code mt-4"><div><span class="eyebrow">MÃ ĐỒNG KIỂM 4 SỐ</span><strong>4 7 2 9</strong><small>Đưa mã này cho chủ đồ hoặc shipper để cùng xác nhận.</small></div><div class="qr-placeholder"><i class="bi bi-qr-code"></i><span>QR đồng kiểm</span></div></div>
        <div v-if="actionCompleted.received" class="alert alert-success mt-4 mb-2"><i class="bi bi-check-circle-fill me-2"></i>{{ notice }}</div>
        <div v-if="!actionCompleted.received" class="d-flex flex-wrap gap-2 mt-4">
          <button type="button" class="btn btn-primary" :disabled="!Object.values(checklist).every(Boolean)" @click="runAction('received')">Xác nhận nhận đồ</button>
          <button type="button" class="btn btn-outline-danger" @click="notice = 'Đã ghi nhận yêu cầu hỗ trợ về tình trạng trang phục.'">Báo vấn đề</button>
        </div>
        <button v-else type="button" class="btn btn-outline-primary mt-3" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Xem tiến trình đơn</button>
      </section>

      <section v-if="stage === 'return'" class="row g-4 mt-1">
        <div class="col-lg-7">
          <article class="detail-card">
            <span class="eyebrow">HẠN TRẢ {{ date(order?.orderItems?.[0]?.endDate) }} · 22:00</span>
            <h2 class="h5">Hình thức trả đồ</h2>
            <div class="return-methods">
              <label v-for="option in ['Grab Express','GHN','Viettel Post','GHTK','Chủ đồ tự nhận','Khách tự trả tại địa chỉ chủ đồ']" :key="option" :class="{ selected: returnMethod === option }">
                <input v-model="returnMethod" :value="option" type="radio">{{ option }}
              </label>
            </div>
            <h3 class="h6 mt-4">Ảnh trả đồ</h3>
            <div class="evidence-grid">
              <label v-for="label in ['Toàn bộ','Tay áo','Váy']" :key="label" class="evidence-tile">
                <i class="bi bi-camera"></i><span>Ảnh trả · {{ label }}</span>
              </label>
              <label class="evidence-tile add-tile">
                <i class="bi bi-plus-lg"></i><span>Thêm ảnh<input type="file" accept="image/*" multiple @change="onEvidenceChange"></span>
              </label>
            </div>
            <div class="tip-box mt-4"><strong>Mẹo vệ sinh</strong><p class="mb-0">Không giặt máy đồ thêu; nếu có vết bẩn, báo chủ đồ thay vì tự tẩy.</p></div>
          </article>
        </div>
        <div class="col-lg-5">
          <article class="detail-card">
            <h2 class="h5">Phí trả muộn</h2>
            <div class="summary-row"><span>Quy định</span><strong>20% giá thuê / ngày</strong></div>
            <div class="summary-row"><span>Phí mỗi ngày</span><strong>{{ money(rental * 0.2) }}</strong></div>
            <div class="summary-row"><span>Số ngày trễ</span><strong>0 ngày</strong></div>
            <div class="summary-row"><span>Trừ vào cọc</span><strong>0đ</strong></div>
            <hr>
            <h3 class="h6">Tóm tắt trả đồ</h3>
            <p class="small text-muted">Cọc đang giữ: {{ money(deposit) }} · Cách trả: {{ returnMethod }}</p>
            <div v-if="actionCompleted.returned" class="alert alert-success mt-3 mb-2"><i class="bi bi-check-circle-fill me-2"></i>{{ notice }}</div>
            <button v-if="!actionCompleted.returned" type="button" class="btn btn-primary w-100" @click="runAction('returned')">Xác nhận đã trả</button>
            <button v-else type="button" class="btn btn-outline-primary w-100 mt-2" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Xem tiến trình đơn</button>
            <small class="d-block text-muted mt-3">Sau khi trả, chủ shop có 24 giờ để kiểm tra đồ.</small>
          </article>
        </div>
      </section>

      <section v-if="stage === 'refund'" class="row g-4 mt-1">
        <div class="col-lg-7">
          <article class="detail-card">
            <span class="eyebrow">KIỂM TRA SAU TRẢ</span>
            <h2 class="h5">Chủ đồ đề xuất khấu trừ</h2>
            <div class="claim-row"><i class="bi bi-exclamation-circle"></i><div><strong>Rách tay áo trái khoảng 5cm</strong><small>Đền bù hư hỏng · {{ money(damageFee) }}</small></div></div>
            <div class="claim-row"><i class="bi bi-exclamation-circle"></i><div><strong>Ố bẩn váy, cần giặt chuyên dụng</strong><small>Đã tính trong khoản bồi thường</small></div></div>
            <h3 class="h6 mt-4">Bằng chứng lúc nhận và lúc trả</h3>
            <div class="evidence-grid">
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh nhận · tay áo</span></div>
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh trả · tay áo</span></div>
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh nhận · váy</span></div>
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh trả · vết ố</span></div>
            </div>
            <h3 class="h6 mt-4">Phương thức hoàn cọc</h3>
            <div class="return-methods">
              <label class="selected"><input type="radio" checked name="refund-method">Về VNPAY (nguồn thanh toán ban đầu)</label>
              <label><input type="radio" name="refund-method">Về ví Clarity · nhận ngay</label>
            </div>
            <p class="small text-muted mt-3">Bạn có 24 giờ để phản hồi; nếu không đồng ý, khoản cọc được giữ nguyên trong lúc Staff xem xét.</p>
          </article>
        </div>
        <div class="col-lg-5">
          <article class="detail-card refund-summary">
            <h2 class="h5">Bảng tính hoàn cọc</h2>
            <div class="summary-row"><span>Tiền cọc đang giữ</span><strong>{{ money(deposit) }}</strong></div>
            <div class="summary-row"><span>Đền bù hư hỏng đề xuất</span><strong>− {{ money(damageFee) }}</strong></div>
            <div class="summary-row"><span>Phí trả muộn</span><strong>− {{ money(lateFee) }}</strong></div>
            <div class="refund-total"><span>Dự kiến hoàn cho bạn</span><strong>{{ money(expectedRefund) }}</strong></div>
            <p class="small text-muted">Hoàn về VNPAY trong 1–3 ngày làm việc sau khi chốt số tiền.</p>
            <div v-if="actionCompleted.refund" class="alert alert-success mt-3 mb-2"><i class="bi bi-check-circle-fill me-2"></i>{{ notice }}</div>
            <template v-if="!actionCompleted.refund">
              <button type="button" class="btn btn-primary w-100" @click="runAction('refund')">Đồng ý khấu trừ</button>
              <button type="button" class="btn btn-outline-danger w-100 mt-2" @click="router.push(isDemo ? `/customer/orders/${order.id}/complaint?demo=1` : `/customer/orders/${order.id}/complaint`)">Không đồng ý → Khiếu nại</button>
            </template>
            <button v-else type="button" class="btn btn-outline-primary w-100 mt-2" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Xem tiến trình đơn</button>
          </article>
        </div>
      </section>

      <section v-if="stage === 'cancel'" class="row g-4 mt-1">
        <div class="col-lg-8">
          <article class="detail-card">
            <span class="eyebrow">HỦY ĐƠN THUÊ #{{ order?.id?.slice(-8)?.toUpperCase() || '8801' }}</span>
            <h2 class="h5">Mức hoàn tiền theo thời điểm hủy</h2>
            <div class="table-responsive">
              <table class="table cancel-table">
                <thead><tr><th>Thời điểm hủy</th><th>Quy định</th><th>Bạn nhận lại</th></tr></thead>
                <tbody>
                  <tr><td>Chủ đồ chưa xác nhận</td><td>Hiện tại · miễn phí</td><td>{{ money(order?.totalAmount || rental + deposit) }}</td></tr>
                  <tr><td>Đã xác nhận, còn từ 48 giờ</td><td>Miễn phí</td><td>{{ money(order?.totalAmount || rental + deposit) }}</td></tr>
                  <tr><td>Trong vòng 48 giờ trước ngày nhận</td><td>Phạt 30% tiền thuê ({{ money(rental * 0.3) }})</td><td>{{ money(refundOnCancel) }}</td></tr>
                  <tr><td>Shop từ chối / quá 12 giờ</td><td>Hoàn tự động 100%</td><td>{{ money(order?.totalAmount || rental + deposit) }}</td></tr>
                </tbody>
              </table>
            </div>
            <div class="alert alert-warning small">Hủy sát giờ nhận có thể bị phạt 30% tiền thuê theo chính sách.</div>
            <template v-if="!actionCompleted.cancel">
              <h3 class="h6">Lý do hủy</h3>
              <div class="reason-list">
                <label v-for="reason in ['Thay đổi lịch cá nhân','Tìm được bộ đồ khác phù hợp hơn','Không còn cần thuê','Sai size / nhập nhầm thông tin','Lý do khác']" :key="reason">
                  <input v-model="cancelReason" type="radio" :value="reason">{{ reason }}
                </label>
              </div>
              <label class="form-label mt-3">Ghi chú thêm (không bắt buộc)
                <textarea v-model="message" class="form-control" rows="3" placeholder="Chia sẻ thêm để Clarity cải thiện dịch vụ..."></textarea>
              </label>
              <label class="agreement mt-3">
                <input v-model="agreeCancel" type="checkbox">Tôi đã đọc và đồng ý mức hoàn tiền ở trên.
              </label>
              <div class="mt-3">
                <button type="button" class="btn btn-danger" :disabled="!cancelReason || !agreeCancel" @click="runAction('cancel')">Xác nhận hủy đơn</button>
                <button type="button" class="btn btn-link ms-2" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Giữ đơn</button>
              </div>
            </template>
            <div v-else class="alert alert-warning mt-3 mb-2">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ notice }}
              <div class="mt-3">
                <button type="button" class="btn btn-outline-primary" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Xem chi tiết đơn</button>
                <button type="button" class="btn btn-outline-secondary ms-2" @click="router.push(isDemo ? '/customer/orders?demo=1' : '/customer/orders')">Về danh sách đơn</button>
              </div>
            </div>
          </article>
        </div>
        <aside class="col-lg-4">
          <article class="detail-card">
            <h2 class="h5">Tóm tắt hoàn tiền</h2>
            <div class="summary-row"><span>Tiền thuê</span><strong>{{ money(rental) }}</strong></div>
            <div class="summary-row"><span>Phí nền tảng</span><span>0đ</span></div>
            <div class="summary-row"><span>Tiền cọc</span><strong>{{ money(deposit) }}</strong></div>
            <div class="summary-row"><span>Phạt hủy</span><strong>− {{ money(cancelPenalty) }}</strong></div>
            <div class="refund-total"><span>Tổng hoàn lại</span><strong>{{ money(refundOnCancel) }}</strong></div>
            <small class="text-muted">Hoàn về cổng thanh toán ban đầu trong 1–3 ngày làm việc.</small>
          </article>
        </aside>
      </section>

      <section v-if="stage === 'review'" class="row g-4 mt-1">
        <div class="col-lg-7">
          <article class="detail-card">
            <h2 class="h5">Đánh giá chủ đồ {{ order?.shop?.name || 'Trần Thị Mai' }}</h2>
            <div v-for="criterion in [{key:'communication',label:'Giao tiếp'},{key:'description',label:'Đúng mô tả'},{key:'punctuality',label:'Đúng hẹn'}]" :key="criterion.key" class="rating-row">
              <span>{{ criterion.label }}</span>
              <div class="stars">
                <button v-for="n in 5" :key="n" type="button" class="btn p-0" :class="{ selected: n <= ratings[criterion.key] }" :aria-label="`${n} sao`" @click="ratings[criterion.key] = n">
                  <i class="bi bi-star-fill"></i>
                </button>
              </div>
            </div>
            <label class="form-label mt-3">Nhận xét về sản phẩm {{ order?.orderItems?.[0]?.productName || 'Cosplay Raiden Shogun' }}
              <textarea v-model="message" class="form-control mt-1" rows="4" placeholder="Chia sẻ trải nghiệm: chất liệu, độ vừa size, phụ kiện..."></textarea>
            </label>
            <h3 class="h6 mt-4">Ảnh thực tế (tối đa 5)</h3>
            <label class="upload-button"><i class="bi bi-plus-lg"></i> Thêm ảnh<input type="file" accept="image/*" multiple @change="onEvidenceChange"></label>
            <small class="d-block text-muted mt-2">{{ evidenceFiles.length }} ảnh đã chọn · Hạn gửi trong 7 ngày kể từ khi đơn hoàn tất.</small>
            <div v-if="actionCompleted.review" class="alert alert-success mt-4 mb-2"><i class="bi bi-check-circle-fill me-2"></i>{{ notice }}</div>
            <button v-if="!actionCompleted.review" type="button" class="btn btn-primary mt-4" @click="runAction('review')">Gửi đánh giá</button>
            <button v-else type="button" class="btn btn-outline-primary mt-3" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Quay lại đơn thuê</button>
          </article>
        </div>
        <aside class="col-lg-5">
          <article class="detail-card">
            <h2 class="h5">Chủ đồ sẽ đánh giá bạn</h2>
            <p class="text-muted">Trần Thị Mai chấm các tiêu chí sau:</p>
            <ul class="review-criteria"><li>Giữ gìn đồ</li><li>Trả đúng hẹn</li><li>Giao tiếp lịch sự</li></ul>
            <h3 class="h6 mt-4">Quy tắc đánh giá ẩn</h3>
            <p class="small text-muted">Đánh giá chỉ hiện công khai khi cả hai đã gửi hoặc sau 7 ngày kể từ khi đơn hoàn tất.</p>
            <div class="two-sided"><span>Bạn <strong>Chưa gửi</strong></span><span>Chủ đồ <strong>Chưa gửi</strong></span></div>
          </article>
        </aside>
      </section>

      <section v-if="stage === 'complaint'" class="row g-4 mt-1">
        <div class="col-lg-7">
          <article class="detail-card">
            <div class="dispute-banner"><i class="bi bi-exclamation-diamond"></i><div><strong>Khiếu nại {{ order?.disputeId || 'DIS-2026-0912' }}</strong><small>Đã chuyển Admin · Mức độ trung bình</small></div></div>
            <h2 class="h6 mt-4">Yêu cầu của chủ đồ</h2>
            <p class="claim-text">Rách tay áo trái khoảng 5cm và ố váy; yêu cầu bồi thường {{ money(damageFee) }} cùng phí trả muộn {{ money(lateFee) }}. Chủ đồ đính kèm ảnh lúc trả.</p>
            <h2 class="h6 mt-4">Ý kiến của bạn</h2>
            <div class="form-label mb-1">Lý do khiếu nại</div>
            <AccessibleSelect v-model="disputeReason" :options="disputeReasonOptions" label="Lý do khiếu nại"/>
            <div class="form-label mt-3 mb-1">Mong muốn giải quyết</div>
            <AccessibleSelect v-model="disputeResolution" :options="disputeResolutionOptions" label="Mong muốn giải quyết"/>
            <label class="form-label mt-3">Mô tả chi tiết
              <textarea v-model="message" class="form-control mt-1" rows="4" placeholder="Mô tả sự việc và dẫn chiếu ảnh đồng kiểm..."></textarea>
            </label>
            <h3 class="h6 mt-3">Bằng chứng</h3>
            <div class="evidence-grid">
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh nhận đồ · 6 ảnh</span></div>
              <div class="evidence-tile"><i class="bi bi-image"></i><span>Ảnh trả đồ · 3 ảnh</span></div>
              <label class="evidence-tile add-tile"><i class="bi bi-plus-lg"></i><span>Thêm ảnh / video<input type="file" accept="image/*,video/*" multiple @change="onEvidenceChange"></span></label>
            </div>
            <small class="d-block text-muted mt-2">{{ evidenceFiles.length }} tệp bổ sung đã chọn</small>
            <div v-if="complaintSubmitted" class="alert alert-success mt-3 mb-0" role="status"><i class="bi bi-check-circle-fill me-2"></i>{{ notice }}</div>
            <div class="d-flex gap-2 mt-4">
              <button type="button" class="btn btn-danger" @click="runAction('complaint')">{{ complaintSubmitted ? 'Cập nhật lại' : 'Gửi khiếu nại' }}</button>
              <button type="button" class="btn btn-outline-primary" @click="router.push(isDemo ? `/customer/orders/${order.id}?demo=1` : `/customer/orders/${order.id}`)">Quay lại đơn</button>
            </div>
          </article>
        </div>
        <aside class="col-lg-5">
          <article class="detail-card">
            <h2 class="h5">Trạng thái tranh chấp</h2>
            <div class="dispute-timeline">
              <div><i>✓</i><span>23/10 · Bạn mở tranh chấp<small>Không đồng ý khoản bồi thường</small></span></div>
              <div><i>✓</i><span>24/10 · Staff tiếp nhận<small>Hòa giải hai bên</small></span></div>
              <div><i>3</i><span>25/10 · Chuyển Admin<small>Chờ phán quyết</small></span></div>
            </div>
            <h3 class="h6 mt-4">Số tiền liên quan</h3>
            <div class="summary-row"><span>Cọc đang giữ</span><strong>{{ money(deposit) }}</strong></div>
            <div class="summary-row"><span>Chủ đồ yêu cầu</span><strong>{{ money(damageFee) }}</strong></div>
            <div class="summary-row"><span>Phí trễ</span><strong>{{ money(lateFee) }}</strong></div>
            <div class="support-note mt-4"><strong>Quy trình hỗ trợ (48 giờ)</strong><p class="small mb-0 mt-2">Staff tiếp nhận, hòa giải; nếu không thống nhất sẽ chuyển Admin phán quyết. Thông tin minh họa theo wireframe.</p></div>
          </article>
        </aside>
      </section>

      <section v-if="stage === 'pending'" class="detail-card mt-4"><h2 class="h5">Tiền thuê đang được Clarity giữ</h2><p class="mb-0">{{ money(rental) }} tiền thuê + {{ money(deposit) }} tiền cọc. Chủ đồ cần xác nhận trước hạn; nếu từ chối hoặc quá hạn, bạn được hoàn theo chính sách.</p><div class="d-flex gap-2 mt-3"><button type="button" class="btn btn-outline-danger" @click="router.push(isDemo ? `/customer/orders/${order.id}/cancel?demo=1` : `/customer/orders/${order.id}/cancel`)">Hủy yêu cầu (miễn phí)</button><button type="button" class="btn btn-outline-primary">Chat với chủ đồ</button></div></section>
      <section v-if="stage === 'tracking'" class="row g-4 mt-1"><section class="col-lg-8"><article class="detail-card"><h2 class="h5">Lịch sử đơn hàng</h2><div class="history-list"><div v-for="entry in history" :key="`${entry.toStatus}-${entry.changedAt}`" class="history-entry"><span class="history-dot" :class="entry.toStatus === 'COMPLETED' ? 'warning' : ''">{{ entry.toStatus === 'COMPLETED' ? '!' : '✓' }}</span><div><strong>{{ date(entry.changedAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }} · {{ statusLabels[entry.toStatus] || entry.toStatus }}</strong><small>{{ historyDescription(entry) }}</small></div></div></div><div v-if="isDisputed" class="alert alert-warning mt-3 mb-0">Đơn đang ở bước kiểm tra sau trả; tiền cọc được giữ đến khi có phán quyết.</div></article></section><aside class="col-lg-4"><article class="detail-card"><h2 class="h5">Thông tin đơn</h2><div class="summary-row"><span>Thời gian thuê</span><strong>{{ date(order?.orderItems?.[0]?.startDate) }}–{{ date(order?.orderItems?.[0]?.endDate) }}</strong></div><div class="summary-row"><span>Nhận đồ</span><strong>{{ order?.shippingProvider || 'Grab Express' }}</strong></div><div class="summary-row"><span>Tổng tiền</span><strong>{{ money(order?.totalAmount || 1500000) }}</strong></div><button type="button" class="btn btn-outline-primary w-100 mt-3" @click="router.push(isDemo ? `/customer/orders/${order.id}/receive?demo=1` : `/customer/orders/${order.id}/receive`)">Xem thao tác nhận / trả</button></article></aside></section>
    </div>
  </div></div>
</template>

<style scoped lang="scss" src="../../assets/css/customer/order-stage.scss"></style>

