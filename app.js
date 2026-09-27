require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const buildSessionMiddleware = require('./config/session');
const { requireAuth } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { closeBrowser } = require('./services/pdfService');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Trust Render's/other reverse proxies so secure cookies & req.ip work correctly.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security & performance middleware
app.use(
  helmet({
    contentSecurityPolicy: false // disabled to keep things simple with CDN Bootstrap/fonts; tighten if needed
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body & cookie parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Sessions (must be set up after cookieParser, before routes)
app.use(buildSessionMiddleware());

// Make session/user info available to every view
app.use((req, res, next) => {
  res.locals.isAuthenticated = Boolean(req.session && req.session.isAuthenticated);
  res.locals.username = req.session ? req.session.username : null;
  res.locals.currentPath = req.path;
  next();
});

// Public routes (login/logout)
app.use('/', authRoutes);

// Everything below this line requires authentication
app.use(requireAuth);

app.get('/', (req, res) => res.redirect('/dashboard'));
app.use('/', dashboardRoutes);
app.use('/', customerRoutes);
app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', apiRoutes);

// 404 + error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDB();

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Order Management System running on port ${port}`);
  });

  // Graceful shutdown: close the shared Puppeteer browser and HTTP server.
  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => console.log('HTTP server closed'));
    await closeBrowser();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
