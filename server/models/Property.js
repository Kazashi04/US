import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  area: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  period: { type: String, default: 'month' },
  amenities: { type: [String], default: [] },
  features: { type: [{ name: String, description: String }], default: [] },
  hasCurfew: { type: Boolean, default: false },
  roomCapacity: { type: Number, default: 1 },
  availableBeds: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String, default: '' },
  images: { type: [String], default: [] },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  isHidden: { type: Boolean, default: true }, // Default hidden until subscription active
  isBoosted: { type: Boolean, default: false },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Keep isVerified in sync with verificationStatus so existing client code
// (cards, badges) continues to read isVerified without changes.
propertySchema.pre('save', function(next) {
  this.isVerified = this.verificationStatus === 'approved';
  next();
});

// Convert Mongoose virtual ID to JSON string ID for easier React parsing
propertySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const Property = mongoose.model('Property', propertySchema);
