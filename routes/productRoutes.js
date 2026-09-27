const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.listProducts);
router.get('/products/add', productController.showAddProductForm);
router.post('/products/add', productController.addProduct);
router.get('/products/edit/:id', productController.showEditProductForm);
router.post('/products/edit/:id', productController.editProduct);
router.post('/products/delete/:id', productController.deleteProduct);

module.exports = router;
