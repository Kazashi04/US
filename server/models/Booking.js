import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['payment_pending', 'pending_landlord_approval', 'approved', 'rejected', 'cancelled'], 
    default: 'payment_pending' 
  },
  moveInDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true },
  message: { type: String, default: '' },
  paymongoSessionId: { type: String, default: null },
  checkoutUrl: { type: String, default: null },
  totalPrice: { type: Number, required: true }, // The reservation fee amount
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const Booking = mongoose.model('Booking', bookingSchema);
