import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  area: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  period: { type: String, default: 'month' },
  amenities: { type: [String], default: [] },
  badges: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  images: { type: [String], default: [] },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

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
