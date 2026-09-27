const mongoose = require('mongoose');

// Each product line inside an order. We snapshot the Hinglish/Gujarati
// names at the time of order creation so that the invoice stays accurate
// even if the master Product record is edited or deleted later.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    nameHinglish: {
      type: String,
      required: true,
      trim: true
    },
    nameGujarati: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    customerName: {
      // Snapshot of the customer name at order time, used for fast display
      // and to preserve history even if the customer record changes.
      type: String,
      required: true,
      trim: true
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    products: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'An order must contain at least one product'
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

orderSchema.index({ invoiceNumber: 1 }, { unique: true });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ customerName: 'text' });

module.exports = mongoose.model('Order', orderSchema);
