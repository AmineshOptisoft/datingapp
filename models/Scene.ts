import mongoose, { Schema, model } from 'mongoose';

const SceneSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sceneTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  sceneDescription: {
    type: String,
    required: true,
    maxlength: 500
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    default: null,
    index: true
  },
  isPublishedAsReel: {
    type: Boolean,
    default: false
  },
  reelId: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Create index for faster queries
SceneSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Scene || model('Scene', SceneSchema);
