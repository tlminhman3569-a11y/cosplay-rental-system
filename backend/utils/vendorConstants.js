// Hằng số nghiệp vụ của phân hệ Vendor (chủ cho thuê). Sửa ở đây là đổi toàn bộ.

// label/kind(màu chip)/group(tab ở trang Danh sách đơn) theo OrderStatus của schema
export const ORDER_STATUS_META = {
  PENDING:   { label: 'Chờ xác nhận',  kind: 'a', group: 'pending' },
  CONFIRMED: { label: 'Đã xác nhận',   kind: 'b', group: 'ship' },
  READY:     { label: 'Sẵn sàng giao', kind: 'b', group: 'ship' },
  SHIPPING:  { label: 'Đang giao',     kind: 'b', group: 'ship' },
  RENTING:   { label: 'Đang thuê',     kind: 'g', group: 'rent' },
  RETURNED:  { label: 'Chờ kiểm tra',  kind: 'a', group: 'check' },
  COMPLETED: { label: 'Hoàn tất',      kind: 'g', group: 'done' },
  CANCELLED: { label: 'Đã hủy',        kind: 'n', group: 'cancel' },
}

// { pending: ['PENDING'], ship: ['CONFIRMED','READY','SHIPPING'], ... }
export const GROUP_STATUSES = Object.entries(ORDER_STATUS_META).reduce((acc, [status, m]) => {
  ;(acc[m.group] ||= []).push(status)
  return acc
}, {})

export const PROCESSING_STATUSES = ['CONFIRMED', 'READY', 'SHIPPING', 'RENTING']
// Đơn đã xác nhận nhưng chưa hoàn tất: tiền thuê chưa "nhả" cho chủ đồ
export const PENDING_PAYOUT_STATUSES = ['CONFIRMED', 'READY', 'SHIPPING', 'RENTING', 'RETURNED']

export const SHIP_LABEL = { DELIVERY: 'Giao tận nơi', PICKUP: 'Nhận tại shop' }

export const PRODUCT_STATUS_META = {
  PENDING:  { label: 'Chờ kiểm duyệt', kind: 'a' },
  ACTIVE:   { label: 'Đang hoạt động', kind: 'g' },
  REJECTED: { label: 'Bị từ chối',     kind: 'r' },
  HIDDEN:   { label: 'Đã ẩn',          kind: 'n' },
}
export const PRODUCT_STATUSES = Object.keys(PRODUCT_STATUS_META)

export const CONFIRM_DEADLINE_HOURS = 12   // hạn vendor xác nhận đơn (chỉ để HIỂN THỊ đếm ngược)
export const URGENT_SECONDS = 4 * 3600     // còn <= 4 giờ thì coi là "sắp hết hạn"
export const DEFAULT_FEE_RATE = 7          // % phí sàn hiển thị khi đơn chưa có rentalTotal

// Chưa có model Review/Dispute trong schema => dữ liệu MOCK giống Figma
export const MOCK = { rating: '4.9', reviewCount: 128, disputeRate: '0%' }

export const PIE_COLORS = ['#6B4630', '#B8895B', '#D9C7AE', '#8C7A68', '#4F7A5A', '#B5432F']
export const STATUS_COLORS = {
  PENDING: '#E0A93B', CONFIRMED: '#6B8FB5', READY: '#8FB5C9', SHIPPING: '#5B7FA6',
  RENTING: '#4F7A5A', RETURNED: '#B8895B', COMPLETED: '#2F6B4A', CANCELLED: '#A8A29A',
}
