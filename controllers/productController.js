const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { hinglishToGujarati } = require('../utils/transliterate');

const PAGE_SIZE = 20;

// GET /products
const listProducts = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const filter = search
    ? {
      $or: [
        { nameHinglish: { $regex: search, $options: 'i' } },
        { nameGujarati: { $regex: search, $options: 'i' } }
      ]
    }
    : {};

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Product.countDocuments(filter)
  ]);

  res.render('products/index', {
    title: 'Products',
    products,
    search,
    page,
    totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
    total
  });
});

// GET /products/add
function showAddProductForm(req, res) {
  res.render('products/form', { title: 'Add Product', product: null, error: null });
}

// POST /products/add
const addProduct = asyncHandler(async (req, res) => {
  const nameHinglish = (req.body.nameHinglish || '').trim();
  const nameGujarati = (req.body.nameGujarati || '').trim();

  if (!nameHinglish || !nameGujarati) {
    return res.status(400).render('products/form', {
      title: 'Add Product',
      product: req.body,
      error: 'Both English and Gujarati product names are required.'
    });
  }

  await Product.create({ nameHinglish, nameGujarati });
  res.redirect('/products');
});

// GET /products/edit/:id
const showEditProductForm = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).render('errors/404', { title: 'Product Not Found' });
  }
  res.render('products/form', { title: 'Edit Product', product, error: null });
});

// POST /products/edit/:id
const editProduct = asyncHandler(async (req, res) => {
  const nameHinglish = (req.body.nameHinglish || '').trim();
  const nameGujarati = (req.body.nameGujarati || '').trim();

  if (!nameHinglish || !nameGujarati) {
    const product = await Product.findById(req.params.id);
    return res.status(400).render('products/form', {
      title: 'Edit Product',
      // Repopulate form with submitted values on error
      product: { ...product.toObject(), ...req.body },
      error: 'Both English and Gujarati product names are required.'
    });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { nameHinglish, nameGujarati },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).render('errors/404', { title: 'Product Not Found' });
  }

  res.redirect('/products');
});

// POST /products/delete/:id
const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  if (req.xhr || req.headers.accept === 'application/json') {
    return res.json({ success: true });
  }
  res.redirect('/products');
});

// GET /api/products/transliterate?text=tameta (live preview while typing)
const transliterateApi = asyncHandler(async (req, res) => {
  const text = (req.query.text || '').trim();
  res.json({ success: true, gujarati: hinglishToGujarati(text) });
});

// GET /api/products/search?q=... (used by the searchable product picker on the order form)
const searchProductsApi = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? {
      $or: [
        { nameHinglish: { $regex: q, $options: 'i' } },
        { nameGujarati: { $regex: q, $options: 'i' } }
      ]
    }
    : {};
  const products = await Product.find(filter).sort({ nameHinglish: 1 }).limit(10);
  res.json({ success: true, products });
});

module.exports = {
  listProducts,
  showAddProductForm,
  addProduct,
  showEditProductForm,
  editProduct,
  deleteProduct,
  transliterateApi,
  searchProductsApi
};
