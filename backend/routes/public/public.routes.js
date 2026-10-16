// backend/routes/public/public.routes.js
const express = require('express');
const router = express.Router();
const publicController = require('../../controllers/public/public.controller');

router.get('/home-feeds', publicController.getHomeFeeds);
router.get('/products/search', publicController.searchProducts);
router.get('/shops/search', publicController.searchShops);

module.exports = router;