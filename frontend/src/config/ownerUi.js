// Hằng số giao diện thuần của khu Chủ đồ (nhãn tab, trạng thái, bước...). Dữ liệu nghiệp vụ lấy từ API qua '@/services/vendorService'.

export const PRODUCT_TABS = [
  { key: 'all', label: 'Tất cả' }, { key: 'ACTIVE', label: 'Đang hoạt động' }, { key: 'PENDING', label: 'Chờ kiểm duyệt' },
  { key: 'REJECTED', label: 'Bị từ chối' }, { key: 'HIDDEN', label: 'Đã ẩn' },
]

// Nhóm phụ kiện đi kèm; trang phục chính là Product.
export const ITEM_KIND_GROUPS = [
  { kind: 'WIG', group: 'Tóc và hóa trang' }, { kind: 'SHOES', group: 'Giày dép và tất' },
  { kind: 'PROPS', group: 'Đạo cụ và vũ khí' }, { kind: 'OTHER', group: 'Khác' },
]

export const INVENTORY_STATUS = {
  HOLD: ['Đang giữ – tranh chấp', 'r'], SHIPPING: ['Đang giao', 'b'], RENTING: ['Đang cho thuê', 'g'], READY: ['Sẵn sàng', 'g'],
  WASH: ['Đang giặt / bảo trì', 'a'], STOP: ['Ngừng cho thuê', 'n'],
}
export const INVENTORY_TABS = [
  { key: 'all', label: 'Tất cả', statuses: null }, { key: 'READY', label: 'Sẵn sàng', statuses: ['READY'] },
  { key: 'USE', label: 'Thuê/giao', statuses: ['SHIPPING', 'RENTING'] }, { key: 'HOLD', label: 'Đang giữ', statuses: ['HOLD'] },
  { key: 'WASH', label: 'Giặt', statuses: ['WASH'] }, { key: 'STOP', label: 'Ngừng', statuses: ['STOP'] },
]
export const INVENTORY_NOTES = {
  SHIPPING: 'Bộ đồ đang trên đường giao cho khách, lịch đã khóa cho đơn này.',
  RENTING: 'Bộ đồ đang được khách thuê.',
  READY: 'Bộ đồ đã giặt và kiểm tra, sẵn sàng nhận đơn mới.',
  WASH: 'Bộ đồ đang giặt / bảo trì, các ngày này tự chặn trên lịch cho thuê.',
  STOP: 'Bộ đồ đang ngừng cho thuê, không hiển thị đặt mới cho khách.',
}

export const ORDER_TABS = [
  { key: 'all', label: 'Tất cả' }, { key: 'pending', label: 'Chờ xác nhận' }, { key: 'ship', label: 'Giao' }, { key: 'rent', label: 'Đang thuê' },
  { key: 'check', label: 'Kiểm tra' }, { key: 'done', label: 'Hoàn tất' }, { key: 'dispute', label: 'Tranh chấp' }, { key: 'cancel', label: 'Hủy' },
]

export const RETURN_TABS = [
  { key: 'all', label: 'Tất cả' }, { key: 'rent', label: 'Đang thuê/giao' }, { key: 'late', label: 'Đang trễ' },
  { key: 'check', label: 'Chờ kiểm tra' }, { key: 'done', label: 'Hoàn tất' },
]
export const RETURN_FLOW = [
  { state: 'd', title: 'Khách xác nhận đã trả', sub: 'Chụp ảnh lúc trả có mốc thời gian' },
  { state: 'c', title: 'Bạn nhận & đồng kiểm', sub: 'Đối chiếu ảnh nhận đồ lúc giao' },
  { state: 'p', title: 'Kiểm tra trong 24 giờ', sub: 'Nguyên vẹn → hoàn cọc / Hư hỏng → bồi thường' },
  { state: 'p', title: 'Hoàn cọc 1–3 ngày làm việc', sub: 'Tiền thuê nhả sau khi hoàn tất' },
]

export const STATS_RANGES = [['d7', '7 ngày'], ['d30', '30 ngày'], ['month', 'Tháng này'], ['quarter', 'Quý này'], ['custom', 'Tùy chọn']]

export const REGISTER_ID_SLOTS = ['CCCD mặt trước', 'CCCD mặt sau', 'Ảnh chân dung cầm CCCD']
export const REGISTER_FLOW = [
  { state: 'c', title: 'Gửi hồ sơ', sub: 'Hôm nay' },
  { state: 'p', title: 'Staff xác minh danh tính', sub: 'Trong 24 giờ' },
  { state: 'p', title: 'Kích hoạt gian hàng', sub: 'Bạn nhận thông báo và vào Back Office' },
  { state: 'p', title: 'Đăng sản phẩm đầu tiên', sub: 'Staff kiểm duyệt trong 24 giờ' },
]

// "còn 3 giờ" / "còn 25 phút" từ số giây còn lại
export function leftText(secs) {
  const s = Math.max(0, Number(secs) || 0)
  return s >= 3600 ? Math.ceil(s / 3600) + ' giờ' : Math.max(1, Math.ceil(s / 60)) + ' phút'
}
