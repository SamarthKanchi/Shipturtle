/**
 * Seed script — run once to populate demo data:
 *   cd server && node seed.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncflow-ai';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Vendor.deleteMany(), Product.deleteMany(), Order.deleteMany()]);
  console.log('Cleared existing data');

  // ── Create demo user ──────────────────────────────────────────────────────
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@syncflow.ai',
    passwordHash: 'password123',
    role: 'marketplace_owner',
    isEmailVerified: true,
  });
  console.log(`Created user: ${user.email} (password: password123)`);

  // ── Create vendors ────────────────────────────────────────────────────────
  const vendorData = [
    { businessName: 'TechVault Pro', businessEmail: 'hello@techvault.co', status: 'approved', businessType: 'company',
      performance: { rating: 4.9, totalOrders: 340, fulfillmentRate: 99.2, totalRevenue: 48200 } },
    { businessName: 'StyleDrop', businessEmail: 'team@styledrop.com', status: 'approved', businessType: 'company',
      performance: { rating: 4.7, totalOrders: 180, fulfillmentRate: 97.8, totalRevenue: 31400 } },
    { businessName: 'GreenMart Organic', businessEmail: 'info@greenmart.eco', status: 'approved', businessType: 'individual',
      performance: { rating: 4.5, totalOrders: 90, fulfillmentRate: 96.1, totalRevenue: 12800 } },
    { businessName: 'HomeNest Decor', businessEmail: 'contact@homenest.com', status: 'approved', businessType: 'company',
      performance: { rating: 4.8, totalOrders: 230, fulfillmentRate: 98.5, totalRevenue: 27600 } },
    { businessName: 'EcoStyle Living', businessEmail: 'apply@ecostyle.co', status: 'pending', businessType: 'individual',
      performance: { rating: 0, totalOrders: 0, fulfillmentRate: 0, totalRevenue: 0 } },
    { businessName: 'UrbanGear Hub', businessEmail: 'support@urbangear.com', status: 'approved', businessType: 'company',
      performance: { rating: 4.3, totalOrders: 150, fulfillmentRate: 94.2, totalRevenue: 19300 } },
  ];

  const vendors = await Vendor.insertMany(vendorData.map(v => ({ ...v, userId: user._id })));
  console.log(`Created ${vendors.length} vendors`);

  // ── Create products ───────────────────────────────────────────────────────
  const categories = ['Electronics', 'Apparel', 'Kitchen', 'Home Decor', 'Beauty', 'Accessories', 'Footwear'];
  const syncStatuses = ['synced', 'synced', 'synced', 'pending', 'error'];

  const products = [];
  const sampleProducts = [
    { title: 'Premium Wireless Headphones', sku: 'TWH-001', price: 129.99, inventoryQuantity: 234, category: 'Electronics', vendorIdx: 0 },
    { title: 'Organic Cotton T-Shirt', sku: 'OCT-042', price: 34.99, inventoryQuantity: 567, category: 'Apparel', vendorIdx: 1 },
    { title: 'Eco Bamboo Water Bottle', sku: 'EBW-015', price: 24.99, inventoryQuantity: 3, category: 'Kitchen', vendorIdx: 2 },
    { title: 'Smart Home Hub v3', sku: 'SHH-003', price: 199.99, inventoryQuantity: 89, category: 'Electronics', vendorIdx: 0 },
    { title: 'Handmade Ceramic Vase', sku: 'HCV-028', price: 67.50, inventoryQuantity: 42, category: 'Home Decor', vendorIdx: 3 },
    { title: 'Running Sneakers Pro', sku: 'RSP-011', price: 149.00, inventoryQuantity: 0, category: 'Footwear', vendorIdx: 5 },
    { title: 'Vitamin C Serum', sku: 'VCS-007', price: 29.99, inventoryQuantity: 312, category: 'Beauty', vendorIdx: 2 },
    { title: 'Laptop Stand Adjustable', sku: 'LSA-019', price: 59.99, inventoryQuantity: 156, category: 'Accessories', vendorIdx: 0 },
    { title: 'Yoga Mat Premium', sku: 'YMP-003', price: 45.00, inventoryQuantity: 88, category: 'Accessories', vendorIdx: 5 },
    { title: 'Scented Soy Candle Set', sku: 'SCS-012', price: 38.00, inventoryQuantity: 220, category: 'Home Decor', vendorIdx: 3 },
  ];

  for (const p of sampleProducts) {
    products.push({
      title: p.title,
      sku: p.sku,
      price: p.price,
      inventoryQuantity: p.inventoryQuantity,
      category: p.category,
      vendorId: vendors[p.vendorIdx]._id,
      syncStatus: syncStatuses[Math.floor(Math.random() * syncStatuses.length)],
      status: 'active',
    });
  }
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);

  // ── Create orders ─────────────────────────────────────────────────────────
  const customers = [
    { name: 'Emma Wilson', email: 'emma@mail.com', phone: '+1-555-0101' },
    { name: 'Liam Chen', email: 'liam@mail.com', phone: '+1-555-0102' },
    { name: 'Sophia Kim', email: 'sophia@mail.com', phone: '+1-555-0103' },
    { name: 'Noah Patel', email: 'noah@mail.com', phone: '+1-555-0104' },
    { name: 'Ava Johnson', email: 'ava@mail.com', phone: '+1-555-0105' },
    { name: 'Ethan Brown', email: 'ethan@mail.com', phone: '+1-555-0106' },
  ];
  const statuses = ['pending', 'processing', 'fulfilled', 'fulfilled', 'fulfilled', 'cancelled'];

  const ordersToInsert = [];
  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length];
    const product = createdProducts[i % createdProducts.length];
    const vendor = vendors.find(v => v._id.toString() === product.vendorId.toString());
    const qty = Math.floor(Math.random() * 3) + 1;
    const subtotal = +(product.price * qty).toFixed(2);
    const shipping = 9.99;
    const tax = +(subtotal * 0.08).toFixed(2);
    const status = statuses[i % statuses.length];

    ordersToInsert.push({
      orderNumber: `#SF-${4800 + i}`,
      customer,
      lineItems: [{
        productId: product._id,
        vendorId: vendor._id,
        title: product.title,
        sku: product.sku,
        quantity: qty,
        price: product.price,
        fulfillmentStatus: status === 'fulfilled' ? 'fulfilled' : 'pending',
      }],
      shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'US' },
      financials: { subtotal, shippingCost: shipping, tax, total: +(subtotal + shipping + tax).toFixed(2) },
      status,
      createdAt: new Date(Date.now() - i * 3600000 * 6),
    });
  }

  await Order.insertMany(ordersToInsert);
  console.log(`Created ${ordersToInsert.length} orders`);

  console.log('\n✅ Seed complete!');
  console.log('   Login: demo@syncflow.ai / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
