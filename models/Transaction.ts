import mongoose, { Schema, model } from 'mongoose';

const TransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'deduction', 'bonus', 'refund'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  metadata: {
    mediaType: {
      type: String,
      enum: ['image', 'video']
    },
    sceneId: {
      type: Schema.Types.ObjectId,
      ref: 'Scene'
    },
    packageType: {
      type: String,
      enum: ['starter', 'popular', 'premium']
    },
    stripePaymentId: String,
    stripeSessionId: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ 'metadata.stripePaymentId': 1 }, { sparse: true });

export default mongoose.models.Transaction || model('Transaction', TransactionSchema);
