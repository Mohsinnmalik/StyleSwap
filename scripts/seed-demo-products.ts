// @ts-nocheck
/**
 * Demo Products Seed Script
 * Adds 12 dummy clothing products (ethnic, casual, party wear) for Boys, Girls & Kids
 * into the shop associated with mohsinmalik1511@gmail.com
 *
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed-demo-products.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TARGET_EMAIL = 'mohsinmalik1511@gmail.com';
const TARGET_PASSWORD = 'admin123';

// ── Inline schemas ────────────────────────────────────────────────────────────

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
  tags:        [String],
  gender:      String,
  is_active:   { type: Boolean, default: true },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now },
});

const User    = mongoose.models.User    || mongoose.model('User',    UserSchema);
const Shop    = mongoose.models.Shop    || mongoose.model('Shop',    ShopSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ── 12 Demo Products ──────────────────────────────────────────────────────────

const DEMO_PRODUCTS = [

  // ─── ETHNIC – Men ─────────────────────────────────────────────────────────
  {
    name: 'Royal Sherwani Set',
    description: 'Elegant full-length sherwani with intricate golden embroidery, paired with churidar. Perfect for weddings and formal events.',
    category: 'suit', price: 7999,
    sizes: ['S','M','L','XL','XXL'],
    colors: ['Royal Blue','Maroon','Ivory'],
    tags: ['ethnic','party','boys','wedding'],
    gender: 'men',
    img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=900&fit=crop',
  },
  {
    name: 'Bandhgala Nehru Jacket',
    description: 'Classic Nehru collar jacket in rich silk blend with subtle woven texture. A timeless ethnic staple for festive occasions.',
    category: 'jacket', price: 3499,
    sizes: ['S','M','L','XL'],
    colors: ['Bottle Green','Navy','Black'],
    tags: ['ethnic','casual','boys'],
    gender: 'men',
    img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4091?w=600&h=900&fit=crop',
  },

  // ─── ETHNIC – Women ───────────────────────────────────────────────────────
  {
    name: 'Anarkali Salwar Suit',
    description: 'Flowy anarkali silhouette in georgette fabric with hand-block print, dupatta, and churidar. Ideal for Eid, mehndi and family functions.',
    category: 'other', price: 4999,
    sizes: ['XS','S','M','L','XL'],
    colors: ['Rose Pink','Turquoise','Peach'],
    tags: ['ethnic','party','girls'],
    gender: 'women',
    img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=900&fit=crop',
  },
  {
    name: 'Embroidered Kurta Palazzo Set',
    description: 'Chikankari embroidered kurti paired with wide-leg palazzo pants. Comfortable yet festive — great for casual ethnic days out.',
    category: 'kurta', price: 2799,
    sizes: ['XS','S','M','L'],
    colors: ['Off-White','Powder Blue','Mint Green'],
    tags: ['ethnic','casual','girls'],
    gender: 'women',
    img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&h=900&fit=crop',
  },

  // ─── CASUAL – Men ─────────────────────────────────────────────────────────
  {
    name: 'Oxford Button-Down Shirt',
    description: 'Relaxed-fit oxford cotton shirt with chest pocket. Goes from office to weekend brunch effortlessly.',
    category: 'shirt', price: 1299,
    sizes: ['S','M','L','XL','XXL'],
    colors: ['White','Sky Blue','Light Grey'],
    tags: ['casual','boys'],
    gender: 'men',
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=900&fit=crop',
  },
  {
    name: 'Slim-Fit Chino Trousers',
    description: 'Versatile slim chino trousers in stretch cotton twill. Pair with sneakers or loafers for any casual occasion.',
    category: 'trouser', price: 1699,
    sizes: ['30','32','34','36','38'],
    colors: ['Khaki','Olive','Navy','Dark Grey'],
    tags: ['casual','boys'],
    gender: 'men',
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=900&fit=crop',
  },

  // ─── CASUAL – Women ───────────────────────────────────────────────────────
  {
    name: 'Floral Wrap Midi Dress',
    description: 'Breezy wrap-style midi dress in soft rayon with an all-over floral print. Perfect for casual outings, cafes, and daytime events.',
    category: 'other', price: 1999,
    sizes: ['XS','S','M','L','XL'],
    colors: ['Coral Floral','Blue Floral','Sage Floral'],
    tags: ['casual','girls'],
    gender: 'women',
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=900&fit=crop',
  },

  // ─── PARTY WEAR – Men ─────────────────────────────────────────────────────
  {
    name: 'Velvet Blazer',
    description: 'Luxurious single-button velvet blazer with satin lapels. The ultimate party-night statement piece.',
    category: 'jacket', price: 4299,
    sizes: ['S','M','L','XL'],
    colors: ['Midnight Black','Burgundy','Teal'],
    tags: ['party','boys'],
    gender: 'men',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=900&fit=crop',
  },

  // ─── PARTY WEAR – Women ───────────────────────────────────────────────────
  {
    name: 'Sequin Cocktail Dress',
    description: 'All-over sequin mini dress with adjustable straps and a flared hem. Guaranteed to turn heads at any party.',
    category: 'other', price: 3299,
    sizes: ['XS','S','M','L'],
    colors: ['Gold','Silver','Rose Gold'],
    tags: ['party','girls'],
    gender: 'women',
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=900&fit=crop',
  },

  // ─── KIDS ─────────────────────────────────────────────────────────────────
  {
    name: 'Kids Festive Kurta Pajama',
    description: 'Adorable embroidered kurta with pajama set for little ones. Available in bright festive colours — perfect for Eid and family gatherings.',
    category: 'kurta', price: 1199,
    sizes: ['2Y','4Y','6Y','8Y','10Y'],
    colors: ['Yellow','Coral','Lime Green'],
    tags: ['ethnic','party','kids'],
    gender: 'kids',
    img: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&h=900&fit=crop',
  },
  {
    name: 'Kids Casual Hoodie & Jogger Set',
    description: 'Super-soft fleece hoodie and matching jogger pants for everyday play. Fun prints and easy pull-on fit for toddlers to tweens.',
    category: 'other', price: 1499,
    sizes: ['2Y','4Y','6Y','8Y','10Y','12Y'],
    colors: ['Denim Blue','Charcoal','Red'],
    tags: ['casual','kids'],
    gender: 'kids',
    img: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&h=900&fit=crop',
  },
  {
    name: 'Girls Party Lehenga Choli',
    description: 'Enchanting mini lehenga with mirror-work choli and dupatta. Makes little girls the star of any celebration.',
    category: 'other', price: 2199,
    sizes: ['4Y','6Y','8Y','10Y'],
    colors: ['Pink','Purple','Fuchsia'],
    tags: ['ethnic','party','kids','girls'],
    gender: 'kids',
    img: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&h=900&fit=crop',
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seedDemoProducts() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env.local');

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('Connected to MongoDB\n');

  // 1. Find or create the target user
  let user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.log(`User "${TARGET_EMAIL}" not found. Creating new account...`);
    const hashedPw = await bcrypt.hash(TARGET_PASSWORD, 12);
    user = await User.create({
      name: 'Mohsin Malik',
      email: TARGET_EMAIL,
      password: hashedPw,
      role: 'owner',
    });
    console.log('User created:', user.email);
  } else {
    console.log('Found user:', user.email);
  }

  // 2. Find or create their shop
  let shop = user.shop_id ? await Shop.findById(user.shop_id) : null;
  if (!shop) shop = await Shop.findOne({ owner_id: user._id });
  if (!shop) {
    console.log('No shop found. Creating "Tryonity Client Demo" shop...');
    shop = await Shop.create({
      owner_id:    user._id,
      name:        'Tryonity Client Demo',
      slug:        'tryonity-client-demo',
      description: 'Demo showroom: ethnic, casual & party wear for Men, Women and Kids.',
      is_active:   true,
    });
    await User.updateOne({ _id: user._id }, { shop_id: shop._id });
    console.log('Shop created:', shop.slug);
  } else {
    console.log('Found shop:', shop.name, '| slug:', shop.slug);
  }

  // 3. Remove any previously seeded demo products
  const { deletedCount } = await Product.deleteMany({ shop_id: shop._id, tags: 'seeded-demo' });
  if (deletedCount) console.log(`Removed ${deletedCount} old seeded-demo products`);

  // 4. Insert fresh products
  console.log('\nInserting 12 demo products...\n');
  for (const p of DEMO_PRODUCTS) {
    await Product.create({
      shop_id:     shop._id,
      name:        p.name,
      description: p.description,
      category:    p.category,
      price:       p.price,
      images:      [{ url: p.img, public_id: `seed_demo_${p.category}_${Date.now()}`, is_primary: true }],
      sizes:       p.sizes,
      colors:      p.colors,
      tags:        [...p.tags, 'seeded-demo'],
      gender:      p.gender,
      is_active:   true,
    });
    const gLabel = { men: 'Men', women: 'Women', kids: 'Kids' }[p.gender] ?? p.gender;
    console.log(`  [${gLabel}] [${p.tags.slice(0,2).join('+')}]  ${p.name}  -  Rs.${p.price}`);
  }

  console.log('\n12 demo products added successfully!');
  console.log('---------------------------------------------------');
  console.log('  Login Email:    ', TARGET_EMAIL);
  console.log('  Login Password: ', TARGET_PASSWORD);
  console.log('  Shop Name:      ', shop.name);
  console.log('  Shop Slug:      ', shop.slug);
  console.log('  Dashboard:       /dashboard');
  console.log('  Shop Page:       /shop/' + shop.slug);
  console.log('---------------------------------------------------');

  await mongoose.disconnect();
}

seedDemoProducts().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
