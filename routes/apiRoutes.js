const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const productController = require('../controllers/productController');

router.get('/api/customers/search', customerController.searchCustomersApi);
router.get('/api/products/search', productController.searchProductsApi);
router.get('/api/products/transliterate', productController.transliterateApi);

module.exports = router;
