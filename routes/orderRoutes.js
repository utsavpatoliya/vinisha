const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Static/specific routes MUST come before the "/orders/:id" param route
router.get('/orders/today', orderController.listTodayOrders);
router.get('/orders/add', orderController.showAddOrderForm);
router.post('/orders/add', orderController.addOrder);
router.get('/orders/edit/:id', orderController.showEditOrderForm);
router.post('/orders/edit/:id', orderController.editOrder);
router.post('/orders/delete/:id', orderController.deleteOrder);
router.post('/orders/bulk-delete', orderController.bulkDeleteOrders);
router.get('/orders/pdf/:id', orderController.downloadInvoicePdf);

router.get('/orders', orderController.listOrders);
router.get('/orders/:id', orderController.viewOrder);

module.exports = router;
