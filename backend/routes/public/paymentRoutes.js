const router = require('express').Router();
const controller = require('../../controllers/public/paymentController');
router.get('/payments/vnpay/return', controller.returnUrl);
router.get('/payments/vnpay/ipn', controller.ipn);
module.exports = router;
