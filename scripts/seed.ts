// @ts-nocheck
/**
 * Seed script — creates one test owner, shop, and 5 sample products.
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed.ts
 * Requires MONGODB_URI in .env.local
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Inline minimal schemas to avoid next.js module resolution issues in ts-node
const UserSchema = new mongoose.Schema({
  name:       String,
  email:      { type: String, unique: true, lowercase: true },
  password:   String,
  role:       { type: String, default: 'owner' },
  shop_id:    mongoose.Schema.Types.ObjectId,
  created_at: { type: Date, default: Date.now },
});

const ShopSchema = new mongoose.Schema({
  owner_id:    mongoose.Schema.Types.ObjectId,
  name:        String,
  slug:        { type: String, unique: true, lowercase: true },
  description: String,
  logo_url:    { type: String, default: '' },
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now },
});

const ProductSchema = new mongoose.Schema({
  shop_id:     mongoose.Schema.Types.ObjectId,
  name:        String,
  description: String,
  category:    String,
  price:       Number,
  images:      [{ url: String, public_id: String, is_primary: Boolean }],
  sizes:       [String],
  colors:      [String],
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env.local');

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('✅ Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({ email: 'owner@styleswap.demo' });

  // Create owner
  const hashedPw = await bcrypt.hash('styleswap123', 12);
  const owner    = await User.create({
    name:     'Demo Owner',
    email:    'owner@styleswap.demo',
    password: hashedPw,
    role:     'owner',
  });
  console.log('✅ Owner created:', owner.email);

  // Create shop
  const oldShop = await Shop.findOne({ slug: 'styleswap-demo' });
  if (oldShop) {
    await Product.deleteMany({ shop_id: oldShop._id });
    await Shop.deleteOne({ _id: oldShop._id });
  }

  const shop = await Shop.create({
    owner_id:    owner._id,
    name:        'StyleSwap Demo Shop',
    slug:        'styleswap-demo',
    description: 'A sample showroom for the StyleSwap virtual try-on demo.',
    is_active:   true,
  });
  console.log('✅ Shop created:', shop.slug);

  // Update owner with shop_id
  await User.updateOne({ _id: owner._id }, { shop_id: shop._id });

  // Sample products using stable placeholder images
  await Product.deleteMany({ shop_id: shop._id });

  const PRODUCTS = [
    { name: 'Classic White Kurta',  category: 'kurta',   price: 1299, sizes: ['S','M','L','XL'], colors: ['White','Off-White'],     img: 'https://placehold.co/600x900/1C1C1C/FFFFFF?text=White+Kurta'  },
    { name: 'Navy Blue Formal Shirt', category: 'shirt', price: 999,  sizes: ['S','M','L','XL','XXL'], colors: ['Navy Blue'],        img: 'https://placehold.co/600x900/1a1a4e/FFFFFF?text=Navy+Shirt'   },
    { name: 'Olive Cargo Jacket',   category: 'jacket',  price: 2499, sizes: ['M','L','XL'],      colors: ['Olive Green','Khaki'],   img: 'https://placehold.co/600x900/2a3a1a/FFFFFF?text=Olive+Jacket' },
    { name: 'Black Slim Trousers',  category: 'trouser', price: 1499, sizes: ['30','32','34','36'], colors: ['Black'],               img: 'https://placehold.co/600x900/0A0A0A/FFFFFF?text=Black+Trouser' },
    { name: 'Royal Sherwani Suit',  category: 'suit',    price: 5999, sizes: ['S','M','L','XL'],  colors: ['Royal Blue','Maroon'],   img: 'https://placehold.co/600x900/1a1a6e/FFFFFF?text=Sherwani+Suit' },
  ];

  for (const p of PRODUCTS) {
    await Product.create({
      shop_id:     shop._id,
      name:        p.name,
      description: `Premium quality ${p.category} for every occasion.`,
      category:    p.category,
      price:       p.price,
      images:      [{ url: p.img, public_id: `seed_${p.category}_${Date.now()}`, is_primary: true }],
      sizes:       p.sizes,
      colors:      p.colors,
      is_active:   true,
    });
    console.log('  📦', p.name);
  }

  console.log('\n🎉 Seed complete!');
  console.log('──────────────────────────────────');
  console.log('  Owner Email:    owner@styleswap.demo');
  console.log('  Owner Password: styleswap123');
  console.log('  Shop URL:      /shop/styleswap-demo');
  console.log('  Dashboard:     /dashboard');
  console.log('  Kiosk:         /kiosk');
  console.log('──────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
