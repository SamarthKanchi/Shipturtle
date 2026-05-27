import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
  },
  shopifyOrderId: { type: String, sparse: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
  },
  lineItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    title: String,
    sku: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'processing', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  financials: {
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'refunded'],
    default: 'pending',
  },
  fulfillments: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    trackingNumber: String,
    carrier: String,
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'failed'], default: 'pending' },
    shippedAt: Date,
    deliveredAt: Date,
  }],
  notes: { type: String },
}, {
  timestamps: true,
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ shopifyOrderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'lineItems.vendorId': 1 });
orderSchema.index({ 'customer.email': 1 });

export default mongoose.model('Order', orderSchema);
