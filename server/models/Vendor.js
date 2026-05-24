import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  businessEmail: { type: String, trim: true, lowercase: true },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'enterprise'],
    default: 'individual',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending',
  },
  commissionRate: { type: Number, default: 15, min: 0, max: 100 },
  description: { type: String, maxlength: 500 },
  website: { type: String },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    routingNumber: String,
    bankName: String,
  },
  performance: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalOrders: { type: Number, default: 0 },
    fulfillmentRate: { type: Number, default: 0 },
    avgShippingDays: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

vendorSchema.index({ userId: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ 'performance.rating': -1 });

export default mongoose.model('Vendor', vendorSchema);
