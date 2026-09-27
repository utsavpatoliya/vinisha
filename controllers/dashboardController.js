const moment = require('moment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// GET /dashboard
const showDashboard = asyncHandler(async (req, res) => {
  const startOfToday = moment().startOf('day').toDate();
  const endOfToday = moment().endOf('day').toDate();
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();

  const [
    totalCustomers,
    totalProducts,
    totalOrders,
    todayOrders,
    monthOrders,
    latestOrders,
    recentCustomers
  ] = await Promise.all([
    Customer.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ orderDate: { $gte: startOfToday, $lte: endOfToday } }),
    Order.countDocuments({ orderDate: { $gte: startOfMonth, $lte: endOfMonth } }),
    Order.find().sort({ createdAt: -1 }).limit(10),
    Customer.find().sort({ createdAt: -1 }).limit(10)
  ]);

  res.render('dashboard', {
    title: 'Dashboard',
    stats: {
      totalCustomers,
      totalProducts,
      totalOrders,
      todayOrders,
      monthOrders
    },
    latestOrders,
    recentCustomers
  });
});

module.exports = { showDashboard };
