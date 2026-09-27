const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name is too long']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name is too long'],
      default: ''
    }
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', city: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
