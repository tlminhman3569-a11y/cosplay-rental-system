const router = require('express').Router();
const controller = require('../../controllers/customer/cartController');
const requireAuthenticatedUser = require('../../middlewares/requireAuthenticatedUser');

router.use(requireAuthenticatedUser);
router.get('/cart/items', controller.get);
router.post('/cart/items', controller.create);
router.patch('/cart/items/:itemId', controller.update);
router.delete('/cart/items/:itemId', controller.remove);
module.exports = router;
