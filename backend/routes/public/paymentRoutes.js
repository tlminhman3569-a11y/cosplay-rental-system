const router = require('express').Router();
const controller = require('../../controllers/public/paymentController');

router.post('/payments/vnpay/create-url', controller.createUrl);
router.get('/payments/vnpay/return', controller.returnUrl);
router.get('/payments/vnpay/ipn', controller.ipn);

module.exports = router;

