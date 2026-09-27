const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

// Reuse a single browser instance across requests instead of launching a
// new one every time — this is much faster and lighter on memory.
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
  return browserPromise;
}

/**
 * Renders the invoice EJS template for a given order and converts it to a
 * PDF buffer using Puppeteer. Waits for web fonts (Noto Sans Gujarati) to
 * finish loading before printing so Gujarati text renders correctly.
 *
 * @param {Object} order - A populated Order mongoose document (or plain object)
 * @param {Object} shop - Shop details { name, address, phone }
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function generateInvoicePdf(order, shop) {
  const templatePath = path.join(__dirname, '..', 'views', 'invoice', 'invoice.ejs');

  const fs = require('fs');
  const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
  let logoDataUri = '';
  if (fs.existsSync(logoPath)) {
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    logoDataUri = 'data:image/png;base64,' + logoBase64;
  }

  const html = await ejs.renderFile(templatePath, {
    order,
    shop,
    logoDataUri,
    generatedAt: new Date()
  });

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Ensure all fonts (including the Google Font loaded via <link>) are
    // fully loaded before we rasterize the page, otherwise Gujarati
    // glyphs can render as boxes/fallback characters.
    await page.evaluateHandle('document.fonts.ready');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

/**
 * Gracefully closes the shared Puppeteer browser instance. Call this on
 * process shutdown to avoid leaving zombie Chromium processes behind.
 */
async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

module.exports = { generateInvoicePdf, closeBrowser };
