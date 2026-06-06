import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['student', 'landlord', 'admin'], required: true },
  university: { type: String, default: null }, // For students
  phoneNumber: { type: String, default: null },
  documentUrl: { type: String, default: null },
  profileImage: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  subscriptionTier: { type: String, enum: ['none', 'regular', 'premium'], default: 'none' },
  subscriptionExpiry: { type: Date, default: null },
  paymongoSubscriptionLinkId: { type: String, default: null },
  paymongoSubscriptionTargetTier: { type: String, enum: ['regular', 'premium', null], default: null },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON response
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    delete ret.__v;
  }
});

export const User = mongoose.model('User', userSchema);
