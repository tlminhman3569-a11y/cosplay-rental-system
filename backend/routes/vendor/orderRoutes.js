import { Router } from 'express'
import { OrderController as C } from '../../controllers/vendor/orderController.js'
import { ah } from '../../middlewares/error.js'

const router = Router()
router.get('/', ah(C.getOrders))
router.get('/:id', ah(C.getOrder))
router.patch('/:id/status', ah(C.updateStatus))   // Tự chọn 2 (CONFIRMED | CANCELLED)

export default router
