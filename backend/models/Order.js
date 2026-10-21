import { prisma } from '../config/prisma.js'

// Chỉ lấy cột cần dùng (không include cả product/renter đầy đủ)
const LIST_SELECT = {
  id: true, status: true, shippingMethod: true, shippingAddress: true, note: true,
  rentalTotal: true, depositTotal: true, platformFee: true, totalAmount: true,
  createdAt: true, updatedAt: true,
  renter: { select: { id: true, fullName: true } },
  orderItems: { select: { productId: true, productName: true, unitPrice: true, deposit: true, quantity: true, startDate: true, endDate: true } },
}
const DETAIL_SELECT = {
  ...LIST_SELECT, receiverName: true, receiverPhone: true, eventDate: true, shippingFee: true, cancelReason: true,
  statusHistory: { orderBy: { changedAt: 'asc' }, select: { fromStatus: true, toStatus: true, changedAt: true } },
}

const periodWhere = (from, to) => (from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lt: to }) } } : {})

export const OrderModel = {
  list: (shopId, { statuses, take = 100, sort = 'desc' } = {}) =>
    prisma.order.findMany({
      where: { shopId, ...(statuses ? { status: { in: statuses } } : {}) },
      select: LIST_SELECT, orderBy: { createdAt: sort }, take,
    }),

  // Luôn kèm shopId: vendor A không đọc/sửa được đơn của vendor B
  findOwned: (id, shopId) => prisma.order.findFirst({ where: { id, shopId }, select: DETAIL_SELECT }),

  count: (shopId, statuses) => prisma.order.count({ where: { shopId, status: { in: statuses } } }),
  countCompletedByRenter: (renterId) => prisma.order.count({ where: { renterId, status: 'COMPLETED' } }),

  // Đơn trong khoảng [from, to) theo ngày tạo (dùng cho thống kê)
  inPeriod: (shopId, from, to) =>
    prisma.order.findMany({ where: { shopId, ...periodWhere(from, to) }, select: LIST_SELECT }),

  // Đơn COMPLETED từ mốc `from` (chỉ lấy cột tiền + ngày) để gom doanh thu theo tháng
  completedSince: (shopId, from) =>
    prisma.order.findMany({ where: { shopId, status: 'COMPLETED', createdAt: { gte: from } }, select: { createdAt: true, rentalTotal: true, platformFee: true } }),

  // Doanh thu: chỉ tính đơn COMPLETED; thực nhận = rentalTotal - platformFee
  revenue: async (shopId, { from, to } = {}) => {
    const r = await prisma.order.aggregate({
      where: { shopId, status: 'COMPLETED', ...periodWhere(from, to) },
      _sum: { rentalTotal: true, platformFee: true }, _count: { _all: true },
    })
    const gross = r._sum.rentalTotal || 0, fee = r._sum.platformFee || 0
    return { gross, fee, net: Math.max(0, gross - fee), orders: r._count._all }
  },
  pendingPayout: async (shopId, statuses) => {
    const r = await prisma.order.aggregate({
      where: { shopId, status: { in: statuses } },
      _sum: { rentalTotal: true, platformFee: true }, _count: { _all: true },
    })
    return { net: Math.max(0, (r._sum.rentalTotal || 0) - (r._sum.platformFee || 0)), orders: r._count._all }
  },

  // Đổi trạng thái kiểu "so sánh rồi ghi" (compare-and-set): chỉ ghi nếu đơn VẪN đang ở trạng thái `from`.
  // Nhờ vậy bấm "Xác nhận" 2 lần / 2 tab cùng lúc không ghi chồng. Trả về false nếu đơn đã bị đổi trước đó.
  transition: async (id, shopId, from, to, { userId, extra = {}, refund = false } = {}) => {
    const res = await prisma.order.updateMany({ where: { id, shopId, status: from }, data: { status: to, ...extra } })
    if (res.count !== 1) return false

    const writes = [prisma.orderStatusHistory.create({ data: { orderId: id, fromStatus: from, toStatus: to, changedBy: userId } })]
    if (refund) {
      const paid = await prisma.payment.findMany({ where: { orderId: id, type: 'PAY', status: 'SUCCESS' } })
      if (paid.length) {
        writes.push(prisma.payment.create({
          data: { orderId: id, type: 'REFUND', method: paid[0].method, amount: paid.reduce((s, p) => s + p.amount, 0), status: 'PENDING' },
        }))
      }
    }
    await prisma.$transaction(writes)
    return true
  },
}
