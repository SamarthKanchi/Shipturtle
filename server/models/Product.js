import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  shopifyProductId: { type: String, sparse: true },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: 255,
  },
  description: { type: String, maxlength: 5000 },
  sku: { type: String, trim: true },
  barcode: { type: String },
  category: { type: String, default: 'Uncategorized' },
  tags: [{ type: String }],
  aiTags: [{ type: String }], // AI-generated tags
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    inventoryQuantity: { type: Number, default: 0 },
    weight: { type: Number },
    weightUnit: { type: String, default: 'kg' },
  }],
  images: [{
    url: { type: String },
    altText: { type: String },
    position: { type: Number },
  }],
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number },
  inventoryQuantity: { type: Number, default: 0 },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'conflict'],
    default: 'pending',
  },
  lastSyncedAt: { type: Date },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active',
  },
}, {
  timestamps: true,
});

productSchema.index({ vendorId: 1 });
productSchema.index({ shopifyProductId: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ syncStatus: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ title: 'text', description: 'text' }); // Full-text search

export default mongoose.model('Product', productSchema);
