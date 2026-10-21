import { OrderModel } from '../../models/Order.js'
import { httpError } from '../../middlewares/error.js'
import { ORDER_STATUS_META, PIE_COLORS, STATUS_COLORS, MOCK } from '../../utils/vendorConstants.js'
import { DAY_MS, addDays, vnStartOfDay, vnStartOfMonth, vnStartOfQuarter, parseVnDate, fmtDM, fmtDMY, fmtISO, weekdayVN, rentalDays } from '../../utils/date.js'
import { payoutOf } from '../../utils/vendorMappers.js'

const MAX_CUSTOM_DAYS = 180

// Trả về [from, to): from = 00:00 ngày đầu, to = 00:00 ngày SAU ngày cuối
export function resolveRange(q = {}, now = new Date()) {
  const today = vnStartOfDay(now), tomorrow = addDays(today, 1)
  const key = q.range || 'month'
  switch (key) {
    case 'd7': return { key, from: addDays(today, -6), to: tomorrow }
    case 'd30': return { key, from: addDays(today, -29), to: tomorrow }
    case 'month': return { key, from: vnStartOfMonth(now), to: tomorrow }
    case 'quarter': return { key, from: vnStartOfQuarter(now), to: tomorrow }
    case 'custom': {
      const f = parseVnDate(q.from), t = parseVnDate(q.to)
      if (!f || !t) throw httpError(400, 'invalid_range', 'Ngày không hợp lệ (định dạng YYYY-MM-DD)')
      if (t < f) throw httpError(400, 'invalid_range', 'Đến ngày phải sau hoặc bằng từ ngày')
      if (t > today) throw httpError(400, 'invalid_range', 'Đến ngày không được sau hôm nay')
      const to = addDays(t, 1)
      if ((to - f) / DAY_MS > MAX_CUSTOM_DAYS) throw httpError(400, 'invalid_range', `Chỉ xem tối đa ${MAX_CUSTOM_DAYS} ngày một lần`)
      return { key, from: f, to }
    }
    default: throw httpError(400, 'invalid_range', 'range không hợp lệ (d7 | d30 | month | quarter | custom)')
  }
}

// <= 14 ngày: mỗi cột 1 ngày; dài hơn: mỗi cột 1 tuần (7 ngày, cột cuối có thể ngắn hơn)
export function buildBuckets(from, to) {
  const n = Math.round((to - from) / DAY_MS)
  const step = n <= 14 ? 1 : 7
  const buckets = []
  for (let s = 0; s < n; s += step) {
    const a = addDays(from, s), b = addDays(from, Math.min(s + step, n) - 1)
    buckets.push({ label: fmtDM(a), sub: step === 1 ? weekdayVN(a) : '– ' + fmtDM(b), value: 0 })
  }
  return { step, buckets }
}

const deltaText = (cur, prev) => {
  if (!prev) return cur > 0 ? 'Kỳ trước chưa có doanh thu' : '—'
  const pct = Math.round(((cur - prev) / prev) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% so với kỳ trước`
}

export const StatsController = {
  getStats: async (req, res) => {
    const shopId = req.shop.id
    const { key, from, to } = resolveRange(req.query)
    const len = to - from
    const [orders, prevRev] = await Promise.all([
      OrderModel.inPeriod(shopId, from, to),
      OrderModel.revenue(shopId, { from: new Date(from - len), to: from }),
    ])

    const { step, buckets } = buildBuckets(from, to)
    const byProduct = new Map()
    const statusCount = {}
    let revenue = 0, done = 0

    for (const o of orders) {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1
      if (o.status !== 'COMPLETED') continue
      done++
      const net = payoutOf(o)
      revenue += net
      const idx = Math.min(buckets.length - 1, Math.floor((new Date(o.createdAt) - from) / (step * DAY_MS)))
      buckets[idx].value += net

      // Chia tiền thực nhận của đơn cho từng sản phẩm theo tỷ trọng (đơn giá × số lượng × số ngày)
      const w = o.orderItems.map((i) => i.unitPrice * i.quantity * rentalDays(i.startDate, i.endDate))
      const sumW = w.reduce((a, b) => a + b, 0)
      o.orderItems.forEach((i, k) => {
        const row = byProduct.get(i.productId) || { name: i.productName, rentals: 0, revenue: 0 }
        row.rentals += i.quantity
        row.revenue += sumW ? (net * w[k]) / sumW : net / o.orderItems.length
        byProduct.set(i.productId, row)
      })
    }

    const ranked = [...byProduct.values()].map((r) => ({ ...r, revenue: Math.round(r.revenue) })).sort((a, b) => b.revenue - a.revenue)
    const slices = ranked.slice(0, 5).map((p, i) => ({ label: p.name, value: p.revenue, color: PIE_COLORS[i] }))
    const rest = ranked.slice(5).reduce((s, p) => s + p.revenue, 0)
    if (rest > 0) slices.push({ label: 'Khác', value: rest, color: PIE_COLORS[5] })

    res.json({
      range: { key, from: fmtISO(from), to: fmtISO(addDays(to, -1)) },
      label: `${fmtDMY(from)} – ${fmtDMY(addDays(to, -1))}`,
      kpis: {
        revenue, delta: deltaText(revenue, prevRev.net),
        orders: orders.length, done,
        rating: MOCK.rating, reviews: MOCK.reviewCount,                       // MOCK: chưa có Review
        dispute: MOCK.disputeRate, disputeOf: `0 / ${orders.length} đơn`,      // MOCK: chưa có Dispute
      },
      bars: buckets,
      products: slices,
      orderStatus: Object.keys(ORDER_STATUS_META).map((s) => ({ label: ORDER_STATUS_META[s].label, value: statusCount[s] || 0, color: STATUS_COLORS[s] })),
      top: ranked.sort((a, b) => b.rentals - a.rentals || b.revenue - a.revenue).slice(0, 5),
    })
  },
}
