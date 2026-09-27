const Order = require('../models/Order');
const moment = require('moment');

/**
 * Generates a unique, human-friendly invoice number in the format:
 *   INV-YYYYMMDD-0001
 * The counter resets each day and is derived from how many orders
 * already exist for "today" (in server local time).
 */
async function generateInvoiceNumber() {
  const datePart = moment().format('YYYYMMDD');
  const prefix = `INV-${datePart}-`;

  const startOfDay = moment().startOf('day').toDate();
  const endOfDay = moment().endOf('day').toDate();

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  let sequence = countToday + 1;
  let invoiceNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

  // Guard against rare race conditions / gaps by checking uniqueness.
  // eslint-disable-next-line no-await-in-loop
  while (await Order.exists({ invoiceNumber })) {
    sequence += 1;
    invoiceNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  return invoiceNumber;
}

module.exports = generateInvoiceNumber;
