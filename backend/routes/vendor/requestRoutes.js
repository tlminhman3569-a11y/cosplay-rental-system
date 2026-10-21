import { Router } from 'express'
import { OrderController as C } from '../../controllers/vendor/orderController.js'
import { ah } from '../../middlewares/error.js'

// Yêu cầu thuê chờ xác nhận (O06) - Tự chọn 2
const router = Router()
router.get('/', ah(C.getRequests))
router.post('/:id/confirm', ah(C.confirm))
router.post('/:id/reject', ah(C.reject))   // body: { reason }

export default router
