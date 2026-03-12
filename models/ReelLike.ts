import mongoose, { Schema, model } from 'mongoose';

const ReelLikeSchema = new Schema({
  reelId: {
    type: Schema.Types.ObjectId,
    ref: 'Reel',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { timestamps: true });

// Prevents duplicate likes — unique per reel+user pair
ReelLikeSchema.index({ reelId: 1, userId: 1 }, { unique: true });

export default mongoose.models.ReelLike || model('ReelLike', ReelLikeSchema);
