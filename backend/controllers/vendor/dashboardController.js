import { OrderModel } from '../../models/Order.js'
import { PROCESSING_STATUSES, ORDER_STATUS_META, URGENT_SECONDS, MOCK } from '../../utils/vendorConstants.js'
import { vnStartOfMonth, vnMonth, fmtDMY } from '../../utils/date.js'
import { payoutOf, productLabel, orderPeriod, secondsLeft, deadlineOf, requestRow } from '../../utils/vendorMappers.js'

const deltaText = (cur, prev) => {
  if (!prev) return cur > 0 ? 'Tháng trước chưa có doanh thu' : '—'
  const pct = Math.round(((cur - prev) / prev) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% so với tháng trước`
}

export const DashboardController = {
  getDashboard: async (req, res) => {
    const shopId = req.shop.id
    const now = new Date()
    const sixStart = vnStartOfMonth(now, -5)

    const [revRows, pendingCount, pendingList, processingCount, processingList] = await Promise.all([
      OrderModel.completedSince(shopId, sixStart),
      OrderModel.count(shopId, ['PENDING']),
      OrderModel.list(shopId, { statuses: ['PENDING'], take: 10, sort: 'asc' }),
      OrderModel.count(shopId, PROCESSING_STATUSES),
      OrderModel.list(shopId, { statuses: PROCESSING_STATUSES, take: 5 }),
    ])

    // Doanh thu 6 tháng gần nhất (thực nhận, đơn COMPLETED, theo ngày tạo đơn)
    const months = Array.from({ length: 6 }, (_, i) => ({ start: vnStartOfMonth(now, -5 + i), total: 0 }))
    for (const o of revRows) {
      const t = new Date(o.createdAt)
      const m = months.findLast((x) => t >= x.start)
      if (m) m.total += payoutOf(o)
    }
    const max = Math.max(...months.map((m) => m.total), 1)
    const revenue6m = months.map((m) => ({
      m: 'T' + vnMonth(m.start), v: (m.total / 1e6).toFixed(1), h: Math.max(4, Math.round((m.total / max) * 110)),
    }))
    const cur = months[5].total, prev = months[4].total

    const pendingRequests = pendingList.map((o) => {
      const r = requestRow(o, {}, now)
      return { code: r.code, shortCode: r.shortCode, productLabel: r.productLabel, renter: r.renter, start: r.start, end: r.end, deadline: r.deadline, secondsLeft: r.secondsLeft, urgent: r.urgent }
    })
    const first = pendingRequests[0]

    res.json({
      greeting: { name: req.user.fullName, date: fmtDMY(now) },
      kpis: {
        revenueMonth: cur, revenueMonthLabel: revenue6m[5].m, revenueDeltaText: deltaText(cur, prev),
        processingCount, processingNote: 'Đang chuẩn bị / giao / cho thuê',
        pendingCount, pendingNote: pendingCount ? 'Cần xác nhận sớm' : 'Không có yêu cầu mới',
        rating: MOCK.rating, reviewCount: MOCK.reviewCount,          // MOCK: chưa có model Review
      },
      urgent: first && first.secondsLeft <= URGENT_SECONDS ? first : null,
      disputeAlert: null,                                            // MOCK: chưa có model Dispute
      pendingRequests,
      processingOrders: processingList.map((o) => ({
        code: o.id, sub: `${productLabel(o.orderItems)} · ${o.renter.fullName}`,
        status: [ORDER_STATUS_META[o.status].label, ORDER_STATUS_META[o.status].kind], chips: [],
      })),
      revenue6m,
    })
  },
}
