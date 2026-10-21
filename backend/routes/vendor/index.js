import { Router } from 'express'
import { authRequired, requireRoles } from '../../middlewares/auth.js'
import { prisma } from '../../config/prisma.js'
import { ah, httpError } from '../../middlewares/error.js'
import { DashboardController } from '../../controllers/vendor/dashboardController.js'
import { StatsController } from '../../controllers/vendor/statsController.js'
import { OrderController } from '../../controllers/vendor/orderController.js'
import productRoutes from './productRoutes.js'
import orderRoutes from './orderRoutes.js'
import requestRoutes from './requestRoutes.js'

const router = Router()

// 1. Phải đăng nhập và có role VENDOR/OWNER
router.use(authRequired, requireRoles('VENDOR', 'OWNER'))

// 2. Gắn gian hàng của user vào req.shop (mọi query phía dưới đều lọc theo req.shop.id)
router.use(ah(async (req, res, next) => {
  const shop = await prisma.shop.findFirst({ where: { ownerId: req.user.id } })
  if (!shop) throw httpError(403, 'no_shop', 'Bạn chưa có gian hàng')
  req.shop = shop
  next()
}))

router.get('/dashboard', ah(DashboardController.getDashboard))   // O01
router.get('/stats', ah(StatsController.getStats))               // O16: biểu đồ cột + tròn
router.get('/revenue', ah(OrderController.getRevenue))           // doanh thu
router.use('/products', productRoutes)                           // O02, O03
router.use('/orders', orderRoutes)                               // O07, O08
router.use('/requests', requestRoutes)                           // O06

export default router
