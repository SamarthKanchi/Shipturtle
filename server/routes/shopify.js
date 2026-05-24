import { Router } from 'express';
import https from 'https';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import { protect } from '../middleware/auth.js';
 
const router = Router();
 
const SHOPIFY_STORE = 'samarthkanchi35.myshopify.com';
const SHOPIFY_API_VERSION = '2026-04';
 
const shopifyFetch = (endpoint) => {
  return new Promise((resolve, reject) => {
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    };
 
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Shopify API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse Shopify response: ${data}`));
        }
      });
    });
 
    req.on('error', reject);
    req.end();
  });
};
 
// ─── SYNC PRODUCTS FROM SHOPIFY ──────────────────────────────────────────────
router.post('/sync-products', protect, async (req, res, next) => {
  try {
    let vendor = await Vendor.findOne({ businessName: 'Shopify Store' });
    if (!vendor) {
      vendor = await Vendor.create({
        userId: req.user._id,
        businessName: 'Shopify Store',
        businessEmail: 'shopify@samarthkanchi35.myshopify.com',
        businessType: 'company',
        status: 'approved',
        description: 'Products synced from Shopify store',
      });
    }
 
    const data = await shopifyFetch('products.json?limit=250');
    const shopifyProducts = data.products;
 
    let synced = 0;
    let errors = 0;
 
    for (const p of shopifyProducts) {
      try {
        const firstVariant = p.variants?.[0];
        await Product.findOneAndUpdate(
          { shopifyProductId: String(p.id) },
          {
            shopifyProductId: String(p.id),
            vendorId: vendor._id,
            title: p.title,
            description: p.body_html?.replace(/<[^>]*>/g, '') || '',
            category: p.product_type || 'Uncategorized',
            price: parseFloat(firstVariant?.price || 0),
            inventoryQuantity: firstVariant?.inventory_quantity || 0,
            sku: firstVariant?.sku || '',
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
            status: p.status === 'active' ? 'active' : 'draft',
          },
          { upsert: true, new: true, runValidators: false }
        );
        synced++;
      } catch (err) {
        console.error(`Failed to sync product ${p.id}:`, err.message);
        errors++;
      }
    }
 
    res.json({ message: 'Shopify sync complete', synced, errors, total: shopifyProducts.length });
  } catch (error) {
    next(error);
  }
});
 
// ─── SYNC ORDERS FROM SHOPIFY ─────────────────────────────────────────────────
router.post('/sync-orders', protect, async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ businessName: 'Shopify Store' });
    const data = await shopifyFetch('orders.json?limit=50&status=any');
    const shopifyOrders = data.orders;
 
    let synced = 0;
    let errors = 0;
 
    for (const o of shopifyOrders) {
      try {
        const lineItems = o.line_items.map(item => ({
          vendorId: vendor?._id,
          title: item.title,
          sku: item.sku || '',
          quantity: item.quantity,
          price: parseFloat(item.price),
          fulfillmentStatus: item.fulfillment_status === 'fulfilled' ? 'fulfilled' : 'pending',
        }));
 
        const statusMap = { pending: 'pending', open: 'processing', closed: 'fulfilled', cancelled: 'cancelled' };
 
        await Order.findOneAndUpdate(
          { shopifyOrderId: String(o.id) },
          {
            shopifyOrderId: String(o.id),
            orderNumber: o.name,
            customer: {
              name: `${o.customer?.first_name || ''} ${o.customer?.last_name || ''}`.trim() || 'Guest',
              email: o.customer?.email || o.email || 'unknown@shopify.com',
              phone: o.customer?.phone || '',
            },
            lineItems,
            shippingAddress: o.shipping_address ? {
              street: o.shipping_address.address1,
              city: o.shipping_address.city,
              state: o.shipping_address.province,
              zip: o.shipping_address.zip,
              country: o.shipping_address.country,
            } : { street: '', city: '', state: '', zip: '', country: '' },
            financials: {
              subtotal: parseFloat(o.subtotal_price || 0),
              shippingCost: 0,
              tax: parseFloat(o.total_tax || 0),
              total: parseFloat(o.total_price || 0),
            },
            status: statusMap[o.financial_status] || statusMap[o.fulfillment_status] || 'pending',
          },
          { upsert: true, new: true, runValidators: false }
        );
        synced++;
      } catch (err) {
        console.error(`Failed to sync order ${o.id}:`, err.message);
        errors++;
      }
    }
 
    res.json({ message: 'Shopify orders sync complete', synced, errors, total: shopifyOrders.length });
  } catch (error) {
    next(error);
  }
});
 
// ─── GET SHOPIFY STORE INFO ───────────────────────────────────────────────────
router.get('/store-info', protect, async (req, res, next) => {
  try {
    const data = await shopifyFetch('shop.json');
    res.json({ shop: data.shop });
  } catch (error) {
    next(error);
  }
});
 
// ─── SYNC STATUS ─────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res, next) => {
  try {
    const [productCount, orderCount, lastSync] = await Promise.all([
      Product.countDocuments({ shopifyProductId: { $exists: true } }),
      Order.countDocuments({ shopifyOrderId: { $exists: true } }),
      Product.findOne({ shopifyProductId: { $exists: true } }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
    ]);
    res.json({
      connected: true,
      store: SHOPIFY_STORE,
      syncedProducts: productCount,
      syncedOrders: orderCount,
      lastSyncedAt: lastSync?.lastSyncedAt || null,
    });
  } catch (error) {
    next(error);
  }
});
 
export default router;
