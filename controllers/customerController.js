const Customer = require('../models/Customer');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

const PAGE_SIZE = 20;

// GET /customers
const listCustomers = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Customer.countDocuments(filter)
  ]);

  res.render('customers/index', {
    title: 'Customers',
    customers,
    search,
    page,
    totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
    total
  });
});

// GET /customers/add
function showAddCustomerForm(req, res) {
  res.render('customers/form', {
    title: 'Add Customer',
    customer: null,
    error: null
  });
}

// POST /customers/add
const addCustomer = asyncHandler(async (req, res) => {
  let name = (req.body.name || '').trim();
  const city = (req.body.city || '').trim();

  if (!name) {
    return res.status(400).render('customers/form', {
      title: 'Add Customer',
      customer: { name, city },
      error: 'Customer name is required.'
    });
  }

  // Automatically format name as "Name - City" if city is specified and not already in name
  if (city && !name.toLowerCase().includes(city.toLowerCase())) {
    name = `${name} - ${city}`;
  }

  await Customer.create({ name, city });
  res.redirect('/customers');
});

// GET /customers/edit/:id
const showEditCustomerForm = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).render('errors/404', { title: 'Customer Not Found' });
  }
  res.render('customers/form', { title: 'Edit Customer', customer, error: null });
});

// POST /customers/edit/:id
const editCustomer = asyncHandler(async (req, res) => {
  let name = (req.body.name || '').trim();
  const city = (req.body.city || '').trim();

  if (!name) {
    const customer = await Customer.findById(req.params.id);
    return res.status(400).render('customers/form', {
      title: 'Edit Customer',
      customer: { ...customer.toObject(), name, city },
      error: 'Customer name is required.'
    });
  }

  // Automatically format name as "Name - City" if city is specified and not already in name
  if (city && !name.toLowerCase().includes(city.toLowerCase())) {
    name = `${name} - ${city}`;
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { name, city },
    { new: true, runValidators: true }
  );

  if (!customer) {
    return res.status(404).render('errors/404', { title: 'Customer Not Found' });
  }

  // Keep denormalized customerName in existing orders in sync.
  await Order.updateMany(
    { customer: customer._id },
    { $set: { customerName: customer.name } }
  );

  res.redirect('/customers');
});

// POST /customers/delete/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  const orderCount = await Order.countDocuments({ customer: req.params.id });

  if (orderCount > 0) {
    if (req.xhr || req.headers.accept === 'application/json') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: this customer has ${orderCount} order(s). Delete or reassign those orders first.`
      });
    }
    req.session.flashError = `Cannot delete: this customer has ${orderCount} order(s).`;
    return res.redirect('/customers');
  }

  await Customer.findByIdAndDelete(req.params.id);

  if (req.xhr || req.headers.accept === 'application/json') {
    return res.json({ success: true });
  }
  res.redirect('/customers');
});

// GET /customers/:id
const viewCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).render('errors/404', { title: 'Customer Not Found' });
  }

  const orders = await Order.find({ customer: customer._id }).sort({ orderDate: -1 });

  res.render('customers/details', {
    title: customer.name,
    customer,
    orders,
    totalOrders: orders.length
  });
});

// GET /api/customers/search?q=... (used by the searchable dropdown on the order form)
const searchCustomersApi = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { city: { $regex: q, $options: 'i' } }
        ]
      }
    : {};
  const customers = await Customer.find(filter).sort({ name: 1 }).limit(10);
  res.json({ success: true, customers });
});

module.exports = {
  listCustomers,
  showAddCustomerForm,
  addCustomer,
  showEditCustomerForm,
  editCustomer,
  deleteCustomer,
  viewCustomer,
  searchCustomersApi
};
