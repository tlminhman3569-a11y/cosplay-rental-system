import { Router } from 'express'
import { ProductController as C } from '../../controllers/vendor/productController.js'
import { ah } from '../../middlewares/error.js'

const router = Router()
router.get('/', ah(C.getProducts))
router.post('/', ah(C.createProduct))
router.get('/:id', ah(C.getProduct))
router.put('/:id', ah(C.updateProduct))
router.post('/:id/hide', ah(C.hideProduct))
router.post('/:id/show', ah(C.showProduct))
router.delete('/:id', ah(C.deleteProduct))

export default router
