import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Only allow in development
const isDev = process.env.NODE_ENV !== 'production';

const TARGET_EMAIL = 'mohsinmalik1511@gmail.com';
const TARGET_PASSWORD = 'admin123';

// Inline schemas to avoid circular import issues
function getModels() {
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
  return { User, Shop, Product };
}

const DEMO_PRODUCTS = [
  // ETHNIC – Men
  {
    name: 'Royal Sherwani Set',
    description: 'Elegant full-length sherwani with intricate golden embroidery, paired with churidar. Perfect for weddings and formal events.',
    category: 'suit', price: 7999,
    sizes: ['S','M','L','XL','XXL'],
    colors: ['Royal Blue','Maroon','Ivory'],
    tags: ['ethnic','party','wedding','seeded-demo'],
    gender: 'men',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\royal_sherwani_1786127184664.png',
    destImg: 'royal_sherwani.png',
  },
  {
    name: 'Bandhgala Nehru Jacket',
    description: 'Classic Nehru collar jacket in rich silk blend with subtle woven texture. A timeless ethnic staple for festive occasions.',
    category: 'jacket', price: 3499,
    sizes: ['S','M','L','XL'],
    colors: ['Bottle Green','Navy','Black'],
    tags: ['ethnic','casual','seeded-demo'],
    gender: 'men',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\bandhgala_jacket_1786127198679.png',
    destImg: 'bandhgala_jacket.png',
  },
  // ETHNIC – Women
  {
    name: 'Anarkali Salwar Suit',
    description: 'Flowy anarkali silhouette in georgette fabric with hand-block print and dupatta. Ideal for Eid, mehndi and family functions.',
    category: 'other', price: 4999,
    sizes: ['XS','S','M','L','XL'],
    colors: ['Rose Pink','Turquoise','Peach'],
    tags: ['ethnic','party','seeded-demo'],
    gender: 'women',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\anarkali_suit_1786127213625.png',
    destImg: 'anarkali_suit.png',
  },
  {
    name: 'Green Kurta',
    description: 'Mint green chikankari embroidered kurti. Comfortable yet festive — great for casual ethnic days out.',
    category: 'kurta', price: 2799,
    sizes: ['XS','S','M','L'],
    colors: ['Mint Green'],
    tags: ['ethnic','casual','seeded-demo'],
    gender: 'women',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\green_kurta_1786127228718.png',
    destImg: 'green_kurta.png',
  },
  // CASUAL – Men
  {
    name: 'Oxford Button-Down Shirt',
    description: 'Relaxed-fit oxford cotton shirt with chest pocket. Goes from office to weekend brunch effortlessly.',
    category: 'shirt', price: 1299,
    sizes: ['S','M','L','XL','XXL'],
    colors: ['White','Sky Blue','Light Grey'],
    tags: ['casual','seeded-demo'],
    gender: 'men',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\oxford_shirt_1786127253726.png',
    destImg: 'oxford_shirt.png',
  },
  {
    name: 'Slim-Fit Chino Trousers',
    description: 'Versatile slim chino trousers in stretch cotton twill. Pair with sneakers or loafers for any casual occasion.',
    category: 'trouser', price: 1699,
    sizes: ['30','32','34','36','38'],
    colors: ['Khaki','Olive','Navy','Dark Grey'],
    tags: ['casual','seeded-demo'],
    gender: 'men',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\chino_trousers_1786127267819.png',
    destImg: 'chino_trousers.png',
  },
  // CASUAL – Women
  {
    name: 'Floral Wrap Midi Dress',
    description: 'Breezy wrap-style midi dress in soft rayon with an all-over floral print. Perfect for casual outings, cafes, and daytime events.',
    category: 'other', price: 1999,
    sizes: ['XS','S','M','L','XL'],
    colors: ['Coral Floral','Blue Floral','Sage Floral'],
    tags: ['casual','seeded-demo'],
    gender: 'women',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\floral_dress_1786127282407.png',
    destImg: 'floral_dress.png',
  },
  // PARTY WEAR – Men
  {
    name: 'Velvet Blazer',
    description: 'Luxurious single-button velvet blazer with satin lapels. The ultimate party-night statement piece.',
    category: 'jacket', price: 4299,
    sizes: ['S','M','L','XL'],
    colors: ['Midnight Black','Burgundy','Teal'],
    tags: ['party','seeded-demo'],
    gender: 'men',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\velvet_blazer_1786127296100.png',
    destImg: 'velvet_blazer.png',
  },
  // PARTY WEAR – Women
  {
    name: 'Sequin Cocktail Dress',
    description: 'All-over sequin mini dress with adjustable straps and a flared hem. Guaranteed to turn heads at any party.',
    category: 'other', price: 3299,
    sizes: ['XS','S','M','L'],
    colors: ['Gold','Silver','Rose Gold'],
    tags: ['party','seeded-demo'],
    gender: 'women',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\sequin_dress_1786127317231.png',
    destImg: 'sequin_dress.png',
  },
  // KIDS
  {
    name: 'Kids Festive Kurta Pajama',
    description: 'Adorable embroidered kurta with pajama set for little ones. Perfect for Eid and family gatherings.',
    category: 'kurta', price: 1199,
    sizes: ['2Y','4Y','6Y','8Y','10Y'],
    colors: ['Yellow','Coral','Lime Green'],
    tags: ['ethnic','party','seeded-demo'],
    gender: 'kids',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\kids_kurta_1786127331850.png',
    destImg: 'kids_kurta.png',
  },
  {
    name: 'Kids Casual Hoodie & Jogger Set',
    description: 'Super-soft fleece hoodie and matching jogger pants for everyday play. Fun prints and easy pull-on fit for toddlers to tweens.',
    category: 'other', price: 1499,
    sizes: ['2Y','4Y','6Y','8Y','10Y','12Y'],
    colors: ['Denim Blue','Charcoal','Red'],
    tags: ['casual','seeded-demo'],
    gender: 'kids',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\kids_hoodie_1786127344752.png',
    destImg: 'kids_hoodie.png',
  },
  {
    name: 'Girls Party Lehenga Choli',
    description: 'Enchanting mini lehenga with mirror-work choli and dupatta. Makes little girls the star of any celebration.',
    category: 'other', price: 2199,
    sizes: ['4Y','6Y','8Y','10Y'],
    colors: ['Pink','Purple','Fuchsia'],
    tags: ['ethnic','party','seeded-demo'],
    gender: 'kids',
    sourceImg: 'C:\\Users\\MOHSIN MALIK\\.gemini\\antigravity-ide\\brain\\d5a6c935-88b4-44a1-89b3-22ff830712ea\\girls_lehenga_1786127360524.png',
    destImg: 'girls_lehenga.png',
  },
];

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }

  try {
    await connectDB();
    const { User, Shop, Product } = getModels();

    const log: string[] = [];
    
    // Create public/demo-products directory if it doesn't exist
    const publicDir = path.join(process.cwd(), 'public', 'demo-products');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      log.push(`Created directory: ${publicDir}`);
    }

    // Copy images to public directory
    for (const p of DEMO_PRODUCTS) {
      if (fs.existsSync(p.sourceImg)) {
        const destPath = path.join(publicDir, p.destImg);
        fs.copyFileSync(p.sourceImg, destPath);
        log.push(`Copied image: ${p.destImg}`);
      } else {
        log.push(`Image not found: ${p.sourceImg}`);
      }
    }

    // 1. Find or create user
    let user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
      const hashedPw = await bcrypt.hash(TARGET_PASSWORD, 12);
      user = await User.create({
        name: 'Mohsin Malik',
        email: TARGET_EMAIL,
        password: hashedPw,
        role: 'owner',
      });
      log.push(`Created user: ${TARGET_EMAIL}`);
    } else {
      log.push(`Found user: ${user.email}`);
    }

    // 2. Find or create shop
    let shop = await Shop.findOne({ slug: 'mohsin-store' });
    if (!shop) shop = user.shop_id ? await Shop.findById(user.shop_id) : await Shop.findOne({ owner_id: user._id });
    
    if (!shop) {
      shop = await Shop.create({
        owner_id:    user._id,
        name:        'Mohsin Store',
        slug:        'mohsin-store',
        description: 'Demo showroom: ethnic, casual & party wear for Men, Women and Kids.',
        is_active:   true,
      });
      await User.updateOne({ _id: user._id }, { shop_id: shop._id });
      log.push(`Created shop: ${shop.slug}`);
    } else {
      // Ensure the slug is mohsin-store just in case
      if (shop.slug !== 'mohsin-store') {
        shop.slug = 'mohsin-store';
        await shop.save();
      }
      log.push(`Found shop: ${shop.name} (slug: ${shop.slug})`);
    }

    // 3. Remove ALL old products in this shop to clear out the broken Unsplash images
    const { deletedCount } = await Product.deleteMany({
      shop_id: shop._id
    });
    if (deletedCount) log.push(`Removed ${deletedCount} old products`);

    // 4. Insert fresh demo products
    const inserted: string[] = [];
    for (const p of DEMO_PRODUCTS) {
      await Product.create({
        shop_id:     shop._id,
        name:        p.name,
        description: p.description,
        category:    p.category,
        price:       p.price,
        images:      [{ url: `/demo-products/${p.destImg}`, public_id: `demo_${p.category}_${Date.now()}`, is_primary: true }],
        sizes:       p.sizes,
        colors:      p.colors,
        tags:        p.tags,
        gender:      p.gender,
        is_active:   true,
      });
      inserted.push(p.name);
    }

    log.push(`Inserted ${inserted.length} products`);

    return NextResponse.json({
      success: true,
      message: `✅ ${inserted.length} demo products seeded into shop "${shop.name}"`,
      shopSlug: shop.slug,
      shopUrl:  `/shop/${shop.slug}`,
      dashboard: '/dashboard',
      login: { email: TARGET_EMAIL, password: TARGET_PASSWORD },
      log,
      products: inserted,
    });
  } catch (err: unknown) {
    console.error('[seed-demo] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
