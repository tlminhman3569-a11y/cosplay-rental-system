const router = require('express').Router();
const controller = require('../../controllers/customer/orderController');
const requireAuthenticatedUser = require('../../middlewares/requireAuthenticatedUser');

router.use(requireAuthenticatedUser);
router.post('/checkouts', controller.checkout);
router.get('/orders', controller.list);
router.get('/orders/:id', controller.detail);
module.exports = router;
