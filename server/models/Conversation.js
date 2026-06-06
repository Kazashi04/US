import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  lastMessage: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

conversationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
