import mongoose, { Schema, model } from 'mongoose';

const WalletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  balance: {
    type: Number,
    required: true,
    default: 100, // New users get 100 free coins
    min: 0
  },
  lifetimeCoins: {
    type: Number,
    default: 0,
    min: 0
  },
  isLifetime: {
    type: Boolean,
    default: false
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchased: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound index for faster queries
WalletSchema.index({ userId: 1, balance: 1 });

// Method to check if user has enough coins
WalletSchema.methods.hasEnoughCoins = function(amount: number): boolean {
  return this.balance >= amount;
};

export default mongoose.models.Wallet || model('Wallet', WalletSchema);
