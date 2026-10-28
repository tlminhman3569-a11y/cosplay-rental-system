// Dữ liệu minh họa O04, O05, O09–O15. Không gọi API và không ghi MongoDB.
export const copyMock = value => JSON.parse(JSON.stringify(value))
export const mockMeta = {
  areas: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'], banks: ['Vietcombank', 'Techcombank', 'MB Bank'],
  pledges: ['Tôi sở hữu hợp pháp trang phục cho thuê', 'Tôi cam kết giao đúng sản phẩm và tình trạng đã mô tả', 'Tôi đồng ý với quy định cho thuê và xử lý tranh chấp'],
  quickReplies: ['Đã nhận bằng chứng', 'Hướng dẫn cách giặt', 'Cảm ơn bạn đã thuê'],
}
export const mockInventory = [
  { id: 1, productId: 1, code: 'COS-001', name: 'Raiden Shogun', status: 'READY', location: 'Kệ A1', rentals: 18, accessories: [['Tóc tím', 'Đủ bộ', 'g'], ['Kiếm', 'Tốt', 'g']], note: 'Đã giặt và kiểm tra, sẵn sàng nhận đơn mới.' },
  { id: 2, productId: 2, code: 'COS-002', name: 'Furina', status: 'RENTING', location: 'Khách đang giữ', rentals: 12, orderCode: 'DEMO-102', accessories: [['Mũ', 'Đã giao', 'b'], ['Găng tay', 'Đã giao', 'b']] },
  { id: 3, productId: 3, code: 'COS-003', name: 'Nahida', status: 'WASH', location: 'Khu vệ sinh', rentals: 9, accessories: [['Tóc xanh', 'Đang giặt', 'a']] },
  { id: 4, productId: 4, code: 'COS-004', name: 'Venti', status: 'HOLD', location: 'Kệ B2', rentals: 7, orderCode: 'DEMO-104', disputeCode: 'DIS-001', accessories: [['Đàn', 'Cần kiểm tra', 'r']] },
]
export const mockCalendar = {
  today: '2026-10-25', month: '2026-10', products: mockInventory.map(p => ({ id: p.id, name: p.name, title: p.code + ' – ' + p.name })), product: { id: 1 },
  legend: [['cf', 'Đã xác nhận'], ['lt', 'Trả trễ'], ['dp', 'Tạm giữ'], ['ow', 'Chủ đồ khóa'], ['hs', 'Lịch sử']],
  ranges: [
    { start: '2026-10-10', end: '2026-10-13', cls: 'hs' }, { start: '2026-10-20', end: '2026-10-24', cls: 'lt' },
    { start: '2026-10-26', end: '2026-10-28', cls: 'cf', startLabel: 'Nhận', endLabel: 'Trả' },
    { start: '2026-10-29', end: '2026-10-29', cls: 'cl' }, { start: '2026-10-30', end: '2026-10-31', cls: 'ow' },
  ],
  events: [
    { start: '2026-10-26', end: '2026-10-28', code: 'DEMO-101', text: 'Khách đến nhận tại shop', who: 'Nguyễn Minh Anh', chip: ['Đã xác nhận', 'g'] },
    { start: '2026-10-30', end: '2026-10-31', code: 'LOCK-01', blockId: 1, text: 'Bảo trì phụ kiện', who: 'Chủ shop', chip: ['Chủ đồ khóa', 'n'], deletable: true },
  ], rules: [['Thuê tối thiểu', '1 ngày'], ['Thuê tối đa', '7 ngày'], ['Giặt sau mỗi lượt', '1 ngày']],
}
export const mockReturns = {
  inspectionHours: 24, lateFeeRate: 20,
  kpis: { dueSoon: 2, dueSoonNote: 'Trong 48 giờ tới', late: 1, check: 1, checkNote: 'Đồng kiểm sau trả', receivedMonth: 12, receivedMonthNote: 'Tháng 10/2026' },
  rows: [
    { code: 'DEMO-102', product: 'Furina', renter: 'Trần Bảo Ngọc', due: '26/10/2026', via: 'Khách trả tại shop', group: 'rent', kind: 'g', label: 'Đang thuê', sub: 'Còn 1 ngày', action: 'remind' },
    { code: 'DEMO-103', product: 'Raiden Shogun', renter: 'Nguyễn Minh Anh', due: '24/10/2026', via: 'Giao tận nơi', group: 'late', kind: 'r', label: 'Trễ 1 ngày', sub: 'Đã liên hệ khách', action: 'remind' },
    { code: 'DEMO-104', product: 'Venti', renter: 'Lê Hoàng', due: '25/10/2026', via: 'Khách trả tại shop', group: 'check', kind: 'a', label: 'Chờ kiểm tra', sub: 'Đã nhận lại lúc 09:00', action: 'view' },
  ],
}
export const mockWallet = {
  available: 2450000, minWithdraw: 100000, pendingWithdrawTotal: 500000, pendingRelease: 810000,
  pendingOrders: ['DEMO-102', 'DEMO-103'], withdrawnMonth: 1800000, withdrawCountMonth: 2, pendingWithdrawCount: 1,
  withdrawFee: 0, approveHours: 24, pendingWithdraw: { code: 'RUT-001', amount: 500000, bank: 'Vietcombank •••• 4826' },
  payoutAccounts: [{ id: 1, bankName: 'Vietcombank', accountNumber: '•••• 4826', accountName: 'TRAN THI MAI', isDefault: true, label: 'Vietcombank •••• 4826' }],
  revenue6m: [2.4, 3.1, 2.8, 4.5, 3.9, 5.2].map((v, i) => ({ m: 'T' + (i + 5), v, h: Math.round(v * 20) })),
  history: [
    { code: 'GD-001', date: '25/10/2026', text: 'Hoàn tất đơn DEMO-101', amountText: '+418.500đ', tone: 'in', chip: ['Thành công', 'g'] },
    { code: 'GD-002', date: '24/10/2026', text: 'Rút về Vietcombank', amountText: '−500.000đ', tone: 'out', chip: ['Chờ duyệt', 'a'] },
    { code: 'GD-003', date: '20/10/2026', text: 'Rút về Vietcombank', amountText: '−800.000đ', tone: 'out', chip: ['Thành công', 'g'] },
  ],
}
export const mockConversations = [
  { id: 1, name: 'Nguyễn Minh Anh', initials: 'MA', preview: 'Mình nhận đồ lúc 10 giờ được không?', unread: 2, order: 'DEMO-101', type: 'RENTER' },
  { id: 2, name: 'Trần Bảo Ngọc', initials: 'BN', preview: 'Cảm ơn shop, bộ đồ rất đẹp!', unread: 0, order: 'DEMO-102', type: 'RENTER' },
  { id: 3, name: 'Hỗ trợ Clarity', initials: 'CL', preview: 'Shop có cần hỗ trợ thêm không?', unread: 0, type: 'SUPPORT', gold: true },
]
export const mockMessages = [
  { id: 1, type: 'system', text: 'Đơn DEMO-101 đã được xác nhận', time: '09:00' },
  { id: 2, type: 'other', text: 'Chào shop, mình nhận đồ lúc 10 giờ được không?', time: '09:10' },
  { id: 3, type: 'me', text: 'Được bạn nhé. Shop đã chuẩn bị đủ bộ và phụ kiện.', time: '09:12' },
]
export const mockConversationSummary = { imgLabel: 'Raiden', product: 'Raiden Shogun', orderCode: 'DEMO-101', status: 'Đã xác nhận', rent: '26–28/10/2026', ship: 'Nhận tại shop', deposit: '400.000đ' }
export const mockDisputes = [{
  code: 'DIS-001', orderCode: 'DEMO-104', product: 'Venti', chips: [['Chờ phản hồi', 'a']], canRespond: true,
  log: [{ state: 'd', title: 'Chủ đồ mở tranh chấp', sub: '24/10/2026 · 10:00' }, { state: 'c', title: 'Staff tiếp nhận hòa giải', sub: '25/10/2026 · 09:00' }],
  view: { product: 'Venti', renter: 'Lê Hoàng', openedAt: '24/10/2026', deposit: 500000, claimed: 150000, staff: 'Nguyễn An', ownerText: 'Phụ kiện đàn bị nứt ở cạnh sau khi trả.', renterText: 'Mình đã gửi ảnh khi bàn giao để shop kiểm tra.', ownerEvidences: [{ label: 'Ảnh phụ kiện khi trả', url: '' }], renterEvidences: [{ label: 'Ảnh lúc nhận', url: '' }], respondHours: 48 },
}]
export const mockReviews = {
  criteria: [['Bảo quản trang phục'], ['Trả đồ đúng hạn'], ['Giao tiếp & hợp tác']],
  toReview: [{ orderCode: 'DEMO-105', renter: 'Nguyễn Minh Anh', initials: 'MA', product: 'Raiden Shogun', rent: '20–22/10/2026', daysLeft: 5 }],
  suspended: [{ orderCode: 'DEMO-104', disputeCode: 'DIS-001' }],
  summary: { ratingText: '4,9', total: 28, dist: [[5, 25], [4, 2], [3, 1], [2, 0], [1, 0]] },
  received: [{ id: 1, name: 'Trần Bảo Ngọc', stars: 5, text: 'Đồ sạch, đủ phụ kiện, shop hỗ trợ rất nhiệt tình.', reply: '' }, { id: 2, name: 'Nguyễn Minh Anh', stars: 5, text: 'Trang phục giống ảnh, nhận và trả nhanh.', reply: 'Cảm ơn bạn đã ủng hộ shop!' }],
}
export const mockShop = {
  initials: 'MC', name: 'Mochi Cosplay', logoUrl: '', description: 'Trang phục cosplay và phụ kiện được chăm sóc kỹ trước mỗi lần cho thuê.',
  region: 'TP. Hồ Chí Minh', hours: '09:00 – 21:00', ship: 'Nhận tại shop', bank: 'Vietcombank •••• 4826', cancelPolicy: 'Liên hệ shop sớm khi cần đổi lịch.',
  areas: mockMeta.areas, shipOptions: ['Nhận tại shop', 'Giao tận nơi'], verified: { cccd: true, approvedAt: '01/10/2026', status: 'VERIFIED' },
  stats: [['4,9', 'Điểm đánh giá'], ['28', 'Đánh giá'], ['46', 'Lượt thuê']], reviews: mockReviews.received,
  policies: ['Đồng kiểm trước khi nhận và trả đồ', 'Không tự chỉnh sửa hoặc nhuộm trang phục', 'Giữ đủ phụ kiện đi kèm'],
}
