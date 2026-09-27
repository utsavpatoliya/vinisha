require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { hinglishToGujarati } = require('../utils/transliterate');

async function seedProducts() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI is not set in environment!');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    console.log('Clearing existing products from database...');
    await Product.deleteMany({});
    console.log('Existing products deleted.');

    const rawDataPath = path.join(__dirname, 'rawProducts.json');
    if (!fs.existsSync(rawDataPath)) {
      console.error('rawProducts.json not found!');
      process.exit(1);
    }

    const rawProducts = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    console.log(`Processing ${rawProducts.length} product names...`);

    const productsToInsert = [];
    const seenNames = new Set();

    for (let i = 0; i < rawProducts.length; i++) {
      const hinglish = rawProducts[i].trim();
      if (!hinglish || seenNames.has(hinglish.toLowerCase())) continue;
      seenNames.add(hinglish.toLowerCase());

      const gujarati = hinglishToGujarati(hinglish);
      productsToInsert.push({
        nameHinglish: hinglish,
        nameGujarati: gujarati
      });
    }

    console.log(`Inserting ${productsToInsert.length} unique products into database in batches...`);

    const BATCH_SIZE = 500;
    let insertedTotal = 0;

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const insertedBatch = await Product.insertMany(batch, { ordered: false });
      insertedTotal += insertedBatch.length;
      console.log(`Inserted batch ${Math.ceil((i + 1) / BATCH_SIZE)}: ${insertedTotal}/${productsToInsert.length} products inserted.`);
    }

    console.log(`\nSuccess! Seeded ${insertedTotal} products into MongoDB database.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seedProducts();
