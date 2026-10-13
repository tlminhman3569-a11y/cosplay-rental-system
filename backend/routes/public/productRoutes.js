const router = require('express').Router();
const controller = require('../../controllers/public/productController');

router.get('/products/sections/:section', controller.section);
router.get('/products/:id', controller.detail);
router.get('/products', controller.list);
router.get('/shops/:shopId/products', controller.listByShop);

module.exports = router;
