const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    nameHinglish: {
      type: String,
      required: [true, 'Product name (Hinglish) is required'],
      trim: true,
      maxlength: [250, 'Product name is too long']
    },
    nameGujarati: {
      type: String,
      required: [true, 'Product name (Gujarati) is required'],
      trim: true,
      maxlength: [250, 'Product name is too long']
    }
  },
  { timestamps: true }
);

productSchema.index({ nameHinglish: 'text', nameGujarati: 'text' });

module.exports = mongoose.model('Product', productSchema);
