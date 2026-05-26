import https from 'https';

const STORE = 'samarthkanchi35.myshopify.com';
const TOKEN = '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';
const API = '2026-04';

function shopifyGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: STORE,
      path: '/admin/api/' + API + '/' + path,
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          scopes: res.headers['x-shopify-access-token-scopes'],
          body: JSON.parse(data),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== SHOPIFY API DIAGNOSTIC ===\n');

  // 1. Get orders
  const ordersRes = await shopifyGet('orders.json?limit=3&status=any');
  console.log('Token scopes:', ordersRes.scopes);
  console.log('\nOrders found:', ordersRes.body.orders?.length || 0);

  for (const o of (ordersRes.body.orders || [])) {
    console.log('\n--- Order', o.id, '(' + o.name + ') ---');
    console.log('  fulfillment_status:', o.fulfillment_status);
    console.log('  financial_status:', o.financial_status);
    console.log('  line_items:', o.line_items?.length);

    // 2. Get fulfillment orders for each
    const foRes = await shopifyGet('orders/' + o.id + '/fulfillment_orders.json');
    const fos = foRes.body.fulfillment_orders || [];
    console.log('  fulfillment_orders:', fos.length);
    for (const fo of fos) {
      console.log('    FO', fo.id, '- status:', fo.status, '- request_status:', fo.request_status);
      console.log('      assigned_location:', fo.assigned_location?.name);
      console.log('      line_items:', fo.line_items?.length);
    }
    if (fos.length === 0) {
      console.log('  ⚠ No fulfillment orders — likely missing read_merchant_managed_fulfillment_orders scope');
    }
  }

  // 3. Check if we need a different scope
  console.log('\n=== SCOPE CHECK ===');
  const scopes = (ordersRes.scopes || '').split(',').map(s => s.trim());
  const hasMerchantManaged = scopes.some(s => s.includes('merchant_managed'));
  const hasAssigned = scopes.some(s => s.includes('assigned'));
  console.log('Has read_merchant_managed_fulfillment_orders:', hasMerchantManaged);
  console.log('Has read_assigned_fulfillment_orders:', hasAssigned);
  if (!hasMerchantManaged) {
    console.log('\n❌ MISSING SCOPE: You need to add "read_merchant_managed_fulfillment_orders"');
    console.log('   and "write_merchant_managed_fulfillment_orders" to your Shopify app scopes.');
    console.log('   Go to: Shopify Admin → Settings → Apps → Your App → API scopes');
  }
}

main().catch(console.error);
