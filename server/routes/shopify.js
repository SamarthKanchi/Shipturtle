import { Router } from 'express';
import https from 'https';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import ShopifyStore from '../models/ShopifyStore.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const SHOPIFY_API_VERSION = '2026-04';

/**
 * Resolves the Shopify store + access token for the current request.
 * Priority:
 *   1. req.user has a connected store (OAuth flow — multi-merchant)
 *   2. Fall back to env vars (legacy / dev single-store mode)
 */
async function resolveShopifyCredentials(req) {
  // OAuth path: look up the store linked to the logged-in user
  if (req.user?._id) {
    const record = await ShopifyStore.findOne({
      connectedBy: req.user._id,
      isActive: true,
    });
    if (record) {
      return { shop: record.shop, token: record.accessToken };
    }
  }

  // Legacy fallback — single store from .env
  const shop = process.env.SHOPIFY_STORE_DOMAIN || 'samarthkanchi35.myshopify.com';
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) {
    throw Object.assign(
      new Error(
        'No Shopify store connected. Please connect your store via Settings → Shopify.'
      ),
      { statusCode: 403 }
    );
  }
  return { shop, token };
}

const shopifyFetch = (endpoint, shop, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: shop,
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

// ─── SHOPIFY WRITE HELPER (PUT / POST / DELETE) ─────────────────────────────
const shopifyWrite = (method, endpoint, body, shop, token) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: shop,
      path: `/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`,
      method,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
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
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(new Error(`Failed to parse Shopify response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// Helper exported for use in other route files
export { shopifyWrite, shopifyFetch, resolveShopifyCredentials, SHOPIFY_API_VERSION };

// ─── SYNC PRODUCTS FROM SHOPIFY ──────────────────────────────────────────────
router.post('/sync-products', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);

    let vendor = await Vendor.findOne({ businessName: 'Shopify Store' });
    if (!vendor) {
      vendor = await Vendor.create({
        userId: req.user._id,
        businessName: 'Shopify Store',
        businessEmail: `shopify@${shop}`,
        businessType: 'company',
        status: 'approved',
        description: 'Products synced from Shopify store',
      });
    }

    const data = await shopifyFetch('products.json?limit=250', shop, token);
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
    const { shop, token } = await resolveShopifyCredentials(req);
    const vendor = await Vendor.findOne({ businessName: 'Shopify Store' });
    const data = await shopifyFetch('orders.json?limit=50&status=any', shop, token);
    const shopifyOrders = data.orders;

    let synced = 0;
    let errors = 0;

    for (const o of shopifyOrders) {
      try {
        const rawItems = Array.isArray(o.line_items) ? o.line_items : [];
        const lineItems = rawItems.map(item => ({
          vendorId: vendor?._id,
          title: item.title || 'Unknown Item',
          sku: item.sku || '',
          quantity: Math.max(parseInt(item.quantity) || 1, 1),
          price: parseFloat(item.price) || 0,
          fulfillmentStatus: item.fulfillment_status === 'fulfilled' ? 'fulfilled' : 'pending',
        }));

        // Shopify fulfillment_status: null (unfulfilled), 'partial', 'fulfilled'
        // Shopify financial_status: 'pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'voided'
        const deriveStatus = (order) => {
          if (order.fulfillment_status === 'fulfilled') return 'fulfilled';
          if (order.fulfillment_status === 'partial') return 'partially_fulfilled';
          if (order.cancelled_at) return 'cancelled';
          if (order.financial_status === 'refunded') return 'cancelled';
          if (order.financial_status === 'paid' || order.financial_status === 'partially_refunded') return 'processing';
          if (order.financial_status === 'pending' || order.financial_status === 'authorized') return 'pending';
          return 'pending';
        };

        await Order.findOneAndUpdate(
          { shopifyOrderId: String(o.id) },
          {
            shopifyOrderId: String(o.id),
            orderNumber: o.name || `#SHOP-${o.id}`,
            customer: {
              name: `${o.customer?.first_name || ''} ${o.customer?.last_name || ''}`.trim() || 'Guest',
              email: o.customer?.email || o.email || 'unknown@shopify.com',
              phone: o.customer?.phone || '',
            },
            lineItems: lineItems.length > 0 ? lineItems : [{
              title: 'Unknown Item',
              quantity: 1,
              price: parseFloat(o.total_price) || 0,
              fulfillmentStatus: 'pending',
            }],
            shippingAddress: o.shipping_address ? {
              street: o.shipping_address.address1 || '',
              city: o.shipping_address.city || '',
              state: o.shipping_address.province || '',
              zip: o.shipping_address.zip || '',
              country: o.shipping_address.country || '',
            } : { street: '', city: '', state: '', zip: '', country: '' },
            financials: {
              subtotal: parseFloat(o.subtotal_price) || 0,
              shippingCost: 0,
              tax: parseFloat(o.total_tax) || 0,
              total: parseFloat(o.total_price) || 0,
            },
            status: deriveStatus(o),
          },
          { upsert: true, new: true, runValidators: false }
        );
        synced++;
      } catch (err) {
        console.error(`Failed to sync order ${o.id} (${o.name}):`, err.message, err.stack);
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
    const { shop, token } = await resolveShopifyCredentials(req);
    const data = await shopifyFetch('shop.json', shop, token);
    res.json({ shop: data.shop });
  } catch (error) {
    next(error);
  }
});

// ─── SYNC STATUS ─────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res, next) => {
  try {
    // Resolve credentials to confirm a store is connected
    const { shop } = await resolveShopifyCredentials(req);
    const [productCount, orderCount, lastSync] = await Promise.all([
      Product.countDocuments({ shopifyProductId: { $exists: true } }),
      Order.countDocuments({ shopifyOrderId: { $exists: true } }),
      Product.findOne({ shopifyProductId: { $exists: true } }).sort({ lastSyncedAt: -1 }).select('lastSyncedAt'),
    ]);
    res.json({
      connected: true,
      store: shop,
      syncedProducts: productCount,
      syncedOrders: orderCount,
      lastSyncedAt: lastSync?.lastSyncedAt || null,
    });
  } catch (error) {
    next(error);
  }
});

// ─── DIAGNOSTIC: CHECK ORDER + FULFILLMENT ORDERS ON SHOPIFY ──────────────────
router.get('/debug-order/:shopifyOrderId', protect, async (req, res) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const shopifyOrderId = req.params.shopifyOrderId;

    const orderData = await shopifyFetch(`orders/${shopifyOrderId}.json`, shop, token);
    const order = orderData?.order;

    const foData = await shopifyFetch(`orders/${shopifyOrderId}/fulfillment_orders.json`, shop, token);
    const fulfillmentOrders = foData?.fulfillment_orders || [];

    const scopeCheck = await new Promise((resolve) => {
      const opts = {
        hostname: shop,
        path: `/admin/api/${SHOPIFY_API_VERSION}/orders/${shopifyOrderId}.json`,
        method: 'GET',
        headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      };
      const req = https.request(opts, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
          resolve({
            statusCode: r.statusCode,
            scopes: r.headers['x-shopify-access-token-scopes'] || 'not returned',
          });
        });
      });
      req.on('error', (e) => resolve({ error: e.message }));
      req.end();
    });

    res.json({
      shopifyOrderId,
      order: order ? {
        id: order.id,
        name: order.name,
        fulfillment_status: order.fulfillment_status,
        financial_status: order.financial_status,
        line_items_count: order.line_items?.length,
      } : null,
      fulfillmentOrders: fulfillmentOrders.map(fo => ({
        id: fo.id,
        status: fo.status,
        request_status: fo.request_status,
        assigned_location: fo.assigned_location?.name,
      })),
      fulfillmentOrderCount: fulfillmentOrders.length,
      tokenScopes: scopeCheck.scopes,
      hint: fulfillmentOrders.length === 0
        ? 'Token may be missing "read_merchant_managed_fulfillment_orders" scope — you have "read_assigned_fulfillment_orders" which only covers orders assigned to your app, not merchant-managed ones.'
        : 'Fulfillment orders found — should be able to fulfill.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── TWO-WAY SYNC: CREATE PRODUCT ON SHOPIFY ─────────────────────────────────
router.post('/create-product', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const { title, description, price, category, sku, inventoryQuantity, status, vendorId } = req.body;

    if (!title || price === undefined || !vendorId) {
      return res.status(400).json({ error: 'title, price, and vendorId are required' });
    }

    // 1) Create product in local MongoDB first
    const product = await Product.create({
      vendorId,
      title,
      description: description || '',
      category: category || 'Uncategorized',
      price: parseFloat(price),
      inventoryQuantity: parseInt(inventoryQuantity) || 0,
      sku: sku || '',
      status: status || 'active',
      syncStatus: 'pending',
    });

    // 2) Push to Shopify
    try {
      const shopifyPayload = {
        product: {
          title,
          body_html: description || '',
          product_type: category || 'Uncategorized',
          status: status === 'active' ? 'active' : 'draft',
          variants: [{
            price: String(parseFloat(price)),
            sku: sku || '',
            inventory_management: 'shopify',
          }],
        },
      };

      const shopifyResult = await shopifyWrite('POST', 'products.json', shopifyPayload, shop, token);
      const shopifyProduct = shopifyResult?.product;

      if (!shopifyProduct?.id) {
        throw new Error('Shopify did not return a product ID');
      }

      // 3) Update local product with Shopify ID
      product.shopifyProductId = String(shopifyProduct.id);
      product.syncStatus = 'synced';
      product.lastSyncedAt = new Date();
      await product.save();

      // 4) Set inventory quantity on Shopify if specified
      if (parseInt(inventoryQuantity) > 0) {
        try {
          const variant = shopifyProduct.variants?.[0];
          if (variant?.inventory_item_id) {
            const locationsData = await shopifyFetch('locations.json', shop, token);
            const locationId = locationsData?.locations?.[0]?.id;
            if (locationId) {
              await shopifyWrite('POST', 'inventory_levels/set.json', {
                location_id: locationId,
                inventory_item_id: variant.inventory_item_id,
                available: parseInt(inventoryQuantity),
              }, shop, token);
            }
          }
        } catch (invErr) {
          console.error('[Create→Shopify] Inventory set failed:', invErr.message);
          // Product was still created — don't fail the whole request
        }
      }

      res.status(201).json({ product, shopifySynced: true });
    } catch (shopifyErr) {
      // Shopify push failed — product exists locally with syncStatus: 'error'
      console.error('[Create→Shopify] Failed:', shopifyErr.message);
      product.syncStatus = 'error';
      await product.save();
      res.status(201).json({
        product,
        shopifySynced: false,
        shopifyWarning: `Product saved locally but Shopify sync failed: ${shopifyErr.message}`,
      });
    }
  } catch (error) {
    next(error);
  }
});

// ─── TWO-WAY SYNC: UPDATE PRODUCT ON SHOPIFY ─────────────────────────────────
router.put('/update-product/:id', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.shopifyProductId) {
      return res.status(400).json({ error: 'Product is not linked to Shopify' });
    }

    const { title, description, price, category, status } = req.body;

    // Build Shopify product payload
    const shopifyPayload = { product: {} };
    if (title !== undefined) shopifyPayload.product.title = title;
    if (description !== undefined) shopifyPayload.product.body_html = description;
    if (status !== undefined) shopifyPayload.product.status = status === 'active' ? 'active' : 'draft';
    if (category !== undefined) shopifyPayload.product.product_type = category;
    if (price !== undefined) {
      shopifyPayload.product.variants = [{ id: undefined, price: String(price) }];
      // Fetch current variant ID first
      const shopifyProduct = await shopifyFetch(`products/${product.shopifyProductId}.json`, shop, token);
      if (shopifyProduct?.product?.variants?.[0]) {
        shopifyPayload.product.variants[0].id = shopifyProduct.product.variants[0].id;
      }
    }

    // Push to Shopify
    await shopifyWrite('PUT', `products/${product.shopifyProductId}.json`, shopifyPayload, shop, token);

    // Update local MongoDB
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (category !== undefined) updates.category = category;
    if (status !== undefined) updates.status = status;
    updates.syncStatus = 'synced';
    updates.lastSyncedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ product: updatedProduct, shopifySynced: true });
  } catch (error) {
    // If Shopify fails, mark as error locally
    await Product.findByIdAndUpdate(req.params.id, { syncStatus: 'error' }).catch(() => { });
    next(error);
  }
});

// ─── TWO-WAY SYNC: FULFILL ORDER ON SHOPIFY ──────────────────────────────────
router.post('/fulfill-order/:id', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.shopifyOrderId) {
      return res.status(400).json({ error: 'Order is not linked to Shopify' });
    }

    const { trackingNumber, carrier } = req.body;
    let shopifySynced = false;
    let shopifyWarning = null;

    // Get fulfillment orders for this Shopify order
    try {
      const fulfillmentOrdersData = await shopifyFetch(
        `orders/${order.shopifyOrderId}/fulfillment_orders.json`, shop, token
      );
      const fulfillmentOrders = fulfillmentOrdersData?.fulfillment_orders || [];

      console.log(`[Fulfill] Order ${order.shopifyOrderId} — ${fulfillmentOrders.length} fulfillment order(s):`,
        fulfillmentOrders.map(fo => ({ id: fo.id, status: fo.status }))
      );

      // Accept any fulfillment order that isn't already closed or cancelled
      const excludedStatuses = ['closed', 'cancelled'];
      const eligibleFO = fulfillmentOrders.find(fo => !excludedStatuses.includes(fo.status));

      if (!eligibleFO && fulfillmentOrders.length > 0) {
        // All fulfillment orders are closed/cancelled — already fulfilled on Shopify
        shopifyWarning = 'Order is already fulfilled on Shopify';
        console.log(`[Fulfill] All fulfillment orders are closed/cancelled — skipping Shopify push`);
      } else if (!eligibleFO) {
        // No fulfillment orders at all — likely a token scope issue
        shopifyWarning = 'Could not sync to Shopify — your access token may be missing the "read_fulfillments" and "write_fulfillments" scopes. Order fulfilled locally only.';
        console.log(`[Fulfill] 0 fulfillment orders found — token may lack fulfillment scopes`);
      } else {
        // We have an eligible fulfillment order — push to Shopify
        console.log(`[Fulfill] Using fulfillment order ${eligibleFO.id} (status: ${eligibleFO.status})`);

        const fulfillmentPayload = {
          fulfillment: {
            line_items_by_fulfillment_order: [{
              fulfillment_order_id: eligibleFO.id,
            }],
            tracking_info: {
              number: trackingNumber || '',
              company: carrier || '',
            },
            notify_customer: true,
          },
        };

        await shopifyWrite('POST', 'fulfillments.json', fulfillmentPayload, shop, token);
        shopifySynced = true;
        console.log(`[Fulfill] Successfully fulfilled on Shopify`);
      }
    } catch (shopifyErr) {
      // Shopify API call failed — still fulfill locally
      shopifyWarning = `Shopify sync failed: ${shopifyErr.message}`;
      console.error(`[Fulfill] Shopify API error:`, shopifyErr.message);
    }

    // Always update local order
    const vendor = await Vendor.findOne({ businessName: 'Shopify Store' });
    order.fulfillments.push({
      vendorId: vendor?._id,
      trackingNumber: trackingNumber || '',
      carrier: carrier || '',
      status: 'shipped',
      shippedAt: new Date(),
    });
    order.lineItems.forEach(item => { item.fulfillmentStatus = 'fulfilled'; });
    order.status = 'fulfilled';
    await order.save();

    res.json({ order, shopifySynced, shopifyWarning });
  } catch (error) {
    console.error('[Fulfill] Error:', error.message);
    next(error);
  }
});

// ─── TWO-WAY SYNC: UPDATE INVENTORY ON SHOPIFY ───────────────────────────────
router.put('/update-inventory/:id', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.shopifyProductId) {
      return res.status(400).json({ error: 'Product is not linked to Shopify' });
    }

    const { inventoryQuantity } = req.body;
    if (inventoryQuantity === undefined) {
      return res.status(400).json({ error: 'inventoryQuantity is required' });
    }

    // Get the variant's inventory_item_id from Shopify
    const shopifyProduct = await shopifyFetch(`products/${product.shopifyProductId}.json`, shop, token);
    const variant = shopifyProduct?.product?.variants?.[0];
    if (!variant?.inventory_item_id) {
      return res.status(400).json({ error: 'Could not find inventory item in Shopify' });
    }

    const locationsData = await shopifyFetch('locations.json', shop, token);
    const locationId = locationsData?.locations?.[0]?.id;
    if (!locationId) {
      return res.status(400).json({ error: 'No locations found in Shopify store' });
    }

    // Set inventory level in Shopify
    await shopifyWrite('POST', 'inventory_levels/set.json', {
      location_id: locationId,
      inventory_item_id: variant.inventory_item_id,
      available: parseInt(inventoryQuantity),
    }, shop, token);

    // Update local MongoDB
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { inventoryQuantity: parseInt(inventoryQuantity), syncStatus: 'synced', lastSyncedAt: new Date() } },
      { new: true }
    );

    res.json({ product: updatedProduct, shopifySynced: true });
  } catch (error) {
    await Product.findByIdAndUpdate(req.params.id, { syncStatus: 'error' }).catch(() => { });
    next(error);
  }
});

// ─── TWO-WAY SYNC: DELETE PRODUCT ON SHOPIFY ─────────────────────────────────
router.delete('/delete-product/:id', protect, async (req, res, next) => {
  try {
    const { shop, token } = await resolveShopifyCredentials(req);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let shopifySynced = false;
    let shopifyWarning = null;

    // If linked to Shopify, delete on Shopify first
    if (product.shopifyProductId) {
      try {
        await shopifyWrite('DELETE', `products/${product.shopifyProductId}.json`, {}, shop, token);
        shopifySynced = true;
        console.log(`[Delete→Shopify] Deleted product ${product.shopifyProductId} from Shopify`);
      } catch (shopifyErr) {
        // If 404, product was already gone from Shopify — that's fine
        if (shopifyErr.message?.includes('404')) {
          shopifySynced = true;
          console.log(`[Delete→Shopify] Product ${product.shopifyProductId} already gone from Shopify`);
        } else {
          shopifyWarning = `Shopify deletion failed: ${shopifyErr.message}. Product deleted locally.`;
          console.error('[Delete→Shopify] Failed:', shopifyErr.message);
        }
      }
    }

    // Always delete from MongoDB
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Product deleted',
      shopifySynced,
      shopifyWarning,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
