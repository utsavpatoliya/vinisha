const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/customers', customerController.listCustomers);
router.get('/customers/add', customerController.showAddCustomerForm);
router.post('/customers/add', customerController.addCustomer);
router.get('/customers/edit/:id', customerController.showEditCustomerForm);
router.post('/customers/edit/:id', customerController.editCustomer);
router.post('/customers/delete/:id', customerController.deleteCustomer);
router.get('/customers/:id', customerController.viewCustomer);

module.exports = router;
