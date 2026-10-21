import { OrderModel } from '../../models/Order.js'
import { httpError } from '../../middlewares/error.js'
import { assertObjectId } from '../../utils/objectId.js'
import { orderRow, orderDetail, requestRow } from '../../utils/vendorMappers.js'
import { GROUP_STATUSES, PENDING_PAYOUT_STATUSES, ORDER_STATUS_META } from '../../utils/vendorConstants.js'

async function loadOwned(req) {
  assertObjectId(req.params.id, 'Mã đơn')
  const o = await OrderModel.findOwned(req.params.id, req.shop.id)
  if (!o) throw httpError(404, 'not_found', 'Không tìm thấy đơn trong gian hàng của bạn')
  return o
}

// Tự chọn 2: chỉ cho phép PENDING -> CONFIRMED hoặc PENDING -> CANCELLED
async function decide(req, res, decision, reason) {
  const order = await loadOwned(req)
  if (order.status !== 'PENDING') throw httpError(409, 'bad_state', `Đơn đang ở trạng thái "${ORDER_STATUS_META[order.status]?.label}", không thể ${decision === 'CONFIRMED' ? 'xác nhận' : 'từ chối'}`)

  const ok = decision === 'CONFIRMED'
    ? await OrderModel.transition(order.id, req.shop.id, 'PENDING', 'CONFIRMED', { userId: req.user.id })
    : await OrderModel.transition(order.id, req.shop.id, 'PENDING', 'CANCELLED', { userId: req.user.id, extra: { cancelReason: reason }, refund: true })
  if (!ok) throw httpError(409, 'bad_state', 'Đơn vừa được xử lý ở nơi khác, vui lòng tải lại')

  res.json({ ok: true, code: order.id, status: decision, label: ORDER_STATUS_META[decision].label })
}

const parseReason = (body = {}) => {
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (reason.length < 3 || reason.length > 300) throw httpError(400, 'validation', 'Vui lòng nhập lý do từ chối (3–300 ký tự)')
  return reason
}

export const OrderController = {
  // GET /orders?group=all|pending|ship|rent|check|done|cancel&limit=100
  getOrders: async (req, res) => {
    const group = String(req.query.group || 'all')
    if (group !== 'all' && !GROUP_STATUSES[group]) throw httpError(400, 'validation', 'Nhóm đơn không hợp lệ')
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200)
    const orders = await OrderModel.list(req.shop.id, { statuses: group === 'all' ? null : GROUP_STATUSES[group], take: limit })
    const now = new Date()
    res.json(orders.map((o) => orderRow(o, now)))
  },

  getOrder: async (req, res) => res.json(orderDetail(await loadOwned(req))),

  // GET /requests: đơn đang chờ vendor xác nhận (cũ nhất trước = gần hết hạn nhất)
  getRequests: async (req, res) => {
    const orders = await OrderModel.list(req.shop.id, { statuses: ['PENDING'], take: 50, sort: 'asc' })
    const counts = await Promise.all(orders.map((o) => OrderModel.countCompletedByRenter(o.renter.id)))
    const now = new Date()
    res.json(orders.map((o, i) => requestRow(o, { completedCount: counts[i] }, now)))
  },

  confirm: (req, res) => decide(req, res, 'CONFIRMED'),
  reject: (req, res) => decide(req, res, 'CANCELLED', parseReason(req.body)),

  // PATCH /orders/:id/status  { status: 'CONFIRMED' | 'CANCELLED', reason? } (giữ route cũ, chỉ nhận 2 giá trị)
  updateStatus: (req, res) => {
    const status = req.body?.status
    if (status === 'CONFIRMED') return decide(req, res, 'CONFIRMED')
    if (status === 'CANCELLED') return decide(req, res, 'CANCELLED', parseReason(req.body))
    throw httpError(400, 'validation', 'status chỉ nhận CONFIRMED hoặc CANCELLED')
  },

  // GET /revenue: tổng tiền kiếm được (sau phí sàn), chỉ tính đơn COMPLETED
  getRevenue: async (req, res) => {
    const [done, waiting] = await Promise.all([OrderModel.revenue(req.shop.id), OrderModel.pendingPayout(req.shop.id, PENDING_PAYOUT_STATUSES)])
    res.json({
      success: true,
      totalRevenue: done.net,          // thực nhận
      grossRental: done.gross,         // tiền thuê trước phí
      platformFee: done.fee,
      completedOrders: done.orders,
      pendingPayout: waiting.net,      // đã xác nhận nhưng chưa hoàn tất
      pendingOrders: waiting.orders,
    })
  },
}
