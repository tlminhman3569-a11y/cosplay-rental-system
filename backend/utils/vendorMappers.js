// Chuyển bản ghi Prisma -> JSON mà các trang Vue của Vendor đọc.
import { ORDER_STATUS_META, PRODUCT_STATUS_META, SHIP_LABEL, CONFIRM_DEADLINE_HOURS, URGENT_SECONDS, DEFAULT_FEE_RATE } from './vendorConstants.js'
import { rentalDays } from './date.js'

// Tiền chủ đồ thực nhận = tiền thuê - phí sàn (không tính cọc, cọc là của khách)
export const payoutOf = (o) => Math.max(0, (o.rentalTotal || 0) - (o.platformFee || 0))
export const shortCode = (id) => '#' + String(id).slice(-6).toUpperCase()
export const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((w) => (w[0] || '').toUpperCase()).join('')

export function orderPeriod(items = []) {
  if (!items.length) return { start: null, end: null }
  const starts = items.map((i) => new Date(i.startDate).getTime())
  const ends = items.map((i) => new Date(i.endDate).getTime())
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) }
}
export const productLabel = (items = []) =>
    !items.length ? 'Sản phẩm' : items[0].productName + (items.length > 1 ? ` +${items.length - 1} món` : '')

// Hạn xác nhận = ngày tạo đơn + 12 giờ (chỉ hiển thị, hệ thống KHÔNG tự hủy đơn quá hạn)
export const deadlineOf = (o) => new Date(new Date(o.createdAt).getTime() + CONFIRM_DEADLINE_HOURS * 3600 * 1000)
export const secondsLeft = (o, now = new Date()) => Math.max(0, Math.floor((deadlineOf(o) - now) / 1000))

const pendingFields = (o, now) => {
  const s = secondsLeft(o, now)
  return { deadline: deadlineOf(o).toISOString(), secondsLeft: s, urgent: s <= URGENT_SECONDS }
}

// Một dòng ở trang Danh sách đơn (O07)
export function orderRow(o, now = new Date()) {
  const meta = ORDER_STATUS_META[o.status] || { label: o.status, kind: 'n', group: 'all' }
  const { start, end } = orderPeriod(o.orderItems)
  return {
    code: o.id, shortCode: shortCode(o.id),
    product: productLabel(o.orderItems),
    renter: o.renter?.fullName || '',
    start, end,
    ship: SHIP_LABEL[o.shippingMethod] || o.shippingMethod,
    payout: payoutOf(o),
    status: o.status, label: meta.label, kind: meta.kind, group: meta.group,
    dispute: false,          // chưa có model Dispute
    nextAction: null,        // vendor chỉ xác nhận/từ chối ở mục Yêu cầu thuê
    createdAt: o.createdAt,
    ...(o.status === 'PENDING' ? pendingFields(o, now) : {}),
  }
}

// Một thẻ ở trang Yêu cầu thuê (O06)
export function requestRow(o, { completedCount = 0 } = {}, now = new Date()) {
  const { start, end } = orderPeriod(o.orderItems)
  const pricePerDay = (o.orderItems || []).reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  return {
    code: o.id, shortCode: shortCode(o.id),
    renter: o.renter?.fullName || '', initials: initials(o.renter?.fullName),
    verified: false,         // schema chưa có trạng thái xác minh CCCD
    rating: null,            // chưa có model Review
    orderCount: completedCount,
    productLabel: productLabel(o.orderItems), pricePerDay,
    start, end, days: start ? rentalDays(start, end) : 0,
    ship: SHIP_LABEL[o.shippingMethod] || o.shippingMethod,
    route: o.shippingMethod === 'DELIVERY' ? (o.shippingAddress || 'Giao tận nơi') : 'Khách tự đến nhận tại shop',
    note: o.note || 'Người thuê không để lại lời nhắn.',
    held: o.totalAmount, rentalTotal: o.rentalTotal, depositAmount: o.depositTotal,
    payout: payoutOf(o),
    feeRate: o.rentalTotal > 0 ? Math.round((o.platformFee / o.rentalTotal) * 100) : DEFAULT_FEE_RATE,
    ...pendingFields(o, now),
  }
}

// Trang Chi tiết đơn (O08). SĐT/địa chỉ người thuê chỉ lộ sau khi vendor đã xác nhận.
export function orderDetail(o, now = new Date()) {
  const meta = ORDER_STATUS_META[o.status] || { label: o.status, kind: 'n', group: 'all' }
  const { start, end } = orderPeriod(o.orderItems)
  const revealed = !['PENDING', 'CANCELLED'].includes(o.status)
  return {
    code: o.id, shortCode: shortCode(o.id),
    status: o.status, label: meta.label, kind: meta.kind,
    renter: o.renter?.fullName || '',
    receiver: { name: revealed ? o.receiverName : null, phone: revealed ? o.receiverPhone : null, address: revealed ? o.shippingAddress : null },
    ship: SHIP_LABEL[o.shippingMethod] || o.shippingMethod,
    eventDate: o.eventDate, start, end, days: start ? rentalDays(start, end) : 0,
    note: o.note, cancelReason: o.cancelReason || null,
    items: (o.orderItems || []).map((i) => ({
      productId: i.productId, name: i.productName, unitPrice: i.unitPrice, deposit: i.deposit,
      quantity: i.quantity, start: i.startDate, end: i.endDate, days: rentalDays(i.startDate, i.endDate),
    })),
    money: {
      rentalTotal: o.rentalTotal, platformFee: o.platformFee, payout: payoutOf(o),
      depositTotal: o.depositTotal, shippingFee: o.shippingFee, totalAmount: o.totalAmount,
    },
    timeline: (o.statusHistory || []).map((h) => ({ from: h.fromStatus, to: h.toStatus, label: ORDER_STATUS_META[h.toStatus]?.label, at: h.changedAt })),
    createdAt: o.createdAt,
    ...(o.status === 'PENDING' ? pendingFields(o, now) : {}),
  }
}

const primaryImage = (images = []) => (images.find((i) => i.isPrimary) || images[0])?.url || null
export const productSku = (id) => 'COS-' + String(id).slice(-6).toUpperCase()

// Một dòng ở trang Sản phẩm của tôi (O02)
export function productRow(p) {
  const meta = PRODUCT_STATUS_META[p.status] || { label: p.status, kind: 'n' }
  return {
    id: p.id, name: p.name, sku: productSku(p.id),
    price: p.pricePerDay, deposit: p.depositAmount,
    image: primaryImage(p.images), rentals: p.rentalCount || 0,
    displayStatus: p.status, statusLabel: meta.label, statusKind: meta.kind,
    canHide: p.status === 'ACTIVE', canShow: p.status === 'HIDDEN',
    note: p.status === 'REJECTED' ? (p.rejectReason || 'Staff chưa ghi lý do') : null,
  }
}

// Dữ liệu đổ vào form Sửa sản phẩm (O03)
export function productDetail(p) {
  return {
    id: p.id, sku: productSku(p.id), status: p.status, rejectReason: p.rejectReason || null,
    name: p.name, characterName: p.characterName, description: p.description,
    categoryId: p.categoryId, brandId: p.brandId, seriesId: p.seriesId,
    category: p.category?.name || null, brand: p.brand?.name || null, series: p.series?.name || null,
    productType: p.productType, gender: p.gender, size: p.size, difficulty: p.difficulty,
    pricePerDay: p.pricePerDay, depositAmount: p.depositAmount, itemValue: p.itemValue ?? null, conditionLevel: p.conditionLevel ?? null, careGuide: p.careGuide ?? null, quantity: p.quantity,
    minRentalDays: p.minRentalDays, maxRentalDays: p.maxRentalDays, cleaningDays: p.cleaningDays,
    images: [...(p.images || [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map((i) => i.url),
    accessories: (p.accessories || []).map((a) => ({ id: a.id, type: a.type, name: a.name, isRequired: !!a.isRequired })),
  }
}
