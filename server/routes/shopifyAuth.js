/**
 * server/routes/shopifyAuth.js
 *
 * Shopify OAuth 2.0 flow:
 *   1.  GET /api/shopify-auth/install?shop=xxx.myshopify.com
 *       → Redirects the merchant to Shopify's permission screen.
 *
 *   2.  GET /api/shopify-auth/callback?shop=...&code=...&hmac=...
 *       → Shopify sends the merchant back here after they click "Install".
 *       → We validate the HMAC, exchange the code for a permanent token,
 *         save it in MongoDB, and redirect to the frontend dashboard.
 *
 *   3.  GET /api/shopify-auth/connected-store          (requires JWT auth)
 *       → Returns the store record for the currently logged-in user.
 *
 *   4.  DELETE /api/shopify-auth/disconnect             (requires JWT auth)
 *       → Marks the store inactive (does NOT revoke the token on Shopify).
 */

import { Router } from 'express';
import https from 'https';
import crypto from 'crypto';
import ShopifyStore from '../models/ShopifyStore.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const {
    SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET,
    SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory,read_fulfillments,write_fulfillments,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders',
    SHOPIFY_APP_URL,       // e.g. https://your-app.com  (no trailing slash)
    FRONTEND_URL,          // e.g. https://your-app.com  (redirected to after install)
} = process.env;

const SHOPIFY_API_VERSION = '2026-04';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validates the HMAC Shopify sends on every OAuth callback. */
function validateHmac(query) {
    const { hmac, ...rest } = query;
    if (!hmac) return false;

    const message = Object.keys(rest)
        .sort()
        .map(k => `${k}=${rest[k]}`)
        .join('&');

    const digest = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET || '')
        .update(message)
        .digest('hex');

    // Constant-time compare
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

/** Normalises a shop domain — strips protocol, trailing slashes, whitespace. */
function normaliseShop(raw = '') {
    return raw
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '')
        .toLowerCase()
        .trim();
}

/** Validates that the shop looks like a real .myshopify.com domain. */
function isValidShop(shop) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

/** Makes a GET request to the Shopify Admin API for a specific store + token. */
function shopifyGet(shop, token, endpoint) {
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

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`Shopify API error ${res.statusCode}: ${data}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Could not parse Shopify response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/** Exchanges the OAuth code for a permanent access token. */
function exchangeCodeForToken(shop, code) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code,
        });

        const options = {
            hostname: shop,
            path: '/admin/oauth/access_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token) {
                        resolve(parsed.access_token);
                    } else {
                        reject(new Error(`Token exchange failed: ${data}`));
                    }
                } catch {
                    reject(new Error(`Could not parse token response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// ─── Step 1 — Install redirect ────────────────────────────────────────────────
/**
 * GET /api/shopify-auth/install?shop=xxx.myshopify.com
 *
 * Called either:
 *   a) When the merchant clicks "Install" in the Shopify App Store, OR
 *   b) From your frontend "Connect Store" button.
 */
router.get('/install', (req, res) => {
    const shop = normaliseShop(req.query.shop || '');

    if (!shop || !isValidShop(shop)) {
        return res.status(400).json({ error: 'Missing or invalid shop parameter.' });
    }

    if (!SHOPIFY_API_KEY) {
        return res
            .status(500)
            .json({ error: 'SHOPIFY_API_KEY is not configured on the server.' });
    }

    const redirectUri = `${SHOPIFY_APP_URL}/api/shopify-auth/callback`;
    const nonce = crypto.randomBytes(16).toString('hex'); // CSRF token

    // In production you should store `nonce` in a short-lived session or cookie
    // and verify it in the callback. Omitted here for simplicity.

    const installUrl =
        `https://${shop}/admin/oauth/authorize` +
        `?client_id=${SHOPIFY_API_KEY}` +
        `&scope=${encodeURIComponent(SHOPIFY_SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${nonce}`;

    res.redirect(installUrl);
});

// ─── Step 2 — OAuth callback ──────────────────────────────────────────────────
/**
 * GET /api/shopify-auth/callback?shop=...&code=...&hmac=...&state=...
 *
 * Shopify redirects here after the merchant approves the install.
 */
router.get('/callback', async (req, res) => {
    try {
        const shop = normaliseShop(req.query.shop || '');
        const { code } = req.query;

        // 1) Basic validation
        if (!shop || !isValidShop(shop)) {
            return res.status(400).send('Invalid shop parameter.');
        }
        if (!code) {
            return res.status(400).send('Missing code parameter.');
        }

        // 2) Validate HMAC to confirm the request really came from Shopify
        if (!validateHmac(req.query)) {
            return res.status(403).send('HMAC validation failed.');
        }

        // 3) Exchange the code for a permanent access token
        const accessToken = await exchangeCodeForToken(shop, code);

        // 4) Fetch basic shop info to cache friendly display names
        let shopMeta = {};
        try {
            const { shop: info } = await shopifyGet(shop, accessToken, 'shop.json');
            shopMeta = {
                shopName: info.name || shop,
                shopEmail: info.email || '',
                shopDomain: info.domain || shop,
            };
        } catch {
            // Non-fatal — we still save the token
        }

        // 5) Upsert the store record in MongoDB
        await ShopifyStore.findOneAndUpdate(
            { shop },
            {
                shop,
                accessToken,
                ...shopMeta,
                isActive: true,
                installedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log(`[ShopifyOAuth] ✅ Store installed: ${shop}`);

        // 6) Redirect the merchant to the frontend dashboard
        const frontendUrl = FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/shopify-connected?shop=${encodeURIComponent(shop)}`);
    } catch (err) {
        console.error('[ShopifyOAuth] Callback error:', err.message);
        res.status(500).send(`OAuth failed: ${err.message}`);
    }
});

// ─── Connected store info (for the frontend) ──────────────────────────────────
/**
 * GET /api/shopify-auth/connected-store
 * Requires JWT auth. Returns the store connected by the current user,
 * or null if none connected yet.
 *
 * For a single-store-per-user model we look up by connectedBy.
 * If your app links stores differently, adjust the query.
 */
router.get('/connected-store', protect, async (req, res) => {
    try {
        const store = await ShopifyStore.findOne({
            connectedBy: req.user._id,
            isActive: true,
        }).select('-accessToken'); // never send the token to the browser

        res.json({ store: store || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/shopify-auth/connect-store
 * Body: { shop: "xxx.myshopify.com" }
 *
 * Convenience endpoint: a logged-in user can claim ownership of a store
 * that was already installed via OAuth (but hasn't been linked to a user yet).
 */
router.post('/connect-store', protect, async (req, res) => {
    try {
        const shop = normaliseShop(req.body.shop || '');
        if (!shop || !isValidShop(shop)) {
            return res.status(400).json({ error: 'Invalid shop domain.' });
        }

        const store = await ShopifyStore.findOne({ shop, isActive: true });
        if (!store) {
            return res.status(404).json({
                error: 'Store not found. Please install the app from your Shopify admin first.',
                installUrl: `${SHOPIFY_APP_URL}/api/shopify-auth/install?shop=${encodeURIComponent(shop)}`,
            });
        }

        // Claim ownership
        store.connectedBy = req.user._id;
        await store.save();

        res.json({
            store: {
                shop: store.shop,
                shopName: store.shopName,
                shopEmail: store.shopEmail,
                shopDomain: store.shopDomain,
                installedAt: store.installedAt,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Disconnect ───────────────────────────────────────────────────────────────
/**
 * DELETE /api/shopify-auth/disconnect
 * Marks the current user's store as inactive.
 */
router.delete('/disconnect', protect, async (req, res) => {
    try {
        await ShopifyStore.findOneAndUpdate(
            { connectedBy: req.user._id, isActive: true },
            { isActive: false }
        );
        res.json({ message: 'Store disconnected.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
