import mongoose, { Schema, model } from 'mongoose';

const ReelViewSchema = new Schema({
  reelId: {
    type: Schema.Types.ObjectId,
    ref: 'Reel',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous viewer
  },
  // Store anonymous fingerprint (IP hash etc.) for unauthenticated views
  fingerprint: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// One view per user per reel (only enforced for authenticated users)
ReelViewSchema.index({ reelId: 1, userId: 1 }, { unique: true, sparse: true });
ReelViewSchema.index({ reelId: 1, fingerprint: 1 }, { sparse: true });

export default mongoose.models.ReelView || model('ReelView', ReelViewSchema);
