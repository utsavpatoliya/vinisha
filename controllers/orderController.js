const moment = require('moment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const generateInvoiceNumber = require('../utils/invoiceNumber');
const { generateInvoicePdf } = require('../services/pdfService');

const PAGE_SIZE = 20;

/**
 * Normalizes the raw `products` array coming from the order form into a
 * clean array of order-item subdocuments. It enforces that every product line
 * MUST have a valid `productId` from an existing product. Any item without a
 * `productId` is discarded.
 */
function normalizeProductLines(rawProducts) {
  if (!rawProducts) return [];

  const arr = Array.isArray(rawProducts) ? rawProducts : Object.values(rawProducts);

  return arr
    .map((item) => {
      const productId = item.productId || null;
      const nameHinglish = (item.nameHinglish || '').trim();
      let nameGujarati = (item.nameGujarati || '').trim();
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price);

      // Auto-transliterate on the server side if nameGujarati is empty
      if (nameHinglish && !nameGujarati) {
        const { hinglishToGujarati } = require('../utils/transliterate');
        nameGujarati = hinglishToGujarati(nameHinglish);
      }

      // An item is valid if it has a Hinglish name, a Gujarati name, positive quantity, and non-negative price.
      if (!nameHinglish || !nameGujarati || Number.isNaN(quantity) || quantity <= 0 || Number.isNaN(price) || price < 0) {
        return null;
      }

      return {
        product: productId || undefined,
        nameHinglish,
        nameGujarati,
        quantity,
        price
      };
    })
    .filter(Boolean);
}

/**
 * Finds an existing customer by (case-insensitive) exact name match, or
 * creates a new one. This powers the "select existing or type new" flow
 * on the order form.
 */
async function findOrCreateCustomer({ customerId, customerName }) {
  if (customerId) {
    const existing = await Customer.findById(customerId);
    if (existing) return existing;
  }

  const trimmedName = (customerName || '').trim();
  if (!trimmedName) return null;

  let customer = await Customer.findOne({
    name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
  });

  if (!customer) {
    customer = await Customer.create({ name: trimmedName });
  }

  return customer;
}

// GET /orders
const listOrders = asyncHandler(async (req, res) => {
  const { search = '', customer = '', sort = 'newest' } = req.query;
  let { date = '' } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const filter = {};

  if (search.trim()) {
    filter.$or = [
      { invoiceNumber: { $regex: search.trim(), $options: 'i' } },
      { customerName: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (customer) {
    filter.customer = customer;
  }

  if (date) {
    const start = moment(date, 'YYYY-MM-DD').startOf('day').toDate();
    const end = moment(date, 'YYYY-MM-DD').endOf('day').toDate();
    if (start.toString() !== 'Invalid Date') {
      filter.orderDate = { $gte: start, $lte: end };
    } else {
      date = '';
    }
  }

  const sortOption = sort === 'oldest' ? { orderDate: 1 } : { orderDate: -1 };

  const [orders, total, customers] = await Promise.all([
    Order.find(filter)
      .sort(sortOption)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Order.countDocuments(filter),
    Customer.find().sort({ name: 1 })
  ]);

  res.render('orders/index', {
    title: 'All Orders',
    orders,
    customers,
    search,
    customer,
    date,
    sort,
    page,
    totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
    total
  });
});

// GET /orders/today
const listTodayOrders = asyncHandler(async (req, res) => {
  const start = moment().startOf('day').toDate();
  const end = moment().endOf('day').toDate();

  const orders = await Order.find({ orderDate: { $gte: start, $lte: end } }).sort({
    createdAt: -1
  });

  res.render('orders/today', { title: "Today's Orders", orders });
});

// GET /orders/add
const showAddOrderForm = asyncHandler(async (req, res) => {
  const [customers, products] = await Promise.all([
    Customer.find().sort({ name: 1 }),
    Product.find().sort({ nameHinglish: 1 })
  ]);

  res.render('orders/form', {
    title: 'Create Order',
    order: null,
    customers,
    products,
    error: null,
    today: moment().format('YYYY-MM-DD')
  });
});

// POST /orders/add
const addOrder = asyncHandler(async (req, res) => {
  const { customerId, customerName, orderDate, products } = req.body;

  const customer = await findOrCreateCustomer({ customerId, customerName });
  const productLines = normalizeProductLines(products);
  const totalAmount = productLines.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!customer || productLines.length === 0) {
    const [customers, allProducts] = await Promise.all([
      Customer.find().sort({ name: 1 }),
      Product.find().sort({ nameHinglish: 1 })
    ]);
    return res.status(400).render('orders/form', {
      title: 'Create Order',
      order: req.body,
      customers,
      products: allProducts,
      today: moment().format('YYYY-MM-DD'),
      error: !customer
        ? 'Please select or enter a customer name.'
        : 'Please add at least one valid product with a quantity greater than 0.'
    });
  }

  const invoiceNumber = await generateInvoiceNumber();

  await Order.create({
    invoiceNumber,
    customer: customer._id,
    customerName: customer.name,
    orderDate: orderDate ? new Date(orderDate) : new Date(),
    products: productLines,
    totalAmount
  });

  res.redirect('/orders');
});

// GET /orders/edit/:id
const showEditOrderForm = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).render('errors/404', { title: 'Order Not Found' });
  }

  const [customers, products] = await Promise.all([
    Customer.find().sort({ name: 1 }),
    Product.find().sort({ nameHinglish: 1 })
  ]);

  res.render('orders/form', {
    title: `Edit Order ${order.invoiceNumber}`,
    order,
    customers,
    products,
    error: null,
    today: moment(order.orderDate).format('YYYY-MM-DD')
  });
});

// POST /orders/edit/:id  (orders are always editable, per spec)
const editOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).render('errors/404', { title: 'Order Not Found' });
  }

  const { customerId, customerName, orderDate, products } = req.body;

  const customer = await findOrCreateCustomer({ customerId, customerName });
  const productLines = normalizeProductLines(products);
  const totalAmount = productLines.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!customer || productLines.length === 0) {
    const [customers, allProducts] = await Promise.all([
      Customer.find().sort({ name: 1 }),
      Product.find().sort({ nameHinglish: 1 })
    ]);
    return res.status(400).render('orders/form', {
      title: `Edit Order ${order.invoiceNumber}`,
      order: { ...order.toObject(), ...req.body },
      customers,
      products: allProducts,
      today: moment(orderDate).format('YYYY-MM-DD'),
      error: !customer
        ? 'Please select or enter a customer name.'
        : 'Please add at least one valid product with a quantity greater than 0.'
    });
  }

  order.customer = customer._id;
  order.customerName = customer.name;
  order.orderDate = orderDate ? new Date(orderDate) : order.orderDate;
  order.products = productLines;
  order.totalAmount = totalAmount;

  await order.save(); // triggers updatedAt via timestamps

  res.redirect('/orders');
});

// POST /orders/delete/:id
const deleteOrder = asyncHandler(async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  if (req.xhr || req.headers.accept === 'application/json') {
    return res.json({ success: true });
  }
  res.redirect('/orders');
});

// POST /orders/bulk-delete
const bulkDeleteOrders = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No orders selected for deletion.' });
  }

  const result = await Order.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, count: result.deletedCount, message: `Successfully deleted ${result.deletedCount} order(s).` });
});

// GET /orders/:id  (view details)
const viewOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).render('errors/404', { title: 'Order Not Found' });
  }
  res.render('orders/details', { title: `Order ${order.invoiceNumber}`, order });
});

// GET /orders/pdf/:id
const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).render('errors/404', { title: 'Order Not Found' });
  }

  const shop = {
    name: process.env.SHOP_NAME || 'Vinisha Refrigeration',
    address: process.env.SHOP_ADDRESS || 'Surat',
    phone: process.env.SHOP_PHONE || ''
  };

  const pdfBuffer = await generateInvoicePdf(order, shop);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${order.invoiceNumber}.pdf"`,
    'Content-Length': pdfBuffer.length
  });
  res.send(pdfBuffer);
});

module.exports = {
  listOrders,
  listTodayOrders,
  showAddOrderForm,
  addOrder,
  showEditOrderForm,
  editOrder,
  deleteOrder,
  bulkDeleteOrders,
  viewOrder,
  downloadInvoicePdf
};
