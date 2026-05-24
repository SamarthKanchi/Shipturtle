import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Don't include in queries by default
  },
  role: {
    type: String,
    enum: ['super_admin', 'marketplace_owner', 'vendor', 'staff'],
    default: 'marketplace_owner',
  },
  avatar: { type: String, default: '' },
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'shopify'],
    default: 'local',
  },
  oauthId: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  settings: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' },
  },
}, {
  timestamps: true,
});

// Index
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
