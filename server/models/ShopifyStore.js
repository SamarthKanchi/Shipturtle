import mongoose from 'mongoose';

/**
 * One document per Shopify store that installs this app.
 * The accessToken is the permanent offline token exchanged during OAuth.
 */
const shopifyStoreSchema = new mongoose.Schema(
    {
        // e.g. "exampleshop.myshopify.com"
        shop: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        // permanent offline access token granted by Shopify OAuth
        accessToken: {
            type: String,
            required: true,
        },
        // The SyncFlow user who connected this store (optional link)
        connectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Shopify shop metadata cached at install time
        shopName: { type: String, default: '' },
        shopEmail: { type: String, default: '' },
        shopDomain: { type: String, default: '' },
        // Whether this is still the active / installed store
        isActive: { type: Boolean, default: true },
        installedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

shopifyStoreSchema.index({ shop: 1 });

export default mongoose.model('ShopifyStore', shopifyStoreSchema);
